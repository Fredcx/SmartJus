const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Criando dados de teste...\n');

  // Criar usuário admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'admin@legal.com' },
    update: {},
    create: {
      email: 'admin@legal.com',
      password: hashedPassword,
      name: 'Administrador',
      role: 'admin',
    },
  });

  console.log('✅ Usuário criado:', user.email);

  // Criar processos de exemplo
  const case1 = await prisma.case.create({
    data: {
      number: '0001234-56.2024.8.26.0100',
      title: 'Ação de Indenização por Danos Morais',
      plaintiff: 'João da Silva',
      defendant: 'Empresa XYZ Ltda',
      subject: 'Danos morais e materiais',
      court: 'Tribunal de Justiça de São Paulo',
      status: 'active',
      thesis: 'A configuração de danos morais prescinde de prova do prejuízo efetivo.',
      userId: user.id,
    },
  });

  console.log('✅ Processo criado:', case1.number);

  const case2 = await prisma.case.create({
    data: {
      number: '0007890-12.2024.8.26.0100',
      title: 'Ação Trabalhista - Horas Extras',
      plaintiff: 'Maria Santos',
      defendant: 'Tech Solutions Ltda',
      subject: 'Horas extras não pagas',
      court: 'Tribunal Regional do Trabalho',
      status: 'pending',
      userId: user.id,
    },
  });

  console.log('✅ Processo criado:', case2.number);

  // Criar documento
  await prisma.document.create({
    data: {
      name: 'Petição Inicial',
      type: 'application/pdf',
      path: '/uploads/peticao-inicial.pdf',
      summary: 'Petição inicial relatando danos morais sofridos pelo autor.',
      status: 'processed',
      caseId: case1.id,
    },
  });

  console.log('✅ Documento criado');

  console.log('\n✨ Dados de teste criados com sucesso!');
  console.log('\n📋 Credenciais de login:');
  console.log('Email: admin@legal.com');
  console.log('Senha: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });