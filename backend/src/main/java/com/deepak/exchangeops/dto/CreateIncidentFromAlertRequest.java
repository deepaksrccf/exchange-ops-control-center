package com.deepak.exchangeops.dto;

import com.deepak.exchangeops.domain.IncidentSeverity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Request body for opening an incident from an existing alert. */
public record CreateIncidentFromAlertRequest(
    @NotBlank @Size(max = 200) String title,
    @NotBlank @Size(max = 4000) String description,
    @NotNull IncidentSeverity severity,
    @Size(max = 128)
        @Pattern(
            regexp = "^[A-Za-z0-9._-]+$",
            message = "must contain only letters, digits, dot, underscore or hyphen")
        String owner,
    @NotBlank
        @Size(max = 128)
        @Pattern(
            regexp = "^[A-Za-z0-9._-]+$",
            message = "must contain only letters, digits, dot, underscore or hyphen")
        String createdBy) {}
