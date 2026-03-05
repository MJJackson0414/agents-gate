package com.agentsgate.domain;

public enum SkillStatus {
    DRAFT,
    PENDING_AI_REVIEW,
    AI_REJECTED_REVIEW,    // AI 初審不通過，等待人工複審
    PENDING_HUMAN_REVIEW,  // AI 初審通過，等待人工審查
    PUBLISHED,
    REJECTED               // 人工審查拒絕
}
