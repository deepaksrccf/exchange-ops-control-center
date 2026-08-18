-- Synthetic operational activity: simulated feed events, alerts and incidents.
-- Values are generated deterministically from the row index; no real market data is used.

WITH ordered_symbol AS (
    SELECT id, venue_id, row_number() OVER (ORDER BY ticker) - 1 AS idx
    FROM symbol
)
INSERT INTO market_event (
    id, venue_id, symbol_id, sequence_number, event_type, price, quantity,
    event_timestamp, received_timestamp, processing_latency_ms, source, metadata, created_at
)
SELECT
    md5('exchangeops-event-' || g)::uuid,
    os.venue_id,
    os.id,
    1000000 + g,
    (ARRAY[
        'TRADE', 'QUOTE', 'TRADE', 'ORDER_ACCEPTED', 'QUOTE',
        'ORDER_CANCELLED', 'TRADE', 'QUOTE', 'HALT', 'RESUME'
    ])[1 + (g % 10)],
    ROUND((20 + os.idx * 15 + ((g * 37) % 2000) / 100.0)::numeric, 6),
    10 * (1 + ((g * 13) % 400)),
    now() - ((600 - g) * interval '7 seconds'),
    now() - ((600 - g) * interval '7 seconds')
        + (CASE WHEN g % 47 = 0 THEN 300 + (g % 90) ELSE 2 + ((g * 17) % 180) END
           * interval '1 millisecond'),
    CASE WHEN g % 47 = 0 THEN 300 + (g % 90) ELSE 2 + ((g * 17) % 180) END,
    'SIM-FEED-' || (1 + (g % 3)),
    jsonb_build_object('feedPartition', g % 4, 'synthetic', true, 'gateway', 'sim-gw-' || (1 + g % 2)),
    now()
FROM generate_series(0, 599) AS g
JOIN ordered_symbol os ON os.idx = g % 10;

WITH ordered_rule AS (
    SELECT id, name, severity, row_number() OVER (ORDER BY name) - 1 AS idx
    FROM alert_rule
),
seed AS (
    SELECT
        g,
        (ARRAY['OPEN', 'OPEN', 'ACKNOWLEDGED', 'OPEN', 'ESCALATED', 'RESOLVED'])[1 + (g % 6)]
            AS status,
        (ARRAY['ops.avery', 'ops.blake', 'ops.casey'])[1 + (g % 3)] AS operator,
        md5('exchangeops-event-' || ((g * 31) % 600))::uuid AS event_id,
        g % 6 AS rule_idx
    FROM generate_series(1, 18) AS g
)
INSERT INTO alert (
    id, rule_id, event_id, venue_id, symbol_id, severity, status, title,
    explanation, assigned_to, detected_at, acknowledged_at, resolved_at
)
SELECT
    md5('exchangeops-alert-' || sd.g)::uuid,
    r.id,
    e.id,
    e.venue_id,
    e.symbol_id,
    r.severity,
    sd.status,
    r.name || ' triggered on ' || sy.ticker,
    'Synthetic detection. Rule "' || r.name || '" matched sequence ' || e.sequence_number
        || ' with processing latency ' || e.processing_latency_ms || ' ms.',
    CASE WHEN sd.status = 'OPEN' THEN NULL ELSE sd.operator END,
    e.event_timestamp + interval '2 seconds',
    CASE WHEN sd.status = 'OPEN' THEN NULL ELSE e.event_timestamp + interval '95 seconds' END,
    CASE WHEN sd.status = 'RESOLVED' THEN e.event_timestamp + interval '400 seconds' ELSE NULL END
FROM seed sd
JOIN ordered_rule r ON r.idx = sd.rule_idx
JOIN market_event e ON e.id = sd.event_id
JOIN symbol sy ON sy.id = e.symbol_id;

INSERT INTO incident (
    id, incident_number, alert_id, title, description, severity, status, owner,
    resolution_summary, created_at, updated_at, resolved_at
) VALUES
    ('44444444-4444-4444-8444-000000000001', 'INC-2026-0001',
     md5('exchangeops-alert-2')::uuid,
     'Elevated feed latency on Arcadia Markets',
     'Simulated gateway sim-gw-1 reported sustained processing latency above the configured '
        || 'threshold. Investigating synthetic feed partition saturation.',
     'SEV2', 'INVESTIGATING', 'ops.blake', NULL,
     now() - interval '52 minutes', now() - interval '18 minutes', NULL),
    ('44444444-4444-4444-8444-000000000002', 'INC-2026-0002',
     md5('exchangeops-alert-5')::uuid,
     'Sequence gap observed on Novalux simulated feed',
     'A gap in the synthetic sequence stream was detected and replayed from the simulator '
        || 'buffer. Monitoring for recurrence.',
     'SEV3', 'MITIGATED', 'ops.avery', NULL,
     now() - interval '3 hours', now() - interval '40 minutes', NULL),
    ('44444444-4444-4444-8444-000000000003', 'INC-2026-0003',
     md5('exchangeops-alert-8')::uuid,
     'Price deviation guard fired repeatedly on HLIO',
     'The synthetic price generator produced deviations beyond the configured guard band. '
        || 'Rule tuning under review.',
     'SEV3', 'OPEN', NULL, NULL,
     now() - interval '26 minutes', now() - interval '26 minutes', NULL),
    ('44444444-4444-4444-8444-000000000004', 'INC-2026-0004',
     md5('exchangeops-alert-11')::uuid,
     'Stale feed watchdog on Meridian Trading Network',
     'Simulated publisher paused for 45 seconds during a scheduled simulator restart.',
     'SEV4', 'RESOLVED', 'ops.casey',
     'Simulator restart completed. Watchdog cleared automatically once publishing resumed.',
     now() - interval '9 hours', now() - interval '8 hours', now() - interval '8 hours');

INSERT INTO incident_note (id, incident_id, author, content, created_at) VALUES
    ('55555555-5555-4555-8555-000000000001', '44444444-4444-4444-8444-000000000001',
     'ops.blake', 'Paged the simulated feed handling team. Latency trending down.',
     now() - interval '45 minutes'),
    ('55555555-5555-4555-8555-000000000002', '44444444-4444-4444-8444-000000000001',
     'ops.avery', 'Partition 2 rebalanced in the simulator. Continuing to observe.',
     now() - interval '20 minutes'),
    ('55555555-5555-4555-8555-000000000003', '44444444-4444-4444-8444-000000000002',
     'ops.avery', 'Replay completed for the affected synthetic sequence range.',
     now() - interval '2 hours'),
    ('55555555-5555-4555-8555-000000000004', '44444444-4444-4444-8444-000000000004',
     'ops.casey', 'Restart window closed, watchdog no longer firing.',
     now() - interval '8 hours');

INSERT INTO incident_event (id, incident_id, event_type, actor, description, created_at) VALUES
    ('66666666-6666-4666-8666-000000000001', '44444444-4444-4444-8444-000000000001',
     'CREATED', 'ops.blake', 'Incident created from alert.', now() - interval '52 minutes'),
    ('66666666-6666-4666-8666-000000000002', '44444444-4444-4444-8444-000000000001',
     'OWNER_ASSIGNED', 'ops.blake', 'Owner set to ops.blake.', now() - interval '50 minutes'),
    ('66666666-6666-4666-8666-000000000003', '44444444-4444-4444-8444-000000000001',
     'STATUS_CHANGED', 'ops.blake', 'Status changed from OPEN to INVESTIGATING.',
     now() - interval '48 minutes'),
    ('66666666-6666-4666-8666-000000000004', '44444444-4444-4444-8444-000000000002',
     'CREATED', 'ops.avery', 'Incident created from alert.', now() - interval '3 hours'),
    ('66666666-6666-4666-8666-000000000005', '44444444-4444-4444-8444-000000000002',
     'STATUS_CHANGED', 'ops.avery', 'Status changed from INVESTIGATING to MITIGATED.',
     now() - interval '40 minutes'),
    ('66666666-6666-4666-8666-000000000006', '44444444-4444-4444-8444-000000000003',
     'CREATED', 'ops.avery', 'Incident created from alert.', now() - interval '26 minutes'),
    ('66666666-6666-4666-8666-000000000007', '44444444-4444-4444-8444-000000000004',
     'CREATED', 'ops.casey', 'Incident created from alert.', now() - interval '9 hours'),
    ('66666666-6666-4666-8666-000000000008', '44444444-4444-4444-8444-000000000004',
     'RESOLVED', 'ops.casey', 'Status changed from MITIGATED to RESOLVED.',
     now() - interval '8 hours');
