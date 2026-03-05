package com.agentsgate.service;

import com.agentsgate.ai.AiReviewService;
import com.agentsgate.domain.Skill;
import com.agentsgate.domain.SkillStatus;
import com.agentsgate.dto.SkillDetailResponse;
import com.agentsgate.dto.SkillResponse;
import com.agentsgate.dto.SkillUploadRequest;
import com.agentsgate.repository.SkillRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class SkillService {

    private final SkillRepository skillRepository;
    private final AiReviewService aiReviewService;

    public SkillService(SkillRepository skillRepository, AiReviewService aiReviewService) {
        this.skillRepository = skillRepository;
        this.aiReviewService = aiReviewService;
    }

    @Transactional
    public SkillResponse uploadSkill(SkillUploadRequest request) {
        Skill skill = mapRequestToEntity(request);
        Skill saved = skillRepository.save(skill);
        UUID savedId = saved.getId();
        // Trigger async AI review only after the transaction commits
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                aiReviewService.reviewAsync(savedId);
            }
        });
        return SkillResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<SkillResponse> listAll() {
        return skillRepository.findAll().stream()
                .map(SkillResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<SkillDetailResponse> findById(UUID id) {
        return skillRepository.findById(id).map(SkillDetailResponse::from);
    }

    private Skill mapRequestToEntity(SkillUploadRequest request) {
        Skill skill = new Skill();
        skill.setName(request.name());
        skill.setType(request.type());
        skill.setDescription(request.description());
        skill.setContent(request.content());
        skill.setStatus(SkillStatus.DRAFT);
        skill.setVersion(request.version());
        skill.setChangelog(request.changelog());
        skill.setAuthorName(request.authorName());
        skill.setAuthorEmail(request.authorEmail());
        skill.setOsCompatibility(request.osCompatibility());
        skill.setTags(request.tags());
        skill.setInstallationSteps(request.installationSteps());
        skill.setDependencies(request.dependencies() != null ? request.dependencies() : List.of());
        skill.setCliOverrides(request.cliOverrides());

        if (request.environmentDeclaration() != null) {
            var env = request.environmentDeclaration();
            skill.setEnvironmentDeclaration(new Skill.EnvironmentDeclaration(
                    env.requiresInternet(),
                    env.requiresMcpServer(),
                    env.requiresLocalService(),
                    env.requiresSystemPackages(),
                    env.additionalNotes()
            ));
        }

        if (request.mcpSpec() != null) {
            var mcp = request.mcpSpec();
            skill.setMcpSpec(new Skill.McpSpec(
                    mcp.serverName(),
                    mcp.command(),
                    mcp.args(),
                    mcp.env()
            ));
        }

        if (request.variables() != null) {
            skill.setVariables(request.variables().stream()
                    .map(v -> new Skill.VariableDefinition(v.name(), v.description(), v.example()))
                    .toList());
        }

        if (request.attachedFiles() != null) {
            skill.setAttachedFiles(request.attachedFiles().stream()
                    .map(f -> new Skill.AttachedFile(f.filename(), f.content()))
                    .toList());
        }

        return skill;
    }
}
