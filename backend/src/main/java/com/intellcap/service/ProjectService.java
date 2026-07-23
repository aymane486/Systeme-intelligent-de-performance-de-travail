package com.intellcap.service;

import com.intellcap.dto.ProjectDTO;
import com.intellcap.model.Project;
import com.intellcap.model.Team;
import com.intellcap.model.Task;
import com.intellcap.repository.ProjectRepository;
import com.intellcap.repository.TeamRepository;
import com.intellcap.repository.TimeEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final TeamRepository teamRepository;
    private final TimeEntryRepository timeEntryRepository;

    public List<ProjectDTO> getAllProjects() {
        return projectRepository.findAll().stream().map(this::toDTO).toList();
    }

    public List<ProjectDTO> getProjectsByTeam(Long teamId) {
        return projectRepository.findByTeamId(teamId).stream().map(this::toDTO).toList();
    }

    public List<ProjectDTO> getProjectsByResponsable(Long responsableId) {
        List<Long> teamIds = teamRepository.findByResponsableId(responsableId)
                .stream().map(Team::getId).toList();
        return projectRepository.findByTeamIdIn(teamIds).stream().map(this::toDTO).toList();
    }

    public ProjectDTO getProject(Long id) {
        return toDTO(projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found")));
    }

    public ProjectDTO createProject(ProjectDTO dto) {
        Project project = new Project();
        project.setName(dto.getName());
        project.setDescription(dto.getDescription());
        project.setStartDate(dto.getStartDate());
        project.setEndDate(dto.getEndDate());
        project.setBudgetHours(dto.getBudgetHours());
        if (dto.getTeamId() != null) {
            project.setTeam(teamRepository.findById(dto.getTeamId()).orElse(null));
        }
        return toDTO(projectRepository.save(project));
    }

    public ProjectDTO updateProject(Long id, ProjectDTO dto) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        project.setName(dto.getName());
        project.setDescription(dto.getDescription());
        project.setStartDate(dto.getStartDate());
        project.setEndDate(dto.getEndDate());
        project.setBudgetHours(dto.getBudgetHours());
        if (dto.getTeamId() != null) {
            project.setTeam(teamRepository.findById(dto.getTeamId()).orElse(null));
        }
        return toDTO(projectRepository.save(project));
    }

    public void deleteProject(Long id) {
        projectRepository.deleteById(id);
    }

    private ProjectDTO toDTO(Project project) {
        ProjectDTO dto = new ProjectDTO();
        dto.setId(project.getId());
        dto.setName(project.getName());
        dto.setDescription(project.getDescription());
        dto.setStartDate(project.getStartDate());
        dto.setEndDate(project.getEndDate());
        dto.setBudgetHours(project.getBudgetHours());
        if (project.getTeam() != null) {
            dto.setTeamId(project.getTeam().getId());
            dto.setTeamName(project.getTeam().getName());
        }
        List<Task> tasks = project.getTasks();
        if (tasks != null && !tasks.isEmpty()) {
            int avg = (int) tasks.stream().mapToInt(Task::getProgressPercent).average().orElse(0);
            dto.setGlobalProgress(avg);
        } else {
            dto.setGlobalProgress(0);
        }
        dto.setTotalTimeSpentMinutes(timeEntryRepository.sumMinutesByProjectId(project.getId()));
        return dto;
    }
}
