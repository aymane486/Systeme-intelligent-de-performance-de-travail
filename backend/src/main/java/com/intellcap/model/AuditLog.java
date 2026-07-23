package com.intellcap.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String userEmail;

    private String userName;

    @Column(nullable = false)
    private String action;

    @Column(nullable = false)
    private String endpoint;

    private String method;

    @Column(nullable = false)
    private LocalDateTime timestamp;
}
