package com.deepak.exchangeops.dto;

import com.deepak.exchangeops.domain.IncidentSeverity;
import com.deepak.exchangeops.domain.IncidentStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Partial update for an incident. Omitted or null fields are left unchanged. */
@Schema(description = "Partial incident update. Null or omitted fields are left unchanged.")
public record UpdateIncidentRequest(
    @Size(max = 200) String title,
    @Size(max = 4000) String description,
    IncidentStatus status,
    IncidentSeverity severity,
    @Size(max = 128)
        @Pattern(
            regexp = "^[A-Za-z0-9._-]+$",
            message = "must contain only letters, digits, dot, underscore or hyphen")
        String owner,
    @Size(max = 4000) String resolutionSummary,
    @NotBlank
        @Size(max = 128)
        @Pattern(
            regexp = "^[A-Za-z0-9._-]+$",
            message = "must contain only letters, digits, dot, underscore or hyphen")
        @Schema(description = "Operator performing the update; recorded on the incident timeline.")
        String actor) {}
