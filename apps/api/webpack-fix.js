const fs = require('fs');

try {
  let file = 'src/auctions/dto/index.ts';
  if(fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/export \* from '\.\/update-auction\.dto';/g, '');
    fs.writeFileSync(file, content);
  }

  file = 'src/users/dto/index.ts';
  if(fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/export \* from '\.\/update-user\.dto';/g, '');
    fs.writeFileSync(file, content);
  }

  file = 'src/suppliers/infrastructure/persistence/prisma/mappers/supplier.mapper.ts';
  if(fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/packages/g, '../../../../packages');
    fs.writeFileSync(file, content);
  }

  file = 'src/suppliers/infrastructure/persistence/prisma/prisma-supplier.repository.ts';
  if(fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/packages/g, '../../../../packages');
    fs.writeFileSync(file, content);
  }

  file = 'src/tenders/application/commands/process-tender-result/process-tender-result.dto.ts';
  if(fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/packages/g, '../../../../packages');
    fs.writeFileSync(file, content);
  }

  file = 'src/tenders/application/commands/process-tender-result/process-tender-result.command.ts';
  if(fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/packages/g, '../../../../packages');
    fs.writeFileSync(file, content);
  }

  file = 'src/suppliers/suppliers.module.ts';
  if(fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/RabbitMQEventPublisher/g, 'RabbitMqTenderEventPublisher');
    fs.writeFileSync(file, content);
  }

  file = 'test/integration/suppliers/prisma-supplier.repository.spec.ts';
  if(fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/prisma\.suppliers/g, 'prisma.supplier');
    fs.writeFileSync(file, content);
  }

  file = 'test/integration/tenders/prisma-tender.repository.spec.ts';
  if(fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/prisma\.tenders/g, 'prisma.tender');
    fs.writeFileSync(file, content);
  }

} catch(e) {}
