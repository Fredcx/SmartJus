// @ts-nocheck
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { Loader2, Copy, Check } from "lucide-react";

const EditJurisprudenceModal = ({ isOpen, onClose, jurisprudence, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [formData, setFormData] = useState({
    tags: [],
    notes: "",
    ementa: "",
  });

  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (jurisprudence) {
      setFormData({
        tags: jurisprudence.tags || [],
        notes: jurisprudence.notes || "",
        ementa: jurisprudence.ementa || "",
      });
    }
  }, [jurisprudence]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleCopyEmenta = async () => {
    if (formData.ementa) {
      try {
        await navigator.clipboard.writeText(formData.ementa);
        setCopied(true);
        toast({
          title: "Ementa copiada!",
          description: "A ementa foi copiada para a área de transferência",
        });
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar a ementa",
          variant: "destructive",
        });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      await api.patch(`/jurisprudence/${jurisprudence.id}`, {
        tags: formData.tags,
        notes: formData.notes.trim() || null,
        ementa: formData.ementa.trim() || null,
      });

      toast({
        title: "Jurisprudência atualizada",
        description: "As alterações foram salvas com sucesso",
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar as alterações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Jurisprudência</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* EMENTA */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="ementa" className="text-sm font-semibold">
                📋 Ementa (Resumo Oficial)
              </Label>
              {formData.ementa && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyEmenta}
                  disabled={loading}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2 text-green-600" />
                      <span className="text-green-600">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar Ementa
                    </>
                  )}
                </Button>
              )}
            </div>
            <Textarea
              id="ementa"
              name="ementa"
              value={formData.ementa}
              onChange={handleChange}
              placeholder="Cole aqui a ementa oficial da jurisprudência..."
              rows={8}
              disabled={loading}
              className="font-mono text-sm leading-relaxed"
            />
            <p className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 p-2 rounded">
              💡 <strong>Dica:</strong> A ementa é o resumo oficial do julgado que pode ser citado em petições
            </p>
          </div>

          {/* TAGS */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">🏷️ Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                placeholder="Ex: favorável, importante, tese..."
                disabled={loading}
              />
              <Button
                type="button"
                onClick={handleAddTag}
                disabled={loading || !tagInput.trim()}
                variant="secondary"
              >
                Adicionar
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 p-3 bg-muted/50 rounded-lg">
                {formData.tags.map((tag, index) => (
                  <div
                    key={index}
                    className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-destructive transition-colors"
                      disabled={loading}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* NOTAS */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-semibold">
              📝 Notas Pessoais
            </Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Adicione suas observações..."
              rows={4}
              disabled={loading}
            />
          </div>

          {/* BOTÕES */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
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
                "Salvar Alterações"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditJurisprudenceModal;