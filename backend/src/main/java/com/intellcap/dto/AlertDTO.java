package com.intellcap.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AlertDTO {
    private Long id;
    private String type;
    private String message;
    private Long taskId;
    private String taskName;
    private Long projectId;
    private String projectName;
    private boolean resolved;
    private LocalDateTime createdAt;
}
