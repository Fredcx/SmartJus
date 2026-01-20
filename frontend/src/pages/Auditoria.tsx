import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { mockCases } from "@/lib/mockData";
import { useState } from "react";

const Auditoria = () => {
  const { caseId, documentId } = useParams();
  const [currentPage, setCurrentPage] = useState(1);
  
  const case_ = mockCases.find((c) => c.id === caseId);
  const document = case_?.documents.find((d) => d.id === documentId);

  if (!case_ || !document) {
    return <div>Documento não encontrado</div>;
  }

  // Mock PDF pages
  const totalPages = 5;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Modo Auditoria</h1>
        <p className="text-muted-foreground">{document.name}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 h-[calc(100vh-12rem)]">
        {/* PDF Viewer (Mock) */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-base">Documento Original</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="flex-1 bg-muted rounded-lg flex items-center justify-center mb-4">
              <p className="text-muted-foreground">
                [Visualizador PDF - Página {currentPage} de {totalPages}]
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              
              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Panel */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-base">Resumo Técnico</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-2">Página {currentPage}:</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {document.summary}
                </p>
              </div>

              <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                <p className="text-sm font-medium mb-2 text-primary">Pontos Relevantes:</p>
                <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                  <li>Fundamentação legal citada</li>
                  <li>Jurisprudência aplicável</li>
                  <li>Tese jurídica principal</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-2">Análise Completa:</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Este documento apresenta os elementos essenciais para a configuração do pedido, 
                  incluindo fundamentação legal robusta e jurisprudência consolidada do STJ e STF.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auditoria;
