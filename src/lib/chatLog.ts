import { getFile, putFile } from "./storage";

// Questions asked to the chat assistant, newest first, for the admin (recent questions, and the
// ones it couldn't answer, to turn into new FAQ entries).
export type ChatEntry = { at: string; lang: "fr" | "en"; question: string; reply: string; answered: boolean };

const KEY = "chat/log.json";
const MAX = 300;

export async function readChatLog(): Promise<ChatEntry[]> {
  try {
    const raw = await getFile(KEY);
    return raw ? (JSON.parse(raw.toString("utf8")) as ChatEntry[]) : [];
  } catch {
    return [];
  }
}

export async function logChat(entry: ChatEntry) {
  try {
    await putFile(KEY, JSON.stringify([entry, ...(await readChatLog())].slice(0, MAX)), "application/json");
  } catch (err) {
    console.error("[chat] could not log", err);
  }
}

export async function removeChat(at: string) {
  const log = await readChatLog();
  await putFile(KEY, JSON.stringify(log.filter((e) => e.at !== at)), "application/json");
  return log.filter((e) => e.at !== at);
}
