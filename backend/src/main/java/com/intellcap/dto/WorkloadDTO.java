package com.intellcap.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class WorkloadDTO {
    private Long userId;
    private String firstName;
    private String lastName;
    private long totalMinutes;
    private int activeTasks;
    private int completedTasks;
    private double averageProgress;
}
