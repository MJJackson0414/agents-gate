package com.agentsgate.dto;

import com.agentsgate.domain.OsType;
import com.agentsgate.domain.Skill;
import com.agentsgate.domain.SkillStatus;
import com.agentsgate.domain.SkillType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Full skill detail response including all fields needed to pre-fill the upload form.
 * Used by GET /api/v1/skills/{id}.
 */
public record SkillDetailResponse(
        UUID id,
        String name,
        SkillType type,
        String description,
        SkillStatus status,
        String version,
        String changelog,
        List<String> tags,
        List<String> installationSteps,
        List<String> dependencies,
        List<OsType> osCompatibility,
        String authorName,
        String authorEmail,
        boolean hasMcpSpec,
        String reviewFeedback,
        Skill.EnvironmentDeclaration environmentDeclaration,
        Skill.McpSpec mcpSpec,
        Map<String, String> cliOverrides,
        String content,
        List<Skill.VariableDefinition> variables,
        List<Skill.AttachedFile> attachedFiles,
        LocalDateTime createdAt
) {
    public static SkillDetailResponse from(Skill skill) {
        return new SkillDetailResponse(
                skill.getId(),
                skill.getName(),
                skill.getType(),
                skill.getDescription(),
                skill.getStatus(),
                skill.getVersion(),
                skill.getChangelog(),
                skill.getTags(),
                skill.getInstallationSteps(),
                skill.getDependencies(),
                skill.getOsCompatibility(),
                skill.getAuthorName(),
                skill.getAuthorEmail(),
                skill.isHasMcpSpec(),
                skill.getReviewFeedback(),
                skill.getEnvironmentDeclaration(),
                skill.getMcpSpec(),
                skill.getCliOverrides(),
                skill.getContent(),
                skill.getVariables(),
                skill.getAttachedFiles(),
                skill.getCreatedAt()
        );
    }
}
