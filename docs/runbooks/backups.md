# Runbook: Backups — BidFlow Platform

> **Propósito:** Estratégia de backup e retenção de dados.
> **Responsável:** DBA / SRE
> **RPO:** 5 min | **RTO:** 30 min | **Retenção:** 30 dias

---

## 1. Estratégia de Backup

| Tipo | Frequência | Retenção | Ferramenta | Tamanho estimado |
|------|-----------|----------|------------|------------------|
| **Full (pg_dump)** | Diário (00:00 UTC) | 30 dias | `pg_dump -Fc` | ~2 GB |
| **WAL archive** | Contínuo | 7 dias | `archive_command` | ~500 MB/dia |
| **Pre-deploy** | A cada deploy | 7 dias | `pg_dump -Fc` | ~2 GB |
| **Schema individual** | Sob demanda | — | `pg_dump -n tenant_uuid` | ~100 MB |

## 2. Script de Backup Full

```bash
#!/bin/bash
# /usr/local/bin/backup-full.sh

BACKUP_DIR="/backups/daily"
TIMESTAMP=$(date +%Y-%m-%d)
DB_NAME="bidflow_db"

pg_dump -Fc \
  -h localhost \
  -U bidflow \
  -d $DB_NAME \
  -f "$BACKUP_DIR/bidflow-db-$TIMESTAMP.dump" \
  -v 2>> "$BACKUP_DIR/backup-$TIMESTAMP.log"

# Comprimir
gzip "$BACKUP_DIR/bidflow-db-$TIMESTAMP.dump"

# Verificar integridade
pg_restore --list "$BACKUP_DIR/bidflow-db-$TIMESTAMP.dump.gz" > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "Backup válido: $TIMESTAMP" >> "$BACKUP_DIR/backup-$TIMESTAMP.log"
else
  echo "BACKUP INVÁLIDO: $TIMESTAMP" >> "$BACKUP_DIR/backup-$TIMESTAMP.log"
  # Notificar equipe
fi
```

## 3. Backup de Schema Específico (Tenant)

```bash
#!/bin/bash
# /usr/local/bin/backup-tenant.sh
# Uso: ./backup-tenant.sh <tenant_uuid>

TENANT_ID=$1
BACKUP_FILE="/backups/tenants/tenant-$TENANT_ID-$(date +%Y-%m-%d).dump"

pg_dump -Fc \
  -h localhost \
  -U bidflow \
  -d bidflow_db \
  -n "tenant_$TENANT_ID" \
  -f $BACKUP_FILE
```

## 4. Verificação de Integridade

```bash
# Diário — verificar backups recentes
for f in /backups/daily/*.dump.gz; do
  gunzip -c $f | pg_restore --list > /dev/null 2>&1
  if [ $? -ne 0 ]; then
    echo "BACKUP CORROMPIDO: $f" | mail -s "ALERTA Backup" devops@bidflow.com
  fi
done
```

## 5. Política de Retenção

| Tipo | Retenção | Destino |
|------|----------|---------|
| Full diário | 30 dias | Disco local + S3 |
| WAL archive | 7 dias | Disco local |
| Pre-deploy | 7 dias | Disco local |
| Schema tenant | 90 dias | S3 (cold storage) |
| Logs de auditoria | 5 anos | S3 Glacier (compliance) |

## 6. Restore — Teste Mensal

```bash
# TODO: Automatizar teste de restore mensal
# 1. Criar database de teste
createdb bidflow_test_restore

# 2. Restaurar último backup
pg_restore -d bidflow_test_restore /backups/daily/bidflow-db-$(date +%Y-%m-%d).dump

# 3. Validar dados
psql -d bidflow_test_restore -c "SELECT count(*) FROM tenants;"

# 4. Limpar
dropdb bidflow_test_restore
```
