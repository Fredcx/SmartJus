const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  console.log('👤 Criando usuário admin...\n');
  
  try {
    // Verificar se já existe
    const existing = await prisma.user.findUnique({
      where: { email: 'admin@legal.com' }
    });

    if (existing) {
      console.log('⚠️  Usuário admin já existe!');
      console.log('Email:', existing.email);
      console.log('Nome:', existing.name);
      return;
    }

    // Criar novo
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const user = await prisma.user.create({
      data: {
        email: 'admin@legal.com',
        password: hashedPassword,
        name: 'Administrador',
        role: 'admin',
      },
    });

    console.log('✅ Usuário admin criado com sucesso!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', user.email);
    console.log('🔑 Senha: admin123');
    console.log('👤 Nome:', user.name);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error.message);
    process.exit(1);
  } finally {
    await prisma.disconnect();
  }
}

createAdmin();
