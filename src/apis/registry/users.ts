import apiClient from "./client";
import { CreateUserDto, UserResponse, VCResponse } from "./types";

export const createUser = async (
  data: CreateUserDto
): Promise<UserResponse> => {
  const response = await apiClient.post<UserResponse>("/users", data);
  return response.data;
};

export const getMe = async (authToken: string): Promise<{ user: UserResponse; credentials: VCResponse[] }> => {
  const response = await apiClient.get<{ user: UserResponse; credentials: VCResponse[] }>("/users", {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  return response.data;
};

export interface StatsResponse {
  totalAgents: number;
}

export const getStats = async (): Promise<StatsResponse> => {
  const response = await apiClient.get<StatsResponse>("/stats");
  return response.data;
};

export interface RegistryInfoResponse {
  registered_agents: number;
}

export const getRegistryInfo = async (): Promise<RegistryInfoResponse> => {
  const response = await apiClient.get<RegistryInfoResponse>("/utils/registry-info");
  return response.data;
};
