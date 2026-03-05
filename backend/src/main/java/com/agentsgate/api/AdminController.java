package com.agentsgate.api;

import com.agentsgate.dto.AdminReviewResponse;
import com.agentsgate.dto.AdminVerifyRequest;
import com.agentsgate.dto.ApiResponse;
import com.agentsgate.service.AdminAuthService;
import com.agentsgate.service.AdminReviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final AdminAuthService adminAuthService;
    private final AdminReviewService adminReviewService;

    public AdminController(AdminAuthService adminAuthService, AdminReviewService adminReviewService) {
        this.adminAuthService = adminAuthService;
        this.adminReviewService = adminReviewService;
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<Map<String, String>>> verify(
            @Valid @RequestBody AdminVerifyRequest request) {
        return adminAuthService.verify(request.password())
                .map(token -> ResponseEntity.ok(ApiResponse.ok(Map.of("token", token))))
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("密碼錯誤")));
    }

    @GetMapping("/reviews")
    public ResponseEntity<ApiResponse<List<AdminReviewResponse>>> listReviews(
            @RequestHeader("X-Admin-Token") String token) {
        if (!adminAuthService.isValidToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("未授權或 Token 已過期"));
        }
        return ResponseEntity.ok(ApiResponse.ok(adminReviewService.listPendingReviews()));
    }

    @PostMapping("/reviews/{id}/approve")
    public ResponseEntity<ApiResponse<Void>> approve(
            @RequestHeader("X-Admin-Token") String token,
            @PathVariable UUID id) {
        if (!adminAuthService.isValidToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("未授權或 Token 已過期"));
        }
        return switch (adminReviewService.approve(id)) {
            case SUCCESS -> ResponseEntity.ok(ApiResponse.ok(null));
            case NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("找不到該 Skill / Agent"));
            case WRONG_STATUS -> ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error("該項目目前狀態無法審核"));
        };
    }

    @PostMapping("/reviews/{id}/reject")
    public ResponseEntity<ApiResponse<Void>> reject(
            @RequestHeader("X-Admin-Token") String token,
            @PathVariable UUID id) {
        if (!adminAuthService.isValidToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("未授權或 Token 已過期"));
        }
        return switch (adminReviewService.reject(id)) {
            case SUCCESS -> ResponseEntity.ok(ApiResponse.ok(null));
            case NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("找不到該 Skill / Agent"));
            case WRONG_STATUS -> ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error("該項目目前狀態無法審核"));
        };
    }
}
