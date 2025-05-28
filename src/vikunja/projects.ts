import { serviceInstance, wrapRequest } from './common.js';
import type { ToolHandler } from './common.js';

export type Project = {
  background_blur_hash: string;
  background_information: unknown;
  created: string;
  description: string;
  hex_color: string;
  id: number;
  identifier: string;
  is_archived: boolean;
  is_favorite: boolean;
  max_right: 0 | 1 | 2; // RO | RW | Admin
  owner: unknown;
  parent_project_id: number;
  position: number;
  subscription: unknown;
  title: string;
  updated: string;
  views: Array<unknown>;
};

const listProjects = async () =>
  wrapRequest(serviceInstance.get<Project[]>('/projects'));

const getProject = async (projectId: number) =>
  wrapRequest(serviceInstance.get<Project>(`/projects/${projectId}`));

const projects = {
  listProjects,
  getProject,
};

export default projects;

export const toolDefinitions = [
  {
    name: 'list_projects',
    description: 'List all projects',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_project',
    description: 'Get a specific project by ID',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'integer',
          description: 'The ID of the project to retrieve',
        },
      },
      required: ['projectId'],
    },
  },
];

export const handlers: Record<string, ToolHandler> = {
  list_projects: async _ => {
    const response = await listProjects();

    if (response.isError) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error fetching projects: ${response.error}`,
          },
        ],
      };
    }

    const projects = response.data || [];

    if (projects.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No projects found',
          },
        ],
      };
    }

    const projectsList = projects.map(p => p.title).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${projects.length} project(s):\n${projectsList}`,
        },
      ],
    };
  },
  get_project: async request => {
    const projectId = request.params.arguments?.projectId;

    if (typeof projectId !== 'number') {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Project ID must be a number',
          },
        ],
      };
    }

    const response = await getProject(projectId);

    if (response.isError) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error fetching project: ${response.error}`,
          },
        ],
      };
    }

    const project = response.data;

    if (!project) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Project with ID ${projectId} not found`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Project Details:\nTitle: ${project.title}\nDescription: ${project.description}\nCreated: ${project.created}`,
        },
      ],
    };
  },
};
