package com.intellcap.controller;

import com.intellcap.dto.ActiveCollaboratorDTO;
import com.intellcap.dto.DashboardStats;
import com.intellcap.dto.WorkloadDTO;
import com.intellcap.security.UserDetailsImpl;
import com.intellcap.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/direction")
    @PreAuthorize("hasAnyRole('DIRECTION', 'ADMIN')")
    public ResponseEntity<DashboardStats> getDirectionDashboard() {
        return ResponseEntity.ok(dashboardService.getDirectionDashboard());
    }

    @GetMapping("/rt")
    @PreAuthorize("hasAnyRole('RESPONSABLE_TECHNIQUE', 'ADMIN')")
    public ResponseEntity<DashboardStats> getRTDashboard(@AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(dashboardService.getRTDashboard(user.getId()));
    }

    @GetMapping("/active-collaborators")
    @PreAuthorize("hasAnyRole('RESPONSABLE_TECHNIQUE', 'DIRECTION', 'ADMIN')")
    public ResponseEntity<List<ActiveCollaboratorDTO>> getActiveCollaborators() {
        return ResponseEntity.ok(dashboardService.getActiveCollaborators());
    }

    @GetMapping("/workload")
    @PreAuthorize("hasAnyRole('RESPONSABLE_TECHNIQUE', 'DIRECTION', 'ADMIN')")
    public ResponseEntity<List<WorkloadDTO>> getWorkload() {
        return ResponseEntity.ok(dashboardService.getWorkload());
    }
}
