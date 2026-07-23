package com.intellcap.repository;

import com.intellcap.model.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findByResolvedFalseOrderByCreatedAtDesc();
    List<Alert> findByProjectIdAndResolvedFalse(Long projectId);
}
