import { serviceInstance, wrapRequest } from './common.js';
import type { ToolHandler } from './common.js';

export type Task = {
  assignees: Array<unknown>;
  attachments: Array<unknown>;
  bucket_id: number;
  buckets: Array<unknown>;
  comments: Array<unknown>;
  cover_image_attachment_id: number;
  created: string;
  created_by: unknown;
  description: string;
  done: boolean;
  done_at: string;
  due_date: string;
  end_date: string;
  hex_color: string;
  id: number;
  identifier: string;
  index: number;
  is_favorite: boolean;
  labels: Array<unknown>;
  percent_done: number;
  position: number;
  priority: number;
  project_id: number;
  reactions: unknown;
  related_tasks: unknown;
  reminders: Array<unknown>;
  repeat_after: number;
  repeat_mode: 0 | 1 | 2; // by repeat_after | daily | from current date
  start_date: string;
  subscription: unknown;
  title: string;
  updated: string;
};

const listAllTasks = async () =>
  wrapRequest(serviceInstance.get<Array<Task>>('/tasks/all'));

const listProjectTasks = async (projectId: number) =>
  wrapRequest(
    serviceInstance.get<Array<Task>>(
      `/tasks/all?filter=project_id=${projectId}`,
    ),
  );

const getTask = async (taskId: number) =>
  wrapRequest(serviceInstance.get<Task>(`/tasks/${taskId}`));

const createTask = async (projectId: number, task: Partial<Task>) =>
  wrapRequest(serviceInstance.put<Task>(`/projects/${projectId}/tasks`, task));

const updateTask = async (taskId: number, task: Partial<Task>) =>
  wrapRequest(serviceInstance.post<Task>(`/tasks/${taskId}`, task));

const deleteTask = async (taskId: number) =>
  wrapRequest(serviceInstance.delete(`/tasks/${taskId}`));

const tasks = {
  listAllTasks,
  listProjectTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
};

export default tasks;

export const toolDefinitions = [
  {
    name: 'list_all_tasks',
    description: 'List all tasks across all projects',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'list_project_tasks',
    description: 'List all tasks for a specific project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'integer', description: 'The ID of the project' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'get_task',
    description: 'Get a specific task by ID',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'integer', description: 'The ID of the task' },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'create_task',
    description: 'Create a new task in a project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'integer', description: 'The ID of the project' },
        task: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Title of the task' },
            description: {
              type: 'string',
              description: 'Description of the task',
            },
            due_date: {
              type: 'string',
              format: 'date-time',
              description: 'Due date of the task',
            },
            priority: { type: 'integer', description: 'Priority of the task' },
            done: { type: 'boolean', description: 'Is the task done?' },
          },
          required: ['title'],
        },
      },
      required: ['projectId', 'task'],
    },
  },
  {
    name: 'update_task',
    description: 'Update an existing task by ID',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'integer', description: 'The ID of the task' },
        taskUpdates: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Updated title of the task' },
            description: {
              type: 'string',
              description: 'Updated description of the task',
            },
            due_date: {
              type: 'string',
              format: 'date-time',
              description: 'Updated due date of the task',
            },
            priority: {
              type: 'integer',
              description: 'Updated priority of the task',
            },
            done: {
              type: 'boolean',
              description: 'Updated status of the task (done or not)',
            },
          },
        },
      },
      required: ['taskId', 'taskUpdates'],
    },
  },
  {
    name: 'delete_task',
    description:
      'Delete a specific task by ID. This action cannot be undone, so use with caution.',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'integer',
          description: 'The ID of the task',
        },
      },
      required: ['taskId'],
    },
  },
];

export const handlers: Record<string, ToolHandler> = {
  list_all_tasks: async _ => {
    const response = await listAllTasks();

    if (response.isError) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error retrieving tasks: ${response.error}`,
          },
        ],
      };
    }

    const tasks = response.data || [];

    if (tasks.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No tasks found',
          },
        ],
      };
    }

    const tasksResponse = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      due_date: task.due_date,
      done: task.done,
      priority: task.priority,
    }));

    return {
      content: [
        {
          type: 'text',
          text: `Found ${tasks.length} task(s)`,
        },
        {
          type: 'text',
          text: JSON.stringify(tasksResponse, null, 2),
        },
      ],
    };
  },
  list_project_tasks: async request => {
    const projectId = request.params.arguments?.projectId;
    if (typeof projectId !== 'number') {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Invalid project ID',
          },
        ],
      };
    }

    const response = await listProjectTasks(projectId);
    if (response.isError) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error retrieving tasks for project ID ${projectId}: ${response.error}`,
          },
        ],
      };
    }

    const tasks = response.data || [];

    if (tasks.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No tasks found for project ID ${projectId}`,
          },
        ],
      };
    }

    const tasksResponse = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      due_date: task.due_date,
      done: task.done,
      priority: task.priority,
    }));

    return {
      content: [
        {
          type: 'text',
          text: `Found ${tasks.length} task(s) for project ID ${projectId}`,
        },
        {
          type: 'text',
          text: JSON.stringify(tasksResponse, null, 2),
        },
      ],
    };
  },
  get_task: async request => {
    const taskId = request.params.arguments?.taskId;
    if (typeof taskId !== 'number') {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Invalid task ID',
          },
        ],
      };
    }

    const response = await getTask(taskId);
    if (response.isError) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error retrieving task ID ${taskId}: ${response.error}`,
          },
        ],
      };
    }

    const task = response.data as Task;

    return {
      content: [
        {
          type: 'text',
          text: `Task ID ${task.id} details:\nTitle: ${task.title}\nDescription: ${task.description}\nDue Date: ${task.due_date}\nDone: ${task.done}\nPriority: ${task.priority}`,
        },
      ],
    };
  },
  create_task: async request => {
    const { projectId, task: _task } = request.params.arguments || {};
    const task = _task as Partial<Task>;

    if (
      typeof projectId !== 'number' ||
      !task ||
      typeof task.title !== 'string'
    ) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Invalid project ID or task data',
          },
        ],
      };
    }

    const response = await createTask(projectId, task);
    if (response.isError) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error creating task in project ID ${projectId}: ${response.error}`,
          },
        ],
      };
    }

    const createdTask = response.data as Task;

    return {
      content: [
        {
          type: 'text',
          text: `Task created successfully with ID ${createdTask.id}`,
        },
      ],
    };
  },
  update_task: async request => {
    const { taskId, taskUpdates } = request.params.arguments || {};

    if (
      typeof taskId !== 'number' ||
      !taskUpdates ||
      typeof taskUpdates !== 'object'
    ) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Invalid task ID or updates data',
          },
        ],
      };
    }

    const response = await updateTask(taskId, taskUpdates);
    if (response.isError) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error updating task ID ${taskId}: ${response.error}`,
          },
        ],
      };
    }

    const updatedTask = response.data as Task;

    return {
      content: [
        {
          type: 'text',
          text: `Task ID ${updatedTask.id} updated successfully`,
        },
      ],
    };
  },
  delete_task: async request => {
    const taskId = request.params.arguments?.taskId;

    if (typeof taskId !== 'number') {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Invalid task ID',
          },
        ],
      };
    }

    const response = await deleteTask(taskId);
    if (response.isError) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error deleting task ID ${taskId}: ${response.error}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Task ID ${taskId} deleted successfully`,
        },
      ],
    };
  },
};
