package com.agentsgate.service;

import com.agentsgate.domain.Skill;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Comparator;
import java.util.Scanner;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Service
public class NpmPublishService {

    private static final Logger log = LoggerFactory.getLogger(NpmPublishService.class);
    private final CliPackageService cliPackageService;

    @Value("${npm.registry.url}")
    private String registryUrl;

    @Value("${npm.registry.auth}")
    private String registryAuth;

    public NpmPublishService(CliPackageService cliPackageService) {
        this.cliPackageService = cliPackageService;
    }

    @Async
    public void publishToInternalRegistry(Skill skill) {
        Path tempDir = null;
        try {
            // 1. Generate the ZIP package bytes
            byte[] zipBytes = cliPackageService.createCliPackage(skill);

            // 2. Create a temporary directory
            tempDir = Files.createTempDirectory("npm-publish-" + skill.getId());
            log.info("[NpmPublish] 準備發布套件到暫存目錄: {}", tempDir);

            // 3. Unzip into temp directory
            try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
                ZipEntry entry;
                while ((entry = zis.getNextEntry()) != null) {
                    Path entryPath = tempDir.resolve(entry.getName());
                    // Prevent zip slip
                    if (!entryPath.normalize().startsWith(tempDir.normalize())) {
                        throw new RuntimeException("Bad zip entry");
                    }
                    if (entry.isDirectory()) {
                        Files.createDirectories(entryPath);
                    } else {
                        Files.createDirectories(entryPath.getParent());
                        Files.copy(zis, entryPath, StandardCopyOption.REPLACE_EXISTING);
                    }
                    zis.closeEntry();
                }
            }

            // 4. Create .npmrc
            String npmrcContent = "registry=" + registryUrl + "\n" +
                    "//" + registryUrl.replaceFirst("^https?://", "") + ":_auth=" + registryAuth + "\n";
            Files.writeString(tempDir.resolve(".npmrc"), npmrcContent);

            // 5. Run npm publish
            log.info("[NpmPublish] 開始執行 npm publish 到 {} ...", registryUrl);
            ProcessBuilder pb = new ProcessBuilder("npm", "publish", "--registry=" + registryUrl);
            pb.directory(tempDir.toFile());
            pb.redirectErrorStream(true);
            Process process = pb.start();

            // Log output
            try (Scanner s = new Scanner(process.getInputStream()).useDelimiter("\\A")) {
                if (s.hasNext()) {
                    log.info("[NpmPublish] 輸出: \n{}", s.next());
                }
            }

            int exitCode = process.waitFor();
            if (exitCode == 0) {
                log.info("[NpmPublish] 發布成功！");
            } else {
                log.error("[NpmPublish] 發布失敗，exit code: {}", exitCode);
            }

        } catch (Exception e) {
            log.error("[NpmPublish] 發布過程發生錯誤", e);
        } finally {
            // Cleanup temp directory
            if (tempDir != null) {
                try {
                    Files.walk(tempDir)
                            .sorted(Comparator.reverseOrder())
                            .map(Path::toFile)
                            .forEach(File::delete);
                } catch (Exception e) {
                    log.error("[NpmPublish] 無法清理暫存目錄", e);
                }
            }
        }
    }
}
