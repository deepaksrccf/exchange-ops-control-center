-- Exchange Operations Control Center - baseline schema.
-- All data stored here is synthetic and fictional.

CREATE TABLE venue (
    id          UUID         PRIMARY KEY,
    code        VARCHAR(16)  NOT NULL,
    name        VARCHAR(128) NOT NULL,
    status      VARCHAR(32)  NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL,
    updated_at  TIMESTAMPTZ  NOT NULL,
    CONSTRAINT uq_venue_code UNIQUE (code),
    CONSTRAINT ck_venue_status CHECK (status IN ('OPERATIONAL', 'DEGRADED', 'HALTED', 'OFFLINE'))
);

CREATE TABLE symbol (
    id           UUID         PRIMARY KEY,
    ticker       VARCHAR(16)  NOT NULL,
    display_name VARCHAR(128) NOT NULL,
    venue_id     UUID         NOT NULL,
    active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ  NOT NULL,
    updated_at   TIMESTAMPTZ  NOT NULL,
    CONSTRAINT fk_symbol_venue FOREIGN KEY (venue_id) REFERENCES venue (id),
    CONSTRAINT uq_symbol_venue_ticker UNIQUE (venue_id, ticker)
);

CREATE INDEX ix_symbol_venue ON symbol (venue_id);

CREATE TABLE market_event (
    id                    UUID           PRIMARY KEY,
    venue_id              UUID           NOT NULL,
    symbol_id             UUID           NOT NULL,
    sequence_number       BIGINT         NOT NULL,
    event_type            VARCHAR(32)    NOT NULL,
    price                 NUMERIC(19, 6),
    quantity              BIGINT         NOT NULL,
    event_timestamp       TIMESTAMPTZ    NOT NULL,
    received_timestamp    TIMESTAMPTZ    NOT NULL,
    processing_latency_ms BIGINT         NOT NULL,
    source                VARCHAR(64)    NOT NULL,
    metadata              JSONB,
    created_at            TIMESTAMPTZ    NOT NULL,
    CONSTRAINT fk_market_event_venue FOREIGN KEY (venue_id) REFERENCES venue (id),
    CONSTRAINT fk_market_event_symbol FOREIGN KEY (symbol_id) REFERENCES symbol (id),
    CONSTRAINT uq_market_event_venue_sequence UNIQUE (venue_id, sequence_number),
    CONSTRAINT ck_market_event_quantity CHECK (quantity >= 0),
    CONSTRAINT ck_market_event_latency CHECK (processing_latency_ms >= 0)
);

CREATE INDEX ix_market_event_timestamp ON market_event (event_timestamp DESC);
CREATE INDEX ix_market_event_venue_timestamp ON market_event (venue_id, event_timestamp DESC);
CREATE INDEX ix_market_event_symbol_timestamp ON market_event (symbol_id, event_timestamp DESC);
CREATE INDEX ix_market_event_type ON market_event (event_type);

CREATE TABLE alert_rule (
    id             UUID         PRIMARY KEY,
    name           VARCHAR(128) NOT NULL,
    rule_type      VARCHAR(32)  NOT NULL,
    severity       VARCHAR(16)  NOT NULL,
    threshold      NUMERIC(19, 6) NOT NULL,
    window_seconds BIGINT       NOT NULL,
    enabled        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ  NOT NULL,
    updated_at     TIMESTAMPTZ  NOT NULL,
    CONSTRAINT uq_alert_rule_name UNIQUE (name),
    CONSTRAINT ck_alert_rule_window CHECK (window_seconds > 0)
);

CREATE TABLE alert (
    id              UUID          PRIMARY KEY,
    rule_id         UUID          NOT NULL,
    event_id        UUID,
    venue_id        UUID          NOT NULL,
    symbol_id       UUID,
    severity        VARCHAR(16)   NOT NULL,
    status          VARCHAR(16)   NOT NULL,
    title           VARCHAR(200)  NOT NULL,
    explanation     VARCHAR(2000) NOT NULL,
    assigned_to     VARCHAR(128),
    detected_at     TIMESTAMPTZ   NOT NULL,
    acknowledged_at TIMESTAMPTZ,
    resolved_at     TIMESTAMPTZ,
    CONSTRAINT fk_alert_rule FOREIGN KEY (rule_id) REFERENCES alert_rule (id),
    CONSTRAINT fk_alert_event FOREIGN KEY (event_id) REFERENCES market_event (id),
    CONSTRAINT fk_alert_venue FOREIGN KEY (venue_id) REFERENCES venue (id),
    CONSTRAINT fk_alert_symbol FOREIGN KEY (symbol_id) REFERENCES symbol (id),
    CONSTRAINT ck_alert_status CHECK (
        status IN ('OPEN', 'ACKNOWLEDGED', 'ESCALATED', 'RESOLVED', 'SUPPRESSED')
    ),
    CONSTRAINT ck_alert_severity CHECK (
        severity IN ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
    )
);

CREATE INDEX ix_alert_status_detected ON alert (status, detected_at DESC);
CREATE INDEX ix_alert_severity ON alert (severity);
CREATE INDEX ix_alert_venue ON alert (venue_id);
CREATE INDEX ix_alert_rule ON alert (rule_id);

CREATE TABLE incident (
    id                 UUID          PRIMARY KEY,
    incident_number    VARCHAR(32)   NOT NULL,
    alert_id           UUID,
    title              VARCHAR(200)  NOT NULL,
    description        VARCHAR(4000) NOT NULL,
    severity           VARCHAR(16)   NOT NULL,
    status             VARCHAR(16)   NOT NULL,
    owner              VARCHAR(128),
    resolution_summary VARCHAR(4000),
    created_at         TIMESTAMPTZ   NOT NULL,
    updated_at         TIMESTAMPTZ   NOT NULL,
    resolved_at        TIMESTAMPTZ,
    CONSTRAINT uq_incident_number UNIQUE (incident_number),
    CONSTRAINT fk_incident_alert FOREIGN KEY (alert_id) REFERENCES alert (id),
    CONSTRAINT ck_incident_status CHECK (
        status IN ('OPEN', 'INVESTIGATING', 'MITIGATED', 'RESOLVED', 'CLOSED')
    ),
    CONSTRAINT ck_incident_severity CHECK (severity IN ('SEV1', 'SEV2', 'SEV3', 'SEV4'))
);

CREATE INDEX ix_incident_status_created ON incident (status, created_at DESC);
CREATE INDEX ix_incident_severity ON incident (severity);

CREATE TABLE incident_note (
    id          UUID          PRIMARY KEY,
    incident_id UUID          NOT NULL,
    author      VARCHAR(128)  NOT NULL,
    content     VARCHAR(4000) NOT NULL,
    created_at  TIMESTAMPTZ   NOT NULL,
    CONSTRAINT fk_incident_note_incident FOREIGN KEY (incident_id)
        REFERENCES incident (id) ON DELETE CASCADE
);

CREATE INDEX ix_incident_note_incident ON incident_note (incident_id, created_at);

CREATE TABLE incident_event (
    id          UUID          PRIMARY KEY,
    incident_id UUID          NOT NULL,
    event_type  VARCHAR(32)   NOT NULL,
    actor       VARCHAR(128)  NOT NULL,
    description VARCHAR(1000) NOT NULL,
    created_at  TIMESTAMPTZ   NOT NULL,
    CONSTRAINT fk_incident_event_incident FOREIGN KEY (incident_id)
        REFERENCES incident (id) ON DELETE CASCADE,
    CONSTRAINT ck_incident_event_type CHECK (
        event_type IN (
            'CREATED', 'STATUS_CHANGED', 'SEVERITY_CHANGED',
            'OWNER_ASSIGNED', 'NOTE_ADDED', 'RESOLVED'
        )
    )
);

CREATE INDEX ix_incident_event_incident ON incident_event (incident_id, created_at);
