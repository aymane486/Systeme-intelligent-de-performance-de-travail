package com.intellcap.repository;

import com.intellcap.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByTeamId(Long teamId);
    List<Project> findByTeamIdIn(List<Long> teamIds);
}
