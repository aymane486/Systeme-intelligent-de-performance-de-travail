package com.intellcap.controller;

import com.intellcap.dto.CreateUserRequest;
import com.intellcap.dto.UserDTO;
import com.intellcap.model.Team;
import com.intellcap.model.User;
import com.intellcap.repository.TeamRepository;
import com.intellcap.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        List<UserDTO> users = userRepository.findAll().stream().map(this::toDTO).toList();
        return ResponseEntity.ok(users);
    }

    @PostMapping
    public ResponseEntity<UserDTO> createUser(@Valid @RequestBody CreateUserRequest req) {
        if (userRepository.findByEmail(req.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().build();
        }
        User user = User.builder()
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .firstName(req.getFirstName())
                .lastName(req.getLastName())
                .role(req.getRole())
                .build();
        if (req.getTeamId() != null) {
            teamRepository.findById(req.getTeamId()).ifPresent(user::setTeam);
        }
        return ResponseEntity.ok(toDTO(userRepository.save(user)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> updateUser(@PathVariable Long id, @Valid @RequestBody CreateUserRequest req) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setEmail(req.getEmail());
        user.setFirstName(req.getFirstName());
        user.setLastName(req.getLastName());
        user.setRole(req.getRole());
        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(req.getPassword()));
        }
        if (req.getTeamId() != null) {
            teamRepository.findById(req.getTeamId()).ifPresent(user::setTeam);
        } else {
            user.setTeam(null);
        }
        return ResponseEntity.ok(toDTO(userRepository.save(user)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/teams")
    public ResponseEntity<List<TeamInfo>> getTeams() {
        List<TeamInfo> teams = teamRepository.findAll().stream()
                .map(t -> new TeamInfo(t.getId(), t.getName())).toList();
        return ResponseEntity.ok(teams);
    }

    private UserDTO toDTO(User u) {
        return UserDTO.builder()
                .id(u.getId())
                .email(u.getEmail())
                .firstName(u.getFirstName())
                .lastName(u.getLastName())
                .role(u.getRole())
                .teamId(u.getTeam() != null ? u.getTeam().getId() : null)
                .teamName(u.getTeam() != null ? u.getTeam().getName() : null)
                .build();
    }

    record TeamInfo(Long id, String name) {}
}
