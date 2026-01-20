import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Building2, Upload, Save } from 'lucide-react';
import api from '@/lib/api';

const Settings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    lawFirmName: '',
    oab: '',
    oabState: '',
    address: '',
    phone: '',
    logoUrl: ''
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const response = await api.get('/auth/me');
      setUserData(response.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.patch('/auth/profile', userData);

      // Update localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...currentUser, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram salvas com sucesso'
      });
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível atualizar o perfil',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('logo', file);

    try {
      const response = await api.post('/auth/upload-logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const newLogoUrl = response.data.logoUrl;
      const updatedUser = { ...userData, logoUrl: newLogoUrl };
      setUserData(updatedUser);

      // Update localStorage synchronously
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...currentUser, logoUrl: newLogoUrl }));

      toast({
        title: 'Logo enviada',
        description: 'Sua logo foi salva com sucesso'
      });
    } catch (error) {
      toast({
        title: 'Erro ao enviar logo',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Configure os dados do seu escritório</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Dados do Escritório
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Logo */}
          <div className="space-y-2">
            <Label>Logo do Escritório</Label>
            <div className="flex items-center gap-4">
              {userData.logoUrl && (
                <img
                  src={userData.logoUrl}
                  alt="Logo"
                  className="w-20 h-20 object-contain border rounded"
                />
              )}
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG ou SVG (máx. 2MB)
                </p>
              </div>
            </div>
          </div>

          {/* Nome */}
          <div className="space-y-2">
            <Label>Nome do Advogado</Label>
            <Input
              value={userData.name}
              onChange={(e) => setUserData({ ...userData, name: e.target.value })}
            />
          </div>

          {/* Nome do Escritório */}
          <div className="space-y-2">
            <Label>Nome do Escritório</Label>
            <Input
              value={userData.lawFirmName}
              onChange={(e) => setUserData({ ...userData, lawFirmName: e.target.value })}
              placeholder="Exemplo: Silva & Associados Advocacia"
            />
          </div>

          {/* OAB */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Número OAB</Label>
              <Input
                value={userData.oab}
                onChange={(e) => setUserData({ ...userData, oab: e.target.value })}
                placeholder="123456"
              />
            </div>
            <div className="space-y-2">
              <Label>UF OAB</Label>
              <Input
                value={userData.oabState}
                onChange={(e) => setUserData({ ...userData, oabState: e.target.value })}
                placeholder="SP"
                maxLength={2}
              />
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-2">
            <Label>Endereço</Label>
            <Input
              value={userData.address}
              onChange={(e) => setUserData({ ...userData, address: e.target.value })}
              placeholder="Rua, número, bairro, cidade - UF"
            />
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input
              value={userData.phone}
              onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
              placeholder="(11) 98765-4321"
            />
          </div>

          {/* Botão Salvar */}
          <Button onClick={handleSave} disabled={loading} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;