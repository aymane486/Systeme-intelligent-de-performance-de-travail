package com.intellcap.service;

import com.intellcap.dto.ActiveCollaboratorDTO;
import com.intellcap.dto.AlertDTO;
import com.intellcap.dto.DashboardStats;
import com.intellcap.dto.ProjectDTO;
import com.intellcap.dto.WorkloadDTO;
import com.intellcap.model.User;
import com.intellcap.model.Alert;
import com.intellcap.model.Task;
import com.intellcap.model.TaskStatus;
import com.intellcap.model.Team;
import com.intellcap.model.TimeEntry;
import com.intellcap.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ProjectService projectService;
    private final TaskRepository taskRepository;
    private final AlertRepository alertRepository;
    private final TeamRepository teamRepository;
    private final TimeEntryRepository timeEntryRepository;
    private final UserRepository userRepository;

    public DashboardStats getDirectionDashboard() {
        List<ProjectDTO> projects = projectService.getAllProjects();
        return buildStats(projects);
    }

    public DashboardStats getRTDashboard(Long responsableId) {
        List<ProjectDTO> projects = projectService.getProjectsByResponsable(responsableId);
        return buildStats(projects);
    }

    private DashboardStats buildStats(List<ProjectDTO> projects) {
        List<Long> projectIds = projects.stream().map(ProjectDTO::getId).toList();
        List<Task> allTasks = taskRepository.findByProjectIdIn(projectIds);

        List<Alert> alerts = alertRepository.findByResolvedFalseOrderByCreatedAtDesc();
        List<AlertDTO> alertDTOs = alerts.stream().map(this::toAlertDTO).toList();

        long completedTasks = allTasks.stream().filter(t -> t.getStatus() == TaskStatus.TERMINE).count();
        long blockedTasks = allTasks.stream().filter(t -> t.getStatus() == TaskStatus.BLOQUE).count();
        double globalProgress = allTasks.isEmpty() ? 0 :
                allTasks.stream().mapToInt(Task::getProgressPercent).average().orElse(0);
        long totalTimeSpent = projects.stream()
                .mapToLong(p -> p.getTotalTimeSpentMinutes() != null ? p.getTotalTimeSpentMinutes() : 0).sum();
        long budgetHours = projects.stream()
                .mapToLong(p -> p.getBudgetHours() != null ? p.getBudgetHours() : 0).sum();

        return DashboardStats.builder()
                .totalProjects(projects.size())
                .activeProjects((int) projects.stream().filter(p -> p.getGlobalProgress() < 100).count())
                .totalTasks(allTasks.size())
                .completedTasks((int) completedTasks)
                .blockedTasks((int) blockedTasks)
                .globalProgressPercent(globalProgress)
                .totalTimeSpentMinutes(totalTimeSpent)
                .budgetHoursTotal(budgetHours)
                .projects(projects)
                .activeAlerts(alertDTOs)
                .build();
    }

    public List<ActiveCollaboratorDTO> getActiveCollaborators() {
        return timeEntryRepository.findByEndTimeIsNull().stream()
                .map(entry -> ActiveCollaboratorDTO.builder()
                        .userId(entry.getUser().getId())
                        .firstName(entry.getUser().getFirstName())
                        .lastName(entry.getUser().getLastName())
                        .taskName(entry.getTask().getName())
                        .projectName(entry.getTask().getProject().getName())
                        .startTime(entry.getStartTime())
                        .paused(entry.isPaused())
                        .build())
                .toList();
    }

    public List<WorkloadDTO> getWorkload() {
        List<TimeEntry> allEntries = timeEntryRepository.findAll();
        Map<Long, List<TimeEntry>> byUser = allEntries.stream()
                .collect(Collectors.groupingBy(e -> e.getUser().getId()));

        return byUser.entrySet().stream().map(entry -> {
            User user = entry.getValue().get(0).getUser();
            long totalMin = entry.getValue().stream()
                    .mapToLong(e -> e.getTotalMinutes() != null ? e.getTotalMinutes() : 0).sum();
            List<com.intellcap.model.Task> tasks = taskRepository.findByAssigneeId(user.getId());
            int active = (int) tasks.stream().filter(t -> t.getStatus() != TaskStatus.TERMINE).count();
            int completed = (int) tasks.stream().filter(t -> t.getStatus() == TaskStatus.TERMINE).count();
            double avgProgress = tasks.isEmpty() ? 0 :
                    tasks.stream().mapToInt(com.intellcap.model.Task::getProgressPercent).average().orElse(0);
            return WorkloadDTO.builder()
                    .userId(user.getId())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .totalMinutes(totalMin)
                    .activeTasks(active)
                    .completedTasks(completed)
                    .averageProgress(avgProgress)
                    .build();
        }).sorted((a, b) -> Long.compare(b.getTotalMinutes(), a.getTotalMinutes())).toList();
    }

    private AlertDTO toAlertDTO(Alert alert) {
        AlertDTO dto = new AlertDTO();
        dto.setId(alert.getId());
        dto.setType(alert.getType());
        dto.setMessage(alert.getMessage());
        dto.setResolved(alert.isResolved());
        dto.setCreatedAt(alert.getCreatedAt());
        if (alert.getTask() != null) {
            dto.setTaskId(alert.getTask().getId());
            dto.setTaskName(alert.getTask().getName());
        }
        if (alert.getProject() != null) {
            dto.setProjectId(alert.getProject().getId());
            dto.setProjectName(alert.getProject().getName());
        }
        return dto;
    }
}
