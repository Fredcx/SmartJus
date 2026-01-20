import React from 'react';
import { X, Copy, Check, FileText } from 'lucide-react';

interface EmentaModalProps {
  isOpen: boolean;
  onClose: () => void;
  ementa: string;
  court: string;
  number: string;
}

const EmentaModal: React.FC<EmentaModalProps> = ({
  isOpen,
  onClose,
  ementa,
  court,
  number,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ementa);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      alert('Erro ao copiar ementa');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-amber-50 to-yellow-50">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-lg">
              <FileText className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Ementa Oficial</h2>
              <p className="text-sm text-gray-600">{court} - {number}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                📋 Ementa
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors text-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 font-medium">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-amber-700" />
                    <span className="text-amber-700 font-medium">Copiar</span>
                  </>
                )}
              </button>
            </div>
            
            <div className="prose prose-sm max-w-none">
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed font-serif">
                {ementa}
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>💡 Dica:</strong> Esta ementa pode ser citada em petições e peças processuais. 
              Use o botão "Copiar" para facilitar a inclusão em seus documentos.
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmentaModal;