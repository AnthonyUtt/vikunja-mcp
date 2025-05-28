import {
  CallToolRequest,
  CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import type { AxiosResponse } from 'axios';

const baseURL = `${process.env.VIKUNJA_API_BASE}/api/v1`;
const headers = {
  Authorization: `Bearer ${process.env.VIKUNJA_API_TOKEN}`,
  'Content-Type': 'application/json',
};

export const serviceInstance = axios.create({
  baseURL,
  headers,
});

type Response<T> = {
  data?: T;
  isError: boolean;
  error?: string;
};
export const wrapRequest = async <T>(
  request: Promise<AxiosResponse<T>>,
): Promise<Response<T>> => {
  try {
    const response = await request;
    return {
      data: response.data,
      isError: false,
    };
  } catch (error) {
    const errorMessage = axios.isAxiosError(error)
      ? error.response?.data?.message || error.message
      : `Unexpected error: ${error}`;

    return {
      isError: true,
      error: errorMessage,
    };
  }
};

export type ToolHandler = (request: CallToolRequest) => Promise<CallToolResult>;
