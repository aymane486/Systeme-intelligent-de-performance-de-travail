package com.intellcap.controller;

import com.intellcap.dto.TimeEntryDTO;
import com.intellcap.dto.TransparencyDTO;
import com.intellcap.dto.TransparencyDTO.TaskView;
import com.intellcap.model.*;
import com.intellcap.repository.*;
import com.intellcap.security.UserDetailsImpl;
import com.intellcap.service.KeyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/transparency")
@RequiredArgsConstructor
public class TransparencyController {

    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final TimeEntryRepository timeEntryRepository;
    private final KeyService keyService;

    @GetMapping("/my-view")
    public ResponseEntity<TransparencyDTO> getMyView(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Task> tasks = taskRepository.findByAssigneeId(user.getId());

        List<TaskView> taskViews = tasks.stream().map(task -> {
            long timeSpent = timeEntryRepository.sumMinutesByTaskId(task.getId());
            return TaskView.builder()
                    .taskId(task.getId())
                    .taskName(task.getName())
                    .projectName(task.getProject().getName())
                    .status(task.getStatus().name())
                    .progressPercent(task.getProgressPercent())
                    .timeSpentMinutes(timeSpent)
                    .estimatedHours(task.getEstimatedHours())
                    .build();
        }).toList();

        long totalTime = taskViews.stream().mapToLong(TaskView::getTimeSpentMinutes).sum();
        int completed = (int) tasks.stream().filter(t -> t.getStatus() == TaskStatus.TERMINE).count();
        int blocked = (int) tasks.stream().filter(t -> t.getStatus() == TaskStatus.BLOQUE).count();

        List<TimeEntryDTO> recentSessions = keyService.getHistory(user.getId()).stream()
                .limit(10).toList();

        String teamName = user.getTeam() != null ? user.getTeam().getName() : "Aucune";
        String rtName = user.getTeam() != null && user.getTeam().getResponsable() != null
                ? user.getTeam().getResponsable().getFirstName() + " " + user.getTeam().getResponsable().getLastName()
                : "Non défini";

        return ResponseEntity.ok(TransparencyDTO.builder()
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .teamName(teamName)
                .rtName(rtName)
                .totalTimeSpentMinutes(totalTime)
                .totalTasks(tasks.size())
                .completedTasks(completed)
                .blockedTasks(blocked)
                .tasks(taskViews)
                .recentSessions(recentSessions)
                .build());
    }
}
