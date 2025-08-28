export type FileSystemState = Record<string, string>;

export interface OrchestrationPlan {
  title: string;
  steps: {
    description: string;
    status: 'pending' | 'done' | 'in_progress';
  }[];
  code: {
    path:string;
    content: string;
  }[];
  review?: string; // Comment from the "reviewing" agent
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  explanation?: string;
  code?: {
    path: string;
    content: string;
  }[];
  orchestration?: OrchestrationPlan;
}

export interface DraggableComponent {
  id: string;
  name: string;
  html: string;
}

export interface LayoutTemplateData {
  id:string;
  name: string;
  description: string;
  html: string;
  css: string;
  js?: string;
}