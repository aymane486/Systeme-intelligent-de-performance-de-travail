package com.intellcap.config;

import com.intellcap.model.*;
import com.intellcap.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final TimeEntryRepository timeEntryRepository;
    private final AlertRepository alertRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) return;

        User admin = userRepository.save(User.builder()
                .email("admin@intellcap.com")
                .password(passwordEncoder.encode("admin123"))
                .firstName("Admin")
                .lastName("System")
                .role(Role.ADMIN)
                .build());

        User patron = userRepository.save(User.builder()
                .email("direction@intellcap.com")
                .password(passwordEncoder.encode("direction123"))
                .firstName("Mohamed")
                .lastName("Alami")
                .role(Role.DIRECTION)
                .build());

        User rt = userRepository.save(User.builder()
                .email("rt@intellcap.com")
                .password(passwordEncoder.encode("rt123"))
                .firstName("Youssef")
                .lastName("Bennani")
                .role(Role.RESPONSABLE_TECHNIQUE)
                .build());

        Team team = teamRepository.save(Team.builder()
                .name("Equipe R&D")
                .responsable(rt)
                .build());

        User collab1 = userRepository.save(User.builder()
                .email("collab1@intellcap.com")
                .password(passwordEncoder.encode("collab123"))
                .firstName("Ayman")
                .lastName("Rifki")
                .role(Role.COLLABORATEUR)
                .team(team)
                .build());

        User collab2 = userRepository.save(User.builder()
                .email("collab2@intellcap.com")
                .password(passwordEncoder.encode("collab123"))
                .firstName("Oumayma")
                .lastName("Tahiri")
                .role(Role.COLLABORATEUR)
                .team(team)
                .build());

        Project project = projectRepository.save(Project.builder()
                .name("Projet PFA - IA Monitoring")
                .description("Développement d'une solution IA pour le monitoring du travail")
                .startDate(LocalDate.now().minusMonths(1))
                .endDate(LocalDate.now().plusMonths(2))
                .budgetHours(500L)
                .team(team)
                .build());

        taskRepository.save(Task.builder()
                .name("Conception de l'architecture")
                .description("Design de l'architecture technique")
                .status(TaskStatus.TERMINE)
                .progressPercent(100)
                .project(project)
                .assignee(collab1)
                .estimatedHours(40L)
                .build());

        Task taskBackend = taskRepository.save(Task.builder()
                .name("Développement Backend API")
                .description("API REST Spring Boot")
                .status(TaskStatus.EN_COURS)
                .progressPercent(60)
                .project(project)
                .assignee(collab1)
                .estimatedHours(120L)
                .build());

        Task taskFrontend = taskRepository.save(Task.builder()
                .name("Développement Frontend React")
                .description("Interface utilisateur React")
                .status(TaskStatus.EN_COURS)
                .progressPercent(30)
                .project(project)
                .assignee(collab2)
                .estimatedHours(100L)
                .build());

        Task taskIA = taskRepository.save(Task.builder()
                .name("Intégration Moteur IA")
                .description("Prédiction de retards et détection de goulots")
                .status(TaskStatus.BLOQUE)
                .progressPercent(10)
                .project(project)
                .assignee(collab2)
                .estimatedHours(80L)
                .technicalComment("En attente des données d'entraînement")
                .build());

        // -- Données de temps réalistes pour le moteur IA --

        // Backend API: 90h consommées à 60% → projection ~150h (dépasse 120h estimées)
        for (int i = 0; i < 9; i++) {
            timeEntryRepository.save(TimeEntry.builder()
                    .user(collab1)
                    .task(taskBackend)
                    .startTime(LocalDateTime.now().minusDays(20 - i * 2).withHour(9))
                    .endTime(LocalDateTime.now().minusDays(20 - i * 2).withHour(19))
                    .paused(false)
                    .totalMinutes(600L)
                    .build());
        }

        // Frontend: 50h consommées à 30% → projection ~167h (dépasse 100h estimées)
        for (int i = 0; i < 5; i++) {
            timeEntryRepository.save(TimeEntry.builder()
                    .user(collab2)
                    .task(taskFrontend)
                    .startTime(LocalDateTime.now().minusDays(15 - i * 3).withHour(9))
                    .endTime(LocalDateTime.now().minusDays(15 - i * 3).withHour(19))
                    .paused(false)
                    .totalMinutes(600L)
                    .build());
        }

        // IA: 12h consommées à 10%, bloquée depuis 3 jours
        timeEntryRepository.save(TimeEntry.builder()
                .user(collab2)
                .task(taskIA)
                .startTime(LocalDateTime.now().minusDays(3).withHour(9))
                .endTime(LocalDateTime.now().minusDays(3).withHour(21))
                .paused(false)
                .totalMinutes(720L)
                .build());

        // Alertes
        alertRepository.save(Alert.builder()
                .type("BLOCAGE")
                .message("Tâche bloquée depuis plus de 48h - En attente des données d'entraînement")
                .task(taskIA)
                .project(project)
                .resolved(false)
                .build());

        alertRepository.save(Alert.builder()
                .type("DEPASSEMENT")
                .message("Budget temps Backend API dépassera l'estimation selon la projection IA")
                .task(taskBackend)
                .project(project)
                .resolved(false)
                .build());
    }
}
