/**
 * @file api/analyze.ts
 * @description Vercel Serverless Function als Proxy zur Gemini API.
 * Der API Key liegt ausschließlich als server-seitige Umgebungsvariable vor
 * und taucht niemals im Client-Bundle auf.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];
const GEMINI_BASE = "https://generativelanguage.googleapis.com";

function isRetryable(message: string): boolean {
  return (
    message.includes("503") ||
    message.includes("overloaded") ||
    message.includes("high demand") ||
    message.includes("429")
  );
}

async function callGemini(
  apiKey: string,
  model: string,
  prompt: string
): Promise<string> {
  const res = await fetch(
    `${GEMINI_BASE}/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${res.status} ${errText}`);
  }
  const json = await res.json();
  return (json.candidates?.[0]?.content?.parts?.[0]?.text ?? "") as string;
}

async function callWithFallback(apiKey: string, prompt: string): Promise<string> {
  let lastError: Error = new Error("Unbekannter Fehler.");
  for (const model of GEMINI_MODELS) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await callGemini(apiKey, model, prompt);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (!isRetryable(lastError.message) || attempt === 3) break;
        await new Promise((r) => setTimeout(r, 3000 * 2 ** (attempt - 1)));
      }
    }
  }
  throw lastError;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "Serverkonfigurationsfehler: API-Schlüssel fehlt.",
    });
  }

  const { prompt } = req.body as { prompt?: string };
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Ungültige Anfrage: prompt fehlt." });
  }

  try {
    const text = await callWithFallback(apiKey, prompt);
    return res.status(200).json({ text });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.startsWith("429") ? 429 : 502;
    return res.status(status).json({ error: message });
  }
}
