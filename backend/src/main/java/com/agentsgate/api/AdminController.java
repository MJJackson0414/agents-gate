package com.agentsgate.api;

import com.agentsgate.dto.AdminReviewResponse;
import com.agentsgate.dto.AdminVerifyRequest;
import com.agentsgate.dto.ApiResponse;
import com.agentsgate.service.AdminAuthService;
import com.agentsgate.service.AdminReviewService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private static final Logger log = LoggerFactory.getLogger(AdminController.class);

    private final AdminAuthService adminAuthService;
    private final AdminReviewService adminReviewService;

    public AdminController(AdminAuthService adminAuthService, AdminReviewService adminReviewService) {
        this.adminAuthService = adminAuthService;
        this.adminReviewService = adminReviewService;
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<Map<String, String>>> verify(
            @Valid @RequestBody AdminVerifyRequest request) {
        log.info("[Admin] 收到登入請求");
        return adminAuthService.verify(request.password())
                .map(token -> {
                    log.info("[Admin] 登入成功，回傳 Token");
                    return ResponseEntity.ok(ApiResponse.ok(Map.of("token", token)));
                })
                .orElseGet(() -> {
                    log.warn("[Admin] 登入失敗：密碼錯誤");
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(ApiResponse.error("密碼錯誤"));
                });
    }

    @GetMapping("/reviews")
    public ResponseEntity<ApiResponse<List<AdminReviewResponse>>> listReviews(
            @RequestHeader("X-Admin-Token") String token) {
        if (!adminAuthService.isValidToken(token)) {
            log.warn("[Admin] 未授權存取 GET /reviews");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("未授權或 Token 已過期"));
        }
        log.info("[Admin] 查詢待審清單");
        return ResponseEntity.ok(ApiResponse.ok(adminReviewService.listPendingReviews()));
    }

    @PostMapping("/reviews/{id}/approve")
    public ResponseEntity<ApiResponse<Void>> approve(
            @RequestHeader("X-Admin-Token") String token,
            @PathVariable UUID id) {
        if (!adminAuthService.isValidToken(token)) {
            log.warn("[Admin] 未授權存取 POST /reviews/{}/approve", id);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("未授權或 Token 已過期"));
        }
        log.info("[Admin] 審核通過請求 id={}", id);
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
            log.warn("[Admin] 未授權存取 POST /reviews/{}/reject", id);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("未授權或 Token 已過期"));
        }
        log.info("[Admin] 審核拒絕請求 id={}", id);
        return switch (adminReviewService.reject(id)) {
            case SUCCESS -> ResponseEntity.ok(ApiResponse.ok(null));
            case NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("找不到該 Skill / Agent"));
            case WRONG_STATUS -> ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error("該項目目前狀態無法審核"));
        };
    }

    @GetMapping("/published")
    public ResponseEntity<ApiResponse<List<AdminReviewResponse>>> listPublished(
            @RequestHeader("X-Admin-Token") String token) {
        if (!adminAuthService.isValidToken(token)) {
            log.warn("[Admin] 未授權存取 GET /published");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("未授權或 Token 已過期"));
        }
        log.info("[Admin] 查詢已發布清單");
        return ResponseEntity.ok(ApiResponse.ok(adminReviewService.listPublished()));
    }

    @DeleteMapping("/skills/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSkill(
            @RequestHeader("X-Admin-Token") String token,
            @PathVariable UUID id) {
        if (!adminAuthService.isValidToken(token)) {
            log.warn("[Admin] 未授權存取 DELETE /skills/{}", id);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("未授權或 Token 已過期"));
        }
        log.info("[Admin] 刪除請求 id={}", id);
        return switch (adminReviewService.deleteById(id)) {
            case SUCCESS -> ResponseEntity.ok(ApiResponse.ok(null));
            case NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("找不到該 Skill / Agent"));
            case WRONG_STATUS -> ResponseEntity.ok(ApiResponse.ok(null)); // unreachable
        };
    }
}
