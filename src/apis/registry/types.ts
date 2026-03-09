export type AgentStatus = "ACTIVE" | "INACTIVE" | "DEPRECATED";
export type MetadataVisibility = "PUBLIC" | "PRIVATE";

export interface Capabilities {
  ai?: string[];
  integration?: string[];
  protocols?: string[];
  [key: string]: string[] | undefined;
}

export interface CreateAgentDto {
  name: string;
  description?: string;
  capabilities?: Capabilities;
}

export interface UpdateAgentDto {
  name?: string;
  description?: string;
  capabilities?: Capabilities;
  status?: AgentStatus;
}

export interface AgentResponse {
  data: Agent[];
  count: number;
  total: number;
}

export interface Agent {
  id: string;
  did: string;
  didIdentifier: string;
  name: string;
  description?: string;
  capabilities?: Capabilities;
  status: AgentStatus;
  ownerId: string;
  owner: {
    walletAddress: string;
  };
  createdAt: string;
  updatedAt: string;
  seed: string | null | undefined;
  httpWebhookUrl: string;
}

export interface CreateMetadataDto {
  key: string;
  value: string;
  visibility?: MetadataVisibility;
}

export interface UpdateMetadataDto {
  value: string;
  visibility?: MetadataVisibility;
}

export interface MetadataResponse {
  id: string;
  key: string;
  value: string;
  visibility: MetadataVisibility;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  walletAddress: string;
  signature: string;
  message: string;
  name: string;
}

export interface UserResponse {
  id: string;
  walletAddress: string;
  name: string;
  didIdentifier: string;
  connectionString: string;
  did: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface GetAgentsParams {
  id?: string;
  name?: string;
  status?: AgentStatus;
  capabilities?: string[];
  did?: string;
  limit?: number;
  offset?: number;
}

export interface GetMetadataParams {
  visibility?: MetadataVisibility;
}

export interface SearchAgentsParams {
  keyword?: string;
  capabilities?: string;
  status?: AgentStatus;
  limit?: number;
  offset?: number;
}

export interface LoginDto {
  wallet_address: string;
  signature: string;
  message: string;
}

export interface APIKeyResponse {
  id: string;
  key: string;
  createdAt: string;
  updatedAt: string;
}

interface CredentialStatus {
  id: string;
  revocationNonce: number;
  type: string;
}

interface CredentialSchema {
  id: string;
  type: string;
}

interface ProofState {
  txId: string;
  blockTimestamp: number;
  blockNumber: number;
  rootOfRoots: string;
  claimsTreeRoot: string;
  revocationTreeRoot: string;
  value: string;
}

interface MTP {
  existence: boolean;
  siblings: unknown[];
}

interface CredentialIssuer {
  id: string;
  state: ProofState;
  authCoreClaim: string;
  mtp: MTP;
  credentialStatus: CredentialStatus;
}

interface Proof {
  type: string;
  issuerData: CredentialIssuer;
  coreClaim: string;
  signature: string;
}

interface VerifiableCredential {
  id: string;
  "@context": string[];
  type: string[];
  expirationDate: string;
  issuanceDate: string;
  credentialSubject: {
    id: string;
    owner: string;
    type: string;
  };
  credentialStatus: CredentialStatus;
  issuer: string;
  credentialSchema: CredentialSchema;
  proof: Proof[];
}

export interface VCResponse {
  id: string;
  proofTypes: string[];
  revoked: boolean;
  schemaHash: string;
  vc: VerifiableCredential;
}
