package com.agentsgate.repository;

import com.agentsgate.domain.Skill;
import com.agentsgate.domain.SkillStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SkillRepository extends JpaRepository<Skill, UUID> {

    boolean existsByName(String name);

    List<Skill> findByStatus(SkillStatus status);

    List<Skill> findByStatusIn(List<SkillStatus> statuses);

    List<Skill> findByStatusNotIn(List<SkillStatus> statuses);
}
