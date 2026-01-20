// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";

const DeadlineModal = ({ isOpen, onClose, caseId, deadline, onSuccess, cases = [] }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const hasLoadedCases = useRef(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium",
    caseId: caseId || "",
  });

  // Carregar dados do prazo existente
  useEffect(() => {
    if (deadline) {
      setFormData({
        title: deadline.title || "",
        description: deadline.description || "",
        dueDate: deadline.dueDate ? new Date(deadline.dueDate).toISOString().slice(0, 16) : "",
        priority: deadline.priority || "medium",
        caseId: deadline.caseId || caseId || "",
      });
    } else {
      setFormData({
        title: "",
        description: "",
        dueDate: "",
        priority: "medium",
        caseId: caseId || "",
      });
    }
    
    // Reset flag quando abrir modal
    hasLoadedCases.current = false;
  }, [deadline, caseId, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({
        title: "Erro de validação",
        description: "O título é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (!formData.dueDate) {
      toast({
        title: "Erro de validação",
        description: "A data e hora são obrigatórias",
        variant: "destructive",
      });
      return;
    }

    if (!formData.caseId) {
      toast({
        title: "Erro de validação",
        description: "Selecione um processo",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        dueDate: new Date(formData.dueDate).toISOString(),
        priority: formData.priority,
        caseId: formData.caseId,
      };

      if (deadline) {
        // Editando prazo existente
        await api.put(`/deadlines/${deadline.id}`, payload);
        toast({
          title: "Prazo atualizado",
          description: "O prazo foi atualizado com sucesso",
        });
      } else {
        // Criando novo prazo
        await api.post("/deadlines", payload);
        toast({
          title: "Prazo criado",
          description: "O prazo foi criado com sucesso",
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar prazo:", error);
      toast({
        title: "Erro ao salvar",
        description: error.response?.data?.error || "Não foi possível salvar o prazo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{deadline ? "Editar Prazo" : "Novo Prazo"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* PROCESSO - apenas se não tiver caseId fixo */}
          {!caseId && cases.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="caseId">
                Processo <span className="text-red-500">*</span>
              </Label>
              <select
                id="caseId"
                name="caseId"
                value={formData.caseId}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
                disabled={loading}
              >
                <option value="">Selecione um processo</option>
                {cases.map((case_) => (
                  <option key={case_.id} value={case_.id}>
                    {case_.title} {case_.caseNumber ? `(${case_.caseNumber})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* TÍTULO */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Título <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ex: Apresentar contestação"
              required
              disabled={loading}
            />
          </div>

          {/* DESCRIÇÃO */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Detalhes adicionais sobre o prazo..."
              rows={3}
              disabled={loading}
            />
          </div>

          {/* DATA E HORA */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">
              Data e Hora <span className="text-red-500">*</span>
            </Label>
            <Input
              id="dueDate"
              name="dueDate"
              type="datetime-local"
              value={formData.dueDate}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          {/* PRIORIDADE */}
          <div className="space-y-2">
            <Label htmlFor="priority">Prioridade</Label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>

          {/* BOTÕES */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>{deadline ? "Atualizar" : "Criar"} Prazo</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DeadlineModal;