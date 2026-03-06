package com.agentsgate.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "skills")
public class Skill {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 64)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SkillType type;

    @Column(nullable = false, length = 1024)
    private String description;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SkillStatus status = SkillStatus.DRAFT;

    @Column(nullable = false, length = 20)
    private String version;

    @Column(columnDefinition = "TEXT")
    private String changelog;

    // Author info
    @Column(length = 255)
    private String authorName;

    @Column(length = 255)
    private String authorEmail;

    // OS compatibility stored as JSON array
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<OsType> osCompatibility;

    // Tags stored as JSON array
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<String> tags;

    // Installation steps (replaced usageExamples)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<String> installationSteps;

    // Dependencies stored as JSON array
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<String> dependencies;

    // Environment declaration stored as JSON
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private EnvironmentDeclaration environmentDeclaration;

    // MCP spec (null = no MCP needed; drives Gemini CLI compatibility)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private McpSpec mcpSpec;

    // Per-CLI description overrides
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, String> cliOverrides;

    // User-configurable variables declared in content as {VAR_NAME}
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<VariableDefinition> variables;

    // Supplementary script files attached to this skill
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<AttachedFile> attachedFiles;

    // AI review feedback stored as JSON (SkillReviewResult)
    @Column(columnDefinition = "TEXT")
    private String reviewFeedback;

    // Source CLI format for archive uploads (null = generic/wizard upload)
    @Column(name = "source_cli_format", length = 20)
    private String sourceCliFormat;

    // Derived flag: true when mcpSpec is present → Gemini CLI not supported
    @Column(nullable = false)
    private boolean hasMcpSpec = false;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // Embedded value objects

    public record EnvironmentDeclaration(
            boolean requiresInternet,
            boolean requiresMcpServer,
            boolean requiresLocalService,
            boolean requiresSystemPackages,
            String additionalNotes
    ) {}

    public record McpSpec(
            String serverName,
            String command,
            List<String> args,
            Map<String, String> env
    ) {}

    public record VariableDefinition(
            String name,
            String description,
            String example
    ) {}

    public record AttachedFile(
            String filename,
            String content
    ) {}

    // Getters and setters

    public UUID getId() { return id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public SkillType getType() { return type; }
    public void setType(SkillType type) { this.type = type; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public SkillStatus getStatus() { return status; }
    public void setStatus(SkillStatus status) { this.status = status; }

    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }

    public String getChangelog() { return changelog; }
    public void setChangelog(String changelog) { this.changelog = changelog; }

    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }

    public String getAuthorEmail() { return authorEmail; }
    public void setAuthorEmail(String authorEmail) { this.authorEmail = authorEmail; }

    public List<OsType> getOsCompatibility() { return osCompatibility; }
    public void setOsCompatibility(List<OsType> osCompatibility) { this.osCompatibility = osCompatibility; }

    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }

    public List<String> getInstallationSteps() { return installationSteps; }
    public void setInstallationSteps(List<String> installationSteps) { this.installationSteps = installationSteps; }

    public List<String> getDependencies() { return dependencies; }
    public void setDependencies(List<String> dependencies) { this.dependencies = dependencies; }

    public EnvironmentDeclaration getEnvironmentDeclaration() { return environmentDeclaration; }
    public void setEnvironmentDeclaration(EnvironmentDeclaration environmentDeclaration) {
        this.environmentDeclaration = environmentDeclaration;
    }

    public McpSpec getMcpSpec() { return mcpSpec; }
    public void setMcpSpec(McpSpec mcpSpec) {
        this.mcpSpec = mcpSpec;
        this.hasMcpSpec = mcpSpec != null;
    }

    public Map<String, String> getCliOverrides() { return cliOverrides; }
    public void setCliOverrides(Map<String, String> cliOverrides) { this.cliOverrides = cliOverrides; }

    public List<VariableDefinition> getVariables() { return variables; }
    public void setVariables(List<VariableDefinition> variables) { this.variables = variables; }

    public List<AttachedFile> getAttachedFiles() { return attachedFiles; }
    public void setAttachedFiles(List<AttachedFile> attachedFiles) { this.attachedFiles = attachedFiles; }

    public boolean isHasMcpSpec() { return hasMcpSpec; }

    public String getReviewFeedback() { return reviewFeedback; }
    public void setReviewFeedback(String reviewFeedback) { this.reviewFeedback = reviewFeedback; }

    public String getSourceCliFormat() { return sourceCliFormat; }
    public void setSourceCliFormat(String sourceCliFormat) { this.sourceCliFormat = sourceCliFormat; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
