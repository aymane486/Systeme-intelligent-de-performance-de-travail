package com.intellcap.controller;

import com.intellcap.dto.AIPredictionDTO;
import com.intellcap.service.AIService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AIController {

    private final AIService aiService;

    @GetMapping("/predictions")
    @PreAuthorize("hasAnyRole('RESPONSABLE_TECHNIQUE', 'DIRECTION', 'ADMIN')")
    public ResponseEntity<AIPredictionDTO> getPredictions() {
        return ResponseEntity.ok(aiService.analyze());
    }
}
