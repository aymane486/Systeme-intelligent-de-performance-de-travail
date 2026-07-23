package com.intellcap.security;

import com.intellcap.model.AuditLog;
import com.intellcap.repository.AuditLogRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class AuditFilter extends OncePerRequestFilter {

    private final AuditLogRepository auditLogRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        filterChain.doFilter(request, response);

        String uri = request.getRequestURI();
        if (!uri.startsWith("/api/v1/") || uri.contains("/auth/")) {
            return;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return;
        }

        String method = request.getMethod();
        String email = auth.getName();
        String userName = "";
        if (auth.getPrincipal() instanceof UserDetailsImpl userDetails) {
            userName = userDetails.getFirstName() + " " + userDetails.getLastName();
        }

        String action = switch (method) {
            case "GET" -> "Consultation";
            case "POST" -> "Creation";
            case "PUT" -> "Modification";
            case "DELETE" -> "Suppression";
            default -> method;
        };

        auditLogRepository.save(AuditLog.builder()
                .userEmail(email)
                .userName(userName)
                .action(action)
                .endpoint(uri)
                .method(method)
                .timestamp(LocalDateTime.now())
                .build());
    }
}
