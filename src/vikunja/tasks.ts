import { serviceInstance, wrapRequest } from './common.js';
import type { ToolHandler } from './common.js';
import { z } from 'zod/v4';
import {
  DateTimeSchema,
  HexColorSchema,
  IdentifierSchema,
  UserSchema,
  User,
  LabelSchema,
  RelationKindSchema,
  RelationKind,
} from './schema.js';

const TaskSchema = z.object({
  assignees: z.array(UserSchema),
  attachments: z.array(z.unknown()),
  description: z.string(),
  done: z.boolean(),
  due_date: DateTimeSchema.optional(),
  end_date: DateTimeSchema.optional(),
  hex_color: HexColorSchema.optional(),
  id: z.number().optional(),
  identifier: IdentifierSchema.optional(),
  index: z.number().optional(),
  is_favorite: z.boolean(),
  labels: z.array(LabelSchema),
  percent_done: z.number(),
  position: z.number().optional(),
  priority: z.number(),
  project_id: z.number(),
  reactions: z.unknown(),
  related_tasks: z.unknown(),
  reminders: z.array(z.unknown()),
  repeat_after: z.number().optional(),
  repeat_mode: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional(), // by repeat_after | daily | from current date
  start_date: DateTimeSchema.optional(),
  subscription: z.unknown(),
  title: z.string(),
});

export type Task = z.infer<typeof TaskSchema> & {
  bucket_id: number;
  buckets: Array<unknown>;
  comments: Array<Comment>;
  cover_image_attachment_id: number;
  created: string;
  created_by: User;
  done_at: string;
  updated: string;
};

export type TaskInput = z.infer<typeof TaskSchema>;

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

const createTask = async (projectId: number, task: TaskInput) =>
  wrapRequest(serviceInstance.put<Task>(`/projects/${projectId}/tasks`, task));

const updateTask = async (taskId: number, task: Partial<TaskInput>) =>
  wrapRequest(serviceInstance.post<Task>(`/tasks/${taskId}`, task));

const deleteTask = async (taskId: number) =>
  wrapRequest(serviceInstance.delete(`/tasks/${taskId}`));

const createRelation = async (
  taskId: number,
  otherTaskId: number,
  relationKind: RelationKind,
) =>
  wrapRequest(
    serviceInstance.put(`/tasks/${taskId}/relations`, {
      task_id: taskId,
      other_task_id: otherTaskId,
      relation_kind: relationKind,
    }),
  );

const deleteRelation = async (
  taskId: number,
  kind: RelationKind,
  otherTaskId: number,
) =>
  wrapRequest(
    serviceInstance.delete(`/tasks/${taskId}/relations/${kind}/${otherTaskId}`),
  );

const getTaskComments = async (taskId: number) =>
  wrapRequest(serviceInstance.get(`/tasks/${taskId}/comments`));

const createTaskComment = async (taskId: number, comment: string) =>
  wrapRequest(serviceInstance.put(`/tasks/${taskId}/comments`, { comment }));

const updateTaskComment = async (
  taskId: number,
  commentId: number,
  comment: string,
) =>
  wrapRequest(
    serviceInstance.post(`/tasks/${taskId}/comments/${commentId}`, { comment }),
  );

const deleteTaskComment = async (taskId: number, commentId: number) =>
  wrapRequest(serviceInstance.delete(`/tasks/${taskId}/comments/${commentId}`));

const listTaskAttachments = async (taskId: number) =>
  wrapRequest(serviceInstance.get(`/tasks/${taskId}/attachments`));

const createTaskAttachment = async (taskId: number, attachment: string) =>
  wrapRequest(
    serviceInstance.put(`/tasks/${taskId}/attachments`, { files: attachment }),
  );

const getTaskAttachment = async (taskId: number, attachmentId: number) =>
  wrapRequest(
    serviceInstance.get(`/tasks/${taskId}/attachments/${attachmentId}`),
  );

const deleteTaskAttachment = async (taskId: number, attachmentId: number) =>
  wrapRequest(
    serviceInstance.delete(`/tasks/${taskId}/attachments/${attachmentId}`),
  );

const tasks = {
  listAllTasks,
  listProjectTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  createRelation,
  deleteRelation,
  getTaskComments,
  createTaskComment,
  updateTaskComment,
  deleteTaskComment,
  listTaskAttachments,
  createTaskAttachment,
  getTaskAttachment,
  deleteTaskAttachment,
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
            assignees: { type: 'array', items: { type: 'object' } },
            attachments: { type: 'array', items: { type: 'object' } },
            description: { type: 'string' },
            done: { type: 'boolean' },
            due_date: { type: 'string', format: 'date-time' },
            end_date: { type: 'string', format: 'date-time' },
            hex_color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
            identifier: { type: 'string', minLength: 0, maxLength: 10 },
            is_favorite: { type: 'boolean' },
            labels: { type: 'array', items: { type: 'object' } },
            percent_done: { type: 'integer', minimum: 0, maximum: 100 },
            position: { type: 'integer' },
            priority: { type: 'integer' },
            project_id: { type: 'integer' },
            reminders: { type: 'array', items: { type: 'object' } },
            repeat_after: { type: 'integer' },
            repeat_mode: { type: 'integer', enum: [0, 1, 2] },
            start_date: { type: 'string', format: 'date-time' },
            title: { type: 'string' },
          },
          required: ['title', 'description', 'done', 'priority', 'project_id'],
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
            assignees: { type: 'array', items: { type: 'object' } },
            attachments: { type: 'array', items: { type: 'object' } },
            description: { type: 'string' },
            done: { type: 'boolean' },
            due_date: { type: 'string', format: 'date-time' },
            end_date: { type: 'string', format: 'date-time' },
            hex_color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
            identifier: { type: 'string', minLength: 0, maxLength: 10 },
            is_favorite: { type: 'boolean' },
            labels: { type: 'array', items: { type: 'object' } },
            percent_done: { type: 'integer', minimum: 0, maximum: 100 },
            position: { type: 'integer' },
            priority: { type: 'integer' },
            project_id: { type: 'integer' },
            reminders: { type: 'array', items: { type: 'object' } },
            repeat_after: { type: 'integer' },
            repeat_mode: { type: 'integer', enum: [0, 1, 2] },
            start_date: { type: 'string', format: 'date-time' },
            title: { type: 'string' },
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
        taskId: { type: 'integer', description: 'The ID of the task' },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'create_relation',
    description: 'Create a relation between two tasks',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'integer', description: 'The ID of the task' },
        otherTaskId: {
          type: 'integer',
          description: 'The ID of the other task',
        },
        relationKind: {
          type: 'string',
          enum: [
            'unknown',
            'subtask',
            'parenttask',
            'related',
            'duplicateof',
            'duplicates',
            'blocking',
            'blocked',
            'precedes',
            'follows',
            'copiedfrom',
            'copiedto',
          ],
        },
      },
      required: ['taskId', 'otherTaskId', 'relationKind'],
    },
  },
  {
    name: 'delete_relation',
    description: 'Delete a relation between two tasks',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'integer', description: 'The ID of the task' },
        kind: {
          type: 'string',
          enum: [
            'unknown',
            'subtask',
            'parenttask',
            'related',
            'duplicateof',
            'duplicates',
            'blocking',
            'blocked',
            'precedes',
            'follows',
            'copiedfrom',
            'copiedto',
          ],
        },
        otherTaskId: {
          type: 'integer',
          description: 'The ID of the other task',
        },
      },
      required: ['taskId', 'kind', 'otherTaskId'],
    },
  },
  {
    name: 'get_task_comments',
    description: 'Get the comments for a specific task',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'integer', description: 'The ID of the task' },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'create_task_comment',
    description: 'Create a comment for a specific task',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'integer', description: 'The ID of the task' },
        comment: { type: 'string', description: 'The comment to create' },
      },
      required: ['taskId', 'comment'],
    },
  },
  {
    name: 'update_task_comment',
    description: 'Update a comment for a specific task',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'integer', description: 'The ID of the task' },
        commentId: { type: 'integer', description: 'The ID of the comment' },
        comment: { type: 'string', description: 'The comment to update' },
      },
      required: ['taskId', 'commentId', 'comment'],
    },
  },
  {
    name: 'delete_task_comment',
    description: 'Delete a comment for a specific task',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'integer', description: 'The ID of the task' },
        commentId: { type: 'integer', description: 'The ID of the comment' },
      },
      required: ['taskId', 'commentId'],
    },
  },
  {
    name: 'list_task_attachments',
    description: 'List all attachments for a specific task',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'integer', description: 'The ID of the task' },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'create_task_attachment',
    description: 'Attach a file to a task',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'integer', description: 'The ID of the task' },
        attachment: {
          type: 'string',
          description: 'The file, as multipart/form-data',
        },
      },
      required: ['taskId', 'attachment'],
    },
  },
  {
    name: 'get_task_attachment',
    description: 'Get a specific attachment for a task',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'integer', description: 'The ID of the task' },
        attachmentId: {
          type: 'integer',
          description: 'The ID of the attachment',
        },
      },
      required: ['taskId', 'attachmentId'],
    },
  },
  {
    name: 'delete_task_attachment',
    description: 'Delete a specific attachment for a task',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'integer', description: 'The ID of the task' },
        attachmentId: {
          type: 'integer',
          description: 'The ID of the attachment',
        },
      },
      required: ['taskId', 'attachmentId'],
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

    return {
      content: [
        {
          type: 'text',
          text: `Found ${tasks.length} task(s)`,
        },
        {
          type: 'text',
          text: JSON.stringify(tasks, null, 2),
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

    return {
      content: [
        {
          type: 'text',
          text: `Found ${tasks.length} task(s) for project ID ${projectId}`,
        },
        {
          type: 'text',
          text: JSON.stringify(tasks, null, 2),
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
          text: JSON.stringify(task, null, 2),
        },
      ],
    };
  },
  create_task: async request => {
    const { projectId, task: _task } = request.params.arguments || {};

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

    try {
      const validatedTask = TaskSchema.parse(_task);
      const response = await createTask(projectId, validatedTask);

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

      return {
        content: [
          {
            type: 'text',
            text: 'Task created successfully:',
          },
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  },
  update_task: async request => {
    const { taskId, taskUpdates } = request.params.arguments || {};

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

    if (!taskUpdates || typeof taskUpdates !== 'object') {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'No update data provided',
          },
        ],
      };
    }

    try {
      const UpdateTaskSchema = TaskSchema.partial();
      const validatedUpdates = UpdateTaskSchema.parse(taskUpdates);
      const response = await updateTask(taskId, validatedUpdates);

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

      return {
        content: [
          {
            type: 'text',
            text: 'Task updated successfully:',
          },
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
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
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  },
  create_relation: async request => {
    const { taskId, otherTaskId, relationKind } =
      request.params.arguments || {};

    if (typeof taskId !== 'number' || typeof otherTaskId !== 'number') {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Invalid task ID or other task ID',
          },
        ],
      };
    }

    if (!RelationKindSchema.safeParse(relationKind).success) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Invalid relation kind',
          },
        ],
      };
    }

    const response = await createRelation(
      taskId,
      otherTaskId,
      relationKind as RelationKind,
    );
    if (response.isError) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error creating relation between task ID ${taskId} and other task ID ${otherTaskId}: ${response.error}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  },
  delete_relation: async request => {
    const { taskId, kind, otherTaskId } = request.params.arguments || {};

    if (typeof taskId !== 'number' || typeof otherTaskId !== 'number') {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Invalid task ID or other task ID',
          },
        ],
      };
    }

    if (!RelationKindSchema.safeParse(kind).success) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Invalid relation kind',
          },
        ],
      };
    }

    const response = await deleteRelation(
      taskId,
      kind as RelationKind,
      otherTaskId,
    );
    if (response.isError) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error deleting relation between task ID ${taskId} and other task ID ${otherTaskId}: ${response.error}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  },
  get_task_comments: async request => {
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

    const response = await getTaskComments(taskId);
    if (response.isError) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error retrieving comments for task ID ${taskId}: ${response.error}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  },
  create_task_comment: async request => {
    const { taskId, comment } = request.params.arguments || {};

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

    const response = await createTaskComment(taskId, comment as string);
    if (response.isError) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error creating comment for task ID ${taskId}: ${response.error}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  },
  update_task_comment: async request => {
    const { taskId, commentId, comment } = request.params.arguments || {};

    if (typeof taskId !== 'number' || typeof commentId !== 'number') {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Invalid task ID or comment ID',
          },
        ],
      };
    }

    const response = await updateTaskComment(
      taskId,
      commentId,
      comment as string,
    );
    if (response.isError) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error updating comment for task ID ${taskId}: ${response.error}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  },
  delete_task_comment: async request => {
    const { taskId, commentId } = request.params.arguments || {};

    if (typeof taskId !== 'number' || typeof commentId !== 'number') {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Invalid task ID or comment ID',
          },
        ],
      };
    }

    const response = await deleteTaskComment(taskId, commentId);
    if (response.isError) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error deleting comment for task ID ${taskId}: ${response.error}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  },
  list_task_attachments: async request => {
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

    const response = await listTaskAttachments(taskId);
    if (response.isError) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error retrieving attachments for task ID ${taskId}: ${response.error}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  },
  create_task_attachment: async request => {
    const { taskId, attachment } = request.params.arguments || {};

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

    const response = await createTaskAttachment(taskId, attachment as string);
    if (response.isError) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error creating attachment for task ID ${taskId}: ${response.error}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  },
  get_task_attachment: async request => {
    const { taskId, attachmentId } = request.params.arguments || {};

    if (typeof taskId !== 'number' || typeof attachmentId !== 'number') {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Invalid task ID or attachment ID',
          },
        ],
      };
    }

    const response = await getTaskAttachment(taskId, attachmentId);
    if (response.isError) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error retrieving attachment for task ID ${taskId}: ${response.error}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  },
  delete_task_attachment: async request => {
    const { taskId, attachmentId } = request.params.arguments || {};

    if (typeof taskId !== 'number' || typeof attachmentId !== 'number') {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Invalid task ID or attachment ID',
          },
        ],
      };
    }

    const response = await deleteTaskAttachment(taskId, attachmentId);
    if (response.isError) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error deleting attachment for task ID ${taskId}: ${response.error}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  },
};
