import React, { useState, useEffect } from 'react';
import { X, Save, Folder } from 'lucide-react';
import api from '@/lib/api';

interface Case {
  id: string;
  title: string;
  caseNumber: string | null;
  clientName: string;
  court: string | null;
  status: string;
  updatedAt?: string;
}

interface Jurisprudence {
  id: string;
  court: string;
  number: string;
  date: string;
  summary: string;
  understanding: string;
  ementa: string;
  link: string;
  relevance: number;
}

interface SaveJurisprudenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  jurisprudence: Jurisprudence;
  onSuccess: () => void;
}

const SaveJurisprudenceModal: React.FC<SaveJurisprudenceModalProps> = ({
  isOpen,
  onClose,
  jurisprudence,
  onSuccess,
}) => {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCases, setLoadingCases] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadCases();
    }
  }, [isOpen]);

  const loadCases = async () => {
    try {
      setLoadingCases(true);
      const response = await api.get('/cases');
      // Filter out completed/archived cases unless necessary
      const activeCases = response.data.filter((c: Case) =>
        c.status === 'active' || c.status === 'pending'
      ).sort((a: Case, b: Case) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());

      setCases(activeCases);
    } catch (error) {
      console.error('Erro ao carregar processos:', error);
    } finally {
      setLoadingCases(false);
    }
  };

  const handleSave = async () => {
    if (!selectedCaseId) {
      alert('Por favor, selecione um processo');
      return;
    }

    try {
      setLoading(true);

      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      await api.post('/jurisprudence/save', {
        caseId: selectedCaseId,
        jurisprudence,
        notes: notes.trim() || null,
        tags: tagsArray,
      });

      alert('Jurisprudência salva com sucesso!');
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      const message = error.response?.data?.message || 'Erro ao salvar jurisprudência';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedCaseId('');
    setNotes('');
    setTags('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Save className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">Salvar Jurisprudência</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* INFO DA JURISPRUDÊNCIA */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-start gap-2 mb-2">
              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                {jurisprudence.court}
              </span>
              <span className="text-xs text-gray-600">{jurisprudence.date}</span>
            </div>
            <p className="text-sm text-gray-700 line-clamp-3">{jurisprudence.summary}</p>
          </div>

          {/* SELECIONAR PROCESSO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Folder className="w-4 h-4 inline mr-1" />
              Selecionar Processo *
            </label>
            {loadingCases ? (
              <div className="text-center py-4 text-gray-500">Carregando processos...</div>
            ) : cases.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                Nenhum processo encontrado. Crie um processo primeiro.
              </div>
            ) : (
              <select
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione um processo...</option>
                {cases.map((case_) => (
                  <option key={case_.id} value={case_.id}>
                    {case_.title} {case_.caseNumber ? `- ${case_.caseNumber}` : ''} ({case_.clientName})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* NOTAS */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📝 Notas Pessoais (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione observações sobre esta jurisprudência..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* TAGS */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🏷️ Tags (opcional)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="importante, trabalhista, danos morais"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Separe as tags por vírgula. Exemplo: "importante, favorável, STF"
            </p>
          </div>
        </div>

        {/* BOTÕES */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !selectedCaseId}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveJurisprudenceModal;