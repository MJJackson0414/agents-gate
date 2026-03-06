package com.agentsgate.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AdminAuthService {

    private static final Logger log = LoggerFactory.getLogger(AdminAuthService.class);
    private static final long TOKEN_TTL_HOURS = 8;

    private final String adminPassword;
    private final ConcurrentHashMap<String, Instant> tokenStore = new ConcurrentHashMap<>();

    public AdminAuthService(@Value("${app.admin.password}") String adminPassword) {
        this.adminPassword = adminPassword;
    }

    /**
     * Verify password and issue a session token valid for 8 hours.
     * Returns the token on success, empty on wrong password.
     */
    public Optional<String> verify(String password) {
        if (!adminPassword.equals(password)) {
            log.warn("[Admin] 登入失敗：密碼錯誤");
            return Optional.empty();
        }
        cleanExpiredTokens();
        String token = UUID.randomUUID().toString();
        tokenStore.put(token, Instant.now().plus(TOKEN_TTL_HOURS, ChronoUnit.HOURS));
        log.info("[Admin] 登入成功，Token 已核發（前 8 碼: {}...）", token.substring(0, 8));
        return Optional.of(token);
    }

    /**
     * Check whether a token is present and not expired.
     */
    public boolean isValidToken(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        Instant expiry = tokenStore.get(token);
        if (expiry == null) {
            log.warn("[Admin] Token 驗證失敗：Token 不存在（前 8 碼: {}...）", token.substring(0, Math.min(8, token.length())));
            return false;
        }
        if (Instant.now().isAfter(expiry)) {
            tokenStore.remove(token);
            log.warn("[Admin] Token 驗證失敗：Token 已過期（前 8 碼: {}...）", token.substring(0, 8));
            return false;
        }
        return true;
    }

    private void cleanExpiredTokens() {
        Instant now = Instant.now();
        int before = tokenStore.size();
        tokenStore.entrySet().removeIf(entry -> now.isAfter(entry.getValue()));
        int removed = before - tokenStore.size();
        if (removed > 0) {
            log.info("[Admin] 清除過期 Token {} 個，剩餘 {} 個", removed, tokenStore.size());
        }
    }
}
