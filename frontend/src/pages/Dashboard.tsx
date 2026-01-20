// @ts-nocheck
import { useState, useEffect } from "react";
import { DashboardTrackingWidget } from "@/components/dashboard/DashboardTrackingWidget";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNotifications } from '@/hooks/useNotifications';
import {
  Briefcase,
  CheckCircle,
  Clock,
  Scale,
  TrendingUp,
  Calendar,
  FileText,
  Plus,
  ArrowRight,
  Loader2,
  AlertCircle,
  Bell,
  Search,
  Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";


const Dashboard = () => {
  const { toast } = useToast();
  const { permission, checkUrgentDeadlines } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [loadingDeadlines, setLoadingDeadlines] = useState(false);
  const [stats, setStats] = useState({
    totalCases: 0,
    activeCases: 0,
    completedCases: 0,
    archivedCases: 0,
    totalJurisprudences: 0,
    recentActivity: [],
  });
  const [cases, setCases] = useState([]);
  const [jurisprudencesByTribunal, setJurisprudencesByTribunal] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      console.log("🔄 Auto-refresh: Recarregando dados do dashboard...");
      loadDashboardData();
      setLastRefresh(new Date());
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (permission === 'granted') {
      checkUrgentDeadlines();
    }
  }, [permission]);

  useEffect(() => {
    if (upcomingDeadlines.length > 0) {
      const urgent = upcomingDeadlines.filter(d => {
        const daysUntil = Math.ceil((new Date(d.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return daysUntil <= 1 && d.status === "pending";
      });

      if (urgent.length > 0) {
        console.log(`🔔 ${urgent.length} prazo(s) urgente(s) detectado(s)!`);
      }
    }
  }, [upcomingDeadlines]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Parallel requests for better performance
      const [casesResponse, statsResponse, deadlinesResponse] = await Promise.allSettled([
        api.get("/cases"),
        api.get("/jurisprudence/stats"),
        api.get("/deadlines/upcoming?days=7")
      ]);

      // Handle Cases
      let casesData = [];
      if (casesResponse.status === 'fulfilled') {
        casesData = casesResponse.value.data;
        setCases(casesData);
      }

      const totalCases = casesData.length;
      const activeCases = casesData.filter(c => c.status === "active").length;
      const completedCases = casesData.filter(c => c.status === "completed").length;
      const archivedCases = casesData.filter(c => c.status === "archived").length;

      // Handle Jurisprudence Stats
      let jurisprudenceStats = { total: 0, byTribunal: {}, recentActivity: [] };
      if (statsResponse.status === 'fulfilled') {
        const data = statsResponse.value.data;
        jurisprudenceStats = {
          total: data.total || 0,
          byTribunal: data.byTribunal || {},
          recentActivity: data.recentActivity || []
        };
      }

      // Handle Deadlines
      if (deadlinesResponse.status === 'fulfilled') {
        setUpcomingDeadlines(deadlinesResponse.value.data.results || []);
      } else {
        setUpcomingDeadlines([]);
      }

      setStats({
        totalCases,
        activeCases,
        completedCases,
        archivedCases,
        totalJurisprudences: jurisprudenceStats.total,
        recentActivity: jurisprudenceStats.recentActivity,
      });

      const tribunalData = Object.entries(jurisprudenceStats.byTribunal).map(([tribunal, count]) => ({
        tribunal,
        quantidade: count,
      }));
      setJurisprudencesByTribunal(tribunalData);

    } catch (error) {
      console.error("❌ Erro ao carregar dashboard:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar algumas informações do dashboard.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setLoadingDeadlines(false);
    }
  };

  const pieData = [
    { name: "Ativos", value: stats.activeCases, color: "#3b82f6" },
    { name: "Concluídos", value: stats.completedCases, color: "#10b981" },
    { name: "Arquivados", value: stats.archivedCases, color: "#6b7280" },
  ].filter(item => item.value > 0);

  const urgentDeadlines = upcomingDeadlines.filter(d => {
    const daysUntil = Math.ceil((new Date(d.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 3 && d.status === "pending";
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-2">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Visão Geral</h1>
          <p className="text-muted-foreground mt-1">
            Bem-vindo ao seu painel de controle jurídico.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            Atualizado às {lastRefresh.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <Button variant="ghost" size="icon" onClick={() => loadDashboardData()} title="Recarregar">
            <Activity className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* URGENT ALERT */}
      {urgentDeadlines.length > 0 && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-red-800 font-semibold">Atenção Necessária</AlertTitle>
          <AlertDescription className="text-red-700">
            Você tem {urgentDeadlines.length} prazo(s) com vencimento em breve. Verifique a aba de Prazos.
          </AlertDescription>
        </Alert>
      )}

      {/* SUMMARY STATS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Processos</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCases}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ativos</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.activeCases}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Concluídos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedCases}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Jurisprudências</CardTitle>
            <Scale className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.totalJurisprudences}</div>
          </CardContent>
        </Card>
      </div>

      {/* MAIN LAYOUT: MAIN CONTENT + SIDEBAR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT COLUMN (MAIN CONTENT) */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="deadlines" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList className="grid w-full max-w-[400px] grid-cols-3">
                <TabsTrigger value="deadlines">Prazos</TabsTrigger>
                <TabsTrigger value="cases">Processos</TabsTrigger>
                <TabsTrigger value="stats">Estatísticas</TabsTrigger>
              </TabsList>
            </div>

            {/* TAB: DEADLINES */}
            <TabsContent value="deadlines" className="space-y-4">
              <Card className="border-none shadow-none">
                <CardHeader className="px-0 pt-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Prazos Próximos</CardTitle>
                      <CardDescription>Próximos 7 dias</CardDescription>
                    </div>
                    <Link to="/prazos">
                      <Button variant="outline" size="sm">Ver Todos</Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="px-0">
                  {upcomingDeadlines.length === 0 ? (
                    <div className="text-center py-10 border rounded-lg bg-muted/20">
                      <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-muted-foreground">Nenhum prazo próximo.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingDeadlines.slice(0, 5).map((deadline) => {
                        const daysUntil = Math.ceil((new Date(deadline.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        const isUrgent = daysUntil <= 3;

                        return (
                          <Link key={deadline.id} to={`/cases/${deadline.case.id}`}>
                            <div className={`flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all cursor-pointer bg-card ${isUrgent ? 'border-l-4 border-l-red-500' : ''}`}>
                              <div className="flex-1 min-w-0 mr-4">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold truncate">{deadline.title}</span>
                                  {isUrgent && <Badge variant="destructive" className="text-[10px] h-5 px-1.5">Urgente</Badge>}
                                </div>
                                <p className="text-sm text-muted-foreground truncate">{deadline.case.title}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className={`font-medium ${isUrgent ? 'text-red-600' : 'text-foreground'}`}>
                                  {daysUntil === 0 ? 'Hoje' : daysUntil === 1 ? 'Amanhã' : `${daysUntil} dias`}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(deadline.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                </p>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: ACCESS CASES */}
            <TabsContent value="cases" className="space-y-4">
              <Card className="border-none shadow-none">
                <CardHeader className="px-0 pt-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Processos Recentes</CardTitle>
                      <CardDescription>Casos ativos em andamento</CardDescription>
                    </div>
                    <Link to="/cases">
                      <Button variant="outline" size="sm">Gerenciar</Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="px-0">
                  {cases.filter(c => c.status === "active").length === 0 ? (
                    <div className="text-center py-10 border rounded-lg bg-muted/20">
                      <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-muted-foreground">Nenhum processo ativo.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cases
                        .filter(c => c.status === "active")
                        .slice(0, 5)
                        .map((case_) => (
                          <Link key={case_.id} to={`/cases/${case_.id}`}>
                            <div className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all cursor-pointer bg-card">
                              <div className="flex items-center gap-4 flex-1">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                                  {case_.title.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium truncate">{case_.title}</p>
                                  <p className="text-xs text-muted-foreground">{case_.clientName || 'Cliente sem nome'}</p>
                                </div>
                              </div>
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </Link>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: CHARTS */}
            <TabsContent value="stats">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Distribuição de Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full">
                      {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                          Sem dados suficientes
                        </div>
                      )}
                    </div>
                    <div className="flex justify-center gap-4 mt-4">
                      {pieData.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-sm text-muted-foreground">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Jurisprudência por Tribunal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full">
                      {jurisprudencesByTribunal.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={jurisprudencesByTribunal} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="tribunal" type="category" width={80} tick={{ fontSize: 12 }} />
                            <Tooltip cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="quantidade" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                          Sem dados
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>


        {/* RIGHT COLUMN (SIDEBAR) */}
        <div className="space-y-6">

          {/* TRACKING WIDGET */}
          <DashboardTrackingWidget />

          {/* QUICK ACTIONS */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Link to="/jurisprudencia">
                <Button variant="outline" className="w-full justify-start bg-background hover:bg-accent text-left h-auto py-3">
                  <Search className="h-4 w-4 mr-3 text-purple-600" />
                  <div>
                    <div className="font-medium">Buscar Jurisprudência</div>
                  </div>
                </Button>
              </Link>
              <Link to="/cases">
                <Button variant="outline" className="w-full justify-start bg-background hover:bg-accent text-left h-auto py-3">
                  <Plus className="h-4 w-4 mr-3 text-blue-600" />
                  <div>
                    <div className="font-medium">Novo Caso</div>
                  </div>
                </Button>
              </Link>
              <Link to="/prazos">
                <Button variant="outline" className="w-full justify-start bg-background hover:bg-accent text-left h-auto py-3">
                  <Calendar className="h-4 w-4 mr-3 text-orange-600" />
                  <div>
                    <div className="font-medium">Ver Agenda</div>
                  </div>
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* RECENT ACTIVITY */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Atividade Recente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade recente</p>
              ) : (
                <div className="space-y-6">
                  {stats.recentActivity.slice(0, 5).map((activity, index) => (
                    <div key={index} className="relative pl-4 border-l">
                      <div className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-muted border-2 border-background" />
                      <div className="mb-1">
                        <p className="text-sm font-medium leading-none">{activity.title}</p>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(activity.date).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground text-pretty">
                        {activity.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;