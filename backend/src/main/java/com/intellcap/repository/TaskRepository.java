package com.intellcap.repository;

import com.intellcap.model.Task;
import com.intellcap.model.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByProjectId(Long projectId);
    List<Task> findByAssigneeId(Long assigneeId);
    List<Task> findByProjectIdIn(List<Long> projectIds);
    List<Task> findByStatus(TaskStatus status);
    long countByProjectIdAndStatus(Long projectId, TaskStatus status);
}
