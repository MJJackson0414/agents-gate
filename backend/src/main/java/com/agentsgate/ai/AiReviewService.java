package com.agentsgate.ai;

import com.agentsgate.domain.Skill;
import com.agentsgate.domain.SkillStatus;
import com.agentsgate.repository.SkillRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Asynchronously reviews a skill submission using the AI service.
 * Flow: DRAFT -> PENDING_AI_REVIEW -> PENDING_HUMAN_REVIEW | REJECTED
 */
@Service
public class AiReviewService {

    private static final Logger log = LoggerFactory.getLogger(AiReviewService.class);

    private final SkillRepository skillRepository;
    private final SkillReviewAiService aiService;
    private final ObjectMapper objectMapper;

    public AiReviewService(SkillRepository skillRepository,
                           SkillReviewAiService aiService,
                           ObjectMapper objectMapper) {
        this.skillRepository = skillRepository;
        this.aiService = aiService;
        this.objectMapper = objectMapper;
    }

    @Async
    @Transactional
    public void reviewAsync(UUID skillId) {
        log.info("[AiReview] ===== Starting review for skill: {} =====", skillId);

        Skill skill = skillRepository.findById(skillId).orElse(null);
        if (skill == null) {
            log.warn("[AiReview] Skill not found: {}", skillId);
            return;
        }

        log.info("[AiReview] Skill loaded: name='{}', type={}, version={}, tags={}",
                skill.getName(), skill.getType(), skill.getVersion(), skill.getTags());

        // Mark as in-review
        skill.setStatus(SkillStatus.PENDING_AI_REVIEW);
        skillRepository.save(skill);

        try {
            SkillReviewResult result = callAiReview(skill);
            applyReviewResult(skill, result);
        } catch (Exception e) {
            log.error("[AiReview] AI review failed for skill '{}' ({}): {}",
                    skill.getName(), skillId, e.getMessage(), e);
            skill.setStatus(SkillStatus.DRAFT);
            skill.setReviewFeedback(buildErrorFeedback(e.getMessage()));
            skillRepository.save(skill);
        }
    }

    private SkillReviewResult callAiReview(Skill skill) {
        String content = skill.getContent();
        String contentPreview = content != null && content.length() > 500
                ? content.substring(0, 500) + "..."
                : content;

        var env = skill.getEnvironmentDeclaration();
        boolean reqInternet = env != null && env.requiresInternet();
        boolean reqMcp = env != null && env.requiresMcpServer();
        boolean reqLocal = env != null && env.requiresLocalService();
        boolean reqSys = env != null && env.requiresSystemPackages();

        List<String> steps = skill.getInstallationSteps();
        String stepsText = steps != null ? String.join("; ", steps) : "(none)";

        List<String> tags = skill.getTags();
        String tagsText = tags != null ? String.join(", ", tags) : "(none)";

        log.info("[AiReview] >>> Sending to AI - name='{}', type={}, description_len={}, " +
                        "content_len={}, steps_count={}, tags='{}', " +
                        "requiresInternet={}, requiresMcp={}, requiresLocal={}, requiresSys={}, hasMcpSpec={}",
                skill.getName(), skill.getType(),
                skill.getDescription() != null ? skill.getDescription().length() : 0,
                content != null ? content.length() : 0,
                steps != null ? steps.size() : 0,
                tagsText,
                reqInternet, reqMcp, reqLocal, reqSys, skill.isHasMcpSpec());

        log.debug("[AiReview] >>> Content preview: {}", contentPreview);
        log.debug("[AiReview] >>> Installation steps: {}", stepsText);

        SkillReviewResult result = aiService.review(
                skill.getName(),
                skill.getType().name(),
                skill.getDescription(),
                tagsText,
                skill.getVersion(),
                contentPreview,
                stepsText,
                reqInternet,
                reqMcp,
                reqLocal,
                reqSys,
                skill.isHasMcpSpec()
        );

        log.info("[AiReview] <<< AI Response - approved={}, summary='{}'",
                result.approved(), result.summary());
        if (!result.issues().isEmpty()) {
            log.warn("[AiReview] <<< Issues ({}):", result.issues().size());
            result.issues().forEach(issue -> log.warn("[AiReview]     - {}", issue));
        }
        if (!result.suggestions().isEmpty()) {
            log.info("[AiReview] <<< Suggestions ({}):", result.suggestions().size());
            result.suggestions().forEach(s -> log.info("[AiReview]     * {}", s));
        }

        return result;
    }

    private void applyReviewResult(Skill skill, SkillReviewResult result) {
        try {
            skill.setReviewFeedback(objectMapper.writeValueAsString(result));
        } catch (Exception e) {
            skill.setReviewFeedback("{\"error\":\"feedback serialization failed\"}");
        }

        if (result.approved()) {
            skill.setStatus(SkillStatus.PENDING_HUMAN_REVIEW);
            log.info("[AiReview] ===== '{}' APPROVED -> PENDING_HUMAN_REVIEW =====", skill.getName());
        } else {
            skill.setStatus(SkillStatus.REJECTED);
            log.warn("[AiReview] ===== '{}' REJECTED (issues: {}) =====",
                    skill.getName(), result.issues());
        }

        skillRepository.save(skill);
    }

    private String buildErrorFeedback(String errorMessage) {
        return "{\"approved\":false," +
                "\"summary\":\"AI review service error\"," +
                "\"userExplanation\":\"很抱歉，AI 審核服務在處理您的提交時發生了技術性錯誤，並非您的內容有問題。請稍後重新提交，若問題持續發生請聯繫平台管理員。\"," +
                "\"issues\":[\"" + escapeJson(errorMessage) + "\"]," +
                "\"suggestions\":[]}";
    }

    private String escapeJson(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\").replace("\"", "\\\"")
                .replace("\n", "\\n").replace("\r", "\\r");
    }
}
