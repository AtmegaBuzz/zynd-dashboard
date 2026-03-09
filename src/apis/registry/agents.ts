import apiClient from "./client";
import {
  Agent,
  AgentResponse,
  CreateAgentDto,
  GetAgentsParams,
  SearchAgentsParams,
  UpdateAgentDto,
  VCResponse,
} from "./types";

const prepareQueryParams = (params: Record<string, unknown>): Record<string, unknown> => {
  const result = { ...params };

  Object.keys(result).forEach((key) => {
    if (Array.isArray(result[key])) {
      result[key] = (result[key] as string[]).join(",");
    }
  });

  return result;
};

export const createAgent = async (authToken: string, data: CreateAgentDto): Promise<Agent> => {
  const response = await apiClient.post<Agent>("/agents", { ...data, status: "ACTIVE" }, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  return response.data;
};

export const getAgents = async (
  params?: GetAgentsParams
): Promise<AgentResponse> => {
  const queryParams = params ? prepareQueryParams(params as Record<string, unknown>) : {};
  const response = await apiClient.get<AgentResponse>("/agents", {
    params: queryParams,
  });

  return response.data;
};

export const getMyAgents = async (
  authToken: string
): Promise<Agent[]> => {
  const response = await apiClient.get<Agent[]>("/agents/get-my-agents", {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  return response.data;
};

export const getAgentById = async (id: string, authToken: string): Promise<{ agent: Agent; credentials: VCResponse[] }> => {
  const response = await apiClient.get<{ agent: Agent; credentials: VCResponse[] }>(`/agents/${id}`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  return response.data;
};

export const getAgentByIdPublic = async (id: string): Promise<Agent | null> => {
  const response = await apiClient.get<AgentResponse>("/agents", {
    params: { id },
  });
  return response.data.data?.[0] || null;
};

export const updateAgent = async (
  id: string,
  data: UpdateAgentDto
): Promise<Agent> => {
  const response = await apiClient.put<Agent>(`/agents/${id}`, data);
  return response.data;
};

export const deleteAgent = async (id: string): Promise<void> => {
  await apiClient.delete(`/agents/${id}`);
};

export const searchAgents = async (
  params?: SearchAgentsParams
): Promise<{ data: Agent[]; count: number; total: number }> => {
  const queryParams = params ? prepareQueryParams(params as Record<string, unknown>) : {};
  const response = await apiClient.get<{ data: Agent[]; count: number; total: number }>("/agents", {
    params: queryParams,
  });
  return response.data;
};
