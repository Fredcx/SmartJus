import { useState, useEffect } from 'react';
import api from '@/lib/api';

export const useUrgentDeadlines = () => {
  const [urgentCount, setUrgentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadUrgentDeadlines = async () => {
    try {
      const response = await api.get('/deadlines/upcoming?days=3');
      const urgent = response.data.results || [];
      setUrgentCount(urgent.filter(d => d.status === 'pending').length);
    } catch (error) {
      console.error('Erro ao carregar prazos urgentes:', error);
      setUrgentCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUrgentDeadlines();

    // Atualizar a cada 2 minutos
    const interval = setInterval(() => {
      console.log('🔄 Atualizando contador de prazos urgentes...');
      loadUrgentDeadlines();
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return { urgentCount, loading, refresh: loadUrgentDeadlines };
};