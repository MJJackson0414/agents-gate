package com.agentsgate.service;

import com.agentsgate.domain.Skill;
import com.agentsgate.domain.SkillStatus;
import com.agentsgate.dto.AdminReviewResponse;
import com.agentsgate.repository.SkillRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class AdminReviewService {

    public enum ReviewActionResult {
        SUCCESS, NOT_FOUND, WRONG_STATUS
    }

    private static final Set<SkillStatus> REVIEWABLE_STATUSES = Set.of(
            SkillStatus.PENDING_HUMAN_REVIEW,
            SkillStatus.AI_REJECTED_REVIEW
    );

    private final SkillRepository skillRepository;
    private final ObjectMapper objectMapper;

    public AdminReviewService(SkillRepository skillRepository, ObjectMapper objectMapper) {
        this.skillRepository = skillRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<AdminReviewResponse> listPendingReviews() {
        return skillRepository
                .findByStatusIn(List.of(SkillStatus.PENDING_HUMAN_REVIEW, SkillStatus.AI_REJECTED_REVIEW))
                .stream()
                .map(skill -> AdminReviewResponse.from(skill, objectMapper))
                .toList();
    }

    @Transactional
    public ReviewActionResult approve(UUID id) {
        return updateStatus(id, SkillStatus.PUBLISHED);
    }

    @Transactional
    public ReviewActionResult reject(UUID id) {
        return updateStatus(id, SkillStatus.REJECTED);
    }

    private ReviewActionResult updateStatus(UUID id, SkillStatus targetStatus) {
        var optionalSkill = skillRepository.findById(id);
        if (optionalSkill.isEmpty()) {
            return ReviewActionResult.NOT_FOUND;
        }
        Skill skill = optionalSkill.get();
        if (!REVIEWABLE_STATUSES.contains(skill.getStatus())) {
            return ReviewActionResult.WRONG_STATUS;
        }
        skill.setStatus(targetStatus);
        skillRepository.save(skill);
        return ReviewActionResult.SUCCESS;
    }
}
