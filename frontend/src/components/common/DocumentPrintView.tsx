import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface DocumentPrintViewProps {
  content: string;
  title: string;
  user: {
    name: string;
    lawFirmName?: string;
    logoUrl?: string;
    oab?: string;
    oabState?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
}

export const DocumentPrintView = ({ content, title, user }: DocumentPrintViewProps) => {
  const handlePrint = () => {
    window.print();
  };

  // Simple Markdown Parser for clear legal document rendering
  const parseMarkdown = (text: string) => {
    if (!text) return '';

    let html = text
      // Protect headers first
      .replace(/^# (.*$)/gm, '<h1 class="text-xl font-bold uppercase text-center mt-6 mb-4">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-lg font-bold mt-4 mb-2 uppercase">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-base font-bold mt-3 mb-1">$1</h3>')
      .replace(/^#### (.*$)/gm, '<h4 class="text-sm font-bold mt-2 mb-1 underline">$1</h4>')

      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

      // Lists (Simple bullet points)
      .replace(/^\- (.*$)/gm, '<li class="ml-4 pl-1">$1</li>')

      // Paragraphs: Split by double newline, wrap in <p> if not already an HTML tag
      .split(/\n\n+/).map(para => {
        const trimmed = para.trim();
        if (!trimmed) return '';
        if (trimmed.startsWith('<h') || trimmed.startsWith('<li')) return trimmed;
        return `<p class="mb-3 text-justify leading-relaxed indent-8">${trimmed.replace(/\n/g, '<br/>')}</p>`;
      }).join('');

    return html;
  };

  const fullLogoUrl = user.logoUrl
    ? (user.logoUrl.startsWith('http') ? user.logoUrl : `http://localhost:3002${user.logoUrl}`)
    : null;

  return (
    <div className="flex flex-col items-center space-y-4 py-8 bg-slate-100 dark:bg-slate-900 rounded-lg w-full">
      {/* Toolbar - Hidden when printing */}
      <div className="w-full max-w-[210mm] flex justify-between items-center print:hidden px-4">
        <div className="text-sm text-muted-foreground">
          Visualização de Impressão (A4)
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePrint} className="gap-2 shadow-sm">
            <Printer className="w-4 h-4" />
            Imprimir / Salvar PDF
          </Button>
        </div>
      </div>

      {/* A4 Page Container */}
      <div
        id="print-area"
        className="bg-white text-black shadow-2xl print:shadow-none print:w-full print:h-auto print:m-0 print:p-0 relative"
        style={{
          width: '210mm',
          minHeight: '297mm', // A4 Height
          padding: '25mm 20mm', // Standard Margins (Top/Bottom 2.5cm, Sides 2cm)
          boxSizing: 'border-box'
        }}
      >
        {/* Header Section */}
        <header className="flex flex-col items-center border-b-2 border-black pb-4 mb-8">
          {fullLogoUrl && (
            <img
              src={fullLogoUrl}
              alt="Logo do Escritório"
              className="h-20 object-contain mb-2"
            />
          )}

          <h1 className="text-2xl font-bold uppercase tracking-wide text-center">
            {user.lawFirmName || `${user.name} Advocacia`}
          </h1>

          <div className="text-xs text-center mt-2 space-y-0.5 text-gray-600 font-serif">
            <p>{user.address || 'Endereço Profissional'}</p>
            <p>
              {user.phone && `Tel: ${user.phone}`}
              {user.phone && user.email && ' • '}
              {user.email && `Email: ${user.email}`}
            </p>
            <p>OAB/{user.oabState || 'UF'} {user.oab || '00000'}</p>
          </div>
        </header>

        {/* Content Body */}
        <main
          className="font-serif text-[12pt] leading-relaxed text-justify"
          dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
        />

        {/* Footer Section */}
        <footer className="fixed bottom-0 left-0 right-0 hidden print:block text-center text-[8pt] text-gray-400 p-2 border-t">
          <p>Documento gerado digitalmente • {new Date().toLocaleDateString()}</p>
        </footer>
      </div>

      {/* Global Print Styles Injection */}
      <style>{`
                @media print {
                    /* Oculta tudo por padrão */
                    body * {
                        visibility: hidden;
                    }

                    /* Exibe apenas o container de impressão e seus filhos */
                    #print-area, #print-area * {
                        visibility: visible;
                    }

                    /* Posiciona o container de impressão no topo da página */
                    #print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 210mm; /* Força largura A4 */
                        margin: 0;
                        padding: 0;
                        background: white;
                    }

                    /* Garante que não haja margens/paddings extras do navegador */
                    @page {
                        size: A4;
                        margin: 0; /* Margens são controladas pelo padding do container */
                    }

                    /* Remove bg do resto da página para economizar tinta/ficar limpo */
                    body {
                        background: white;
                    }
                }
            `}</style>
    </div>
  );
};
