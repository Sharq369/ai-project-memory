export interface ExtractedRequirement {
  id: string;
  layer: 'frontend' | 'backend' | 'shared';
  feature: string;
  dependencies: string[];
}

export interface TaskStep {
  stepNumber: number;
  title: string;
  goal: string;
  tasks: string[];
  requirements: string[];
  output: string;
}

export interface MarkdownFile {
  fileName: string;
  content: string;
}
