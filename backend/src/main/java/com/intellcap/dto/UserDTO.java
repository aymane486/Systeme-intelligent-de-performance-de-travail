package com.intellcap.dto;

import com.intellcap.model.Role;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserDTO {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private Role role;
    private Long teamId;
    private String teamName;
}
