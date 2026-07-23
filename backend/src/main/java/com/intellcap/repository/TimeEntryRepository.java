package com.intellcap.repository;

import com.intellcap.model.TimeEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface TimeEntryRepository extends JpaRepository<TimeEntry, Long> {
    List<TimeEntry> findByUserId(Long userId);
    List<TimeEntry> findByTaskId(Long taskId);
    Optional<TimeEntry> findByUserIdAndEndTimeIsNull(Long userId);

    @Query("SELECT COALESCE(SUM(t.totalMinutes), 0) FROM TimeEntry t WHERE t.task.id = :taskId")
    Long sumMinutesByTaskId(Long taskId);

    @Query("SELECT COALESCE(SUM(t.totalMinutes), 0) FROM TimeEntry t WHERE t.task.project.id = :projectId")
    Long sumMinutesByProjectId(Long projectId);

    List<TimeEntry> findByEndTimeIsNull();
}
