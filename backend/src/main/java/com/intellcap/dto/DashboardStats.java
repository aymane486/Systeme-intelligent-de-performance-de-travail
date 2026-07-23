package com.intellcap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStats {
    private int totalProjects;
    private int activeProjects;
    private int totalTasks;
    private int completedTasks;
    private int blockedTasks;
    private double globalProgressPercent;
    private long totalTimeSpentMinutes;
    private long budgetHoursTotal;
    private List<ProjectDTO> projects;
    private List<AlertDTO> activeAlerts;
}
