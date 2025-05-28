import type { ToolHandler } from './common.js';
import projects, {
  toolDefinitions as projectToolDefinitions,
  handlers as projectHandlers,
} from './projects.js';
import tasks, {
  toolDefinitions as taskToolDefinitions,
  handlers as taskHandlers,
} from './tasks.js';

export { projects, tasks };
export const tools = [...projectToolDefinitions, ...taskToolDefinitions];
export const handlers: Record<string, ToolHandler> = {
  ...projectHandlers,
  ...taskHandlers,
};
