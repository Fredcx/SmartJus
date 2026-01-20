export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface Case {
  id: string;
  number: string;
  title: string;
  plaintiff: string;
  defendant: string;
  subject: string;
  court: string;
  status: string;
  thesis?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  path: string;
  summary?: string;
  status: string;
  uploadDate: string;
  caseId: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface ApiError {
  error: string;
  message?: string;
}