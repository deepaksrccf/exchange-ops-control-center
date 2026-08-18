package com.deepak.exchangeops.repository;

import com.deepak.exchangeops.domain.AlertRule;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AlertRuleRepository extends JpaRepository<AlertRule, UUID> {}
