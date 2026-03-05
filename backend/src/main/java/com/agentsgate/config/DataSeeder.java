package com.agentsgate.config;

import com.agentsgate.domain.OsType;
import com.agentsgate.domain.Skill;
import com.agentsgate.domain.SkillStatus;
import com.agentsgate.domain.SkillType;
import com.agentsgate.repository.SkillRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Seeds sample skills from the AgentsGate .agents/skills directory into the database on first startup.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final SkillRepository skillRepository;

    public DataSeeder(SkillRepository skillRepository) {
        this.skillRepository = skillRepository;
    }

    @Override
    public void run(String... args) {
        if (skillRepository.count() > 0) {
            log.info("[DataSeeder] 資料庫已有資料，跳過初始化。");
            return;
        }

        log.info("[DataSeeder] 初始化 BMAD 範例 Skill 資料...");

        List<SkillSeedData> seeds = List.of(
            // ── BMAD 核心 Agents ──
            s("bmad-agent-bmad-master", "BMAD Master 協調器", "BMAD 框架的主協調代理，負責啟動與管理各 BMAD 子代理的工作流程。", SkillType.AGENT, List.of("bmad", "ai", "orchestration")),
            s("bmad-agent-bmm-dev", "開發工程師代理", "全端開發代理，負責依照故事規格實作功能、修復 Bug 與撰寫測試。", SkillType.AGENT, List.of("coding", "dev", "tdd")),
            s("bmad-agent-bmm-architect", "軟體架構師代理", "系統架構設計代理，負責技術選型、架構決策與解決方案設計文件。", SkillType.AGENT, List.of("architecture", "design", "ai")),
            s("bmad-agent-bmm-pm", "產品經理代理", "產品管理代理，負責 PRD 撰寫、史詩規劃與需求整理。", SkillType.AGENT, List.of("product", "planning", "prd")),
            s("bmad-agent-bmm-qa", "品質保證代理", "QA 代理，負責測試計畫、驗收測試與品質把關。", SkillType.AGENT, List.of("testing", "qa", "automation")),
            s("bmad-agent-bmm-analyst", "需求分析師代理", "業務分析代理，負責需求訪談、市場研究與域知識研究。", SkillType.AGENT, List.of("analysis", "research", "requirements")),
            s("bmad-agent-bmm-ux-designer", "UX 設計師代理", "使用者體驗設計代理，負責 UX 規格、流程圖與介面設計指引。", SkillType.AGENT, List.of("ux", "design", "ui")),
            s("bmad-agent-bmm-sm", "Scrum Master 代理", "敏捷 Scrum Master 代理，負責 Sprint 規劃、衝刺回顧與障礙清除。", SkillType.AGENT, List.of("agile", "scrum", "planning")),
            s("bmad-agent-bmm-tech-writer", "技術文件撰寫代理", "技術文件代理，負責 API 文件、使用者指南與架構說明文件。", SkillType.AGENT, List.of("docs", "writing", "api")),
            s("bmad-agent-bmm-quick-flow-solo-dev", "獨立開發者快速流程代理", "適合獨立開發者的精簡 BMAD 流程代理，從需求到實作一站完成。", SkillType.AGENT, List.of("solo", "dev", "quick")),

            // ── CIS 創意智慧套件代理 ──
            s("bmad-agent-cis-brainstorming-coach", "腦力激盪教練代理", "以多元創意技法引導互動腦力激盪會議，幫助發散思維與點子生成。", SkillType.AGENT, List.of("creative", "brainstorming", "ideation")),
            s("bmad-agent-cis-creative-problem-solver", "創意問題解決代理", "運用系統性問題解決方法論，協助攻克複雜挑戰。", SkillType.AGENT, List.of("creative", "problem-solving", "innovation")),
            s("bmad-agent-cis-design-thinking-coach", "設計思維教練代理", "以同理心驅動的人本設計方法，引導設計思維全流程。", SkillType.AGENT, List.of("design-thinking", "ux", "innovation")),
            s("bmad-agent-cis-innovation-strategist", "創新策略師代理", "識別顛覆機會，建構商業模式創新方案。", SkillType.AGENT, List.of("strategy", "innovation", "business")),
            s("bmad-agent-cis-presentation-master", "簡報大師代理", "以故事框架打造引人入勝的簡報內容與表達策略。", SkillType.AGENT, List.of("presentation", "storytelling", "communication")),
            s("bmad-agent-cis-storyteller", "說故事代理", "運用故事框架撰寫引人共鳴的敘事內容。", SkillType.AGENT, List.of("storytelling", "writing", "creative")),
            s("bmad-agent-tea-tea", "測試架構教育代理", "測試架構教育代理，涵蓋 TDD、ATDD、CI/CD 品質流程。", SkillType.AGENT, List.of("testing", "education", "tdd")),
            s("bmad-agent-bmb-agent-builder", "BMAD Agent 建構代理", "依最佳實踐新建 BMAD Agent，含合規性驗證。", SkillType.AGENT, List.of("bmad", "agent", "builder")),
            s("bmad-agent-bmb-module-builder", "BMAD 模組建構代理", "建構完整 BMAD 模組，包含 Agents、工作流程與基礎設施。", SkillType.AGENT, List.of("bmad", "module", "builder")),
            s("bmad-agent-bmb-workflow-builder", "BMAD 工作流程建構代理", "依最佳實踐建立 BMAD 工作流程，含結構驗證。", SkillType.AGENT, List.of("bmad", "workflow", "builder")),

            // ── BMAD Skills（指令型） ──
            s("bmad-bmb-create-agent", "建立 BMAD Agent", "依最佳實踐新建一個符合 BMAD 規範的 Agent 設定檔。", SkillType.SKILL, List.of("bmad", "agent", "coding")),
            s("bmad-bmb-create-module", "建立 BMAD 模組", "建立完整 BMAD 模組，包含 Agents、工作流程與相關基礎設施。", SkillType.SKILL, List.of("bmad", "module", "coding")),
            s("bmad-bmb-create-workflow", "建立 BMAD 工作流程", "以最佳實踐新建一個 BMAD 工作流程設定。", SkillType.SKILL, List.of("bmad", "workflow", "coding")),
            s("bmad-bmb-edit-agent", "編輯 BMAD Agent", "在維持合規性的前提下編輯現有 BMAD Agent。", SkillType.SKILL, List.of("bmad", "agent", "coding")),
            s("bmad-bmb-validate-agent", "驗證 BMAD Agent", "檢查現有 BMAD Agent 的合規性並提供改善建議。", SkillType.SKILL, List.of("bmad", "validation", "quality")),
            s("bmad-bmb-validate-workflow", "驗證 BMAD 工作流程", "對 BMAD 工作流程執行最佳實踐合規性檢查。", SkillType.SKILL, List.of("bmad", "validation", "quality")),
            s("bmad-bmm-create-prd", "建立 PRD", "從零開始協作建立產品需求文件（PRD）。", SkillType.SKILL, List.of("product", "prd", "docs")),
            s("bmad-bmm-create-architecture", "建立技術架構", "為 AI Agent 一致性建立架構解決方案與設計決策文件。", SkillType.SKILL, List.of("architecture", "design", "docs")),
            s("bmad-bmm-create-epics-and-stories", "建立 Epics 與 Stories", "將需求拆解為 Epics 與使用者故事清單。", SkillType.SKILL, List.of("agile", "planning", "stories")),
            s("bmad-bmm-create-ux-design", "建立 UX 設計規格", "規劃 UX 模式與設計規格文件。", SkillType.SKILL, List.of("ux", "design", "docs")),
            s("bmad-bmm-dev-story", "實作故事", "依照填充好的故事規格檔案執行功能實作。", SkillType.SKILL, List.of("coding", "dev", "agile")),
            s("bmad-bmm-code-review", "程式碼審查", "以對抗性審查方式找出具體問題，執行嚴格的程式碼品質檢查。", SkillType.SKILL, List.of("review", "quality", "coding")),
            s("bmad-bmm-quick-spec", "建立快速規格", "快速建立適合小型功能或變更的實作就緒規格。", SkillType.SKILL, List.of("planning", "quick", "docs")),
            s("bmad-bmm-sprint-planning", "Sprint 規劃", "從 Epics 產生 Sprint 狀態追蹤計畫。", SkillType.SKILL, List.of("agile", "scrum", "planning")),
            s("bmad-bmm-sprint-status", "Sprint 狀態報告", "摘要目前 Sprint 狀態並標示風險項目。", SkillType.SKILL, List.of("agile", "scrum", "status")),
            s("bmad-bmm-retrospective", "Sprint 回顧", "Epic 後的回顧分析，提取經驗教訓並評估成果。", SkillType.SKILL, List.of("agile", "retro", "quality")),
            s("bmad-bmm-domain-research", "領域研究", "執行領域與產業研究，產出結構化研究報告。", SkillType.SKILL, List.of("research", "analysis", "docs")),
            s("bmad-bmm-market-research", "市場研究", "對競爭對手與客戶進行市場研究分析。", SkillType.SKILL, List.of("research", "market", "strategy")),
            s("bmad-bmm-technical-research", "技術研究", "對技術方案與架構進行深度技術研究。", SkillType.SKILL, List.of("research", "architecture", "coding")),
            s("bmad-bmm-qa-generate-e2e-tests", "產生 E2E 自動化測試", "為現有功能生成端對端自動化測試案例。", SkillType.SKILL, List.of("testing", "e2e", "automation")),
            s("bmad-brainstorming", "腦力激盪工作坊", "以多元創意技法引導互動式腦力激盪，協助發散思維與創意發想。", SkillType.SKILL, List.of("creative", "brainstorming", "ideation")),
            s("bmad-cis-design-thinking", "設計思維工作坊", "以同理心驅動的人本設計方法引導設計思維全流程工作坊。", SkillType.SKILL, List.of("design-thinking", "ux", "innovation")),
            s("bmad-cis-innovation-strategy", "創新策略制定", "識別顛覆機會並架構商業模式創新方案。", SkillType.SKILL, List.of("strategy", "innovation", "business")),
            s("bmad-cis-problem-solving", "系統性問題解決", "運用系統性問題解決方法論，協助攻克複雜挑戰。", SkillType.SKILL, List.of("problem-solving", "creative", "analysis")),
            s("bmad-cis-storytelling", "故事敘事工作坊", "運用故事框架打造引人入勝的敘事內容與溝通策略。", SkillType.SKILL, List.of("storytelling", "communication", "creative")),
            s("bmad-tea-teach-me-testing", "測試學習工作坊", "以結構化課程漸進教學測試實踐，涵蓋 TDD 到 E2E。", SkillType.SKILL, List.of("testing", "education", "tdd")),
            s("bmad-tea-testarch-atdd", "驗收測試驅動開發", "以 TDD 循環產生失敗的驗收測試，推動 ATDD 實踐。", SkillType.SKILL, List.of("testing", "tdd", "atdd")),
            s("bmad-tea-testarch-framework", "測試框架初始化", "以 Playwright 或 Cypress 初始化測試框架。", SkillType.SKILL, List.of("testing", "playwright", "automation")),
            s("bmad-tea-testarch-ci", "CI/CD 品質流程建置", "建立含測試執行的 CI/CD 品質流程。", SkillType.SKILL, List.of("ci", "testing", "devops")),
            s("bmad-tea-testarch-test-design", "測試計畫設計", "建立系統層級或 Epic 層級的測試計畫與測試策略。", SkillType.SKILL, List.of("testing", "planning", "quality")),
            s("bmad-tea-testarch-test-review", "測試品質審查", "以最佳實踐驗證審查測試案例的品質。", SkillType.SKILL, List.of("testing", "review", "quality")),
            s("bmad-tea-testarch-trace", "測試覆蓋追溯矩陣", "產生追溯矩陣並進行品質關卡決策分析。", SkillType.SKILL, List.of("testing", "traceability", "quality")),
            s("bmad-mmm-document-project", "專案文件化", "為棕地專案產生 AI 可用的背景文件。", SkillType.SKILL, List.of("docs", "brownfield", "ai")),
            s("bmad-help", "BMAD 說明", "顯示當前 BMAD 安裝的說明資訊與可用 Skill 清單。", SkillType.SKILL, List.of("bmad", "help", "docs"))
        );

        List<Skill> entities = seeds.stream().map(seed -> {
            Skill skill = new Skill();
            skill.setName(seed.name());
            skill.setType(seed.type());
            skill.setDescription(seed.description());
            skill.setContent(seed.content());
            skill.setStatus(SkillStatus.PUBLISHED);
            skill.setVersion("1.0.0");
            skill.setChangelog("初始版本");
            skill.setAuthorName("BMAD Team");
            skill.setAuthorEmail("bmad@agentsgate.dev");
            skill.setOsCompatibility(List.of(OsType.WINDOWS, OsType.MACOS));
            skill.setTags(seed.tags());
            skill.setInstallationSteps(seed.type() == SkillType.SKILL
                ? List.of(
                    "下載套件並解壓縮",
                    "執行 install.ps1（Windows）或 install.sh（macOS）",
                    "重新啟動你的 CLI 工具",
                    "使用 /" + seed.name() + " 呼叫此 Skill"
                )
                : List.of(
                    "下載套件並解壓縮",
                    "執行 install.ps1（Windows）或 install.sh（macOS）",
                    "重新啟動你的 CLI 工具",
                    "在對話中呼叫 @" + seed.name() + " 啟動 Agent"
                )
            );
            skill.setDependencies(List.of());
            skill.setEnvironmentDeclaration(new Skill.EnvironmentDeclaration(
                    false, false, false, false, null));
            return skill;
        }).toList();

        skillRepository.saveAll(entities);
        log.info("[DataSeeder] 已成功寫入 {} 筆 BMAD 範例資料。", entities.size());
    }

    private static SkillSeedData s(String name, String displayName, String description, SkillType type, List<String> tags) {
        String content = "## " + displayName + "\n\n" + description + "\n\n" +
                "本 Skill 由 BMAD 框架提供，使用前請確認已正確安裝 BMAD 模組。";
        return new SkillSeedData(name, description, content, type, tags);
    }

    private record SkillSeedData(String name, String description, String content, SkillType type, List<String> tags) {}
}
