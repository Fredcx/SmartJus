
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import OverviewTab from '@/components/case/OverviewTab';
import DocumentsTab from '@/components/case/DocumentsTab';
import JurisprudenceTab from '@/components/case/JurisprudenceTab';
import DraftingTab from '@/components/case/DraftingTab';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MoreVertical, Archive, Trash2, Undo2, RotateCw } from 'lucide-react';

export default function CaseDashboard() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [caseData, setCaseData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const fetchCase = async () => {
        try {
            console.log('🔍 Buscando caso:', id);
            const res = await api.get(`/cases/${id}`);
            console.log('✅ Caso carregado:', res.data);
            setCaseData(res.data);
        } catch (error: any) {
            console.error("❌ Erro ao buscar caso:", error);
            // ...
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchCase();
    }, [id]);

    const handleCaseUpdate = () => {
        console.log('🔄 Recarregando dados do caso...');
        fetchCase();
    };

    const handleArchive = async () => {
        try {
            const isArchived = caseData.status === 'archived';
            await api.put(`/cases/${id}/archive`, { archived: !isArchived });
            toast({
                title: isArchived ? "Processo desarquivado" : "Processo arquivado",
                description: isArchived ? "O processo voltou para a lista de ativos." : "O processo foi movido para o arquivo.",
            });
            fetchCase(); // Refresh to show new status
        } catch (error) {
            toast({
                title: "Erro ao alterar status",
                variant: "destructive"
            });
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/cases/${id}`);
            toast({
                title: "Processo excluído",
                description: "O processo foi removido permanentemente."
            });
            navigate('/cases');
        } catch (error) {
            toast({
                title: "Erro ao excluir",
                variant: "destructive"
            });
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin w-10 h-10" /></div>;
    if (!caseData) return <div>Processo não encontrado.</div>;

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                    <Link to="/cases" className="text-muted-foreground hover:text-primary"><ArrowLeft className="w-6 h-6" /></Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight">{caseData.title}</h1>
                            {caseData.status === 'archived' && (
                                <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                                    <Archive className="w-3 h-3" /> Arquivado
                                </span>
                            )}
                        </div>
                        <div className="flex space-x-2 text-sm text-muted-foreground mt-1">
                            <span>#{caseData.caseNumber || 'N/A'}</span>
                            <span>•</span>
                            <span>{caseData.court}</span>
                            <span>•</span>
                            <span>{caseData.clientName} (Autor)</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="opacity-70" onClick={() => {
                        toast({
                            title: "Em Desenvolvimento",
                            description: "A integração oficial (DOU/DJEN) está sendo finalizada. Aguarde!",
                            variant: "default"
                        });
                    }}>
                        <RotateCw className="w-4 h-4 mr-2" />
                        Verificar Diário (Em Breve)
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="w-5 h-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleArchive}>
                                {caseData.status === 'archived' ? (
                                    <>
                                        <Undo2 className="mr-2 h-4 w-4" /> Desarquivar
                                    </>
                                ) : (
                                    <>
                                        <Archive className="mr-2 h-4 w-4" /> Arquivar
                                    </>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} className="text-red-600 focus:text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" /> Excluir Processo
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Essa ação não pode ser desfeita. Isso excluirá permanentemente o processo
                            <strong> {caseData.title}</strong> e todos os documentos associados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Excluir Definitivamente
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-5 lg:w-[750px]">
                    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                    <TabsTrigger value="documents">Documentos</TabsTrigger>
                    <TabsTrigger value="drafting">Redação</TabsTrigger>
                    <TabsTrigger value="jurisprudence">Jurisprudência</TabsTrigger>
                    <TabsTrigger value="history">Histórico</TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    <TabsContent value="overview">
                        <OverviewTab caseData={caseData} onCaseUpdate={handleCaseUpdate} />
                    </TabsContent>

                    <TabsContent value="documents">
                        <DocumentsTab caseData={caseData} onCaseUpdate={handleCaseUpdate} />
                    </TabsContent>

                    <TabsContent value="drafting">
                        <DraftingTab caseData={caseData} />
                    </TabsContent>

                    <TabsContent value="jurisprudence">
                        <JurisprudenceTab caseData={caseData} />
                    </TabsContent>

                    <TabsContent value="history">
                        <Card>
                            <CardHeader><CardTitle>Histórico de Atividades</CardTitle></CardHeader>
                            <CardContent>Em breve...</CardContent>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
