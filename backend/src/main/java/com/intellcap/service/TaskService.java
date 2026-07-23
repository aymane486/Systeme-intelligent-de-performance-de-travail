package com.intellcap.service;

import com.intellcap.dto.ProgressUpdateRequest;
import com.intellcap.dto.TaskDTO;
import com.intellcap.model.Task;
import com.intellcap.model.TaskStatus;
import com.intellcap.repository.ProjectRepository;
import com.intellcap.repository.TaskRepository;
import com.intellcap.repository.TimeEntryRepository;
import com.intellcap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final TimeEntryRepository timeEntryRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public List<TaskDTO> getTasksByProject(Long projectId) {
        return taskRepository.findByProjectId(projectId).stream().map(this::toDTO).toList();
    }

    public List<TaskDTO> getTasksByAssignee(Long userId) {
        return taskRepository.findByAssigneeId(userId).stream().map(this::toDTO).toList();
    }

    public TaskDTO getTask(Long id) {
        return toDTO(taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found")));
    }

    public TaskDTO createTask(TaskDTO dto) {
        Task task = new Task();
        task.setName(dto.getName());
        task.setDescription(dto.getDescription());
        task.setStatus(dto.getStatus() != null ? dto.getStatus() : TaskStatus.EN_COURS);
        task.setProgressPercent(dto.getProgressPercent() != null ? dto.getProgressPercent() : 0);
        task.setEstimatedHours(dto.getEstimatedHours());
        task.setProject(projectRepository.findById(dto.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found")));
        if (dto.getAssigneeId() != null) {
            task.setAssignee(userRepository.findById(dto.getAssigneeId()).orElse(null));
        }
        return toDTO(taskRepository.save(task));
    }

    public TaskDTO updateProgress(ProgressUpdateRequest request) {
        Task task = taskRepository.findById(request.getTaskId())
                .orElseThrow(() -> new RuntimeException("Task not found"));
        task.setProgressPercent(request.getProgressPercent());
        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
        }
        if (request.getTechnicalComment() != null) {
            task.setTechnicalComment(request.getTechnicalComment());
        }
        if (request.getProgressPercent() == 100) {
            task.setStatus(TaskStatus.TERMINE);
        }
        Task saved = taskRepository.save(task);

        messagingTemplate.convertAndSend("/topic/tasks/" + task.getProject().getId(), toDTO(saved));

        return toDTO(saved);
    }

    public void deleteTask(Long id) {
        taskRepository.deleteById(id);
    }

    private TaskDTO toDTO(Task task) {
        TaskDTO dto = new TaskDTO();
        dto.setId(task.getId());
        dto.setName(task.getName());
        dto.setDescription(task.getDescription());
        dto.setStatus(task.getStatus());
        dto.setProgressPercent(task.getProgressPercent());
        dto.setProjectId(task.getProject().getId());
        dto.setProjectName(task.getProject().getName());
        dto.setEstimatedHours(task.getEstimatedHours());
        dto.setTechnicalComment(task.getTechnicalComment());
        if (task.getAssignee() != null) {
            dto.setAssigneeId(task.getAssignee().getId());
            dto.setAssigneeName(task.getAssignee().getFirstName() + " " + task.getAssignee().getLastName());
        }
        dto.setTotalTimeSpentMinutes(timeEntryRepository.sumMinutesByTaskId(task.getId()));
        return dto;
    }
}
