package com.intellcap.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ActiveCollaboratorDTO {
    private Long userId;
    private String firstName;
    private String lastName;
    private String taskName;
    private String projectName;
    private LocalDateTime startTime;
    private boolean paused;
}
