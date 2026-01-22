import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  UserPlus, Mail, Lock, User, Building2,
  Scale, Phone, MapPin, Loader2, ArrowRight
} from 'lucide-react';
import api from '@/lib/api';

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    lawFirmName: '',
    oab: '',
    oabState: '',
    phone: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mínimo de 6 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await api.post('/auth/register', {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        lawFirmName: formData.lawFirmName.trim(),
        oab: formData.oab.trim(),
        oabState: formData.oabState.trim().toUpperCase(),
        phone: formData.phone.trim()
      });

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      toast({
        title: 'Bem-vindo ao SmartJust!',
        description: 'Sua conta foi criada com sucesso.',
      });

      navigate('/dashboard');

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao criar conta. Tente novamente.';
      toast({
        title: 'Erro no registro',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (field === 'oabState') value = value.slice(0, 2).toUpperCase();

    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex flex-col justify-between bg-slate-900 p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-2xl font-bold">
            <Scale className="w-8 h-8 text-blue-400" />
            <span>SmartJus</span>
          </div>
          <p className="mt-4 text-slate-300 text-lg max-w-md">
            A plataforma completa para gestão do seu escritório de advocacia.
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          <blockquote className="text-xl font-light italic text-slate-200">
            "A justiça é a constante e perpétua vontade de dar a cada um o que é seu."
          </blockquote>
          <p className="text-sm text-slate-400">— Ulpiano</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex items-center justify-center p-6 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-xl space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Crie sua conta</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Comece a transformar a gestão do seu escritório hoje.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Account Info Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Dados da Conta</h3>

                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      placeholder="Dr. João Silva"
                      className={`pl-10 ${errors.name ? 'border-red-500' : ''}`}
                      value={formData.name}
                      onChange={handleChange('name')}
                    />
                  </div>
                  {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Corporativo</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="nome@advocacia.com"
                      className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                      value={formData.email}
                      onChange={handleChange('email')}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input id="password" type="password" placeholder="******" className="pl-10" value={formData.password} onChange={handleChange('password')} />
                    </div>
                    {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input id="confirmPassword" type="password" placeholder="******" className="pl-10" value={formData.confirmPassword} onChange={handleChange('confirmPassword')} />
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
                  </div>
                </div>
              </div>

              {/* Professional Info Section */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Dados Profissionais (Opcional)</h3>

                <div className="space-y-2">
                  <Label htmlFor="lawFirmName">Nome do Escritório</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input id="lawFirmName" placeholder="Silva & Associados" className="pl-10" value={formData.lawFirmName} onChange={handleChange('lawFirmName')} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="oab">Nº OAB</Label>
                    <div className="relative">
                      <Scale className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input id="oab" placeholder="123456" className="pl-10" value={formData.oab} onChange={handleChange('oab')} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="oabState">UF</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input id="oabState" placeholder="SP" className="pl-10" maxLength={2} value={formData.oabState} onChange={handleChange('oabState')} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone / WhatsApp</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input id="phone" placeholder="(11) 99999-9999" className="pl-10" value={formData.phone} onChange={handleChange('phone')} />
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 h-11" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                <>
                  Criar Conta Profissional
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Já possui uma conta? </span>
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">
              Fazer Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;