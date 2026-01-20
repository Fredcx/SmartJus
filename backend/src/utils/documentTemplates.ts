
export const DOCUMENT_TEMPLATES = {
  'peticao_inicial': {
    name: 'Petição Inicial',
    structure: `{
  "parte_autora": "string",
  "parte_re": "string",
  "resumo_fatico": "string",
  "fundamento_juridico": ["string"],
  "pedidos": ["string"]
}`
  },
  'contestacao': {
    name: 'Contestação',
    structure: `{
  "parte_autora": "string",
  "parte_re": "string",
  "resumo_defesa": "string",
  "argumentos_juridicos": ["string"],
  "documentos_de_prova": ["string"]
}`
  },
  'replica': {
    name: 'Réplica',
    structure: `{
  "parte_autora": "string",
  "resumo_refutacao": "string",
  "novos_argumentos": ["string"],
  "provas_apresentadas": ["string"]
}`
  },
  'laudo_medico': {
    name: 'Laudo Médico',
    structure: `{
  "paciente": "string",
  "CID": "string",
  "diagnostico": "string",
  "resumo_clinico": "string",
  "conclusao_pericial": "string"
}`
  },
  'boletim_ocorrencia': {
    name: 'Boletim de Ocorrência',
    structure: `{
  "numero": "string",
  "data": "string",
  "autoridade": "string",
  "resumo_fatico": "string",
  "pessoas_envolvidas": ["string"],
  "local": "string"
}`
  },
  'sentenca': {
    name: 'Sentença',
    structure: `{
  "vara": "string",
  "processo": "string",
  "sintese_fatica": "string",
  "fundamentos_juridicos": ["string"],
  "dispositivo": "string",
  "pontos_importantes": ["string"]
}`
  }
};

export const GLOBAL_CASE_SUMMARY_TEMPLATE = `{
  "contexto_geral": "string - Visão macro do caso",
  "resumo_processual": [
      {
          "titulo": "string - Título da seção (ex: Fatos, Direito, Pedidos)",
          "conteudo": "string - Resumo detalhado",
          "referencia_documento": "string - Nome do documento de origem e página aproximada se houver",
          "trecho_original": "string - Citação direta do texto original que fundamenta este resumo"
      }
  ],
  "linha_do_tempo": [
    { "data": "YYYY-MM-DD", "evento": "string", "documento_ref": "string" }
  ],
  "analise_estrategica": {
      "pontos_fortes": ["string"],
      "pontos_fracos": ["string"],
      "oportunidades": ["string"],
      "ameacas": ["string"]
  },
  "pontos_criticos": ["string"],
  "riscos": ["string"],
  "tese_sugerida": "string",
  "documentos_faltantes": ["string"],
  "proximos_passos_sugeridos": ["string"]
}`;
