package com.agentsgate.service;

import com.agentsgate.domain.Skill;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
public class CliPackageService {

    private final ObjectMapper objectMapper;

    public CliPackageService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public byte[] createCliPackage(Skill skill) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
                ZipOutputStream zos = new ZipOutputStream(baos)) {

            // 1. package.json
            String packageName = generatePackageName(skill);
            String packageJson = generatePackageJson(skill, packageName);
            addFileToZip(zos, "package.json", packageJson.getBytes(StandardCharsets.UTF_8));

            // 2. SKILL.md 或 AGENT.md
            String filename = "SKILL".equalsIgnoreCase(skill.getType().name()) ? "SKILL.md" : "AGENT.md";

            // 加入標準的 Markdown Frontmatter 格式
            StringBuilder contentBuilder = new StringBuilder();
            contentBuilder.append("---\n");
            contentBuilder.append("name: ").append(skill.getName()).append("\n");
            if (skill.getDescription() != null && !skill.getDescription().isEmpty()) {
                // 將換行替換為空格以避免破壞 frontmatter 格式，或根據需求直接放入
                contentBuilder.append("description: ").append(skill.getDescription().replace("\n", " ")).append("\n");
            } else {
                contentBuilder.append("description: No description provided\n");
            }
            contentBuilder.append("user-invocable: true\n");
            contentBuilder.append("---\n\n");

            if (skill.getContent() != null) {
                contentBuilder.append(skill.getContent());
            }

            String content = contentBuilder.toString();
            addFileToZip(zos, filename, content.getBytes(StandardCharsets.UTF_8));

            // 3. config.json
            if (skill.getVariables() != null && !skill.getVariables().isEmpty()) {
                List<Map<String, String>> configList = new ArrayList<>();
                for (Skill.VariableDefinition var : skill.getVariables()) {
                    Map<String, String> configItem = new HashMap<>();
                    configItem.put("key", var.name());
                    configItem.put("prompt", "請輸入 " + var.name()
                            + (var.description() != null ? " (" + var.description() + ")" : "") + ": ");
                    configList.add(configItem);
                }
                String configJson = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(configList);
                addFileToZip(zos, "config.json", configJson.getBytes(StandardCharsets.UTF_8));
            } else {
                addFileToZip(zos, "config.json", "[]".getBytes(StandardCharsets.UTF_8));
            }

            // 4. 附加檔案
            if (skill.getAttachedFiles() != null && !skill.getAttachedFiles().isEmpty()) {
                for (Skill.AttachedFile file : skill.getAttachedFiles()) {
                    if (file.filename() != null && file.content() != null) {
                        addFileToZip(zos, file.filename(), file.content().getBytes(StandardCharsets.UTF_8));
                    }
                }
            }

            // 5. bin/index.js
            String indexJs = readResourceFile("cli-template/bin/index.js");
            indexJs = indexJs.replace("const skillName = 'skill-lookup';", "const skillName = '" + packageName + "';");

            String sourceCli = skill.getSourceCliFormat() != null ? skill.getSourceCliFormat().toUpperCase() : "ALL";
            indexJs = indexJs.replace("const targetCliFormat = 'ALL'; // THIS_WILL_BE_REPLACED_BY_BACKEND",
                    "const targetCliFormat = '" + sourceCli + "'; // THIS_WILL_BE_REPLACED_BY_BACKEND");

            addFileToZip(zos, "bin/index.js", indexJs.getBytes(StandardCharsets.UTF_8));

            zos.finish();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate CLI package", e);
        }
    }

    private void addFileToZip(ZipOutputStream zos, String filename, byte[] data) throws Exception {
        ZipEntry entry = new ZipEntry(filename);
        zos.putNextEntry(entry);
        zos.write(data);
        zos.closeEntry();
    }

    private String generatePackageName(Skill skill) {
        String baseName = skill.getName().toLowerCase().replaceAll("[^a-z0-9-]", "-");
        if (baseName.isEmpty()) {
            baseName = "agent-skill";
        }
        return baseName;
    }

    private String generatePackageJson(Skill skill, String packageName) {
        try {
            Map<String, Object> pkg = new HashMap<>();
            pkg.put("name", packageName);
            pkg.put("version", skill.getVersion() != null ? skill.getVersion() : "1.0.0");
            pkg.put("description", "Installer for " + skill.getName() + " AI skill/agent");

            Map<String, String> bin = new HashMap<>();
            bin.put(packageName, "./bin/index.js");
            pkg.put("bin", bin);

            List<String> keywords = new ArrayList<>();
            keywords.add("ai");
            keywords.add("skill");
            keywords.add("agent");
            if (skill.getTags() != null) {
                keywords.addAll(skill.getTags());
            }
            pkg.put("keywords", keywords);

            pkg.put("author", skill.getAuthorName() != null ? skill.getAuthorName() : "");
            pkg.put("license", "MIT");

            List<String> files = new ArrayList<>();
            files.add("bin/index.js");
            files.add("SKILL.md");
            files.add("AGENT.md");
            files.add("config.json");
            pkg.put("files", files);

            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(pkg);
        } catch (Exception e) {
            throw new RuntimeException("Error generating package.json", e);
        }
    }

    private String readResourceFile(String path) throws Exception {
        ClassPathResource resource = new ClassPathResource(path);
        try (InputStream is = resource.getInputStream();
                ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[1024];
            int length;
            while ((length = is.read(buffer)) != -1) {
                baos.write(buffer, 0, length);
            }
            return baos.toString(StandardCharsets.UTF_8);
        }
    }
}
