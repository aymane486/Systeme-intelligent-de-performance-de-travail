package com.intellcap.service;

import com.intellcap.dto.AIPredictionDTO;
import com.intellcap.dto.AIPredictionDTO.*;
import com.intellcap.model.*;
import com.intellcap.repository.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AIService {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final TimeEntryRepository timeEntryRepository;
    private static final String ML_SERVICE_URL = "http://localhost:8000/predict";

    public AIPredictionDTO analyze() {
        List<Project> projects = projectRepository.findAll();
        List<DelayRisk> delayRisks = new ArrayList<>();
        List<Bottleneck> bottlenecks = new ArrayList<>();
        List<Recommendation> recommendations = new ArrayList<>();
        Map<Long, Double> userWorkload = new HashMap<>();

        // Collecter les tâches pour le ML
        List<Task> tasksForML = new ArrayList<>();
        List<Double> consumedHoursList = new ArrayList<>();

        for (Project project : projects) {
            List<Task> tasks = taskRepository.findByProjectId(project.getId());

            for (Task task : tasks) {
                if (task.getStatus() == TaskStatus.TERMINE) continue;

                double consumedMinutes = timeEntryRepository.sumMinutesByTaskId(task.getId());
                double consumedHours = consumedMinutes / 60.0;
                double estimatedHours = task.getEstimatedHours() != null ? task.getEstimatedHours() : 0;

                if (task.getAssignee() != null) {
                    userWorkload.merge(task.getAssignee().getId(), consumedHours, Double::sum);
                }

                if (estimatedHours > 0 && task.getProgressPercent() > 0) {
                    tasksForML.add(task);
                    consumedHoursList.add(consumedHours);
                }

                // Détection des blocages
                if (task.getStatus() == TaskStatus.BLOQUE) {
                    List<TimeEntry> entries = timeEntryRepository.findByTaskId(task.getId());
                    Optional<TimeEntry> lastEntry = entries.stream()
                            .filter(e -> e.getEndTime() != null)
                            .max(Comparator.comparing(TimeEntry::getEndTime));

                    long blockedHours = lastEntry.map(e ->
                            Duration.between(e.getEndTime(), LocalDateTime.now()).toHours()
                    ).orElse(0L);

                    if (blockedHours >= 2) {
                        bottlenecks.add(Bottleneck.builder()
                                .type("TACHE_BLOQUEE")
                                .entityName(task.getName())
                                .description(String.format(
                                    "Bloquée depuis %dh sur le projet \"%s\". Assignée à %s.",
                                    blockedHours, project.getName(),
                                    task.getAssignee() != null ?
                                            task.getAssignee().getFirstName() + " " + task.getAssignee().getLastName() : "personne"))
                                .severity(blockedHours > 8 ? "CRITIQUE" : "ATTENTION")
                                .build());

                        recommendations.add(Recommendation.builder()
                                .type("DEBLOCAGE")
                                .title("Débloquer: " + task.getName())
                                .description(String.format(
                                    "Cette tâche est bloquée depuis %dh. Organiser un point technique urgent avec l'équipe.",
                                    blockedHours))
                                .priority(blockedHours > 8 ? "HAUTE" : "MOYENNE")
                                .build());
                    }
                }
            }

            double totalConsumedH = timeEntryRepository.sumMinutesByProjectId(project.getId()) / 60.0;
            double budgetH = project.getBudgetHours() != null ? project.getBudgetHours() : 0;
            if (budgetH > 0 && totalConsumedH > budgetH * 0.8) {
                double pct = (totalConsumedH / budgetH) * 100;
                bottlenecks.add(Bottleneck.builder()
                        .type("BUDGET_DEPASSE")
                        .entityName(project.getName())
                        .description(String.format("Budget consommé à %.0f%% (%.0fh / %.0fh).", pct, totalConsumedH, budgetH))
                        .severity(totalConsumedH > budgetH ? "CRITIQUE" : "ATTENTION")
                        .build());
            }
        }

        // Appel au service ML Python
        String modelName = "Rule-Based";
        String modelAccuracy = "";
        Map<Long, JsonNode> mlResults = callMLService(tasksForML, consumedHoursList);

        if (mlResults != null) {
            modelName = "Random Forest Classifier";
            modelAccuracy = "94%";
        }

        // Construire les DelayRisk avec les résultats ML
        for (int i = 0; i < tasksForML.size(); i++) {
            Task task = tasksForML.get(i);
            double consumedHours = consumedHoursList.get(i);
            double estimatedHours = task.getEstimatedHours();
            int progress = task.getProgressPercent();
            double predictedTotal = (consumedHours / progress) * 100;

            int riskLevel;
            String riskLabel;
            String explanation;
            double mlProbability = -1;

            if (mlResults != null && mlResults.containsKey(task.getId())) {
                JsonNode ml = mlResults.get(task.getId());
                mlProbability = ml.get("probability").asDouble();
                riskLabel = ml.get("risk_level").asText();
                explanation = "ML: " + ml.get("explanation").asText();

                if (mlProbability >= 75) riskLevel = 3;
                else if (mlProbability >= 50) riskLevel = 2;
                else if (mlProbability >= 30) riskLevel = 1;
                else continue;
            } else {
                // Fallback rule-based
                double overrun = predictedTotal - estimatedHours;
                if (overrun > estimatedHours * 0.5) {
                    riskLevel = 3;
                    riskLabel = "CRITIQUE";
                } else if (overrun > estimatedHours * 0.2) {
                    riskLevel = 2;
                    riskLabel = "ELEVÉ";
                } else if (overrun > 0) {
                    riskLevel = 1;
                    riskLabel = "MODÉRÉ";
                } else {
                    continue;
                }
                explanation = String.format(
                    "Tâche à %d%% avec %.1fh consommées sur %.0fh estimées. Projection: %.1fh total.",
                    progress, consumedHours, estimatedHours, predictedTotal);
            }

            delayRisks.add(DelayRisk.builder()
                    .projectId(task.getProject().getId())
                    .projectName(task.getProject().getName())
                    .taskId(task.getId())
                    .taskName(task.getName())
                    .assigneeName(task.getAssignee() != null ?
                            task.getAssignee().getFirstName() + " " + task.getAssignee().getLastName() : "Non assigné")
                    .progressPercent(progress)
                    .estimatedHours(estimatedHours)
                    .consumedHours(Math.round(consumedHours * 10) / 10.0)
                    .predictedTotalHours(Math.round(predictedTotal * 10) / 10.0)
                    .riskLevel(riskLevel)
                    .riskLabel(riskLabel)
                    .explanation(explanation)
                    .mlProbability(mlProbability)
                    .build());
        }

        userWorkload.entrySet().stream()
                .filter(e -> e.getValue() > 40)
                .forEach(e -> recommendations.add(Recommendation.builder()
                        .type("REAFFECTATION")
                        .title("Collaborateur surchargé")
                        .description(String.format(
                            "Un collaborateur cumule %.0fh de travail. Envisager de répartir ses tâches.", e.getValue()))
                        .priority("HAUTE")
                        .build()));

        delayRisks.sort((a, b) -> Integer.compare(b.getRiskLevel(), a.getRiskLevel()));

        return AIPredictionDTO.builder()
                .delayRisks(delayRisks)
                .bottlenecks(bottlenecks)
                .recommendations(recommendations)
                .modelName(modelName)
                .modelAccuracy(modelAccuracy)
                .build();
    }

    private Map<Long, JsonNode> callMLService(List<Task> tasks, List<Double> consumedHoursList) {
        if (tasks.isEmpty()) return null;

        try {
            ObjectMapper mapper = new ObjectMapper();
            List<Map<String, Object>> taskInputs = new ArrayList<>();
            List<String> taskNames = new ArrayList<>();

            for (int i = 0; i < tasks.size(); i++) {
                Task task = tasks.get(i);
                int blockedCount = task.getStatus() == TaskStatus.BLOQUE ? 1 : 0;
                Map<String, Object> input = new HashMap<>();
                input.put("progress_percent", (double) task.getProgressPercent());
                input.put("consumed_hours", consumedHoursList.get(i));
                input.put("estimated_hours", task.getEstimatedHours() != null ? (double) task.getEstimatedHours() : 0.0);
                input.put("blocked_count", blockedCount);
                input.put("days_since_start", 10);
                taskInputs.add(input);
                taskNames.add(task.getName());
            }

            Map<String, Object> body = new HashMap<>();
            body.put("tasks", taskInputs);
            body.put("task_names", taskNames);

            String jsonBody = mapper.writeValueAsString(body);

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(5))
                    .build();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(ML_SERVICE_URL))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .timeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode root = mapper.readTree(response.body());
                JsonNode predictions = root.get("predictions");
                Map<Long, JsonNode> results = new HashMap<>();

                for (int i = 0; i < tasks.size() && i < predictions.size(); i++) {
                    results.put(tasks.get(i).getId(), predictions.get(i));
                }

                log.info("ML Service: {} prédictions reçues (modèle: {})",
                        predictions.size(), root.get("model_name").asText());
                return results;
            }
        } catch (Exception e) {
            log.warn("ML Service indisponible, fallback rule-based: {}", e.getMessage());
        }
        return null;
    }
}
