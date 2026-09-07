import { NextResponse } from "next/server";

import { fetchCardByHandle, type AgentProfileCard } from "@/lib/cards";

interface HistoryItem {
  role: string;
  content: string;
}

interface ChatRequestBody {
  handle?: unknown;
  message?: unknown;
  history?: unknown;
}

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-flash-1.5";
const MAX_HISTORY = 6;

function buildSystemPrompt(card: AgentProfileCard): string {
  const { identity } = card;
  const skills = card.skills.map((s) => s.name).join(", ");
  const projects = card.projects
    .map((p) => `${p.name}: ${p.description}`)
    .join("\n");

  return [
    `You are an AI assistant for ${identity.name}'s profile on Zynd. Answer questions about them based on their profile data only. Be concise and helpful.`,
    "",
    "Profile:",
    `Name: ${identity.name}`,
    `Headline: ${identity.headline}`,
    `Location: ${identity.location}`,
    `Availability: ${card.availability}`,
    `Summary: ${card.summary}`,
    `Skills: ${skills}`,
    `Working on: ${card.working_on.join(", ")}`,
    `Can help with: ${card.can_help_with.join(", ")}`,
    `Connect with: ${card.connect_with.join(", ")}`,
    `Love talking about: ${card.love_talking_about.join(", ")}`,
    `Experience: ${card.experience_years ?? "unknown"} years`,
    `Industries: ${card.industries.join(", ")}`,
    `Projects:\n${projects}`,
  ].join("\n");
}

function normalizeHistory(raw: unknown): HistoryItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is HistoryItem =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as HistoryItem).role === "string" &&
        typeof (item as HistoryItem).content === "string",
    )
    .slice(-MAX_HISTORY)
    .map((item) => ({
      role: item.role === "assistant" ? "assistant" : "user",
      content: item.content,
    }));
}

export async function POST(req: Request) {
  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const handle = typeof body.handle === "string" ? body.handle.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!handle || !message) {
    return NextResponse.json(
      { error: "handle and message are required" },
      { status: 400 },
    );
  }

  const card = await fetchCardByHandle(handle);
  if (!card) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      message: "Chat unavailable",
    });
  }

  const messages = [
    { role: "system", content: buildSystemPrompt(card) },
    ...normalizeHistory(body.history),
    { role: "user", content: message },
  ];

  let upstream: Response;
  try {
    upstream = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: MODEL, messages, stream: true }),
    });
  } catch {
    return NextResponse.json(
      { error: "Chat provider unreachable" },
      { status: 502 },
    );
  }

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: "Chat provider error" },
      { status: 502 },
    );
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.body!.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;

            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") {
              controller.close();
              return;
            }

            try {
              const parsed = JSON.parse(data) as {
                choices?: { delta?: { content?: string } }[];
              };
              const token = parsed.choices?.[0]?.delta?.content;
              if (token) controller.enqueue(encoder.encode(token));
            } catch {
              // Partial or non-JSON SSE keep-alive line — skip it.
            }
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      } finally {
        reader.releaseLock();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
