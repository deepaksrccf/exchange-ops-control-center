package com.deepak.exchangeops.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Request body for acknowledging an alert. */
public record AcknowledgeAlertRequest(
    @NotBlank
        @Size(max = 128)
        @Pattern(
            regexp = "^[A-Za-z0-9._-]+$",
            message = "must contain only letters, digits, dot, underscore or hyphen")
        String operator) {}
