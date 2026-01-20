
import { useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Eye, Upload, Loader2, AlertCircle, FilePlus, RefreshCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface DocumentsTabProps {
    caseData: any;
    onCaseUpdate?: () => void;
}

export default function DocumentsTab({ caseData, onCaseUpdate }: DocumentsTabProps) {
    const { toast } = useToast();
    const [selectedDoc, setSelectedDoc] = useState<any>(null);
    const [uploading, setUploading] = useState(false);
    const [generatingSummary, setGeneratingSummary] = useState(false);

    // Unified document list
    const documents = caseData.documents || [];

    const handleRegenerateSummary = async () => {
        try {
            setGeneratingSummary(true);
            toast({ title: "Analisando...", description: "Reanalisando todos os documentos do caso. Isso pode levar alguns segundos." });

            await api.post(`/cases/${caseData.id}/summary`);

            toast({
                title: "Resumo Atualizado!",
                description: "A análise global foi refeita considerando os novos documentos.",
                variant: "default"
            });

            if (onCaseUpdate) onCaseUpdate();
        } catch (error) {
            console.error(error);
            toast({ title: "Erro na atualização", description: "Não foi possível regenerar o resumo.", variant: "destructive" });
        } finally {
            setGeneratingSummary(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;

        setUploading(true);
        const formData = new FormData();
        Array.from(e.target.files).forEach(file => {
            formData.append('file', file);
        });

        // Add additional fields
        formData.append('caseId', caseData.id);
        formData.append('category', 'evidence'); // Mark as evidence

        try {
            await api.post(`/documents/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast({ title: "Prova anexada", description: "O documento foi adicionado como prova." });

            if (onCaseUpdate) {
                // Wait a bit for processing to start/finish or just refresh list
                setTimeout(onCaseUpdate, 1000);
            }
        } catch (error) {
            console.error(error);
            toast({ title: "Erro no upload", description: "Falha ao enviar arquivo.", variant: "destructive" });
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    const DocumentCard = ({ doc, isEvidence = false }: { doc: any, isEvidence?: boolean }) => (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div className={`p-2 rounded-lg ${isEvidence ? 'bg-amber-100' : 'bg-primary/10'}`}>
                        {isEvidence ? <FilePlus className="w-5 h-5 text-amber-600" /> : <FileText className="w-5 h-5 text-primary" />}
                    </div>
                    <Badge variant={doc.status === 'summarized' ? 'default' : 'secondary'}>
                        {doc.classification ? (doc.classification as any).type?.replace('_', ' ') : 'Processando...'}
                    </Badge>
                </div>
                <CardTitle className="mt-3 text-base leading-tight truncate" title={doc.name}>
                    {doc.name}
                </CardTitle>
                <CardDescription className="text-xs">
                    {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button
                    className="w-full"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDoc(doc)}
                >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Análise
                </Button>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-8">
            {/* AÇÕES DE DOCUMENTOS (Upload + Update) */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50 p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                        <Upload className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">Central de Documentos</h3>
                        <p className="text-xs text-muted-foreground">
                            Adicione novos arquivos e atualize a inteligência do caso.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative">
                        <Button disabled={uploading} variant="outline" className="w-full sm:w-auto border-blue-200 text-blue-700 hover:bg-blue-50">
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                            Adicionar Documento
                        </Button>
                        <input
                            type="file"
                            multiple
                            accept=".pdf,.txt,.docx"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleFileUpload}
                            disabled={uploading}
                        />
                    </div>

                    <Button
                        disabled={generatingSummary}
                        onClick={handleRegenerateSummary}
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {generatingSummary ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
                        Atualizar Análise IA
                    </Button>
                </div>
            </div>

            {/* LISTA UNIFICADA DE DOCUMENTOS */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Todos os Documentos do Caso</h3>
                    <Badge variant="secondary" className="ml-2">{documents.length}</Badge>
                </div>

                {documents.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {documents.map((doc: any) => (
                            <DocumentCard
                                key={doc.id}
                                doc={doc}
                                isEvidence={(doc.classification as any)?.category === 'evidence'}
                            />
                        ))}
                    </div>
                ) : (
                    <Card className="border-dashed bg-slate-50">
                        <CardContent className="py-12 text-center text-muted-foreground">
                            <p>Nenhum documento encontrado neste processo.</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Detail Modal */}
            <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
                <DialogContent className="max-w-3xl max-h-[85vh]">
                    <DialogHeader>
                        <DialogTitle>{selectedDoc?.name}</DialogTitle>
                        <DialogDescription>
                            {selectedDoc?.classification ? (
                                <>
                                    {selectedDoc.classification.type?.replace('_', ' ').toUpperCase()} •
                                    Confiança: {selectedDoc.classification.confidence}%
                                </>
                            ) : 'Análise do documento'}
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[60vh] pr-4">
                        <div className="space-y-4">
                            {selectedDoc?.individualSummary && (
                                <div className="bg-muted p-4 rounded-md">
                                    <h4 className="font-semibold mb-2">Resumo Individual (IA)</h4>
                                    <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                                        {typeof selectedDoc.individualSummary === 'string'
                                            ? selectedDoc.individualSummary
                                            : JSON.stringify(selectedDoc.individualSummary, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {!selectedDoc?.individualSummary && (
                                <p className="text-muted-foreground">Nenhuma análise disponível para este documento.</p>
                            )}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
}
