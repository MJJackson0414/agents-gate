package com.agentsgate.dto;

import com.agentsgate.domain.OsType;
import com.agentsgate.domain.SkillType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.util.List;
import java.util.Map;

public record SkillUploadRequest(

        // === Required Fields ===

        @NotBlank(message = "名稱為必填")
        @Pattern(regexp = "^[a-z0-9-]+$", message = "名稱只能使用小寫字母、數字和連字號")
        @Size(max = 64, message = "名稱最多 64 個字元")
        String name,

        @NotNull(message = "類型為必填")
        SkillType type,

        @NotBlank(message = "描述為必填")
        @Size(max = 1024, message = "描述最多 1024 個字元")
        String description,

        @NotBlank(message = "內容為必填")
        String content,

        // 安裝步驟（必填至少一步）
        @NotEmpty(message = "至少需要一個安裝步驟")
        List<@NotBlank(message = "安裝步驟不得為空") String> installationSteps,

        // 依賴套件（可為空）
        List<String> dependencies,

        @NotEmpty(message = "至少需要一個標籤")
        @Size(max = 5, message = "最多 5 個標籤")
        List<@NotBlank(message = "標籤不得為空") String> tags,

        @NotBlank(message = "版本號為必填")
        @Pattern(regexp = "^\\d+\\.\\d+\\.\\d+$", message = "版本號需符合 SemVer 格式（如 1.0.0）")
        String version,

        @NotBlank(message = "更新說明為必填")
        String changelog,

        @NotNull(message = "支援的作業系統為必填")
        @NotEmpty(message = "至少需要指定一個作業系統")
        List<OsType> osCompatibility,

        @NotBlank(message = "作者名稱為必填")
        String authorName,

        @NotBlank(message = "作者 Email 為必填")
        @Email(message = "作者 Email 格式不正確")
        String authorEmail,

        // === Environment Declaration ===

        @NotNull(message = "環境需求聲明為必填")
        @Valid
        EnvironmentDeclarationDto environmentDeclaration,

        // === Optional Fields ===

        @Valid
        McpSpecDto mcpSpec,

        Map<String, String> cliOverrides,

        List<VariableDefinitionDto> variables,

        List<AttachedFileDto> attachedFiles,

        // Archive mode: which CLI this ZIP was built for (null = generic wizard upload)
        String sourceCliFormat

) {

    public record VariableDefinitionDto(
            String name,
            String description,
            String example
    ) {}

    public record AttachedFileDto(
            String filename,
            String content
    ) {}

    public record EnvironmentDeclarationDto(
            boolean requiresInternet,
            boolean requiresMcpServer,
            boolean requiresLocalService,
            boolean requiresSystemPackages,
            String additionalNotes
    ) {}

    public record McpSpecDto(
            @NotBlank(message = "MCP Server 名稱為必填")
            String serverName,

            @NotBlank(message = "MCP 指令為必填")
            String command,

            List<String> args,
            Map<String, String> env
    ) {}
}
