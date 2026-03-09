import apiClient from "./client";
import { LoginDto, LoginResponse, APIKeyResponse } from "./types";

export const login = async (
  data: LoginDto
): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>("/auth/login", data);
  return response.data;
};

export const createApiKey = async (authToken: string): Promise<string> => {
  const response = await apiClient.post<string>("/auth/create-api-key", {}, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  return response.data;
};

export const getApiKeys = async (authToken: string): Promise<APIKeyResponse[]> => {
  const response = await apiClient.get<APIKeyResponse[]>("/auth/api-keys", {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  return response.data;
};

export const deleteApiKey = async (authToken: string, keyId: string): Promise<void> => {
  await apiClient.delete(`/auth/api-keys/${keyId}`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
};
