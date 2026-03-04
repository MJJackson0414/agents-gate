package com.agentsgate.ai;

import java.util.List;

/**
 * Structured result returned by the AI review service.
 * LangChain4j will serialize/deserialize this as JSON.
 */
public record SkillReviewResult(
        boolean approved,
        String summary,
        String userExplanation,
        List<String> issues,
        List<String> suggestions
) {}
