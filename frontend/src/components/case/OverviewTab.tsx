
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarIcon, AlertTriangle, Target, Bookmark, Loader2, RefreshCw, CheckCircle2, FileText, Download, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Quote } from "lucide-react";

interface OverviewTabProps {
    caseData: any;
    onCaseUpdate?: () => void;
}

export default function OverviewTab({ caseData, onCaseUpdate }: OverviewTabProps) {
    const { toast } = useToast();
    const [generating, setGenerating] = useState(false);
    const [selectedSource, setSelectedSource] = useState<{ text: string, ref: string } | null>(null);
    const summary = caseData.caseSummary;

    const handleGenerateSummary = async () => {
        setGenerating(true);
        try {
            const response = await api.post(`/cases/${caseData.id}/summary`);
            toast({
                title: "Resumo gerado com sucesso!",
                description: "A análise processual foi concluída.",
            });
            if (onCaseUpdate) onCaseUpdate();
        } catch (error: any) {
            console.error("Erro ao gerar resumo:", error);
            toast({
                title: "Erro ao gerar resumo",
                description: error.response?.data?.message || "Tente novamente mais tarde",
                variant: "destructive",
            });
        } finally {
            setGenerating(false);
        }
    };

    const handleDownload = (url: string, filename: string) => {
        const link = document.createElement('a');
        link.href = `http://localhost:3002${url}`;
        link.download = filename;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!summary) {
        return (
            <div className="space-y-6">
                {/* DOCUMENTO ORIGINAL - Sempre visível */}
                {caseData.originalDocumentUrl && (
                    <Card className="border-2 border-yellow-200 bg-yellow-50/30">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                Documento Original do Upload
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {caseData.documentAnalysis && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-white rounded-lg">
                                            <p className="text-xs text-muted-foreground mb-1">Tipo de Documento</p>
                                            <p className="font-semibold">
                                                {caseData.documentAnalysis.type?.replace('_', ' ').toUpperCase()}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-white rounded-lg">
                                            <p className="text-xs text-muted-foreground mb-1">Confiança da Análise</p>
                                            <p className="font-semibold">
                                                {caseData.documentAnalysis.confidence}%
                                            </p>
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full"
                                        onClick={() => handleDownload(caseData.originalDocumentUrl, 'documento-original.pdf')}
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Baixar Documento Original
                                    </Button>
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardContent className="py-10 text-center">
                        <div className="max-w-md mx-auto space-y-4">
                            <div className="p-4 bg-muted rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                                <Target className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-2">Resumo Processual Não Disponível</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Gere um resumo detalhado do caso com links para as fontes originais.
                                </p>
                            </div>
                            <Button onClick={handleGenerateSummary} disabled={generating} size="lg">
                                {generating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Gerando resumo detalhado...
                                    </>
                                ) : (
                                    <>
                                        <FileText className="mr-2 h-4 w-4" />
                                        Gerar Resumo Processual
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Resumo Processual Gerado</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleGenerateSummary} disabled={generating}>
                    {generating ? (
                        <> <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Regenerando... </>
                    ) : (
                        <> <RefreshCw className="mr-2 h-3 w-3" /> Atualizar Resumo </>
                    )}
                </Button>
            </div>

            {/* CONTEXTO GERAL */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Bookmark className="w-5 h-5 text-primary" />
                        Visão Geral do Caso
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="leading-relaxed text-slate-700">{summary.contexto_geral}</p>
                </CardContent>
            </Card>


            {/* DADOS EXTRAÍDOS AUTOMATICAMENTE */}
            {caseData.documentAnalysis?.extractedData && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Target className="w-5 h-5 text-primary" />
                            Dados Processuais Extraídos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            {caseData.documentAnalysis.extractedData.caseNumber && (
                                <div className="space-y-1">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Número do Processo</span>
                                    <p className="font-mono text-sm font-medium">{caseData.documentAnalysis.extractedData.caseNumber}</p>
                                </div>
                            )}

                            {caseData.documentAnalysis.extractedData.court && (
                                <div className="space-y-1">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tribunal / Vara</span>
                                    <p className="text-sm font-medium">{caseData.documentAnalysis.extractedData.court}</p>
                                </div>
                            )}

                            {caseData.documentAnalysis.extractedData.caseType && (
                                <div className="space-y-1">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tipo de Ação</span>
                                    <p className="text-sm font-medium">{caseData.documentAnalysis.extractedData.caseType}</p>
                                </div>
                            )}

                            {caseData.documentAnalysis.extractedData.subject && (
                                <div className="space-y-1">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Assunto</span>
                                    <p className="text-sm font-medium">{caseData.documentAnalysis.extractedData.subject}</p>
                                </div>
                            )}

                            {caseData.documentAnalysis.extractedData.parties?.plaintiff && (
                                <div className="space-y-1 col-span-2 lg:col-span-2">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Autor / Requerente</span>
                                    <p className="text-sm font-medium">{caseData.documentAnalysis.extractedData.parties.plaintiff}</p>
                                </div>
                            )}

                            {caseData.documentAnalysis.extractedData.parties?.defendant && (
                                <div className="space-y-1 col-span-2 lg:col-span-2">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Réu / Requerido</span>
                                    <p className="text-sm font-medium">{caseData.documentAnalysis.extractedData.parties.defendant}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* RESUMO PROCESSUAL DETALHADO (VISUALIZAÇÃO MINIMIZADA) */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Resumo Detalhado por Seção (Minimizado)
                </h3>

                {summary.resumo_processual && summary.resumo_processual.length > 0 ? (
                    summary.resumo_processual.map((section: any, idx: number) => (
                        <Card key={idx} className="hover:border-primary/50 transition-colors">
                            <CardHeader className="py-3 bg-slate-50/50">
                                <CardTitle className="text-base font-medium text-slate-900">
                                    {section.titulo}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <p className="text-slate-600 mb-4 text-sm leading-relaxed">
                                    {section.conteudo}
                                </p>
                                {section.trecho_original && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs gap-2 h-8"
                                        onClick={() => setSelectedSource({ text: section.trecho_original, ref: section.referencia_documento })}
                                    >
                                        <Quote className="w-3 h-3" />
                                        Ver Fonte Original
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            Nenhum resumo detalhado disponível. Tente regenerar a análise.
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* LINHA DO TEMPO */}
            <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-primary" />
                    <CardTitle>Linha do Tempo dos Fatos</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                        <div className="relative border-l border-muted ml-3 space-y-6">
                            {summary.linha_do_tempo?.map((event: any, i: number) => (
                                <div key={i} className="mb-8 ml-6 relative">
                                    <span className="absolute -left-9 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs ring-4 ring-background">
                                        {i + 1}
                                    </span>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                                        <span className="text-sm font-bold text-primary min-w-[100px]">{event.data}</span>
                                        <h3 className="font-semibold">{event.evento}</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">Ref: {event.documento_ref}</p>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* SOURCE VIEWER DIALOG */}
            <Dialog open={!!selectedSource} onOpenChange={(open) => !open && setSelectedSource(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Quote className="w-5 h-5 text-primary" />
                            Fonte Original
                        </DialogTitle>
                        <DialogDescription>
                            Trecho extraído do documento: <span className="font-medium text-foreground">{selectedSource?.ref}</span>
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[60vh] mt-4">
                        <div className="p-4 bg-muted/50 rounded-lg border italic text-slate-700 leading-relaxed">
                            "{selectedSource?.text}"
                        </div>
                    </ScrollArea>
                    <div className="flex justify-end mt-4">
                        {caseData.originalDocumentUrl && (
                            <Button
                                variant="outline"
                                onClick={() => handleDownload(caseData.originalDocumentUrl, 'documento-referencia.pdf')}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Abrir Documento Completo
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
