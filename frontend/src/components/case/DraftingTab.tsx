import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, FileText, Copy, Download, Sparkles, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { DocumentPrintView } from "@/components/common/DocumentPrintView";

interface DraftingTabProps {
    caseData: any;
}

const DOCUMENT_TYPES = [
    { value: 'peticao_inicial', label: 'Petição Inicial', description: 'Primeira peça processual que inicia a ação' },
    { value: 'contestacao', label: 'Contestação', description: 'Resposta do réu à petição inicial' },
    { value: 'replica', label: 'Réplica', description: 'Resposta do autor à contestação' },
    { value: 'memorial', label: 'Memorial', description: 'Peça de sustentação oral ou recursal' },
    { value: 'recurso_apelacao', label: 'Recurso de Apelação', description: 'Recurso contra sentença' },
    { value: 'recurso_agravo', label: 'Agravo de Instrumento', description: 'Recurso contra decisão interlocutória' },
    { value: 'embargos_declaracao', label: 'Embargos de Declaração', description: 'Recurso para esclarecer obscuridade ou omissão' },
    { value: 'peticao_intermediaria', label: 'Petição Intermediária', description: 'Petição durante o processo' },
];

export default function DraftingTab({ caseData }: DraftingTabProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [generatedContent, setGeneratedContent] = useState('');
    const [selectedType, setSelectedType] = useState('peticao_inicial');
    const [additionalInfo, setAdditionalInfo] = useState('');
    const [generatedDocs, setGeneratedDocs] = useState<any[]>([]);

    // Evidence Logic
    const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>([]);
    const evidenceDocs = (caseData.documents || []).filter((d: any) => (d.classification as any)?.category === 'evidence');

    const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                // Try to get fresh data from API first
                const res = await api.get('/auth/me');
                setUser(res.data);
                // Also update local storage to keep it fresh
                localStorage.setItem('user', JSON.stringify(res.data));
            } catch (error) {
                // Fallback to local storage
                console.warn('Failed to fetch user profile, using local storage');
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    setUser(JSON.parse(userStr));
                }
            }
        };
        fetchUser();
    }, []);

    useEffect(() => {
        loadGeneratedDocuments();
    }, [caseData.id]);

    const loadGeneratedDocuments = async () => {
        try {
            const res = await api.get(`/documents/generated/case/${caseData.id}`);
            setGeneratedDocs(res.data || []);
        } catch (error) {
            console.error('Erro ao carregar documentos:', error);
        }
    };

    const handleGenerate = async () => {
        setLoading(true);
        try {
            let endpoint = '';

            // Mapear tipo para endpoint correto
            if (selectedType === 'peticao_inicial') {
                endpoint = `/documents/generate/peticao/${caseData.id}`;
            } else if (selectedType === 'memorial') {
                endpoint = `/documents/generate/memorial/${caseData.id}`;
            } else if (selectedType === 'contestacao') {
                endpoint = `/documents/generate/contestacao/${caseData.id}`;
            } else {
                // Para outros tipos, usar endpoint genérico
                endpoint = `/documents/generate/generic/${caseData.id}`;
            }

            console.log('📤 Gerando documento:', selectedType, endpoint);

            const res = await api.post(endpoint, {
                saveToDatabase: true,
                documentType: selectedType,
                additionalInfo: additionalInfo || undefined,
                evidenceIds: selectedEvidenceIds // Pass selected evidence
            });

            setGeneratedContent(res.data.content || '');

            toast({
                title: "Documento Gerado",
                description: res.data.message || "O documento foi criado com base nos dados do caso."
            });

            // Reload history
            loadGeneratedDocuments();
            setAdditionalInfo(''); // Limpar campo
        } catch (error: any) {
            console.error(error);
            const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Falha ao gerar o documento.';
            toast({
                title: "Erro na geração",
                description: errorMessage,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedContent);
        toast({ title: "Copiado", description: "Texto copiado para a área de transferência." });
    };

    const downloadAsText = () => {
        const blob = new Blob([generatedContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedType}_${caseData.title}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: "Download iniciado", description: "O arquivo está sendo baixado." });
    };

    const loadPreviousDocument = async (docId: string) => {
        try {
            const res = await api.get(`/documents/generated/${docId}`);
            setGeneratedContent(res.data.content || '');
            toast({ title: "Documento carregado", description: "Documento anterior carregado no editor." });
        } catch (error) {
            toast({ title: "Erro", description: "Não foi possível carregar o documento.", variant: "destructive" });
        }
    };

    const selectedTypeInfo = DOCUMENT_TYPES.find(t => t.value === selectedType);

    return (
        <div className="space-y-6">
            {/* Seleção de Tipo de Documento */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        Geração de Peças Processuais com IA
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="docType">Tipo de Peça</Label>
                            <Select value={selectedType} onValueChange={setSelectedType}>
                                <SelectTrigger id="docType">
                                    <SelectValue placeholder="Selecione o tipo de peça" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DOCUMENT_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{type.label}</span>
                                                <span className="text-xs text-muted-foreground">{type.description}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedTypeInfo && (
                                <p className="text-xs text-muted-foreground">
                                    {selectedTypeInfo.description}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="additionalInfo">Informações Adicionais (Opcional)</Label>
                            <Textarea
                                id="additionalInfo"
                                placeholder="Ex: Incluir argumento sobre prescrição, mencionar jurisprudência específica, etc."
                                value={additionalInfo}
                                onChange={(e) => setAdditionalInfo(e.target.value)}
                                rows={3}
                                className="resize-none"
                            />
                            <p className="text-xs text-muted-foreground">
                                Adicione instruções específicas para a IA considerar na geração
                            </p>
                        </div>
                    </div>

                    {/* SEÇÃO DE SELEÇÃO DE PROVAS */}
                    {evidenceDocs.length > 0 && (
                        <div className="space-y-3 pt-2 border-t">
                            <Label className="text-base font-medium flex items-center gap-2">
                                <FileText className="w-4 h-4 text-amber-600" />
                                Selecionar Provas para Citar
                            </Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {evidenceDocs.map((doc: any) => (
                                    <div key={doc.id} className="flex items-start space-x-2 border p-3 rounded-md hover:bg-slate-50">
                                        <input
                                            type="checkbox"
                                            id={`evidence-${doc.id}`}
                                            className="mt-1"
                                            checked={selectedEvidenceIds.includes(doc.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedEvidenceIds([...selectedEvidenceIds, doc.id]);
                                                } else {
                                                    setSelectedEvidenceIds(selectedEvidenceIds.filter(id => id !== doc.id));
                                                }
                                            }}
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                            <label
                                                htmlFor={`evidence-${doc.id}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                {doc.name}
                                            </label>
                                            <p className="text-xs text-muted-foreground">
                                                {(doc.individualSummary as any)?.summary
                                                    ? ((doc.individualSummary as any).summary.substring(0, 60) + '...')
                                                    : 'Sem resumo disponível'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <Button
                        onClick={handleGenerate}
                        disabled={loading}
                        size="lg"
                        className="w-full"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Gerando {selectedTypeInfo?.label}...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Gerar {selectedTypeInfo?.label} com IA
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Editor de Conteúdo */}
            {generatedContent && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Documento Gerado
                            </CardTitle>
                            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                                <Button
                                    variant={viewMode === 'edit' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('edit')}
                                    className="text-xs h-7"
                                >
                                    Editar
                                </Button>
                                <Button
                                    variant={viewMode === 'preview' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('preview')}
                                    className="text-xs h-7"
                                >
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    Visualizar Impressão (Oficial)
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {viewMode === 'edit' ? (
                            <>
                                <div className="flex justify-end gap-2 mb-2">
                                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copiar
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={downloadAsText}>
                                        <Download className="w-4 h-4 mr-2" />
                                        Baixar TXT
                                    </Button>
                                </div>
                                <Textarea
                                    value={generatedContent}
                                    onChange={(e) => setGeneratedContent(e.target.value)}
                                    className="min-h-[500px] font-mono text-sm leading-relaxed"
                                    placeholder="O conteúdo gerado aparecerá aqui..."
                                />
                                <p className="text-xs text-muted-foreground mt-2">
                                    Edite o texto acima se necessário. Mude para "Visualizar Impressão" para ver com cabeçalho e logo.
                                </p>
                            </>
                        ) : (
                            <DocumentPrintView
                                content={generatedContent}
                                title={`${selectedTypeInfo?.label || 'Documento'} - ${caseData.title}`}
                                user={user || { name: 'Advogado' }}
                            />
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Histórico de Documentos Gerados */}
            {generatedDocs.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <History className="w-5 h-5" />
                            Documentos Gerados Anteriormente ({generatedDocs.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[200px]">
                            <div className="space-y-2">
                                {generatedDocs.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-muted-foreground" />
                                                <span className="font-medium text-sm">{doc.title}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="secondary" className="text-xs">
                                                    {DOCUMENT_TYPES.find(t => t.value === doc.type)?.label || doc.type}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(doc.createdAt).toLocaleString('pt-BR')}
                                                </span>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => loadPreviousDocument(doc.id)}
                                        >
                                            Carregar
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
