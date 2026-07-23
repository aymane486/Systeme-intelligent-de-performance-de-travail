package com.intellcap.service;

import com.intellcap.dto.TimeEntryDTO;
import com.intellcap.model.Task;
import com.intellcap.model.TimeEntry;
import com.intellcap.model.User;
import com.intellcap.repository.TaskRepository;
import com.intellcap.repository.TimeEntryRepository;
import com.intellcap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class KeyService {

    private final TimeEntryRepository timeEntryRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public TimeEntryDTO activate(Long userId, Long taskId) {
        Optional<TimeEntry> active = timeEntryRepository.findByUserIdAndEndTimeIsNull(userId);
        if (active.isPresent()) {
            throw new RuntimeException("Key already active. Deactivate first.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        TimeEntry entry = TimeEntry.builder()
                .user(user)
                .task(task)
                .startTime(LocalDateTime.now())
                .paused(false)
                .build();

        entry = timeEntryRepository.save(entry);

        messagingTemplate.convertAndSend("/topic/key-events",
                Map.of("event", "activated", "userId", userId, "taskId", taskId));

        return toDTO(entry);
    }

    public TimeEntryDTO deactivate(Long userId) {
        TimeEntry entry = timeEntryRepository.findByUserIdAndEndTimeIsNull(userId)
                .orElseThrow(() -> new RuntimeException("No active key found"));

        entry.setEndTime(LocalDateTime.now());
        entry.setTotalMinutes(Duration.between(entry.getStartTime(), entry.getEndTime()).toMinutes());
        entry = timeEntryRepository.save(entry);

        messagingTemplate.convertAndSend("/topic/key-events",
                Map.of("event", "deactivated", "userId", userId,
                        "taskId", entry.getTask().getId(),
                        "minutes", entry.getTotalMinutes()));

        return toDTO(entry);
    }

    public TimeEntryDTO pause(Long userId) {
        TimeEntry entry = timeEntryRepository.findByUserIdAndEndTimeIsNull(userId)
                .orElseThrow(() -> new RuntimeException("No active key found"));
        entry.setPaused(true);
        return toDTO(timeEntryRepository.save(entry));
    }

    public TimeEntryDTO resume(Long userId) {
        TimeEntry entry = timeEntryRepository.findByUserIdAndEndTimeIsNull(userId)
                .orElseThrow(() -> new RuntimeException("No active key found"));
        entry.setPaused(false);
        return toDTO(timeEntryRepository.save(entry));
    }

    public List<TimeEntryDTO> getHistory(Long userId) {
        return timeEntryRepository.findByUserId(userId).stream()
                .filter(e -> e.getEndTime() != null)
                .sorted((a, b) -> b.getEndTime().compareTo(a.getEndTime()))
                .map(this::toDTO)
                .toList();
    }

    public Optional<TimeEntry> getActiveEntry(Long userId) {
        return timeEntryRepository.findByUserIdAndEndTimeIsNull(userId);
    }

    private TimeEntryDTO toDTO(TimeEntry entry) {
        return TimeEntryDTO.builder()
                .id(entry.getId())
                .userId(entry.getUser().getId())
                .taskId(entry.getTask().getId())
                .taskName(entry.getTask().getName())
                .projectName(entry.getTask().getProject().getName())
                .startTime(entry.getStartTime())
                .endTime(entry.getEndTime())
                .paused(entry.isPaused())
                .totalMinutes(entry.getTotalMinutes())
                .build();
    }
}
