package com.intellcap.service;

import com.intellcap.dto.AuthRequest;
import com.intellcap.dto.AuthResponse;
import com.intellcap.dto.RegisterRequest;
import com.intellcap.model.User;
import com.intellcap.repository.TeamRepository;
import com.intellcap.repository.UserRepository;
import com.intellcap.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(request.getRole())
                .build();

        if (request.getTeamId() != null) {
            user.setTeam(teamRepository.findById(request.getTeamId()).orElse(null));
        }

        user = userRepository.save(user);
        String token = jwtUtils.generateToken(user.getEmail(), user.getRole().name());

        return new AuthResponse(token, user.getId(), user.getEmail(),
                user.getFirstName(), user.getLastName(), user.getRole());
    }

    public AuthResponse login(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtUtils.generateToken(user.getEmail(), user.getRole().name());

        return new AuthResponse(token, user.getId(), user.getEmail(),
                user.getFirstName(), user.getLastName(), user.getRole());
    }
}
