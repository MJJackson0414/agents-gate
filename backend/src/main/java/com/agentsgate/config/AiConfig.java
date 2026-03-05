package com.agentsgate.config;

import com.agentsgate.ai.SkillReviewAiService;
import dev.langchain4j.model.anthropic.AnthropicChatModel;
import dev.langchain4j.service.AiServices;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AiConfig {

    private static final Logger log = LoggerFactory.getLogger(AiConfig.class);

    @Value("${anthropic.api-key:}")
    private String apiKey;

    @Bean
    public AnthropicChatModel anthropicChatModel() {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("[AiConfig] ANTHROPIC_API_KEY not set - AI review will be disabled");
        }
        return AnthropicChatModel.builder()
                .apiKey(apiKey)
                .modelName("claude-haiku-4-5-20251001")
                .maxTokens(1024)
                .build();
    }

    @Bean
    public SkillReviewAiService skillReviewAiService(AnthropicChatModel model) {
        return AiServices.builder(SkillReviewAiService.class)
                .chatLanguageModel(model)
                .build();
    }
}
