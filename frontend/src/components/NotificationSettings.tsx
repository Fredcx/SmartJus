// @ts-nocheck
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Check, X } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useToast } from '@/hooks/use-toast';

const NotificationSettings = () => {
  const { permission, isSupported, requestPermission, checkUrgentDeadlines, cleanOldNotifications } = useNotifications();
  const { toast } = useToast();

  useEffect(() => {
    cleanOldNotifications();

    if (permission === 'granted') {
      checkUrgentDeadlines();

      const interval = setInterval(() => {
        console.log('🔔 Verificando prazos urgentes para notificações...');
        checkUrgentDeadlines();
      }, 2 * 60 * 1000); // 2 minutos

      return () => clearInterval(interval);
    }
  }, [permission]);

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    
    if (granted) {
      toast({
        title: 'Notificações ativadas!',
        description: 'Você receberá alertas sobre prazos urgentes',
      });
      checkUrgentDeadlines();
    } else {
      toast({
        title: 'Permissão negada',
        description: 'Você pode ativar nas configurações do navegador',
        variant: 'destructive',
      });
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notificações não suportadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Seu navegador não suporta notificações push
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificações de Prazos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Status das Notificações</p>
            <p className="text-sm text-muted-foreground">
              Receba alertas sobre prazos urgentes
            </p>
          </div>
          {permission === 'granted' ? (
            <Badge variant="default" className="bg-green-600">
              <Check className="h-3 w-3 mr-1" />
              Ativado
            </Badge>
          ) : permission === 'denied' ? (
            <Badge variant="destructive">
              <X className="h-3 w-3 mr-1" />
              Bloqueado
            </Badge>
          ) : (
            <Badge variant="secondary">
              Desativado
            </Badge>
          )}
        </div>

        {permission === 'default' && (
          <Button onClick={handleRequestPermission} className="w-full">
            <Bell className="mr-2 h-4 w-4" />
            Ativar Notificações
          </Button>
        )}

        {permission === 'denied' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">
              Notificações foram bloqueadas. Para ativar, acesse as configurações do navegador e permita notificações para este site.
            </p>
          </div>
        )}

        {permission === 'granted' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800 space-y-1">
              <p>✅ Notificações ativadas com sucesso!</p>
              <p className="text-xs">• Você receberá alertas para prazos HOJE ou AMANHÃ</p>
              <p className="text-xs">• Verificação automática a cada 2 minutos</p>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;