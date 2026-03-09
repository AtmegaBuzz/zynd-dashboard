import apiClient from "./client";
import {
  CreateMetadataDto,
  GetMetadataParams,
  MetadataResponse,
  UpdateMetadataDto,
} from "./types";

export const createMetadata = async (
  agentId: string,
  data: CreateMetadataDto
): Promise<MetadataResponse> => {
  const response = await apiClient.post<MetadataResponse>(
    `/agents/${agentId}/metadata`,
    data
  );
  return response.data;
};

export const getMetadata = async (
  agentId: string,
  params?: GetMetadataParams
): Promise<MetadataResponse[]> => {
  const response = await apiClient.get<MetadataResponse[]>(
    `/agents/${agentId}/metadata`,
    {
      params,
    }
  );
  return response.data;
};

export const getMetadataByKey = async (
  agentId: string,
  key: string
): Promise<MetadataResponse> => {
  const response = await apiClient.get<MetadataResponse>(
    `/agents/${agentId}/metadata/${key}`
  );
  return response.data;
};

export const updateMetadata = async (
  agentId: string,
  key: string,
  data: UpdateMetadataDto
): Promise<MetadataResponse> => {
  const response = await apiClient.put<MetadataResponse>(
    `/agents/${agentId}/metadata/${key}`,
    data
  );
  return response.data;
};

export const deleteMetadata = async (
  agentId: string,
  key: string
): Promise<void> => {
  await apiClient.delete(`/agents/${agentId}/metadata/${key}`);
};
