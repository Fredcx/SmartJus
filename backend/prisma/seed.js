const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

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

  console.log('✅ Usuário criado:', {
    id: user.id,
    email: user.email,
    name: user.name,
  });
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });