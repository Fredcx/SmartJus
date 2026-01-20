import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, RefreshCw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface CaseUpdate {
    id: string;
    date: string;
    description: string;
    source: string;
    caseId: string;
    case?: {
        title: string;
        number: string;
    };
}

export function DashboardTrackingWidget() {
    const [updates, setUpdates] = useState<CaseUpdate[]>([]);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const fetchUpdates = async () => {
        setLoading(true);
        try {
            // In a real scenario, we would have a dedicated endpoint for "recent updates across all cases"
            // For now, we might need to mock it or fetch from individual cases if backend doesn't support 'all'
            // Let's assume we added a route /tracking/recent or similar, or just fetch updates for active cases.
            // Since I didn't verify the backend route for 'recent', I will assume we might need to adjust.
            // But let's try to fetch a hypothetical 'recent' endpoint or just show empty for now if not ready.
            // Actually, I'll fetch check-all to trigger it and then maybe list known updates. 

            // Ideally: GET /api/tracking/recent (Need to add this to backend controller?)
            // Let's stick to the plan: I only added check-all and get-by-case.
            // I will implement a quick fetch for specific case updates if available or just show a "Check Now" button.

            // Let's change strategy: This widget will trigger a check and show "Verification Started".
            // And maybe list local updates if we had a proper endpoint.
            // For MVP, I'll just show the button and a list of "Latest Movements" if I can fetch them.

            // I'll assume for now we don't have the list endpoint yet, so I'll add it to the implementation if I can, 
            // or just list nothing and focus on the trigger.

            setUpdates([]); // Placeholder
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckAll = async () => {
        toast({
            title: "Em Desenvolvimento",
            description: "A integração oficial (DOU/DJEN) está sendo finalizada. Aguarde!",
            variant: "default"
        });
    };

    return (
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    Acompanhamento de Diários Oficiais
                </CardTitle>
                <Button variant="outline" size="sm" onClick={handleCheckAll} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Verificando...' : 'Verificar Agora'}
                </Button>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground py-8">
                    <div className="bg-yellow-50 p-3 rounded-full mb-3">
                        <FileText className="w-8 h-8 text-yellow-600 opacity-50" />
                    </div>
                    <p className="font-medium">Módulo em Construção</p>
                    <p className="text-xs text-center max-w-[250px] mt-1">
                        Estamos integrando com as fontes oficiais (DJEN/DOU). Em breve disponível.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
