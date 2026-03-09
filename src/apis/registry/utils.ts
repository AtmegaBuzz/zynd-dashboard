import apiClient from "./client";

export interface CreateMailCollectorRequest {
  email: string;
  purpose?: "NEWS_LETTER" | "EARLY_ACCESS";
}

export const collectMail = async (
  data: CreateMailCollectorRequest
): Promise<boolean> => {
  const response = await apiClient.post("/utils/mail-collector", data);

  if (response.status === 201) {
    return true;
  } else {
    return false;
  }
};

export type WaitlistRole = "BUILDER" | "FOUNDER" | "INVESTOR" | "RESEARCHER" | "STUDENT" | "OTHER";

export interface CreateWaitlistRequest {
  email: string;
  role: WaitlistRole;
  linkedinProfile?: string;
  building?: string;
  attendingAiSummit?: boolean;
}

export const submitWaitlist = async (
  data: CreateWaitlistRequest
): Promise<boolean> => {
  const response = await apiClient.post("/utils/waitlist", data);
  return response.status === 201;
};
