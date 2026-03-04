package com.agentsgate.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
        boolean success,
        T data,
        String error,
        Meta meta
) {

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null, null);
    }

    public static <T> ApiResponse<T> created(T data) {
        return new ApiResponse<>(true, data, null, null);
    }

    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, null, message, null);
    }

    public static <T> ApiResponse<T> validationError(Map<String, String> fieldErrors) {
        return new ApiResponse<>(false, null, "Validation failed", new Meta(null, null, null, fieldErrors));
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Meta(
            Long total,
            Integer page,
            Integer limit,
            Map<String, String> fieldErrors
    ) {}
}
