import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload as UploadIcon, FileText, Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import api from '@/lib/api';

const Upload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // ============================================
  // HANDLE DRAG & DROP
  // ============================================
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFiles(Array.from(e.dataTransfer.files));
    }
  };

  // ============================================
  // HANDLE FILE SELECT
  // ============================================
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFiles(Array.from(e.target.files));
    }
  };

  // ============================================
  // VALIDATE FILES
  // ============================================
  const validateAndSetFiles = (newFiles: File[]) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const allowedExtensions = ['.pdf', '.docx', '.txt'];

    const validFiles: File[] = [];
    let hasError = false;

    // Filter valid files
    newFiles.forEach(file => {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if ((allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension)) && file.size <= 10 * 1024 * 1024) {
        // Avoid duplicates
        if (!files.some(f => f.name === file.name && f.size === file.size)) {
          validFiles.push(file);
        }
      } else {
        hasError = true;
      }
    });

    if (hasError) {
      toast({
        title: 'Alguns arquivos foram ignorados',
        description: 'Apenas arquivos PDF, DOCX ou TXT de até 10MB são permitidos.',
        variant: 'destructive'
      });
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      setAnalysisResult(null);
      toast({
        title: 'Arquivos adicionados',
        description: `${validFiles.length} arquivo(s) pronto(s) para análise.`
      });
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // ============================================
  // UPLOAD AND ANALYZE
  // ============================================
  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: 'Nenhum arquivo selecionado',
        description: 'Por favor, selecione pelo menos um arquivo.',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    files.forEach(file => {
      formData.append('documents', file);
    });

    try {
      console.log(`📤 Enviando ${files.length} arquivos para análise...`);

      // Simular progresso
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 5;
        });
      }, 500);

      const response = await api.post('/upload/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      console.log('✅ Resposta recebida:', response.data);
      setAnalysisResult(response.data);
      setFiles([]); // Clear queue on success

      toast({
        title: 'Processamento concluído!',
        description: 'Seus documentos foram analisados.'
      });

    } catch (error: any) {
      console.error('❌ Erro ao fazer upload:', error);

      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        'Erro ao processar os arquivos';

      toast({
        title: 'Erro no upload',
        description: errorMessage,
        variant: 'destructive'
      });

      setAnalysisResult({ error: errorMessage });

    } finally {
      setIsUploading(false);
    }
  };

  // ============================================
  // RESET
  // ============================================
  const handleReset = () => {
    setFiles([]);
    setAnalysisResult(null);
    setUploadProgress(0);
  };

  // ============================================
  // GO TO CASE
  // ============================================
  const handleGoToCase = (caseId: string) => {
    if (caseId) {
      navigate(`/cases/${caseId}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Upload de Documento(s)</h1>
        <p className="text-muted-foreground">
          Envie petições, sentenças ou outros documentos para análise automática e criação de processos
        </p>
      </div>

      {/* ÁREA DE UPLOAD */}
      {!analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UploadIcon className="w-5 h-5" />
              Selecione o(s) Documento(s)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* DRAG & DROP AREA */}
            <div
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
                transition-all duration-200
                ${isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                }
              `}
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf,.docx,.txt"
                multiple
                onChange={handleFileSelect}
                disabled={isUploading}
              />

              <label htmlFor="file-upload" className="cursor-pointer w-full h-full block">
                <div className="flex flex-col items-center gap-4">
                  <div className={`
                    w-16 h-16 rounded-full flex items-center justify-center
                    ${isDragging ? 'bg-blue-100' : 'bg-gray-100'}
                  `}>
                    <UploadIcon className={`w-8 h-8 ${isDragging ? 'text-blue-600' : 'text-gray-600'}`} />
                  </div>

                  <div>
                    <p className="text-lg font-medium text-gray-700">
                      {isDragging
                        ? 'Solte os arquivos aqui'
                        : 'Arraste e solte arquivos aqui'
                      }
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      ou clique para selecionar (suporta múltiplos)
                    </p>
                  </div>

                  <div className="flex gap-2 text-xs text-gray-500">
                    <span className="px-2 py-1 bg-gray-100 rounded">PDF</span>
                    <span className="px-2 py-1 bg-gray-100 rounded">DOCX</span>
                    <span className="px-2 py-1 bg-gray-100 rounded">TXT</span>
                  </div>

                  <p className="text-xs text-gray-400">
                    Max: 10MB por arquivo
                  </p>
                </div>
              </label>
            </div>

            {/* LISTA DE ARQUIVOS SELECIONADOS */}
            {files.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {files.map((f, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{f.name}</p>
                        <p className="text-xs text-gray-600">
                          {(f.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={isUploading}
                      title="Remover"
                    >
                      <span className="text-red-500 hover:text-red-700">&times;</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* BOTÃO ANALISAR */}
            <Button
              onClick={handleUpload}
              disabled={files.length === 0 || isUploading}
              className="w-full"
              size="lg"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processando {files.length} arquivo(s)... {uploadProgress}%
                </>
              ) : (
                <>
                  <UploadIcon className="mr-2 h-5 w-5" />
                  Analisar {files.length} Documento(s)
                </>
              )}
            </Button>

            {/* BARRA DE PROGRESSO */}
            {isUploading && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* RESULTADO (DETALHADO) */}
      {analysisResult && !analysisResult.error && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* SUCESSO HEADER */}
          <div className="flex items-center gap-3 text-green-600 bg-green-50 p-4 rounded-lg border border-green-100">
            <CheckCircle2 className="w-6 h-6" />
            <span className="font-semibold text-lg">Upload concluído com sucesso!</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* LADO ESQUERDO - INFO RÁPIDA */}
            <div className="md:col-span-1 space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Documento(s)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Tipo Identificado</span>
                    <span className="font-semibold text-lg flex items-center gap-2">
                      {analysisResult.analysis.documentType === 'peticao_inicial' && '📄 Petição Inicial'}
                      {analysisResult.analysis.documentType === 'contestacao' && '🛡️ Contestação'}
                      {analysisResult.analysis.documentType === 'sentenca' && '⚖️ Sentença'}
                      {analysisResult.analysis.documentType === 'acordao' && '📋 Acórdão'}
                      {analysisResult.analysis.documentType === 'despacho' && '📝 Despacho'}
                      {analysisResult.analysis.documentType === 'recurso' && '📤 Recurso'}
                      {analysisResult.analysis.documentType === 'outro' && '📄 Outro'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Confiança da IA</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${analysisResult.analysis.confidence}%` }}
                        />
                      </div>
                      <span className="font-mono text-sm">{analysisResult.analysis.confidence}%</span>
                    </div>
                  </div>
                  {analysisResult.fileCount > 1 && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Arquivos Analisados</span>
                      <span className="font-medium">{analysisResult.fileCount} arquivos unificados</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-50 border-dashed">
                <CardContent className="pt-6">
                  <h4 className="font-medium mb-2 flex items-center gap-2 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Processo Criado
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    {analysisResult.case.title}
                  </p>
                  <Button onClick={() => handleGoToCase(analysisResult.case?.id)} className="w-full gap-2">
                    Visualizar Processo
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* LADO DIREITO - DETALHES */}
            <div className="md:col-span-2 space-y-6">

              {/* CONTEXTO GERAL (ANTIGO RESUMO) */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    Contexto Geral Unificado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {analysisResult.analysis.summary}
                  </p>
                </CardContent>
              </Card>

              {/* DADOS EXTRAÍDOS */}
              {analysisResult.analysis.extractedData && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Dados Processuais Extraídos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                      {analysisResult.analysis.extractedData.caseNumber && (
                        <div className="col-span-2 md:col-span-1 border-b pb-2">
                          <span className="text-muted-foreground block text-xs mb-1">Número do Processo</span>
                          <span className="font-medium font-mono">{analysisResult.analysis.extractedData.caseNumber}</span>
                        </div>
                      )}

                      {analysisResult.analysis.extractedData.court && (
                        <div className="col-span-2 md:col-span-1 border-b pb-2">
                          <span className="text-muted-foreground block text-xs mb-1">Tribunal / Vara</span>
                          <span className="font-medium">{analysisResult.analysis.extractedData.court}</span>
                        </div>
                      )}

                      <div className="col-span-2 grid grid-cols-2 gap-4 pt-2">
                        {analysisResult.analysis.extractedData.parties?.plaintiff && (
                          <div>
                            <span className="text-muted-foreground block text-xs mb-1">Autor / Requerente</span>
                            <span className="font-medium block">{analysisResult.analysis.extractedData.parties.plaintiff}</span>
                          </div>
                        )}
                        {analysisResult.analysis.extractedData.parties?.defendant && (
                          <div>
                            <span className="text-muted-foreground block text-xs mb-1">Réu / Requerido</span>
                            <span className="font-medium block">{analysisResult.analysis.extractedData.parties.defendant}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* RESUMO GERAL (ANTIGA ANÁLISE ESTRATÉGICA) */}
              <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-100 flex gap-4 items-start">
                <div className="p-2 bg-blue-100 rounded-full mt-1">
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin-slow" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Resumo Geral em Processamento</h4>
                  <p className="text-sm text-blue-700 leading-relaxed">
                    O sistema está gerando o resumo estratégico detalhado com base em todos os documentos.
                    <br />
                    Você pode acessar essas informações completas na aba <strong>"Visão Geral"</strong> do processo.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleReset}
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Analisar outro documento
                </Button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ERRO GERAL */}
      {analysisResult?.error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-6 h-6" />
              Erro na Análise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 mb-4">{analysisResult.error}</p>
            <Button onClick={handleReset} variant="outline">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Upload;