package com.intellcap.dto;

import com.intellcap.model.TaskStatus;
import lombok.Data;

@Data
public class TaskDTO {
    private Long id;
    private String name;
    private String description;
    private TaskStatus status;
    private Integer progressPercent;
    private Long projectId;
    private String projectName;
    private Long assigneeId;
    private String assigneeName;
    private Long estimatedHours;
    private Long totalTimeSpentMinutes;
    private String technicalComment;
}
