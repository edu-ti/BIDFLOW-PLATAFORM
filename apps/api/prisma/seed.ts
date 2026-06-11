import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 A iniciar o seed da base de dados...');

  // 1. Define o tenantId constante (não há tabela Tenant)
  const tenantId = 'tenant-demo-001';

  // 2. Cria a Hash da Senha
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash('admin123', saltRounds);

  // 3. Cria o Utilizador Admin
  const user = await prisma.user.upsert({
    where: { 
      tenantId_email: { 
        tenantId, 
        email: 'admin@x3solucoes.com' 
      } 
    },
    update: {
      password: hashedPassword,
      name: 'Eduardo Cabral',
      role: 'ADMIN',
    },
    create: {
      tenantId,
      email: 'admin@x3solucoes.com',
      password: hashedPassword,
      name: 'Eduardo Cabral',
      role: 'ADMIN',
    },
  });

  // 4. Cria o Pipeline Padrão do CRM para este Tenant
  const stages = [
    { id: 'QUALIFICACAO', name: 'Qualificação', order: 1 },
    { id: 'NEGOCIACAO', name: 'Negociação', order: 2 }
  ];

  await prisma.pipeline.upsert({
    where: { 
      tenantId_slug: { 
        tenantId, 
        slug: 'licitacoes-default' 
      } 
    },
    update: {
      stages: stages,
      isDefault: true,
      name: 'Funil de Licitações Padrão',
    },
    create: {
      tenantId,
      name: 'Funil de Licitações Padrão',
      slug: 'licitacoes-default',
      isDefault: true,
      stages: stages,
    }
  });

  console.log('✅ Seed concluído com sucesso!');
  console.log('=================================');
  console.log(`📧 E-mail: admin@x3solucoes.com`);
  console.log(`🔑 Senha:  admin123`);
  console.log('=================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });