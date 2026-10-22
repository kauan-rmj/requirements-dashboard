CREATE TABLE IF NOT EXISTS v3_tests (
  id BIGSERIAL PRIMARY KEY,
  milestone TEXT NOT NULL DEFAULT '',
  feature TEXT NOT NULL DEFAULT '',
  test TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'validacao_pendente'
    CHECK (status IN ('validado_nao_qa','validado_qa','correcao_pendente','validacao_pendente')),
  position BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Snapshot of the V3 Linear project milestones (refreshed from Linear when LINEAR_API_KEY is set)
CREATE TABLE IF NOT EXISTS v3_milestones (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order DOUBLE PRECISION NOT NULL DEFAULT 0
);

-- Snapshot of Linear users (refreshed from Linear when LINEAR_API_KEY is set)
CREATE TABLE IF NOT EXISTS v3_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT
);
ALTER TABLE v3_tests ADD COLUMN IF NOT EXISTS assignee_id TEXT;
ALTER TABLE v3_tests ADD COLUMN IF NOT EXISTS validator_id TEXT;

ALTER TABLE v3_tests ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'sem_prioridade';
ALTER TABLE v3_tests DROP CONSTRAINT IF EXISTS v3_tests_status_check;
ALTER TABLE v3_tests ADD CONSTRAINT v3_tests_status_check CHECK (status IN ('validado_nao_qa','validado_qa','correcao_pendente','validacao_pendente','especificacao_pendente'));

-- Linear issue (DEV-XXXX) each test was derived from
ALTER TABLE v3_tests ADD COLUMN IF NOT EXISTS linear_id TEXT;
