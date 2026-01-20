// @ts-nocheck
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, Plus, Archive, FolderOpen, CheckCircle } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Case {
  id: string;
  number: string;
  title: string;
  plaintiff: string;
  defendant: string;
  subject: string;
  status: string;
  updatedAt: string;
}

const Cases = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      const response = await api.get('/cases');
      setCases(response.data);
    } catch (error: any) {
      console.error('Erro ao carregar processos:', error);
      toast({
        title: "Erro ao carregar processos",
        description: error.response?.data?.error || "Não foi possível carregar os processos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const [activeTab, setActiveTab] = useState("active");

  const filteredCases = cases.filter(
    (case_) => {
      const matchesSearch = case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.plaintiff.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = activeTab === 'all'
        ? true
        : activeTab === 'active'
          ? (case_.status === 'active' || case_.status === 'pending' || case_.status === 'analyzed')
          : activeTab === 'completed'
            ? case_.status === 'completed'
            : case_.status === 'archived';

      return matchesSearch && matchesStatus;
    }
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Carregando processos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Processos</h1>
          <p className="text-muted-foreground">Gerencie todos os processos do escritório</p>
        </div>


      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" /> Todos
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" /> Em Andamento
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Concluídos
            </TabsTrigger>
            <TabsTrigger value="archived" className="flex items-center gap-2">
              <Archive className="w-4 h-4" /> Arquivados
            </TabsTrigger>
          </TabsList>

          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número, título ou parte..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <TabsContent value="all" className="space-y-4">
          <CaseList cases={filteredCases} searchTerm={searchTerm} emptyMessage="Nenhum processo encontrado" />
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <CaseList cases={filteredCases} searchTerm={searchTerm} />
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <CaseList cases={filteredCases} searchTerm={searchTerm} emptyMessage="Nenhum processo concluído" />
        </TabsContent>

        <TabsContent value="archived" className="space-y-4">
          <CaseList cases={filteredCases} searchTerm={searchTerm} emptyMessage="Nenhum processo arquivado" />
        </TabsContent>
      </Tabs>
    </div >
  );
};

// Helper Component for List
const CaseList = ({ cases, searchTerm, emptyMessage = "Nenhum processo encontrado" }: any) => {
  const navigate = useNavigate();

  if (cases.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            {searchTerm ? "Nenhum processo encontrado com esses termos" : emptyMessage}
          </p>
          {!searchTerm && emptyMessage === "Nenhum processo encontrado" && (
            <Button className="mt-4" onClick={() => navigate('/upload')}>
              <Plus className="mr-2 h-4 w-4" /> Criar Primeiro Processo
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {cases.map((case_: any) => (
        <Link key={case_.id} to={`/cases/${case_.id}`}>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {case_.title}
                    {case_.status === 'archived' && <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded-full uppercase">Arquivado</span>}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{case_.number}</p>
                </div>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${case_.status === "active" ? "bg-green-100 text-green-800" :
                  case_.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                    case_.status === "completed" ? "bg-blue-100 text-blue-800" :
                      case_.status === "archived" ? "bg-gray-100 text-gray-800" :
                        "bg-gray-100 text-gray-800"
                  }`}>
                  {case_.status === "active" ? "Ativo" :
                    case_.status === "pending" ? "Pendente" :
                      case_.status === "completed" ? "Concluído" :
                        case_.status === "archived" ? "Arquivado" :
                          case_.status}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                <div>
                  <p className="font-medium text-muted-foreground">Autor</p>
                  <p>{case_.plaintiff}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Réu</p>
                  <p>{case_.defendant}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Assunto</p>
                  <p>{case_.subject}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Última Atualização</p>
                  <p>{new Date(case_.updatedAt).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default Cases;