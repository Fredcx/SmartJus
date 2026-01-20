// @ts-nocheck
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ExternalLink, Save, Loader2, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import SaveJurisprudenceModal from "@/components/SaveJurisprudenceModal";
import EmentaModal from "@/components/EmentaModal";

interface JurisprudenceResult {
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

interface PaginationInfo {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const Jurisprudencia = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourt, setSelectedCourt] = useState("TODOS");
  const [results, setResults] = useState<JurisprudenceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [lastQuery, setLastQuery] = useState("");

  // Estados do modal de salvar
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [selectedJurisprudence, setSelectedJurisprudence] = useState<JurisprudenceResult | null>(null);

  // Estados do modal de ementa
  const [ementaModalOpen, setEmentaModalOpen] = useState(false);
  const [selectedEmenta, setSelectedEmenta] = useState<JurisprudenceResult | null>(null);

  const handleSearch = async (page: number = 1) => {
    if (!searchTerm.trim()) {
      toast({
        title: "Digite algo para buscar",
        description: "Informe uma tese jurídica ou palavras-chave",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setLastQuery(searchTerm);

    try {
      console.log('🔍 Buscando jurisprudência:', searchTerm, 'Página:', page);

      const response = await api.post('/jurisprudence/search', {
        query: searchTerm,
        court: selectedCourt,
        page: page,
        pageSize: 20, // Solicitar 20 resultados
      });

      console.log('✅ Resposta:', response.data);
      setResults(response.data.results || []);
      setPagination(response.data.pagination || pagination);

      toast({
        title: "Busca concluída",
        description: `Encontrados ${response.data.pagination?.total || 0} resultados (Página ${page} de ${response.data.pagination?.totalPages || 1})`,
      });
    } catch (error: any) {
      console.error('❌ Erro na busca:', error);
      toast({
        title: "Erro na busca",
        description: error.response?.data?.error || "Não foi possível realizar a busca",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleNextPage = () => {
    if (pagination.hasNextPage) {
      handleSearch(pagination.page + 1);
    }
  };

  const handlePreviousPage = () => {
    if (pagination.hasPreviousPage) {
      handleSearch(pagination.page - 1);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isSearching) {
      handleSearch(1);
    }
  };

  const handleSave = (result: JurisprudenceResult) => {
    setSelectedJurisprudence(result);
    setSaveModalOpen(true);
  };

  const handleViewEmenta = (result: JurisprudenceResult) => {
    setSelectedEmenta(result);
    setEmentaModalOpen(true);
  };

  const handleSaveSuccess = () => {
    toast({
      title: "Jurisprudência salva",
      description: "A jurisprudência foi adicionada ao processo com sucesso",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Busca de Jurisprudência</h1>
        <p className="text-muted-foreground">Consulte decisões oficiais do STJ, STF e outros tribunais</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Select value={selectedCourt} onValueChange={setSelectedCourt}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Selecione o tribunal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos os Tribunais</SelectItem>
                  <SelectItem value="STF">STF</SelectItem>
                  <SelectItem value="STJ">STJ</SelectItem>
                  <SelectItem value="TST">TST</SelectItem>
                  <SelectItem value="TRF">TRF</SelectItem>
                  <SelectItem value="TRT">TRT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Digite sua tese jurídica ou palavras-chave..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
                disabled={isSearching}
              />
              <Button onClick={() => handleSearch(1)} disabled={isSearching}>
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Buscar
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {results.length} de {pagination.total} resultado(s) - Página {pagination.page} de {pagination.totalPages}
            </p>
            <Badge variant="outline" className="text-xs">
              Tribunal: {selectedCourt}
            </Badge>
          </div>

          {results.map((result) => (
            <Card key={result.id || result.number} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          result.court === 'STF' ? 'bg-blue-100 text-blue-800' :
                            result.court === 'STJ' ? 'bg-green-100 text-green-800' :
                              result.court === 'TST' ? 'bg-orange-100 text-orange-800' :
                                'bg-purple-100 text-purple-800'
                        }
                      >
                        {result.court}
                      </Badge>
                      <CardTitle className="text-base">
                        {result.number}
                      </CardTitle>
                    </div>
                    <p className="text-sm text-muted-foreground">{result.date}</p>
                  </div>
                  <Badge variant="secondary">{result.relevance}% relevante</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Resumo:</p>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {result.summary}
                  </p>
                </div>

                <div className="flex gap-2 pt-2 flex-wrap">
                  <Button variant="outline" size="sm" className="flex-1 min-w-[150px]" asChild>
                    <a href={result.link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Ver Decisão Completa
                    </a>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 min-w-[150px] bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                    onClick={() => handleViewEmenta(result)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Ver Ementa
                  </Button>

                  <Button
                    size="sm"
                    className="flex-1 min-w-[150px]"
                    onClick={() => handleSave(result)}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Salvar no Processo
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={!pagination.hasPreviousPage || isSearching}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Anterior
                </Button>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Página {pagination.page} de {pagination.totalPages}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!pagination.hasNextPage || isSearching}
                >
                  Próxima
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {results.length === 0 && !isSearching && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">
              Digite uma tese jurídica para iniciar a busca
            </p>
            <p className="text-sm text-muted-foreground">
              Exemplo: "responsabilidade civil danos morais"
            </p>
            <div className="mt-4 text-xs text-muted-foreground space-y-1">
              <p>✅ Busca em STF, STJ, TST e outros tribunais</p>
              <p>✅ Jurisprudências com ementas oficiais</p>
              <p>✅ Resultados com paginação</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isSearching && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">
              Buscando em {selectedCourt === 'TODOS' ? 'todos os tribunais' : selectedCourt}...
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Isso pode levar alguns segundos
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal de Salvar */}
      {selectedJurisprudence && (
        <SaveJurisprudenceModal
          isOpen={saveModalOpen}
          onClose={() => setSaveModalOpen(false)}
          jurisprudence={selectedJurisprudence}
          onSuccess={handleSaveSuccess}
        />
      )}

      {/* Modal de Ementa */}
      {selectedEmenta && (
        <EmentaModal
          isOpen={ementaModalOpen}
          onClose={() => setEmentaModalOpen(false)}
          ementa={selectedEmenta.ementa}
          court={selectedEmenta.court}
          number={selectedEmenta.number}
        />
      )}
    </div>
  );
};

export default Jurisprudencia;