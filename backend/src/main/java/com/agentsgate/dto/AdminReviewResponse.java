package com.agentsgate.dto;

import com.agentsgate.ai.SkillReviewResult;
import com.agentsgate.domain.Skill;
import com.agentsgate.domain.SkillStatus;
import com.agentsgate.domain.SkillType;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record AdminReviewResponse(
        UUID id,
        String name,
        SkillType type,
        String description,
        String authorName,
        String authorEmail,
        String version,
        List<String> tags,
        SkillStatus status,
        boolean aiReviewPassed,
        String aiReviewSummary,
        String aiReviewUserExplanation,
        List<String> aiReviewIssues,
        List<String> aiReviewSuggestions,
        LocalDateTime createdAt
) {
    public static AdminReviewResponse from(Skill skill, ObjectMapper objectMapper) {
        boolean passed = false;
        String summary = null;
        String userExplanation = null;
        List<String> issues = List.of();
        List<String> suggestions = List.of();

        String feedback = skill.getReviewFeedback();
        if (feedback != null && !feedback.isBlank()) {
            try {
                SkillReviewResult result = objectMapper.readValue(feedback, SkillReviewResult.class);
                passed = result.approved();
                summary = result.summary();
                userExplanation = result.userExplanation();
                issues = result.issues() != null ? result.issues() : List.of();
                suggestions = result.suggestions() != null ? result.suggestions() : List.of();
            } catch (Exception e) {
                summary = "無法解析 AI 審查結果";
            }
        }

        return new AdminReviewResponse(
                skill.getId(),
                skill.getName(),
                skill.getType(),
                skill.getDescription(),
                skill.getAuthorName(),
                skill.getAuthorEmail(),
                skill.getVersion(),
                skill.getTags(),
                skill.getStatus(),
                passed,
                summary,
                userExplanation,
                issues,
                suggestions,
                skill.getCreatedAt()
        );
    }
}
