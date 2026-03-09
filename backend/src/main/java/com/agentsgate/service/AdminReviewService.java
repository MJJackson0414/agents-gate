package com.agentsgate.service;

import com.agentsgate.domain.Skill;
import com.agentsgate.domain.SkillStatus;
import com.agentsgate.dto.AdminReviewResponse;
import com.agentsgate.repository.SkillRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class AdminReviewService {

    private static final Logger log = LoggerFactory.getLogger(AdminReviewService.class);

    public enum ReviewActionResult {
        SUCCESS, NOT_FOUND, WRONG_STATUS
    }

    private static final Set<SkillStatus> REVIEWABLE_STATUSES = Set.of(
            SkillStatus.PENDING_HUMAN_REVIEW,
            SkillStatus.AI_REJECTED_REVIEW);

    private final SkillRepository skillRepository;
    private final ObjectMapper objectMapper;
    private final NpmPublishService npmPublishService;

    public AdminReviewService(SkillRepository skillRepository, ObjectMapper objectMapper,
            NpmPublishService npmPublishService) {
        this.skillRepository = skillRepository;
        this.objectMapper = objectMapper;
        this.npmPublishService = npmPublishService;
    }

    @Transactional(readOnly = true)
    public List<AdminReviewResponse> listPendingReviews() {
        List<AdminReviewResponse> result = skillRepository
                .findByStatusIn(List.of(SkillStatus.PENDING_HUMAN_REVIEW, SkillStatus.AI_REJECTED_REVIEW))
                .stream()
                .map(skill -> AdminReviewResponse.from(skill, objectMapper))
                .toList();
        log.info("[Admin] 查詢待審清單：共 {} 筆", result.size());
        return result;
    }

    @Transactional
    public ReviewActionResult approve(UUID id) {
        ReviewActionResult result = updateStatus(id, SkillStatus.PUBLISHED);
        log.info("[Admin] 審核通過 id={} → {}", id, result);

        if (result == ReviewActionResult.SUCCESS) {
            skillRepository.findById(id).ifPresent(skill -> {
                npmPublishService.publishToInternalRegistry(skill);
            });
        }

        return result;
    }

    @Transactional
    public ReviewActionResult reject(UUID id) {
        ReviewActionResult result = updateStatus(id, SkillStatus.REJECTED);
        log.info("[Admin] 審核拒絕 id={} → {}", id, result);
        return result;
    }

    @Transactional(readOnly = true)
    public List<AdminReviewResponse> listPublished() {
        List<AdminReviewResponse> result = skillRepository.findByStatus(SkillStatus.PUBLISHED)
                .stream()
                .map(skill -> AdminReviewResponse.from(skill, objectMapper))
                .toList();
        log.info("[Admin] 查詢已發布清單：共 {} 筆", result.size());
        return result;
    }

    @Transactional
    public ReviewActionResult deleteById(UUID id) {
        if (!skillRepository.existsById(id)) {
            log.warn("[Admin] 刪除失敗：找不到 id={}", id);
            return ReviewActionResult.NOT_FOUND;
        }
        skillRepository.deleteById(id);
        log.info("[Admin] 已刪除 id={}", id);
        return ReviewActionResult.SUCCESS;
    }

    private ReviewActionResult updateStatus(UUID id, SkillStatus targetStatus) {
        var optionalSkill = skillRepository.findById(id);
        if (optionalSkill.isEmpty()) {
            log.warn("[Admin] 找不到 id={}", id);
            return ReviewActionResult.NOT_FOUND;
        }
        Skill skill = optionalSkill.get();
        SkillStatus previousStatus = skill.getStatus();
        if (!REVIEWABLE_STATUSES.contains(previousStatus)) {
            log.warn("[Admin] 狀態不符，無法更新 id={} 目前狀態={} 目標狀態={}", id, previousStatus, targetStatus);
            return ReviewActionResult.WRONG_STATUS;
        }
        skill.setStatus(targetStatus);
        skillRepository.save(skill);
        log.info("[Admin] 狀態更新成功 id={} name='{}' {} → {}", id, skill.getName(), previousStatus, targetStatus);
        return ReviewActionResult.SUCCESS;
    }
}
