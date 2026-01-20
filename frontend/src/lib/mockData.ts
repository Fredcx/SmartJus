export interface Case {
  id: string;
  number: string;
  title: string;
  parties: {
    plaintiff: string;
    defendant: string;
  };
  subject: string;
  court: string;
  status: "active" | "pending" | "completed";
  lastUpdate: Date;
  documents: Document[];
  timeline: TimelineEvent[];
  jurisprudence: Jurisprudence[];
  thesis: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  uploadDate: Date;
  summary: string;
  status: "processed" | "processing" | "pending";
}

export interface TimelineEvent {
  id: string;
  date: Date;
  title: string;
  description: string;
  type: "upload" | "summary" | "jurisprudence" | "audit";
}

export interface Jurisprudence {
  id: string;
  court: string;
  number: string;
  date: Date;
  summary: string;
  understanding: string;
  link: string;
  relevance: number;
}

export interface HistoryEntry {
  id: string;
  date: Date;
  type: "upload" | "summary" | "search";
  description: string;
  caseId?: string;
}

export const mockCases: Case[] = [
  {
    id: "1",
    number: "0001234-56.2024.8.26.0100",
    title: "Ação de Indenização por Danos Morais",
    parties: {
      plaintiff: "João da Silva",
      defendant: "Empresa XYZ Ltda",
    },
    subject: "Danos morais e materiais",
    court: "Tribunal de Justiça de São Paulo",
    status: "active",
    lastUpdate: new Date("2024-01-15"),
    documents: [
      {
        id: "d1",
        name: "Petição Inicial",
        type: "PDF",
        uploadDate: new Date("2024-01-10"),
        summary: "Petição inicial relatando danos morais sofridos pelo autor em decorrência de conduta negligente da ré. Requer indenização no valor de R$ 50.000,00.",
        status: "processed",
      },
      {
        id: "d2",
        name: "Documentos Comprobatórios",
        type: "ZIP",
        uploadDate: new Date("2024-01-12"),
        summary: "Comprovantes de gastos médicos, atestados, laudos periciais e demais documentos que fundamentam o pedido indenizatório.",
        status: "processed",
      },
    ],
    timeline: [
      {
        id: "t1",
        date: new Date("2024-01-10"),
        title: "Upload da Petição Inicial",
        description: "Petição inicial enviada e processada com sucesso",
        type: "upload",
      },
      {
        id: "t2",
        date: new Date("2024-01-12"),
        title: "Documentos Adicionados",
        description: "Documentos comprobatórios anexados ao processo",
        type: "upload",
      },
      {
        id: "t3",
        date: new Date("2024-01-15"),
        title: "Jurisprudência Consultada",
        description: "3 jurisprudências relevantes adicionadas",
        type: "jurisprudence",
      },
    ],
    jurisprudence: [
      {
        id: "j1",
        court: "STJ",
        number: "REsp 1.234.567/SP",
        date: new Date("2023-05-20"),
        summary: "Responsabilidade civil. Danos morais. Caracterização e quantum indenizatório.",
        understanding: "O Superior Tribunal de Justiça entendeu que a configuração de danos morais dispensa prova do prejuízo, bastando a demonstração do ato ilícito e do nexo causal.",
        link: "https://stj.jus.br/exemplo",
        relevance: 95,
      },
      {
        id: "j2",
        court: "TJSP",
        number: "Apelação 1234567-89.2023.8.26.0000",
        date: new Date("2023-08-10"),
        summary: "Indenização por danos morais. Valor da condenação. Proporcionalidade.",
        understanding: "O valor da indenização deve ser fixado com razoabilidade, considerando a extensão do dano e a capacidade econômica das partes.",
        link: "https://tjsp.jus.br/exemplo",
        relevance: 88,
      },
    ],
    thesis: "A configuração de danos morais prescinde de prova do prejuízo efetivo, bastando a demonstração do ato ilícito e do nexo de causalidade. O valor indenizatório deve ser fixado com razoabilidade, considerando a extensão do dano e a capacidade econômica das partes.",
  },
  {
    id: "2",
    number: "0007890-12.2024.8.26.0100",
    title: "Ação Trabalhista - Horas Extras",
    parties: {
      plaintiff: "Maria Santos",
      defendant: "Tech Solutions Ltda",
    },
    subject: "Horas extras não pagas",
    court: "Tribunal Regional do Trabalho",
    status: "pending",
    lastUpdate: new Date("2024-01-18"),
    documents: [],
    timeline: [],
    jurisprudence: [],
    thesis: "",
  },
];

export const mockHistory: HistoryEntry[] = [
  {
    id: "h1",
    date: new Date("2024-01-15"),
    type: "search",
    description: "Busca por jurisprudência sobre danos morais - 3 resultados encontrados",
    caseId: "1",
  },
  {
    id: "h2",
    date: new Date("2024-01-12"),
    type: "upload",
    description: "Upload de documentos comprobatórios no processo 0001234-56.2024",
    caseId: "1",
  },
  {
    id: "h3",
    date: new Date("2024-01-10"),
    type: "summary",
    description: "Resumo gerado para petição inicial do processo 0001234-56.2024",
    caseId: "1",
  },
];
