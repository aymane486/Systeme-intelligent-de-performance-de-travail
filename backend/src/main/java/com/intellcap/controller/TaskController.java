package com.intellcap.controller;

import com.intellcap.dto.ProgressUpdateRequest;
import com.intellcap.dto.TaskDTO;
import com.intellcap.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<TaskDTO>> getByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(taskService.getTasksByProject(projectId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<TaskDTO>> getByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(taskService.getTasksByAssignee(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskDTO> getTask(@PathVariable Long id) {
        return ResponseEntity.ok(taskService.getTask(id));
    }

    @PostMapping
    public ResponseEntity<TaskDTO> createTask(@RequestBody TaskDTO dto) {
        return ResponseEntity.ok(taskService.createTask(dto));
    }

    @PutMapping("/progress")
    public ResponseEntity<TaskDTO> updateProgress(@Valid @RequestBody ProgressUpdateRequest request) {
        return ResponseEntity.ok(taskService.updateProgress(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }
}
