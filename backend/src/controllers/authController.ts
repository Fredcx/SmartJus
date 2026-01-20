import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';

// const prisma = new PrismaClient(); // Removed

const JWT_SECRET = process.env.JWT_SECRET || 'seu-secret-super-seguro-mude-isso-em-producao';

class AuthController {
  // ============================================
  // REGISTRO DE USUÁRIO
  // ============================================
  async register(req: Request, res: Response) {
    try {
      const { email, password, name } = req.body;

      console.log('📝 Tentando registrar usuário:', email);

      // Validações
      if (!email || !password || !name) {
        console.warn('⚠️ Campos obrigatórios faltando');
        return res.status(400).json({
          error: 'Campos obrigatórios faltando',
          message: 'Email, senha e nome são obrigatórios',
        });
      }

      if (password.length < 6) {
        console.warn('⚠️ Senha muito curta');
        return res.status(400).json({
          error: 'Senha muito curta',
          message: 'A senha deve ter no mínimo 6 caracteres',
        });
      }

      // Verificar se usuário já existe
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        console.warn('⚠️ Email já cadastrado:', email);
        return res.status(400).json({
          error: 'Email já cadastrado',
          message: 'Este email já está em uso',
        });
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log('🔐 Senha hasheada com sucesso');

      // Criar usuário
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          lawFirmName: req.body.lawFirmName,
          oab: req.body.oab,
          oabState: req.body.oabState,
          phone: req.body.phone,
        },
      });

      console.log('✅ Usuário criado:', user.id);

      // Gerar token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (error: any) {
      console.error('❌ Erro ao registrar usuário:', error);
      res.status(500).json({
        error: 'Erro ao criar usuário',
        message: 'Erro interno do servidor',
      });
    }
  }

  // ============================================
  // LOGIN DE USUÁRIO
  // ============================================
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      console.log('\n' + '='.repeat(60));
      console.log('🔐 TENTATIVA DE LOGIN');
      console.log('📧 Email:', email);
      console.log('🔑 Senha fornecida:', password ? '***' : 'VAZIO');
      console.log('='.repeat(60));

      // Validações básicas
      if (!email || !password) {
        console.warn('⚠️ Email ou senha não fornecidos');
        return res.status(400).json({
          error: 'Credenciais inválidas',
          message: 'Email e senha são obrigatórios',
        });
      }

      // Buscar usuário
      console.log('🔍 Buscando usuário no banco de dados...');
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        console.warn('❌ Usuário não encontrado:', email);
        return res.status(401).json({
          error: 'Credenciais inválidas',
          message: 'Email ou senha incorretos',
        });
      }

      console.log('✅ Usuário encontrado:', user.id);
      console.log('👤 Nome:', user.name);
      console.log('📧 Email confirmado:', user.email);

      // Verificar senha
      console.log('🔐 Verificando senha...');
      console.log('🔑 Hash armazenado:', user.password.substring(0, 20) + '...');

      const isPasswordValid = await bcrypt.compare(password, user.password);

      console.log('🔓 Senha válida?', isPasswordValid ? 'SIM ✅' : 'NÃO ❌');

      if (!isPasswordValid) {
        console.warn('❌ Senha incorreta para:', email);
        return res.status(401).json({
          error: 'Credenciais inválidas',
          message: 'Email ou senha incorretos',
        });
      }

      // Gerar token
      console.log('🎫 Gerando token JWT...');
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      console.log('✅ Token gerado:', token.substring(0, 30) + '...');

      const response = {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          lawFirmName: user.lawFirmName,
          oab: user.oab,
          oabState: user.oabState,
          address: user.address,
          phone: user.phone,
          logoUrl: user.logoUrl,
        },
      };

      console.log('✅ LOGIN BEM-SUCEDIDO');
      console.log('👤 Usuário:', user.name);
      console.log('='.repeat(60) + '\n');

      res.json(response);
    } catch (error: any) {
      console.error('\n❌ ERRO NO LOGIN:', error);
      console.error('Stack:', error.stack);
      console.log('='.repeat(60) + '\n');

      res.status(500).json({
        error: 'Erro ao fazer login',
        message: 'Erro interno do servidor',
      });
    }
  }

  // ============================================
  // OBTER DADOS DO USUÁRIO LOGADO
  // ============================================
  async me(req: Request, res: Response) {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
      }

      const decoded = jwt.verify(token, JWT_SECRET) as any;

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          lawFirmName: true,
          oab: true,
          oabState: true,
          address: true,
          phone: true,
          logoUrl: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      res.json(user);
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      res.status(401).json({ error: 'Token inválido' });
    }
  }

  // ============================================
  // ATUALIZAR PERFIL
  // ============================================
  async updateProfile(req: Request, res: Response) {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
      }

      const decoded = jwt.verify(token, JWT_SECRET) as any;

      const { name, lawFirmName, oab, oabState, address, phone } = req.body;

      const updatedUser = await prisma.user.update({
        where: { id: decoded.userId },
        data: {
          name: name || undefined,
          lawFirmName: lawFirmName || undefined,
          oab: oab || undefined,
          oabState: oabState || undefined,
          address: address || undefined,
          phone: phone || undefined,
        },
        select: {
          id: true,
          email: true,
          name: true,
          lawFirmName: true,
          oab: true,
          oabState: true,
          address: true,
          phone: true,
          logoUrl: true,
        },
      });

      res.json(updatedUser);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }
  }

  // ============================================
  // UPLOAD DE LOGO
  // ============================================
  async uploadLogo(req: Request, res: Response) {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
      }

      const decoded = jwt.verify(token, JWT_SECRET) as any;

      if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
      }

      const logoUrl = `/uploads/logos/${req.file.filename}`;

      await prisma.user.update({
        where: { id: decoded.userId },
        data: { logoUrl },
      });

      res.json({ logoUrl });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      res.status(500).json({ error: 'Erro ao fazer upload' });
    }
  }
}

export default new AuthController();