package com.intellcap.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class TeamMemberDTO {
    private Long userId;
    private String firstName;
    private String lastName;
    private String email;
    private boolean keyActive;
    private boolean keyPaused;
    private String currentTaskName;
    private String currentProjectName;
    private LocalDateTime keyStartTime;
    private List<MemberTask> tasks;

    @Data
    @Builder
    public static class MemberTask {
        private Long taskId;
        private String taskName;
        private String projectName;
        private String status;
        private int progressPercent;
        private long timeSpentMinutes;
    }
}
