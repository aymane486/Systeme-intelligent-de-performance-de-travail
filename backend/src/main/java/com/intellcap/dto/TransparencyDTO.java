package com.intellcap.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class TransparencyDTO {
    private String firstName;
    private String lastName;
    private String teamName;
    private String rtName;
    private long totalTimeSpentMinutes;
    private int totalTasks;
    private int completedTasks;
    private int blockedTasks;
    private List<TaskView> tasks;
    private List<TimeEntryDTO> recentSessions;

    @Data
    @Builder
    public static class TaskView {
        private Long taskId;
        private String taskName;
        private String projectName;
        private String status;
        private int progressPercent;
        private long timeSpentMinutes;
        private Long estimatedHours;
    }
}
