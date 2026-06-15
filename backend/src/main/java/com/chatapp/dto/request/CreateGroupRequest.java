package com.chatapp.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class CreateGroupRequest {

    @NotBlank
    private String name;

    private String description;

    @NotEmpty
    private List<Long> memberIds;
}
