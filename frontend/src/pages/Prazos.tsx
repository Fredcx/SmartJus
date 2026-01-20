// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Clock,
  Plus,
  CheckCircle,
  Trash2,
  Edit,
  Calendar,
  Filter,
  X,
  Loader2,
  Home,
  FileText,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import DeadlineModal from "@/components/DeadlineModal";

const Prazos = () => {
  const { toast } = useToast();
  const isMounted = useRef(true);
  const isLoading = useRef(false);
  
  const [loading, setLoading] = useState(true);
  const [deadlines, setDeadlines] = useState([]);
  const [cases, setCases] = useState([]);
  const [filteredDeadlines, setFilteredDeadlines] = useState([]);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    if (!isMounted.current || isLoading.current) return;
    
    isMounted.current = false;
    loadAllData();

    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    filterDeadlines();
  }, [deadlines, statusFilter, priorityFilter, searchText]);

  const loadAllData = async () => {
    if (isLoading.current) {
      console.log("⚠️ Carregamento já em andamento");
      return;
    }

    try {
      isLoading.current = true;
      setLoading(true);
      
      console.log("📡 Carregando dados...");
      
      const [deadlinesRes, casesRes] = await Promise.all([
        api.get("/deadlines/all"),
        api.get("/cases")
      ]);
      
      console.log("✅ Dados carregados:", {
        deadlines: deadlinesRes.data.results?.length || 0,
        cases: casesRes.data?.length || 0
      });
      
      setDeadlines(deadlinesRes.data.results || []);
      setCases(casesRes.data || []);
    } catch (error) {
      console.error("❌ Erro:", error);
      toast({
        title: "Erro ao carregar dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      isLoading.current = false;
    }
  };

  const filterDeadlines = () => {
    let result = [...deadlines];

    if (statusFilter !== "all") {
      result = result.filter(d => d.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      result = result.filter(d => d.priority === priorityFilter);
    }

    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      result = result.filter(d =>
        d.title.toLowerCase().includes(search) ||
        d.case?.title?.toLowerCase().includes(search)
      );
    }

    result.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    setFilteredDeadlines(result);
  };

  const handleComplete = async (id) => {
    try {
      await api.patch(`/deadlines/${id}/complete`);
      toast({ title: "Prazo concluído" });
      setDeadlines(prev => prev.map(d => 
        d.id === id ? { ...d, status: 'completed', completedAt: new Date() } : d
      ));
    } catch (error) {
      toast({ title: "Erro", variant: "destructive" });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir este prazo?")) return;

    try {
      await api.delete(`/deadlines/${id}`);
      toast({ title: "Prazo excluído" });
      setDeadlines(prev => prev.filter(d => d.id !== id));
    } catch (error) {
      toast({ title: "Erro", variant: "destructive" });
    }
  };

  const openEditModal = (deadline) => {
    setEditingDeadline(deadline);
    setSelectedCase(deadline.caseId);
    setModalOpen(true);
  };

  const openNewModal = () => {
    setEditingDeadline(null);
    setSelectedCase(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingDeadline(null);
    setSelectedCase(null);
  };

  const handleModalSuccess = async () => {
    isLoading.current = false;
    await loadAllData();
    closeModal();
  };

  const calculateDays = (date) => {
    const now = new Date();
    const due = new Date(date);
    return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  };

  const getPriorityStyle = (priority) => {
    const styles = {
      low: "bg-blue-50 text-blue-700 border-blue-200",
      medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
      high: "bg-orange-50 text-orange-700 border-orange-200",
      urgent: "bg-red-50 text-red-700 border-red-200"
    };
    return styles[priority] || styles.medium;
  };

  const getPriorityText = (priority) => {
    const labels = {
      low: "Baixa",
      medium: "Média",
      high: "Alta",
      urgent: "Urgente"
    };
    return labels[priority] || "Média";
  };

  const renderStatusBadge = (deadline) => {
    if (deadline.status === "completed") {
      return (
        <Badge className="bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Concluído
        </Badge>
      );
    }

    const days = calculateDays(deadline.dueDate);

    if (days < 0) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Vencido
        </Badge>
      );
    }

    if (days === 0) {
      return (
        <Badge variant="destructive">
          <Clock className="h-3 w-3 mr-1" />
          Hoje
        </Badge>
      );
    }

    if (days === 1) {
      return (
        <Badge variant="destructive">
          <Clock className="h-3 w-3 mr-1" />
          Amanhã
        </Badge>
      );
    }

    if (days <= 3) {
      return <Badge variant="destructive">{days} dias</Badge>;
    }

    if (days <= 7) {
      return <Badge className="bg-orange-600">{days} dias</Badge>;
    }

    return <Badge variant="secondary">{days} dias</Badge>;
  };

  const stats = {
    total: deadlines.length,
    pending: deadlines.filter(d => d.status === "pending").length,
    completed: deadlines.filter(d => d.status === "completed").length,
    overdue: deadlines.filter(d => {
      const days = calculateDays(d.dueDate);
      return d.status === "pending" && days < 0;
    }).length,
    urgent: deadlines.filter(d => {
      const days = calculateDays(d.dueDate);
      return d.status === "pending" && days >= 0 && days <= 3;
    }).length
  };

  const hasFilters = statusFilter !== "all" || priorityFilter !== "all" || searchText.trim() !== "";

  const clearAllFilters = () => {
    setStatusFilter("all");
    setPriorityFilter("all");
    setSearchText("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-primary/10 to-transparent rounded-lg p-6 border">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Prazos Processuais</h1>
                <p className="text-sm text-muted-foreground">
                  {stats.total} {stats.total === 1 ? 'prazo' : 'prazos'}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link to="/">
                <Button variant="outline" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Button onClick={openNewModal}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Prazo
              </Button>
            </div>
          </div>
        </div>

        {/* ESTATÍSTICAS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-l-4 border-l-gray-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold mt-1">{stats.total}</p>
                </div>
                <div className="bg-gray-100 p-2 rounded-lg">
                  <FileText className="h-5 w-5 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{stats.pending}</p>
                </div>
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Urgentes</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{stats.urgent}</p>
                </div>
                <div className="bg-red-100 p-2 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Vencidos</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">{stats.overdue}</p>
                </div>
                <div className="bg-orange-100 p-2 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Concluídos</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</p>
                </div>
                <div className="bg-green-100 p-2 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FILTROS */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <CardTitle className="text-base">Filtros</CardTitle>
              </div>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Status</Label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendentes</option>
                  <option value="completed">Concluídos</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Prioridade</Label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                >
                  <option value="all">Todas</option>
                  <option value="urgent">Urgente</option>
                  <option value="high">Alta</option>
                  <option value="medium">Média</option>
                  <option value="low">Baixa</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Buscar</Label>
                <Input
                  placeholder="Título ou processo..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
            </div>

            {hasFilters && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  <strong>{filteredDeadlines.length}</strong> de <strong>{deadlines.length}</strong>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* LISTA */}
        <div className="space-y-3">
          {filteredDeadlines.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {hasFilters ? "Nenhum prazo encontrado" : "Nenhum prazo"}
                </h3>
                <Button onClick={hasFilters ? clearAllFilters : openNewModal}>
                  {hasFilters ? "Limpar filtros" : "Adicionar prazo"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredDeadlines.map((deadline) => {
              const days = calculateDays(deadline.dueDate);
              const isOverdue = days < 0 && deadline.status === "pending";
              const isUrgent = days >= 0 && days <= 3 && deadline.status === "pending";
              const isDone = deadline.status === "completed";

              return (
                <Card
                  key={deadline.id}
                  className={`transition-all ${
                    isOverdue ? 'border-red-200 bg-red-50/30' :
                    isUrgent ? 'border-orange-200 bg-orange-50/30' :
                    isDone ? 'border-green-200 bg-green-50/30 opacity-70' :
                    'hover:shadow-md'
                  }`}
                >
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start gap-2 flex-wrap">
                          <h3 className={`font-semibold ${isDone ? 'line-through text-muted-foreground' : ''}`}>
                            {deadline.title}
                          </h3>
                          {renderStatusBadge(deadline)}
                          <Badge variant="outline" className={getPriorityStyle(deadline.priority)}>
                            {getPriorityText(deadline.priority)}
                          </Badge>
                        </div>

                        {deadline.case && (
                          <Link to={`/cases/${deadline.case.id}`}>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                              <FileText className="h-4 w-4" />
                              <span>{deadline.case.title}</span>
                            </div>
                          </Link>
                        )}

                        {deadline.description && (
                          <p className="text-sm text-muted-foreground">{deadline.description}</p>
                        )}

                        <div className="flex gap-4 text-xs">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(deadline.dueDate).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {deadline.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleComplete(deadline.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(deadline)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(deadline.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL */}
      {modalOpen && (
        <DeadlineModal
          isOpen={modalOpen}
          onClose={closeModal}
          caseId={selectedCase}
          deadline={editingDeadline}
          onSuccess={handleModalSuccess}
          cases={cases}
        />
      )}
    </>
  );
};

export default Prazos;