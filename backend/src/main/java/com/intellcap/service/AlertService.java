package com.intellcap.service;

import com.intellcap.model.*;
import com.intellcap.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlertService {

    private final TaskRepository taskRepository;
    private final TimeEntryRepository timeEntryRepository;
    private final ProjectRepository projectRepository;
    private final AlertRepository alertRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Scheduled(fixedRate = 300000)
    public void checkAndGenerateAlerts() {
        checkBlockedTasks();
        checkBudgetOverruns();
        checkStagnantProgress();
    }

    private void checkBlockedTasks() {
        List<Task> blockedTasks = taskRepository.findByStatus(TaskStatus.BLOQUE);
        for (Task task : blockedTasks) {
            List<TimeEntry> entries = timeEntryRepository.findByTaskId(task.getId());
            LocalDateTime blockedSince = entries.stream()
                    .filter(e -> e.getEndTime() != null)
                    .map(TimeEntry::getEndTime)
                    .max(LocalDateTime::compareTo)
                    .orElse(LocalDateTime.now().minusHours(3));

            long hoursBlocked = Duration.between(blockedSince, LocalDateTime.now()).toHours();

            if (hoursBlocked >= 2) {
                boolean alreadyExists = alertRepository.findByResolvedFalseOrderByCreatedAtDesc().stream()
                        .anyMatch(a -> a.getTask() != null
                                && a.getTask().getId().equals(task.getId())
                                && "BLOCAGE".equals(a.getType()));
                if (!alreadyExists) {
                    Alert alert = alertRepository.save(Alert.builder()
                            .type("BLOCAGE")
                            .message(String.format("Tâche \"%s\" bloquée depuis %dh. Assignée à %s.",
                                    task.getName(), hoursBlocked,
                                    task.getAssignee() != null ?
                                            task.getAssignee().getFirstName() + " " + task.getAssignee().getLastName() : "personne"))
                            .task(task)
                            .project(task.getProject())
                            .resolved(false)
                            .build());
                    notifyAlert(alert);
                }
            }
        }
    }

    private void checkBudgetOverruns() {
        List<Project> projects = projectRepository.findAll();
        for (Project project : projects) {
            if (project.getBudgetHours() == null || project.getBudgetHours() == 0) continue;

            long consumedMinutes = timeEntryRepository.sumMinutesByProjectId(project.getId());
            double consumedHours = consumedMinutes / 60.0;
            double budgetHours = project.getBudgetHours();
            double ratio = consumedHours / budgetHours;

            if (ratio >= 0.8) {
                boolean alreadyExists = alertRepository.findByResolvedFalseOrderByCreatedAtDesc().stream()
                        .anyMatch(a -> a.getProject() != null
                                && a.getProject().getId().equals(project.getId())
                                && "DEPASSEMENT_BUDGET".equals(a.getType()));
                if (!alreadyExists) {
                    String severity = ratio >= 1.0 ? "DÉPASSÉ" : "ATTENTION";
                    Alert alert = alertRepository.save(Alert.builder()
                            .type("DEPASSEMENT_BUDGET")
                            .message(String.format("Projet \"%s\": budget à %.0f%% (%.0fh / %.0fh). %s",
                                    project.getName(), ratio * 100, consumedHours, budgetHours, severity))
                            .project(project)
                            .resolved(false)
                            .build());
                    notifyAlert(alert);
                }
            }
        }
    }

    private void checkStagnantProgress() {
        List<Task> activeTasks = taskRepository.findByStatus(TaskStatus.EN_COURS);
        for (Task task : activeTasks) {
            if (task.getEstimatedHours() == null || task.getEstimatedHours() == 0) continue;

            long consumedMinutes = timeEntryRepository.sumMinutesByTaskId(task.getId());
            double consumedHours = consumedMinutes / 60.0;
            int progress = task.getProgressPercent();

            if (progress > 0 && consumedHours > 0) {
                double predictedTotal = (consumedHours / progress) * 100;
                double overrunRatio = predictedTotal / task.getEstimatedHours();

                if (overrunRatio >= 1.5) {
                    boolean alreadyExists = alertRepository.findByResolvedFalseOrderByCreatedAtDesc().stream()
                            .anyMatch(a -> a.getTask() != null
                                    && a.getTask().getId().equals(task.getId())
                                    && "RETARD_PREDIT".equals(a.getType()));
                    if (!alreadyExists) {
                        Alert alert = alertRepository.save(Alert.builder()
                                .type("RETARD_PREDIT")
                                .message(String.format("Tâche \"%s\": projection IA à %.0fh (estimé %dh). Risque de retard important.",
                                        task.getName(), predictedTotal, task.getEstimatedHours()))
                                .task(task)
                                .project(task.getProject())
                                .resolved(false)
                                .build());
                        notifyAlert(alert);
                    }
                }
            }
        }
    }

    private void notifyAlert(Alert alert) {
        log.info("Alerte auto-générée: [{}] {}", alert.getType(), alert.getMessage());
        messagingTemplate.convertAndSend("/topic/alerts", Map.of(
                "type", alert.getType(),
                "message", alert.getMessage(),
                "projectName", alert.getProject() != null ? alert.getProject().getName() : "",
                "taskName", alert.getTask() != null ? alert.getTask().getName() : ""
        ));
    }
}
