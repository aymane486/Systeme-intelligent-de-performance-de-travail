package com.intellcap.controller;

import com.intellcap.dto.TeamMemberDTO;
import com.intellcap.model.Team;
import com.intellcap.model.User;
import com.intellcap.repository.TeamRepository;
import com.intellcap.repository.UserRepository;
import com.intellcap.security.UserDetailsImpl;
import com.intellcap.service.TeamService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/team")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;

    @GetMapping("/members")
    @PreAuthorize("hasAnyRole('RESPONSABLE_TECHNIQUE', 'ADMIN')")
    public ResponseEntity<List<TeamMemberDTO>> getMyTeamMembers(@AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(teamService.getTeamMembers(user.getId()));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TeamInfoDTO>> getAllTeams() {
        List<TeamInfoDTO> teams = teamRepository.findAll().stream().map(this::toDTO).toList();
        return ResponseEntity.ok(teams);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TeamInfoDTO> createTeam(@RequestBody CreateTeamRequest req) {
        Team team = Team.builder().name(req.getName()).build();
        if (req.getResponsableId() != null) {
            userRepository.findById(req.getResponsableId()).ifPresent(team::setResponsable);
        }
        return ResponseEntity.ok(toDTO(teamRepository.save(team)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TeamInfoDTO> updateTeam(@PathVariable Long id, @RequestBody CreateTeamRequest req) {
        Team team = teamRepository.findById(id).orElseThrow(() -> new RuntimeException("Team not found"));
        team.setName(req.getName());
        if (req.getResponsableId() != null) {
            userRepository.findById(req.getResponsableId()).ifPresent(team::setResponsable);
        } else {
            team.setResponsable(null);
        }
        return ResponseEntity.ok(toDTO(teamRepository.save(team)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteTeam(@PathVariable Long id) {
        teamRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    private TeamInfoDTO toDTO(Team t) {
        TeamInfoDTO dto = new TeamInfoDTO();
        dto.setId(t.getId());
        dto.setName(t.getName());
        dto.setMemberCount(t.getMembers() != null ? t.getMembers().size() : 0);
        if (t.getResponsable() != null) {
            dto.setResponsableId(t.getResponsable().getId());
            dto.setResponsableName(t.getResponsable().getFirstName() + " " + t.getResponsable().getLastName());
        }
        return dto;
    }

    @Data
    static class TeamInfoDTO {
        private Long id;
        private String name;
        private int memberCount;
        private Long responsableId;
        private String responsableName;
    }

    @Data
    static class CreateTeamRequest {
        private String name;
        private Long responsableId;
    }
}
