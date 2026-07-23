package com.intellcap.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class ProjectDTO {
    private Long id;
    private String name;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private Long budgetHours;
    private Long teamId;
    private String teamName;
    private Integer globalProgress;
    private Long totalTimeSpentMinutes;
}
