# Runbook: Disaster Recovery — BidFlow Platform

> **Propósito:** Plano de recuperação de desastres para a plataforma.
> **Responsável:** SRE
> **RTO:** 30 min | **RPO:** 5 min

---

## 1. Cenários de Desastre

| Cenário | Impacto | RTO | RPO | Ação |
|---------|---------|-----|-----|------|
| **Perda de instância DB** | Sistema todo fora | 30 min | 5 min | Restore + WAL |
| **Corrupção de dados** | Dados inconsistentes | 1h | 1 min | PITR |
| **Perda de schema de tenant** | 1 tenant afetado | 15 min | 5 min | Restore schema |
| **Região cloud indisponível** | Sistema todo fora | 2h | 15 min | Failover região |
| **Ataque ransomware** | Dados criptografados | 4h | 24h | Restore backup limpo |

## 2. Plano de Recuperação

### 2.1 Perda de Instância DB

```bash
# 1. Provisionar nova instância PostgreSQL
docker run -d --name bidflow-db-recovery \
  -e POSTGRES_DB=bidflow_db \
  -e POSTGRES_USER=bidflow \
  -e POSTGRES_PASSWORD=$DB_PASSWORD \
  postgres:16-alpine

# 2. Restaurar último backup full
pg_restore -d bidflow_db -j 4 /backups/daily/bidflow-db-$(date +%Y-%m-%d).dump

# 3. Aplicar WAL até o momento da falha
# (configurar recovery.conf com restore_command)

# 4. Verificar consistência
psql -d bidflow_db -c "SELECT count(*) FROM tenants;"
psql -d bidflow_db -c "SELECT count(*) FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%';"

# 5. Redirecionar aplicação
export DATABASE_URL="postgresql://bidflow@new-host:5432/bidflow_db"

# 6. Verificar health
curl -f http://localhost:3001/health
```

### 2.2 Perda de Schema de Tenant

```bash
# 1. Identificar tenant afetado
SELECT schema_name FROM information_schema.schemata
WHERE schema_name = 'tenant_uuid';

# 2. Restaurar schema específico
pg_restore -d bidflow_db -n tenant_uuid /backups/tenants/tenant-uuid-2026-05-15.dump

# 3. Verificar dados
psql -d bidflow_db -c "SET search_path TO tenant_uuid; SELECT count(*) FROM users;"
```

## 3. DR Teste (Trimestral)

```yaml
dr_test:
  frequency: quarterly
  scenarios:
    - "Perda de instância DB principal"
    - "Corrupção de schema de tenant"
    - "Failover de região"
  validation:
    - "Todos os health checks passam"
    - "Dados consistentes (queries de verificação)"
    - "Performance dentro do baseline"
  report:
    to: "Architecture Board"
    deadline: "5 dias úteis após o teste"
```

## 4. Backup Verification (Mensal)

```bash
#!/bin/bash
# /usr/local/bin/test-restore.sh

# 1. Criar DB de teste
createdb bidflow_dr_test

# 2. Restaurar backup
pg_restore -d bidflow_dr_test -j 4 /backups/daily/bidflow-db-latest.dump

# 3. Validar dados
psql -d bidflow_dr_test -c "
  SELECT 'tenants' AS tbl, count(*) FROM tenants
  UNION ALL
  SELECT 'schemas', count(*) FROM information_schema.schemata
  WHERE schema_name LIKE 'tenant_%';
"

# 4. Limpar
dropdb bidflow_dr_test
echo "DR test completed: $(date)"
```

## 5. Documentos Relacionados

- [`backups.md`](./backups.md) — Estratégia de backup
- [`database-recovery.md`](./database-recovery.md) — Recovery procedures
- [`incident-response.md`](./incident-response.md) — Incident response flow
- [`rollback.md`](./rollback.md) — Rollback procedures
