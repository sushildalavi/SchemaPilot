CREATE TABLE IF NOT EXISTS contract_registry_endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    namespace VARCHAR(100) NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    http_method VARCHAR(10) NOT NULL,
    route_path VARCHAR(255) NOT NULL,
    endpoint_name VARCHAR(512) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(namespace, service_name, http_method, route_path)
);

CREATE TABLE IF NOT EXISTS contract_schema_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint_id UUID NOT NULL REFERENCES contract_registry_endpoints(id) ON DELETE CASCADE,
    version INT NOT NULL,
    fingerprint VARCHAR(64) NOT NULL,
    canonical_schema JSONB NOT NULL,
    compatibility_classification VARCHAR(32) NOT NULL DEFAULT 'SAFE',
    previous_version_id UUID NULL REFERENCES contract_schema_versions(id) ON DELETE SET NULL,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(endpoint_id, version),
    UNIQUE(endpoint_id, fingerprint)
);

CREATE INDEX IF NOT EXISTS ix_contract_schema_versions_endpoint_current
ON contract_schema_versions(endpoint_id, is_current);

CREATE TABLE IF NOT EXISTS consumer_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consumer_id VARCHAR(100) NOT NULL,
    endpoint_id UUID NOT NULL REFERENCES contract_registry_endpoints(id) ON DELETE CASCADE,
    target_url TEXT NOT NULL,
    severity_threshold VARCHAR(32) NOT NULL,
    schema_version INT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_delivery_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    consumer_id VARCHAR(100) NOT NULL,
    endpoint_id UUID NOT NULL REFERENCES contract_registry_endpoints(id) ON DELETE CASCADE,
    target_url TEXT NOT NULL,
    success BOOLEAN NOT NULL,
    failure_reason TEXT NULL,
    attempt_count INT NOT NULL,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_delivery_dlq (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    consumer_id VARCHAR(100) NOT NULL,
    endpoint_id UUID NOT NULL REFERENCES contract_registry_endpoints(id) ON DELETE CASCADE,
    target_url TEXT NOT NULL,
    payload JSONB NOT NULL,
    failure_reason TEXT NOT NULL,
    attempt_count INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(event_id, consumer_id)
);
