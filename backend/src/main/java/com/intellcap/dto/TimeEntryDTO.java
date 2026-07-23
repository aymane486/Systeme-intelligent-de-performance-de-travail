package com.intellcap.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class TimeEntryDTO {
    private Long id;
    private Long userId;
    private Long taskId;
    private String taskName;
    private String projectName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private boolean paused;
    private Long totalMinutes;
}
