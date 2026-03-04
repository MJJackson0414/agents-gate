package com.agentsgate.service;

import com.agentsgate.domain.Skill;
import com.agentsgate.domain.SkillStatus;
import com.agentsgate.dto.SkillResponse;
import com.agentsgate.dto.SkillUploadRequest;
import com.agentsgate.repository.SkillRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SkillService {

    private final SkillRepository skillRepository;

    public SkillService(SkillRepository skillRepository) {
        this.skillRepository = skillRepository;
    }

    @Transactional
    public SkillResponse uploadSkill(SkillUploadRequest request) {
        Skill skill = mapRequestToEntity(request);
        Skill saved = skillRepository.save(skill);
        return SkillResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<SkillResponse> listAll() {
        return skillRepository.findAll().stream()
                .map(SkillResponse::from)
                .toList();
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

        return skill;
    }
}
