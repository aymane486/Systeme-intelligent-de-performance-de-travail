package com.intellcap.repository;

import com.intellcap.model.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TeamRepository extends JpaRepository<Team, Long> {
    List<Team> findByResponsableId(Long responsableId);
}
