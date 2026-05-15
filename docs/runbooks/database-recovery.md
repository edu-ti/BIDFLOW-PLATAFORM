# Runbook: Database Recovery — BidFlow Platform

> **Propósito:** Procedimentos de recuperação de banco de dados PostgreSQL.
> **Responsável:** DBA / SRE
> **RPO alvo:** 5 min | **RTO alvo:** 30 min

---

## 1. Backup Structure

```bash
/backups/
├── daily/           # Backup completo (00:00 UTC)
│   └── bidflow-db-YYYY-MM-DD.dump
├── hourly/          # WAL arquivado
│   └── 0000000100000000-*
└── pre-deploy/      # Backup antes de cada deploy
    └── bidflow-db-pre-deploy-YYYY-MM-DD-HHMM.dump
```

## 2. Recuperação de Schema Individual (Schema-per-tenant)

```sql
-- 1. Identificar schema do tenant
SELECT schema_name FROM information_schema.schemata
WHERE schema_name LIKE 'tenant_%'
AND schema_name NOT IN ('public', 'information_schema', 'pg_catalog');

-- 2. Backup de schema específico
pg_dump -d bidflow_db -n tenant_uuid -f tenant_uuid.dump

-- 3. Restore de schema específico
psql -d bidflow_db -c "DROP SCHEMA IF EXISTS tenant_uuid CASCADE;"
pg_restore -d bidflow_db -n tenant_uuid tenant_uuid.dump
```

## 3. Recuperação Completa (Point-in-Time)

```bash
# 1. Restaurar último backup completo
pg_restore -d bidflow_db -j 4 /backups/daily/bidflow-db-2026-05-15.dump

# 2. Aplicar WAL até o ponto desejado
# Configurar recovery.conf com restore_command
# recovery_target_time = '2026-05-15 14:30:00 UTC'
```

## 4. Corrupção de Dados

```sql
-- 1. Identificar extensões corrompidas
SELECT datname, oid FROM pg_database;

-- 2. Verificar integridade
SET search_path TO tenant_uuid;
SELECT * FROM pg_stat_all_tables WHERE schemaname = 'tenant_uuid';

-- 3. Reindexar se necessário
REINDEX DATABASE bidflow_db;
```

## 5. Failover (Futuro — replicação)

```bash
# Promover réplica para primário
pg_ctl promote -D /var/lib/postgresql/data-replica

# Redirecionar aplicação
export DATABASE_URL="postgresql://bidflow@replica:5432/bidflow_db"
```

## 6. Checklist de Recuperação

- [ ] Backup íntegro verificado
- [ ] Schema do tenant identificado
- [ ] Recovery executado
- [ ] Dados consistentes (queries de verificação)
- [ ] Aplicação reconectada
- [ ] Health check OK
