// @ts-nocheck
import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Scale,
  Download,
  Eye,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Star,
  Trash2,
  Loader2,
  Edit,
  Filter,
  X,
  History,
  Search,
  Clock,
  RotateCw,
  Plus,
  CheckCircle,
  Calendar,
  AlertCircle,
  User,
  Building,
  Gavel,
  FileCheck,
  ArrowLeft,
  Home,
  Upload,
  MessageSquare,
  Copy
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { mockCases } from "@/lib/mockData";
import EditJurisprudenceModal from "@/components/EditJurisprudenceModal";
import DeadlineModal from "@/components/DeadlineModal";

const CaseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isLoadingCase = useRef(false);
  const isLoadingJuris = useRef(false);
  const isLoadingHistory = useRef(false);
  const isLoadingDeadlinesRef = useRef(false);
  const hasLoaded = useRef(false);

  const [expandedDocs, setExpandedDocs] = useState([]);
  const [caseData, setCaseData] = useState(null);
  const [jurisprudences, setJurisprudences] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingJurisprudences, setLoadingJurisprudences] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingDeadlines, setLoadingDeadlines] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedJurisprudence, setSelectedJurisprudence] = useState(null);
  const [deadlineModalOpen, setDeadlineModalOpen] = useState(false);
  const [selectedDeadline, setSelectedDeadline] = useState(null);

  const [filterFavorite, setFilterFavorite] = useState(false);
  const [filterCourt, setFilterCourt] = useState("TODOS");
  const [filterTag, setFilterTag] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const case_ = mockCases.find((c) => c.id === id);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    loadCase();
    loadJurisprudences();
    loadSearchHistory();
    loadDeadlines();

    return () => {
      hasLoaded.current = false;
    };
  }, [id]);

  const loadCase = async () => {
    if (isLoadingCase.current) return;

    try {
      isLoadingCase.current = true;
      setLoading(true);
      const response = await api.get(`/cases/${id}`);
      setCaseData(response.data);
    } catch (error) {
      console.log("Usando dados mock");
      setCaseData(case_);
    } finally {
      setLoading(false);
      isLoadingCase.current = false;
    }
  };

  const loadJurisprudences = async () => {
    if (isLoadingJuris.current) return;

    try {
      isLoadingJuris.current = true;
      setLoadingJurisprudences(true);
      const response = await api.get(`/jurisprudence/case/${id}`);
      setJurisprudences(response.data.results || []);
    } catch (error) {
      console.error("Erro ao carregar jurisprudências:", error);
      setJurisprudences([]);
    } finally {
      setLoadingJurisprudences(false);
      isLoadingJuris.current = false;
    }
  };

  const loadSearchHistory = async () => {
    if (isLoadingHistory.current) return;

    try {
      isLoadingHistory.current = true;
      setLoadingHistory(true);
      const response = await api.get(`/jurisprudence/history/${id}?limit=10`);
      setSearchHistory(response.data.results || []);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
      setSearchHistory([]);
    } finally {
      setLoadingHistory(false);
      isLoadingHistory.current = false;
    }
  };

  const loadDeadlines = async () => {
    if (isLoadingDeadlinesRef.current) return;

    try {
      isLoadingDeadlinesRef.current = true;
      setLoadingDeadlines(true);
      const response = await api.get(`/deadlines/case/${id}`);
      setDeadlines(response.data.results || []);
    } catch (error) {
      console.error("Erro ao carregar prazos:", error);
      setDeadlines([]);
    } finally {
      setLoadingDeadlines(false);
      isLoadingDeadlinesRef.current = false;
    }
  };

  const handleRepeatSearch = (query, court) => {
    navigate(`/jurisprudencia?query=${encodeURIComponent(query)}&court=${court || 'TODOS'}`);
  };

  const handleToggleFavorite = async (jurisprudenceId, currentStatus) => {
    try {
      await api.patch(`/jurisprudence/${jurisprudenceId}`, {
        isFavorite: !currentStatus,
      });

      setJurisprudences(prev =>
        prev.map(j =>
          j.id === jurisprudenceId ? { ...j, isFavorite: !currentStatus } : j
        )
      );

      toast({
        title: !currentStatus ? "Adicionado aos favoritos" : "Removido dos favoritos",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (jurisprudenceId) => {
    if (!confirm("Remover esta jurisprudência?")) return;

    try {
      await api.delete(`/jurisprudence/${jurisprudenceId}`);
      setJurisprudences(prev => prev.filter(j => j.id !== jurisprudenceId));
      toast({ title: "Jurisprudência removida" });
    } catch (error) {
      toast({ title: "Erro ao remover", variant: "destructive" });
    }
  };

  const handleEdit = (jurisprudence) => {
    setSelectedJurisprudence(jurisprudence);
    setEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    isLoadingJuris.current = false;
    loadJurisprudences();
  };

  const handleDeadlineSuccess = () => {
    isLoadingDeadlinesRef.current = false;
    loadDeadlines();
  };

  const handleEditDeadline = (deadline) => {
    setSelectedDeadline(deadline);
    setDeadlineModalOpen(true);
  };

  const handleNewDeadline = () => {
    setSelectedDeadline(null);
    setDeadlineModalOpen(true);
  };

  const handleCompleteDeadline = async (deadlineId) => {
    try {
      await api.patch(`/deadlines/${deadlineId}/complete`);
      toast({ title: "Prazo concluído" });
      setDeadlines(prev => prev.map(d =>
        d.id === deadlineId ? { ...d, status: 'completed', completedAt: new Date() } : d
      ));
    } catch (error) {
      toast({ title: "Erro", variant: "destructive" });
    }
  };

  const handleDeleteDeadline = async (deadlineId) => {
    if (!confirm("Excluir este prazo?")) return;

    try {
      await api.delete(`/deadlines/${deadlineId}`);
      toast({ title: "Prazo excluído" });
      setDeadlines(prev => prev.filter(d => d.id !== deadlineId));
    } catch (error) {
      toast({ title: "Erro", variant: "destructive" });
    }
  };

  const handleDeleteCase = async () => {
    if (!confirm("Tem certeza que deseja excluir este processo permanentemente? Esta ação não pode ser desfeita.")) return;

    // Safety check: require user to type DELETE or just a second confirmation for safety? 
    // For now simple double confirm
    if (!confirm("Confirmar exclusão definitiva?")) return;

    try {
      setLoading(true);
      await api.delete(`/cases/${id}`);
      toast({
        title: "Processo excluído",
        description: "O processo e todos os seus dados foram removidos."
      });
      navigate('/cases');
    } catch (error) {
      console.error("Erro ao excluir processo:", error);
      toast({
        title: "Erro ao excluir processo",
        description: "Não foi possível completar a exclusão.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const toggleDoc = (docId) => {
    setExpandedDocs(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const getFilteredAndSortedJurisprudences = () => {
    let filtered = [...jurisprudences];

    if (filterFavorite) {
      filtered = filtered.filter(j => j.isFavorite);
    }

    if (filterCourt !== "TODOS") {
      filtered = filtered.filter(j => j.court === filterCourt);
    }

    if (filterTag.trim()) {
      filtered = filtered.filter(j =>
        j.tags && j.tags.some(tag =>
          tag.toLowerCase().includes(filterTag.toLowerCase())
        )
      );
    }

    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortBy === "relevance") {
        comparison = b.relevance - a.relevance;
      } else if (sortBy === "date") {
        const parseDate = (dateStr) => {
          const [day, month, year] = dateStr.split('/');
          return new Date(year, month - 1, day);
        };
        comparison = parseDate(b.date) - parseDate(a.date);
      } else if (sortBy === "createdAt") {
        comparison = new Date(b.createdAt) - new Date(a.createdAt);
      }

      return sortOrder === "desc" ? comparison : -comparison;
    });

    return filtered;
  };

  const getUniqueCourts = () => {
    const courts = jurisprudences.map(j => j.court);
    return ["TODOS", ...new Set(courts)];
  };

  const clearFilters = () => {
    setFilterFavorite(false);
    setFilterCourt("TODOS");
    setFilterTag("");
    setSortBy("createdAt");
    setSortOrder("desc");
  };

  const hasActiveFilters = () => {
    return filterFavorite || filterCourt !== "TODOS" || filterTag.trim() !== "";
  };

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;

    return date.toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' });
  };

  const getDaysUntil = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "bg-blue-50 text-blue-700 border-blue-200",
      medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
      high: "bg-orange-50 text-orange-700 border-orange-200",
      urgent: "bg-red-50 text-red-700 border-red-200"
    };
    return colors[priority] || colors.medium;
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      low: "Baixa",
      medium: "Média",
      high: "Alta",
      urgent: "Urgente"
    };
    return labels[priority] || "Média";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const displayCase = caseData || case_;

  if (!displayCase) {
    return <div>Processo não encontrado</div>;
  }

  const filteredJurisprudences = getFilteredAndSortedJurisprudences();

  const urgentDeadlines = deadlines.filter(d => {
    const days = getDaysUntil(d.dueDate);
    return d.status === "pending" && days >= 0 && days <= 3;
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-lg p-6 border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Button variant="outline" size="sm" onClick={async () => {
              try {
                toast({ title: "Verificando...", description: "Buscando atualizações no Diário Oficial" });
                const res = await api.post(`/tracking/check/${id}`);
                if (res.data.count > 0) {
                  toast({ title: "Novas atualizações!", description: `${res.data.count} movimentações encontradas.` });
                  loadCase();
                } else {
                  toast({ title: "Sem novidades", description: "Nenhuma atualização encontrada hoje." });
                }
              } catch (e) {
                toast({ title: "Erro", description: "Falha ao verificar atualizações.", variant: "destructive" });
              }
            }}>
              <RotateCw className="h-4 w-4 mr-2" />
              Verificar Diário
            </Button>
          </div>
          <Link to="/">
            <Button variant="outline" size="sm">
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
        </div>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Gavel className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{displayCase.title}</h1>
              <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {displayCase.number || displayCase.caseNumber}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Building className="h-4 w-4" />
                  {displayCase.court}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              variant={displayCase.status === "active" ? "default" : "secondary"}
              className="text-sm px-3 py-1"
            >
              {displayCase.status === "active" ? "Ativo" :
                displayCase.status === "pending" ? "Pendente" : "Concluído"}
            </Badge>
            {urgentDeadlines.length > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                <Clock className="h-3 w-3 mr-1" />
                {urgentDeadlines.length} urgente{urgentDeadlines.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* INFORMAÇÕES PRINCIPAIS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">Cliente</p>
                <p className="font-semibold">{displayCase.clientName || displayCase.parties?.plaintiff}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Scale className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">Parte Contrária</p>
                <p className="font-semibold">{displayCase.opposingParty || displayCase.parties?.defendant || "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <FileCheck className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">Assunto</p>
                <p className="font-semibold">{displayCase.subject || displayCase.caseType}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Building className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">Vara/Tribunal</p>
                <p className="font-semibold">{displayCase.court}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AÇÕES RÁPIDAS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {displayCase.documents && (
              <Link to={`/auditoria/${displayCase.id}/d1`}>
                <Button variant="outline" className="w-full h-20 flex-col gap-2">
                  <Eye className="h-5 w-5" />
                  <span className="text-xs">Auditoria</span>
                </Button>
              </Link>
            )}

            <Button variant="outline" className="w-full h-20 flex-col gap-2">
              <Download className="h-5 w-5" />
              <span className="text-xs">Relatório</span>
            </Button>
            <Link to="/jurisprudencia">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Scale className="h-5 w-5" />
                <span className="text-xs">Jurisprudência</span>
              </Button>
            </Link>
            <Button
              variant="outline"
              className="w-full h-20 flex-col gap-2"
              onClick={handleNewDeadline}
            >
              <Plus className="h-5 w-5" />
              <span className="text-xs">Novo Prazo</span>
            </Button>
            <Link to="/chat">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <MessageSquare className="h-5 w-5" />
                <span className="text-xs">Chat IA</span>
              </Button>
            </Link>
            <Link to="/upload">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Upload className="h-5 w-5" />
                <span className="text-xs">Upload</span>
              </Button>
            </Link>
            <Button
              variant="outline"
              className="w-full h-20 flex-col gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
              onClick={handleDeleteCase}
            >
              <Trash2 className="h-5 w-5" />
              <span className="text-xs">Excluir</span>
            </Button>
          </div>
        </CardContent >
      </Card >

      {/* TABS */}
      < Tabs defaultValue="overview" className="space-y-4" >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="deadlines">
            Prazos
            {deadlines.length > 0 && (
              <Badge variant="secondary" className="ml-2">{deadlines.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="jurisprudence">
            Jurisprudências
            {jurisprudences.length > 0 && (
              <Badge variant="secondary" className="ml-2">{jurisprudences.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
        </TabsList>

        {/* TAB: VISÃO GERAL */}
        <TabsContent value="overview" className="space-y-4">
          {(displayCase.thesis || displayCase.description) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Tese Jurídica Central
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed bg-muted/50 p-4 rounded-lg">
                  {displayCase.thesis || displayCase.description || "Tese jurídica ainda não definida"}
                </p>
              </CardContent>
            </Card>
          )}

          {displayCase.timeline && displayCase.timeline.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Linha do Tempo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {displayCase.timeline.map((event, index) => (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        {index < displayCase.timeline.length - 1 && (
                          <div className="h-full w-0.5 bg-border" />
                        )}
                      </div>
                      <div className="pb-4 flex-1">
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {event.date.toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB: PRAZOS */}
        <TabsContent value="deadlines" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Prazos Processuais
                </CardTitle>
                <Button onClick={handleNewDeadline} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Prazo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingDeadlines ? (
                <div className="py-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                </div>
              ) : deadlines.length === 0 ? (
                <div className="py-12 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-2">Nenhum prazo cadastrado</p>
                  <Button variant="outline" size="sm" onClick={handleNewDeadline}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar primeiro prazo
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {deadlines
                    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                    .map((deadline) => {
                      const days = getDaysUntil(deadline.dueDate);
                      const isOverdue = days < 0 && deadline.status === "pending";
                      const isUrgent = days >= 0 && days <= 3 && deadline.status === "pending";

                      return (
                        <Card
                          key={deadline.id}
                          className={`${isOverdue ? 'border-red-200 bg-red-50/30' :
                            isUrgent ? 'border-orange-200 bg-orange-50/30' :
                              deadline.status === "completed" ? 'border-green-200 bg-green-50/30 opacity-70' :
                                ''
                            }`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className={`font-semibold ${deadline.status === "completed" ? 'line-through text-muted-foreground' : ''}`}>
                                    {deadline.title}
                                  </h4>

                                  {deadline.status === "completed" ? (
                                    <Badge className="bg-green-600">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Concluído
                                    </Badge>
                                  ) : isOverdue ? (
                                    <Badge variant="destructive">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      Vencido
                                    </Badge>
                                  ) : days === 0 ? (
                                    <Badge variant="destructive">Hoje</Badge>
                                  ) : days === 1 ? (
                                    <Badge variant="destructive">Amanhã</Badge>
                                  ) : days <= 3 ? (
                                    <Badge variant="destructive">{days} dias</Badge>
                                  ) : days <= 7 ? (
                                    <Badge className="bg-orange-600">{days} dias</Badge>
                                  ) : (
                                    <Badge variant="secondary">{days} dias</Badge>
                                  )}

                                  <Badge variant="outline" className={getPriorityColor(deadline.priority)}>
                                    {getPriorityLabel(deadline.priority)}
                                  </Badge>
                                </div>

                                {deadline.description && (
                                  <p className="text-sm text-muted-foreground">{deadline.description}</p>
                                )}

                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(deadline.dueDate).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                {deadline.status === "pending" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCompleteDeadline(deadline.id)}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditDeadline(deadline)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteDeadline(deadline.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: JURISPRUDÊNCIAS */}
        <TabsContent value="jurisprudence" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  Jurisprudências Salvas
                </CardTitle>
                <Badge variant="outline">{jurisprudences.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loadingJurisprudences ? (
                <div className="py-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                </div>
              ) : jurisprudences.length === 0 ? (
                <div className="py-12 text-center">
                  <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-2">Nenhuma jurisprudência salva</p>
                  <Link to="/jurisprudencia">
                    <Button>
                      <Scale className="mr-2 h-4 w-4" />
                      Buscar Jurisprudências
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="mb-6 p-4 bg-muted/50 rounded-lg space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <select
                        value={filterCourt}
                        onChange={(e) => setFilterCourt(e.target.value)}
                        className="px-3 py-2 text-sm border rounded-lg"
                      >
                        {getUniqueCourts().map(court => (
                          <option key={court} value={court}>{court}</option>
                        ))}
                      </select>

                      <Input
                        placeholder="Buscar por tag..."
                        value={filterTag}
                        onChange={(e) => setFilterTag(e.target.value)}
                        className="text-sm"
                      />

                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 text-sm border rounded-lg"
                      >
                        <option value="createdAt">Data de salvamento</option>
                        <option value="relevance">Relevância</option>
                        <option value="date">Data da decisão</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        variant={filterFavorite ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilterFavorite(!filterFavorite)}
                      >
                        <Star className={`mr-2 h-4 w-4 ${filterFavorite ? "fill-white" : ""}`} />
                        Favoritas
                      </Button>

                      {hasActiveFilters() && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                          <X className="mr-2 h-4 w-4" />
                          Limpar
                        </Button>
                      )}

                      <span className="text-sm text-muted-foreground ml-auto">
                        {filteredJurisprudences.length} de {jurisprudences.length}
                      </span>
                    </div>
                  </div>

                  {filteredJurisprudences.length === 0 ? (
                    <div className="py-8 text-center">
                      <Filter className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground mb-2">Nenhuma encontrada</p>
                      <Button variant="outline" size="sm" onClick={clearFilters}>
                        Limpar filtros
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredJurisprudences.map((juris) => (
                        <Card key={juris.id} className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <Badge variant="outline">{juris.court}</Badge>
                                  <span className="font-semibold text-sm">{juris.number}</span>
                                  {juris.isFavorite && (
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">{juris.date}</p>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {juris.relevance}%
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3 pt-0">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Entendimento</p>
                              <p className="text-sm">{juris.understanding}</p>
                            </div>

                            {/* EMENTA OFICIAL */}
                            {juris.ementa && (
                              <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs font-bold text-amber-900">📋 EMENTA OFICIAL</p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={async () => {
                                      try {
                                        await navigator.clipboard.writeText(juris.ementa);
                                        toast({
                                          title: "Ementa copiada!",
                                          description: "Pronta para usar em petições"
                                        });
                                      } catch (error) {
                                        toast({
                                          title: "Erro ao copiar",
                                          variant: "destructive"
                                        });
                                      }
                                    }}
                                    className="h-8"
                                  >
                                    <Copy className="h-3 w-3 mr-2" />
                                    Copiar
                                  </Button>
                                </div>
                                <p className="text-xs text-amber-900 whitespace-pre-wrap font-mono leading-relaxed bg-white/50 p-3 rounded">
                                  {juris.ementa}
                                </p>
                              </div>
                            )}

                            {juris.notes && (
                              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-3">
                                <p className="text-xs font-semibold text-blue-900 mb-1">📝 Notas</p>
                                <p className="text-sm text-blue-800">{juris.notes}</p>
                              </div>
                            )}

                            <div className="flex gap-2 flex-wrap pt-2">
                              <Button variant="outline" size="sm" asChild>
                                <a href={juris.link} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="mr-2 h-3 w-3" />
                                  Ver
                                </a>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleFavorite(juris.id, juris.isFavorite)}
                              >
                                <Star className={`mr-2 h-3 w-3 ${juris.isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(juris)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(juris.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: HISTÓRICO */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Buscas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="py-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                </div>
              ) : searchHistory.length === 0 ? (
                <div className="py-12 text-center">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-2">Nenhuma busca realizada</p>
                  <Link to="/jurisprudencia">
                    <Button variant="outline" size="sm">
                      <Search className="mr-2 h-4 w-4" />
                      Fazer primeira busca
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {searchHistory.map((search) => (
                    <Card key={search.id} className="hover:bg-muted/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Search className="h-4 w-4 text-muted-foreground" />
                              <p className="font-medium text-sm">{search.query}</p>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-xs">{search.court}</Badge>
                              <span>{search.resultsCount} resultados</span>
                              <span>{formatRelativeTime(search.createdAt)}</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRepeatSearch(search.query, search.court)}
                          >
                            <RotateCw className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: DOCUMENTOS */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos do Processo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!displayCase.documents || displayCase.documents.length === 0 ? (
                <div className="py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhum documento anexado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayCase.documents.map((doc) => (
                    <Collapsible key={doc.id} open={expandedDocs.includes(doc.id)} onOpenChange={() => toggleDoc(doc.id)}>
                      <Card>
                        <CollapsibleTrigger className="w-full">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-primary" />
                                <div className="text-left">
                                  <p className="font-semibold text-sm">{doc.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {doc.uploadDate.toLocaleDateString("pt-BR")} • {doc.type}
                                  </p>
                                </div>
                              </div>
                              {expandedDocs.includes(doc.id) ? (
                                <ChevronUp className="h-5 w-5" />
                              ) : (
                                <ChevronDown className="h-5 w-5" />
                              )}
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent className="pt-0">
                            <div className="bg-muted/50 p-4 rounded-lg mb-3">
                              <p className="text-xs font-medium text-muted-foreground mb-2">Resumo IA</p>
                              <p className="text-sm">{doc.summary}</p>
                            </div>
                            <Link to={`/auditoria/${displayCase.id}/${doc.id}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="mr-2 h-4 w-4" />
                                Ver no Modo Auditoria
                              </Button>
                            </Link>
                          </CardContent>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs >

      {/* MODAIS */}
      {
        editModalOpen && (
          <EditJurisprudenceModal
            isOpen={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            jurisprudence={selectedJurisprudence}
            onSuccess={handleEditSuccess}
          />
        )
      }

      {
        deadlineModalOpen && (
          <DeadlineModal
            isOpen={deadlineModalOpen}
            onClose={() => {
              setDeadlineModalOpen(false);
              setSelectedDeadline(null);
            }}
            caseId={id}
            deadline={selectedDeadline}
            onSuccess={handleDeadlineSuccess}
          />
        )
      }
    </div >
  );
};

export default CaseDetail;