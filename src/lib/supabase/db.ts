export interface DeveloperKey {
  id: string;
  user_id: string;
  developer_id: string;
  public_key: string;
  private_key_enc: string;
  name: string;
  created_at: string;
}

export interface AgentRecord {
  id: string;
  user_id: string;
  agent_id: string | null;
  name: string;
  description: string | null;
  agent_url: string | null;
  category: string | null;
  tags: string[] | null;
  summary: string | null;
  agent_index: number | null;
  status: string;
  source: string;
  created_at: string;
  updated_at: string;
}
