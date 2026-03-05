package com.agentsgate.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AdminAuthService {

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
            return Optional.empty();
        }
        cleanExpiredTokens();
        String token = UUID.randomUUID().toString();
        tokenStore.put(token, Instant.now().plus(TOKEN_TTL_HOURS, ChronoUnit.HOURS));
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
            return false;
        }
        if (Instant.now().isAfter(expiry)) {
            tokenStore.remove(token);
            return false;
        }
        return true;
    }

    private void cleanExpiredTokens() {
        Instant now = Instant.now();
        tokenStore.entrySet().removeIf(entry -> now.isAfter(entry.getValue()));
    }
}
