package com.intellcap.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class KeyActivationRequest {
    @NotNull
    private Long taskId;
}
