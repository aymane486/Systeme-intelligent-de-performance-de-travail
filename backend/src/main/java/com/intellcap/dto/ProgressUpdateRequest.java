package com.intellcap.dto;

import com.intellcap.model.TaskStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProgressUpdateRequest {
    @NotNull
    private Long taskId;
    @NotNull @Min(0) @Max(100)
    private Integer progressPercent;
    private TaskStatus status;
    private String technicalComment;
}
