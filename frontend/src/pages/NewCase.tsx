
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

export default function NewCase() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        clientName: '',
        caseNumber: '',
        court: '',
        caseType: 'Cível',
        description: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Backend expects: clientName, title, court, caseNumber, description, caseType
            const response = await axios.post('http://localhost:3002/api/cases', formData);
            const newCase = response.data;

            toast({
                title: "Processo criado",
                description: "Redirecionando para upload de documentos...",
            });

            navigate(`/cases/${newCase.id}/upload`);
        } catch (error) {
            console.error(error);
            toast({
                title: "Erro ao criar processo",
                description: "Verifique os dados e tente novamente.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="container mx-auto py-10 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle>Novo Processo</CardTitle>
                    <CardDescription>Cadastre as informações iniciais do caso antes de enviar os documentos.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Título do Caso *</Label>
                                <Input id="title" name="title" required value={formData.title} onChange={handleChange} placeholder="Ex: Ação de Indenização - Silva vs Souza" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="caseType">Tipo de Ação</Label>
                                <Select onValueChange={(val) => setFormData({ ...formData, caseType: val })} defaultValue={formData.caseType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Cível">Cível</SelectItem>
                                        <SelectItem value="Trabalhista">Trabalhista</SelectItem>
                                        <SelectItem value="Penal">Penal</SelectItem>
                                        <SelectItem value="Tributário">Tributário</SelectItem>
                                        <SelectItem value="Família">Família</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="clientName">Nome do Cliente *</Label>
                                <Input id="clientName" name="clientName" required value={formData.clientName} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="caseNumber">Número do Processo</Label>
                                <Input id="caseNumber" name="caseNumber" value={formData.caseNumber} onChange={handleChange} placeholder="0000000-00.0000.0.00.0000" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="court">Tribunal / Vara</Label>
                            <Input id="court" name="court" value={formData.court} onChange={handleChange} placeholder="Ex: 3ª Vara Cível de São Paulo" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descrição / Observações</Label>
                            <Textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Breve contexto sobre o caso..." />
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Criando...' : 'Próximo: Upload de Documentos'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
