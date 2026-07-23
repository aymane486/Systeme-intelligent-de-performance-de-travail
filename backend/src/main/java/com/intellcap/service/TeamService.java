package com.intellcap.service;

import com.intellcap.dto.TeamMemberDTO;
import com.intellcap.dto.TeamMemberDTO.MemberTask;
import com.intellcap.model.*;
import com.intellcap.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository teamRepository;
    private final TaskRepository taskRepository;
    private final TimeEntryRepository timeEntryRepository;

    public List<TeamMemberDTO> getTeamMembers(Long responsableId) {
        List<Team> teams = teamRepository.findByResponsableId(responsableId);
        List<TeamMemberDTO> members = new ArrayList<>();

        for (Team team : teams) {
            for (User member : team.getMembers()) {
                Optional<TimeEntry> activeEntry = timeEntryRepository.findByUserIdAndEndTimeIsNull(member.getId());

                List<Task> userTasks = taskRepository.findByAssigneeId(member.getId());
                List<MemberTask> memberTasks = userTasks.stream().map(task -> {
                    long timeSpent = timeEntryRepository.sumMinutesByTaskId(task.getId());
                    return MemberTask.builder()
                            .taskId(task.getId())
                            .taskName(task.getName())
                            .projectName(task.getProject().getName())
                            .status(task.getStatus().name())
                            .progressPercent(task.getProgressPercent())
                            .timeSpentMinutes(timeSpent)
                            .build();
                }).toList();

                TeamMemberDTO.TeamMemberDTOBuilder builder = TeamMemberDTO.builder()
                        .userId(member.getId())
                        .firstName(member.getFirstName())
                        .lastName(member.getLastName())
                        .email(member.getEmail())
                        .keyActive(activeEntry.isPresent())
                        .keyPaused(activeEntry.map(TimeEntry::isPaused).orElse(false))
                        .tasks(memberTasks);

                activeEntry.ifPresent(entry -> {
                    builder.currentTaskName(entry.getTask().getName());
                    builder.currentProjectName(entry.getTask().getProject().getName());
                    builder.keyStartTime(entry.getStartTime());
                });

                members.add(builder.build());
            }
        }
        return members;
    }
}
