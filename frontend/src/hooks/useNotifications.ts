// @ts-nocheck
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Verificar se o navegador suporta notificações
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  // Solicitar permissão
  const requestPermission = async () => {
    if (!isSupported) {
      console.warn('Notificações não são suportadas neste navegador');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Erro ao solicitar permissão de notificação:', error);
      return false;
    }
  };

  // Enviar notificação
  const notify = (title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') {
      console.warn('Notificações não estão habilitadas');
      return null;
    }

    try {
      const notification = new Notification(title, {
        icon: '/logo.png',
        badge: '/logo.png',
        requireInteraction: true,
        ...options,
      });

      // Vibração para dispositivos móveis
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }

      // Tocar som (opcional)
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => console.log('Som desabilitado'));
      } catch (err) {
        // Ignorar erro de som
      }

      return notification;
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      return null;
    }
  };

  // Verificar prazos urgentes e notificar
  const checkUrgentDeadlines = async () => {
    if (permission !== 'granted') return;

    try {
      const response = await api.get('/deadlines/upcoming?days=1');
      const todayDeadlines = response.data.results || [];

      if (todayDeadlines.length > 0) {
        const notifiedIds = JSON.parse(localStorage.getItem('notifiedDeadlines') || '[]');
        const newDeadlines = todayDeadlines.filter(d => !notifiedIds.includes(d.id) && d.status === 'pending');

        if (newDeadlines.length > 0) {
          const deadline = newDeadlines[0];
          const daysUntil = Math.ceil((new Date(deadline.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          
          let body = '';
          let urgency = '';
          
          if (daysUntil === 0) {
            body = `⚠️ HOJE às ${new Date(deadline.dueDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${deadline.case.title}`;
            urgency = '🔴 URGENTE';
          } else if (daysUntil === 1) {
            body = `📅 AMANHÃ às ${new Date(deadline.dueDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${deadline.case.title}`;
            urgency = '🟠 ATENÇÃO';
          }

          const notification = notify(`${urgency} ${deadline.title}`, {
            body,
            tag: deadline.id,
          });

          if (notification) {
            notification.onclick = () => {
              window.focus();
              window.location.href = `/cases/${deadline.case.id}`;
              notification.close();
            };
          }

          const updated = [...notifiedIds, deadline.id];
          localStorage.setItem('notifiedDeadlines', JSON.stringify(updated));
        }
      }
    } catch (error) {
      console.error('Erro ao verificar prazos urgentes:', error);
    }
  };

  const cleanOldNotifications = () => {
    try {
      const lastClean = localStorage.getItem('lastNotificationClean');
      const now = new Date();
      
      if (!lastClean || (now.getTime() - new Date(lastClean).getTime()) > 24 * 60 * 60 * 1000) {
        localStorage.removeItem('notifiedDeadlines');
        localStorage.setItem('lastNotificationClean', now.toISOString());
        console.log('🧹 Limpeza de notificações antigas realizada');
      }
    } catch (error) {
      console.error('Erro ao limpar notificações antigas:', error);
    }
  };

  return {
    permission,
    isSupported,
    requestPermission,
    notify,
    checkUrgentDeadlines,
    cleanOldNotifications,
  };
};