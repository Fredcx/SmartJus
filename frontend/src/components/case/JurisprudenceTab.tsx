
import { useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Trash2, Scale, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface JurisprudenceTabProps {
    caseData: any;
}

export default function JurisprudenceTab({ caseData }: JurisprudenceTabProps) {
    const { toast } = useToast();
    const [savedJurisprudence, setSavedJurisprudence] = useState<any[]>(caseData.jurisprudence || []);
    const [removing, setRemoving] = useState<string | null>(null);

    const handleRemove = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover esta jurisprudência do processo?')) return;

        setRemoving(id);
        try {
            await api.delete(`/jurisprudence/saved/${id}`);

            // Update local state
            setSavedJurisprudence(prev => prev.filter(item => item.id !== id));

            toast({
                title: "Removido",
                description: "Jurisprudência desvinculada do processo."
            });
        } catch (error) {
            console.error('Erro ao remover:', error);
            toast({
                title: "Erro ao remover",
                description: "Não foi possível desvincular a jurisprudência.",
                variant: "destructive"
            });
        } finally {
            setRemoving(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Scale className="w-5 h-5" />
                        Jurisprudências Salvas
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Estas decisões serão utilizadas pela IA para fundamentar as peças deste processo.
                    </p>
                </div>
                <Badge variant="outline" className="h-6">
                    {savedJurisprudence.length} selecionadas
                </Badge>
            </div>

            {savedJurisprudence.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="py-10 text-center space-y-4">
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <Scale className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <h3 className="font-medium text-lg">Nenhuma Jurisprudência Vinculada</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto">
                            Para adicionar, vá até a aba <strong>Jurisprudência</strong> no menu lateral, faça uma busca e clique em "Salvar no Processo".
                        </p>
                        <Button variant="outline" asChild>
                            <a href="/jurisprudence">Ir para Busca de Jurisprudência</a>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {savedJurisprudence.map((item, idx) => (
                        <Card key={item.id || idx}>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <Badge variant={
                                            item.court === 'STF' ? 'default' :
                                                item.court === 'STJ' ? 'secondary' :
                                                    'outline'
                                        }>{item.court}</Badge>
                                        <CardTitle className="text-base font-medium">
                                            {item.number || 'Sem número'}
                                        </CardTitle>
                                        <span className="text-xs text-muted-foreground">{item.date}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="icon" asChild title="Ver original">
                                            <a href={item.link} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleRemove(item.id)}
                                            disabled={removing === item.id}
                                            title="Remover do processo"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                                    {item.ementa || item.summary}
                                </p>

                                {(item.notes || (item.tags && item.tags.length > 0)) && (
                                    <div className="bg-muted/50 p-3 rounded-md text-xs space-y-2 mt-2">
                                        {item.notes && (
                                            <p><span className="font-semibold">Nota:</span> {item.notes}</p>
                                        )}
                                        {item.tags && item.tags.length > 0 && (
                                            <div className="flex gap-1 flex-wrap">
                                                {item.tags.map((tag: string, i: number) => (
                                                    <Badge key={i} variant="secondary" className="text-[10px] h-5 px-1">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
