// @ts-nocheck
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Search } from "lucide-react";
import { mockHistory } from "@/lib/mockData";
import { Link } from "react-router-dom";

const Historico = () => {
  const getIcon = (type: string) => {
    switch (type) {
      case "upload":
        return <Upload className="h-4 w-4" />;
      case "summary":
        return <FileText className="h-4 w-4" />;
      case "search":
        return <Search className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "upload":
        return "Upload";
      case "summary":
        return "Resumo";
      case "search":
        return "Busca";
      default:
        return "Atividade";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "upload":
        return "bg-blue-100 text-blue-800";
      case "summary":
        return "bg-green-100 text-green-800";
      case "search":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Histórico</h1>
        <p className="text-muted-foreground">Todas as atividades do escritório</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockHistory.map((entry, index) => (
              <div key={entry.id}>
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {getIcon(entry.type)}
                    </div>
                    {index < mockHistory.length - 1 && (
                      <div className="mt-2 h-full w-0.5 bg-border" style={{ minHeight: "40px" }} />
                    )}
                  </div>

                  <div className="flex-1 pb-8">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={getTypeColor(entry.type)}>
                        {getTypeLabel(entry.type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {entry.date.toLocaleDateString("pt-BR")} às{" "}
                        {entry.date.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm">{entry.description}</p>
                    {entry.caseId && (
                      <Link to={`/cases/${entry.caseId}`}>
                        <span className="text-xs text-primary hover:underline">
                          Ver processo relacionado →
                        </span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Historico;