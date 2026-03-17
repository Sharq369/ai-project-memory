import { TaskStep, MarkdownFile } from '../types';

export const chunkTasks = (tasks: TaskStep[], limit: number): TaskStep[][] => {
  const chunks = [];
  for (let i = 0; i < tasks.length; i += limit) {
    chunks.push(tasks.slice(i, i + limit));
  }
  return chunks;
};

export const compileMarkdown = (layer: string, chunks: TaskStep[][]): MarkdownFile[] => {
  const files: MarkdownFile[] = [];
  
  chunks.forEach((chunk, index) => {
    let md = `# ${layer.toUpperCase()} Build Steps\n\n`;
    chunk.forEach(step => {
      md += `## Step ${step.stepNumber}: ${step.title}\n`;
      md += `* **Goal:** ${step.goal}\n`;
      md += `* **Tasks:**\n${step.tasks.map(t => `  - ${t}`).join('\n')}\n`;
      md += `* **Requirements:**\n${step.requirements.map(r => `  - ${r}`).join('\n')}\n`;
      md += `* **Output:** ${step.output}\n\n`;
      md += `---\n\n`;
    });

    const partSuffix = chunks.length > 1 ? `-part${index + 1}` : '';
    files.push({
      fileName: `${layer}-build-steps${partSuffix}.md`,
      content: md.trim()
    });
  });

  return files;
};
