const fs = require('fs');
const schemaFile = 'prisma/schema.prisma';
let schema = fs.readFileSync(schemaFile, 'utf8');

if (!schema.includes('model Supplier')) {
  const toAppend = `

// ═══════════════════════════════════════════════════════════════════════════
// SUPPLIERS
// ═══════════════════════════════════════════════════════════════════════════

model Supplier {
  id              String   @id @default(uuid()) @map("id")
  tenantId        String   @map("tenant_id")
  corporateName   String   @map("corporate_name") @db.VarChar(255)
  tradeName       String?  @map("trade_name") @db.VarChar(255)
  cnpj            String   @map("cnpj") @db.VarChar(14)
  status          String   @default("ACTIVE") @map("status")
  complianceScore Int      @default(100) @map("compliance_score")
  metadata        Json     @default("{}") @map("metadata")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  @@unique([tenantId, cnpj])
  @@index([tenantId, status])
  @@map("suppliers")
}
`;
  fs.appendFileSync(schemaFile, toAppend);
}
