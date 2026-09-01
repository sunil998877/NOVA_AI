import { conversationApi, openaiApi } from "./api";

export async function ensureConversation(title) {
  const { data } = await conversationApi.list();
  const existing = (data || []).find((item) => item.title === title);
  if (existing) return existing;
  return conversationApi.create({ title });
}

export async function craftEmail({ prompt, tone, audience, conversationTitle = "Message Crafter" }) {
  const conversation = await ensureConversation(conversationTitle);
  const composed = [
    `Write a complete marketing email with a subject line.`,
    prompt ? `Goal: ${prompt}` : "",
    tone ? `Tone: ${tone}` : "",
    audience ? `Audience: ${audience}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const result = await openaiApi.generateMessage({
    conversationId: conversation.id,
    prompt: composed,
  });
  return result.data;
}
