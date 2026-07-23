package com.intellcap.controller;

import com.intellcap.dto.KeyActivationRequest;
import com.intellcap.dto.TimeEntryDTO;
import com.intellcap.model.TimeEntry;
import com.intellcap.security.UserDetailsImpl;
import com.intellcap.service.KeyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/key")
@RequiredArgsConstructor
public class KeyController {

    private final KeyService keyService;

    @PostMapping("/activate")
    public ResponseEntity<TimeEntryDTO> activate(@AuthenticationPrincipal UserDetailsImpl user,
                                               @Valid @RequestBody KeyActivationRequest request) {
        return ResponseEntity.ok(keyService.activate(user.getId(), request.getTaskId()));
    }

    @PostMapping("/deactivate")
    public ResponseEntity<TimeEntryDTO> deactivate(@AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(keyService.deactivate(user.getId()));
    }

    @PostMapping("/pause")
    public ResponseEntity<TimeEntryDTO> pause(@AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(keyService.pause(user.getId()));
    }

    @PostMapping("/resume")
    public ResponseEntity<TimeEntryDTO> resume(@AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(keyService.resume(user.getId()));
    }

    @GetMapping("/history")
    public ResponseEntity<List<TimeEntryDTO>> getHistory(@AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(keyService.getHistory(user.getId()));
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus(@AuthenticationPrincipal UserDetailsImpl user) {
        Optional<TimeEntry> active = keyService.getActiveEntry(user.getId());
        if (active.isPresent()) {
            TimeEntry entry = active.get();
            return ResponseEntity.ok(Map.of(
                    "active", true,
                    "taskId", entry.getTask().getId(),
                    "startTime", entry.getStartTime().toString(),
                    "paused", entry.isPaused()
            ));
        }
        return ResponseEntity.ok(Map.of("active", false));
    }
}
