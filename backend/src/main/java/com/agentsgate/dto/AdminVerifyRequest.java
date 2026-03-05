package com.agentsgate.dto;

import jakarta.validation.constraints.NotBlank;

public record AdminVerifyRequest(
        @NotBlank(message = "密碼不可為空")
        String password
) {}
