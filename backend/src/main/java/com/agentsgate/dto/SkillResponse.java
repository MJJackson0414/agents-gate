package com.agentsgate.dto;

import com.agentsgate.domain.Skill;
import com.agentsgate.domain.SkillStatus;
import com.agentsgate.domain.SkillType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record SkillResponse(
        UUID id,
        String name,
        SkillType type,
        String description,
        SkillStatus status,
        String version,
        List<String> tags,
        boolean hasMcpSpec,
        String reviewFeedback,
        LocalDateTime createdAt
) {
    public static SkillResponse from(Skill skill) {
        return new SkillResponse(
                skill.getId(),
                skill.getName(),
                skill.getType(),
                skill.getDescription(),
                skill.getStatus(),
                skill.getVersion(),
                skill.getTags(),
                skill.isHasMcpSpec(),
                skill.getReviewFeedback(),
                skill.getCreatedAt()
        );
    }
}
