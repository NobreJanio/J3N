-- Funcionalidades Avançadas - J3N Platform
-- Dashboard/Analytics, Agendamento, Webhooks, Templates, Versionamento

-- ========================================
-- ANALYTICS E MÉTRICAS
-- ========================================

-- Tabela para métricas de execução
CREATE TABLE IF NOT EXISTS execution_metrics (
    id SERIAL PRIMARY KEY,
    execution_id VARCHAR(36) REFERENCES workflow_executions(id) ON DELETE CASCADE,
    workflow_id INTEGER REFERENCES workflows(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    execution_time_ms INTEGER, -- Tempo de execução em milissegundos
    nodes_executed INTEGER DEFAULT 0,
    nodes_failed INTEGER DEFAULT 0,
    memory_usage_mb DECIMAL(10,2),
    cpu_usage_percent DECIMAL(5,2),
    api_calls_count INTEGER DEFAULT 0,
    data_processed_bytes BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para estatísticas agregadas diárias
CREATE TABLE IF NOT EXISTS daily_stats (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    total_executions INTEGER DEFAULT 0,
    successful_executions INTEGER DEFAULT 0,
    failed_executions INTEGER DEFAULT 0,
    avg_execution_time_ms DECIMAL(10,2),
    total_api_calls INTEGER DEFAULT 0,
    total_data_processed_bytes BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, user_id)
);

-- ========================================
-- AGENDAMENTO E TRIGGERS TEMPORAIS
-- ========================================

-- Tabela para agendamentos (cron jobs)
CREATE TABLE IF NOT EXISTS workflow_schedules (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER REFERENCES workflows(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    cron_expression VARCHAR(100) NOT NULL, -- Ex: '0 9 * * 1-5' (9h, seg-sex)
    timezone VARCHAR(50) DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT true,
    next_run_at TIMESTAMP WITH TIME ZONE,
    last_run_at TIMESTAMP WITH TIME ZONE,
    last_execution_id VARCHAR(36),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para histórico de execuções agendadas
CREATE TABLE IF NOT EXISTS schedule_executions (
    id SERIAL PRIMARY KEY,
    schedule_id INTEGER REFERENCES workflow_schedules(id) ON DELETE CASCADE,
    execution_id VARCHAR(36) REFERENCES workflow_executions(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'completed', -- completed, failed, skipped
    error_message TEXT
);

-- ========================================
-- SISTEMA DE WEBHOOKS
-- ========================================

-- Tabela para webhooks incoming (recebidos)
CREATE TABLE IF NOT EXISTS webhook_endpoints (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER REFERENCES workflows(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    endpoint_url VARCHAR(500) UNIQUE NOT NULL, -- URL única gerada
    secret_token VARCHAR(255), -- Token para validação
    is_active BOOLEAN DEFAULT true,
    allowed_methods TEXT[] DEFAULT '{"POST"}', -- Métodos HTTP permitidos
    content_type VARCHAR(100) DEFAULT 'application/json',
    max_payload_size INTEGER DEFAULT 1048576, -- 1MB em bytes
    rate_limit_per_minute INTEGER DEFAULT 60,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    total_triggers INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para webhooks outgoing (enviados)
CREATE TABLE IF NOT EXISTS webhook_subscriptions (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER REFERENCES workflows(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    target_url VARCHAR(500) NOT NULL,
    events TEXT[] NOT NULL, -- Ex: ['workflow.completed', 'workflow.failed']
    headers JSONB DEFAULT '{}', -- Headers customizados
    secret_token VARCHAR(255), -- Para assinatura HMAC
    is_active BOOLEAN DEFAULT true,
    retry_attempts INTEGER DEFAULT 3,
    retry_delay_seconds INTEGER DEFAULT 60,
    timeout_seconds INTEGER DEFAULT 30,
    last_sent_at TIMESTAMP WITH TIME ZONE,
    total_sent INTEGER DEFAULT 0,
    total_failed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para logs de webhooks
CREATE TABLE IF NOT EXISTS webhook_logs (
    id SERIAL PRIMARY KEY,
    webhook_endpoint_id INTEGER REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
    webhook_subscription_id INTEGER REFERENCES webhook_subscriptions(id) ON DELETE CASCADE,
    execution_id VARCHAR(36) REFERENCES workflow_executions(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL, -- Ex: 'incoming', 'outgoing'
    http_method VARCHAR(10),
    status_code INTEGER,
    request_headers JSONB DEFAULT '{}',
    request_body TEXT,
    response_headers JSONB DEFAULT '{}',
    response_body TEXT,
    processing_time_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- TEMPLATES DE WORKFLOWS
-- ========================================

-- Tabela para templates
CREATE TABLE IF NOT EXISTS workflow_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- Ex: 'automation', 'integration', 'data-processing'
    tags TEXT[], -- Tags para busca
    template_data JSONB NOT NULL, -- Estrutura do workflow
    preview_image_url VARCHAR(500), -- URL da imagem de preview
    is_public BOOLEAN DEFAULT false, -- Template público ou privado
    is_featured BOOLEAN DEFAULT false, -- Template em destaque
    author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    usage_count INTEGER DEFAULT 0, -- Quantas vezes foi usado
    rating_average DECIMAL(3,2) DEFAULT 0.0, -- Avaliação média (0-5)
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para avaliações de templates
CREATE TABLE IF NOT EXISTS template_ratings (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES workflow_templates(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(template_id, user_id)
);

-- ========================================
-- VERSIONAMENTO DE WORKFLOWS
-- ========================================

-- Tabela para versões de workflows
CREATE TABLE IF NOT EXISTS workflow_versions (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER REFERENCES workflows(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    version_name VARCHAR(255), -- Ex: 'v1.0', 'Versão Inicial'
    description TEXT,
    workflow_data JSONB NOT NULL, -- Snapshot dos dados do workflow
    is_current BOOLEAN DEFAULT false, -- Versão atual ativa
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workflow_id, version_number)
);

-- Tabela para comparações entre versões
CREATE TABLE IF NOT EXISTS version_comparisons (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER REFERENCES workflows(id) ON DELETE CASCADE,
    version_from INTEGER REFERENCES workflow_versions(id) ON DELETE CASCADE,
    version_to INTEGER REFERENCES workflow_versions(id) ON DELETE CASCADE,
    diff_data JSONB NOT NULL, -- Diferenças entre versões
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- ÍNDICES PARA PERFORMANCE
-- ========================================

-- Analytics
CREATE INDEX IF NOT EXISTS idx_execution_metrics_workflow_id ON execution_metrics(workflow_id);
CREATE INDEX IF NOT EXISTS idx_execution_metrics_user_id ON execution_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_execution_metrics_created_at ON execution_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date_user ON daily_stats(date, user_id);

-- Agendamento
CREATE INDEX IF NOT EXISTS idx_workflow_schedules_workflow_id ON workflow_schedules(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_schedules_is_active ON workflow_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_workflow_schedules_next_run ON workflow_schedules(next_run_at);
CREATE INDEX IF NOT EXISTS idx_schedule_executions_schedule_id ON schedule_executions(schedule_id);

-- Webhooks
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_workflow_id ON webhook_endpoints(workflow_id);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_is_active ON webhook_endpoints(is_active);
CREATE INDEX IF NOT EXISTS idx_webhook_subscriptions_workflow_id ON webhook_subscriptions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);

-- Templates
CREATE INDEX IF NOT EXISTS idx_workflow_templates_category ON workflow_templates(category);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_is_public ON workflow_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_is_featured ON workflow_templates(is_featured);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_usage_count ON workflow_templates(usage_count);
CREATE INDEX IF NOT EXISTS idx_template_ratings_template_id ON template_ratings(template_id);

-- Versionamento
CREATE INDEX IF NOT EXISTS idx_workflow_versions_workflow_id ON workflow_versions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_versions_is_current ON workflow_versions(is_current);
CREATE INDEX IF NOT EXISTS idx_version_comparisons_workflow_id ON version_comparisons(workflow_id);

-- ========================================
-- TRIGGERS PARA UPDATED_AT
-- ========================================

CREATE TRIGGER update_workflow_schedules_updated_at BEFORE UPDATE ON workflow_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhook_endpoints_updated_at BEFORE UPDATE ON webhook_endpoints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhook_subscriptions_updated_at BEFORE UPDATE ON webhook_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_templates_updated_at BEFORE UPDATE ON workflow_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- FUNÇÕES AUXILIARES
-- ========================================

-- Função para calcular próxima execução de cron
CREATE OR REPLACE FUNCTION calculate_next_cron_run(
    cron_expr TEXT,
    timezone_name TEXT DEFAULT 'UTC'
) RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
    next_run TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Implementação simplificada - em produção usar biblioteca cron
    -- Por enquanto, adiciona 1 hora à data atual
    next_run := CURRENT_TIMESTAMP + INTERVAL '1 hour';
    RETURN next_run;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar estatísticas diárias
CREATE OR REPLACE FUNCTION update_daily_stats(
    target_date DATE,
    target_user_id INTEGER
) RETURNS VOID AS $$
BEGIN
    INSERT INTO daily_stats (
        date, user_id, total_executions, successful_executions, 
        failed_executions, avg_execution_time_ms, total_api_calls, 
        total_data_processed_bytes
    )
    SELECT 
        target_date,
        target_user_id,
        COUNT(*) as total_executions,
        COUNT(*) FILTER (WHERE status = 'completed') as successful_executions,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_executions,
        AVG(em.execution_time_ms) as avg_execution_time_ms,
        COALESCE(SUM(em.api_calls_count), 0) as total_api_calls,
        COALESCE(SUM(em.data_processed_bytes), 0) as total_data_processed_bytes
    FROM workflow_executions we
    LEFT JOIN execution_metrics em ON we.id = em.execution_id
    JOIN workflows w ON we.workflow_id = w.id
    WHERE DATE(we.started_at) = target_date
    AND w.user_id = target_user_id
    GROUP BY target_date, target_user_id
    ON CONFLICT (date, user_id) DO UPDATE SET
        total_executions = EXCLUDED.total_executions,
        successful_executions = EXCLUDED.successful_executions,
        failed_executions = EXCLUDED.failed_executions,
        avg_execution_time_ms = EXCLUDED.avg_execution_time_ms,
        total_api_calls = EXCLUDED.total_api_calls,
        total_data_processed_bytes = EXCLUDED.total_data_processed_bytes;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE execution_metrics IS 'Métricas detalhadas de execução para analytics';
COMMENT ON TABLE daily_stats IS 'Estatísticas agregadas diárias para dashboard';
COMMENT ON TABLE workflow_schedules IS 'Agendamentos de workflows com expressões cron';
COMMENT ON TABLE webhook_endpoints IS 'Endpoints para receber webhooks externos';
COMMENT ON TABLE webhook_subscriptions IS 'Configurações para envio de webhooks';
COMMENT ON TABLE workflow_templates IS 'Templates pré-configurados de workflows';
COMMENT ON TABLE workflow_versions IS 'Histórico de versões dos workflows';