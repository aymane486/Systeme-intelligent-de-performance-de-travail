package com.intellcap.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class AIPredictionDTO {
    private List<DelayRisk> delayRisks;
    private List<Bottleneck> bottlenecks;
    private List<Recommendation> recommendations;
    @Builder.Default
    private String modelName = "Rule-Based";
    @Builder.Default
    private String modelAccuracy = "";

    @Data
    @Builder
    public static class DelayRisk {
        private Long projectId;
        private String projectName;
        private Long taskId;
        private String taskName;
        private String assigneeName;
        private int progressPercent;
        private double estimatedHours;
        private double consumedHours;
        private double predictedTotalHours;
        private int riskLevel;
        private String riskLabel;
        private String explanation;
        @Builder.Default
        private double mlProbability = -1;
    }

    @Data
    @Builder
    public static class Bottleneck {
        private String type;
        private String entityName;
        private String description;
        private String severity;
    }

    @Data
    @Builder
    public static class Recommendation {
        private String type;
        private String title;
        private String description;
        private String priority;
    }
}
