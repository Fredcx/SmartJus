
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, FileText, Loader2, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Helper to poll status
function usePolling(callback: () => void, interval = 3000) {
    useEffect(() => {
        const id = setInterval(callback, interval);
        return () => clearInterval(id);
    }, [callback, interval]);
}

export default function UploadDocuments() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [documents, setDocuments] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);

    // Poll for document status
    const fetchDocuments = async () => {
        try {
            const res = await axios.get(`http://localhost:3002/api/cases/${id}`);
            setDocuments(res.data.documents || []);
        } catch (error) {
            console.error("Error polling documents:", error);
        }
    };

    usePolling(fetchDocuments, 3000);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;

        setUploading(true);
        const formData = new FormData();
        Array.from(e.target.files).forEach(file => {
            formData.append('documents', file);
        });

        try {
            await axios.post(`http://localhost:3002/api/cases/${id}/documents`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast({ title: "Upload iniciado", description: "Os documentos estão sendo processados." });
            fetchDocuments();
        } catch (error) {
            toast({ title: "Erro no upload", description: "Falha ao enviar arquivos.", variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };

    const handleGenerateSummary = async () => {
        setAnalyzing(true);
        try {
            await axios.post(`http://localhost:3002/api/cases/${id}/summary`);
            toast({ title: "Análise concluída", description: "O resumo do caso foi gerado com sucesso." });
            navigate(`/cases/${id}`); // Go to dashboard
        } catch (error) {
            toast({ title: "Erro na análise", description: "Não foi possível gerar o resumo.", variant: "destructive" });
        } finally {
            setAnalyzing(false);
        }
    };

    const allProcessed = documents.length > 0 && documents.every(d => d.status === 'summarized' || d.status === 'processed' || d.status === 'error');

    return (
        <div className="container mx-auto py-10 max-w-4xl">
            <div className="mb-8 text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Upload de Documentos</h1>
                <p className="text-muted-foreground">Adicione todas as peças do processo para a IA analisar.</p>
            </div>

            <div className="grid gap-6">
                {/* Upload Area */}
                <Card className="border-dashed border-2">
                    <CardContent className="flex flex-col items-center justify-center py-10 space-y-4">
                        <div className="p-4 bg-muted rounded-full">
                            <FileText className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium">Arraste seus arquivos (PDF) ou clique para selecionar</p>
                            <p className="text-xs text-muted-foreground mt-1">Suporta múltiplos arquivos simultâneos</p>
                        </div>
                        <div className="relative">
                            <Button disabled={uploading} variant="secondary">
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Selecionar Arquivos
                            </Button>
                            <input
                                type="file"
                                multiple
                                accept=".pdf"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleFileUpload}
                                disabled={uploading}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Document List */}
                {documents.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Status do Processamento</CardTitle>
                            <CardDescription>Acompanhe a classificação e análise individual de cada peça.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {documents.map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg bg-card shadow-sm">
                                    <div className="flex items-center space-x-4">
                                        <div className="p-2 bg-primary/10 rounded-full">
                                            {getStatusIcon(doc.status)}
                                        </div>
                                        <div>
                                            <h4 className="font-medium">{doc.name}</h4>
                                            <p className="text-sm text-muted-foreground capitalize">
                                                {doc.classification ? (doc.classification as any).type.replace('_', ' ') : 'Agurdando classificação...'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <Badge variant={getStatusVariant(doc.status)}>
                                            {getStatusLabel(doc.status)}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Action Button */}
                <div className="flex justify-end pt-4">
                    <Button
                        size="lg"
                        onClick={handleGenerateSummary}
                        disabled={!allProcessed || analyzing || documents.length === 0}
                        className="w-full sm:w-auto"
                    >
                        {analyzing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Gerando Análise do Caso...
                            </>
                        ) : (
                            'Finalizar e Gerar Caso'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

function getStatusIcon(status: string) {
    switch (status) {
        case 'summarized':
        case 'processed':
            return <CheckCircle2 className="w-5 h-5 text-green-500" />;
        case 'error':
            return <AlertCircle className="w-5 h-5 text-red-500" />;
        default:
            return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
    }
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
        case 'summarized':
        case 'processed':
            return "default"; // green usually but default is black/primary. Shadcn badge variant customization might be needed for green.
        case 'error':
            return "destructive";
        default:
            return "secondary";
    }
}

function getStatusLabel(status: string) {
    switch (status) {
        case 'pending': return 'Fila';
        case 'processing': return 'Processando';
        case 'classified': return 'Classificado';
        case 'summarized': return 'Concluído'; // 'Analisado'
        case 'processed': return 'Concluído';
        case 'error': return 'Erro';
        default: return status;
    }
}
