/**
 * @file contractAnalysis.service.ts
 * @description Client-seitiger Service für die KI-gestützte Vertragsanalyse.
 *
 * Der API Key wird NIEMALS im Client gebündelt. Alle Gemini-Aufrufe gehen
 * über die Vercel Serverless Function unter /api/analyze, die den Key
 * server-seitig aus der Umgebungsvariable GEMINI_API_KEY liest.
 *
 * Analyse-Pipeline:
 * 1. Vertragstexte → strukturierter Prompt (client-seitig)
 * 2. POST /api/analyze mit dem Prompt (kein Key im Request)
 * 3. Serverless Function ruft Gemini auf und gibt Text zurück
 * 4. JSON-Antwort wird in AnalysisResult geparst (client-seitig)
 */

import type { AnalysisResult, DocumentInput } from "../types/analysis";

/**
 * Sendet den Prompt an die Vercel Serverless Function und gibt den Rohtext zurück.
 * @throws {Error} Mit deutschsprachiger Fehlermeldung bei HTTP- oder Netzwerkfehlern
 */
async function callAnalyzeApi(prompt: string): Promise<string> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = (body as { error?: string }).error ?? `HTTP ${res.status}`;
    if (res.status === 429) {
      throw new Error("Rate Limit erreicht. Bitte warte eine Minute und versuche es erneut.");
    }
    if (res.status === 502 || res.status === 503) {
      throw new Error("Die KI ist momentan ausgelastet. Bitte versuche es in wenigen Sekunden erneut.");
    }
    throw new Error(msg);
  }

  const json = await res.json();
  return (json.text ?? "") as string;
}

/**
 * Analysiert eine Liste von Vertragsdokumenten und gibt ein strukturiertes
 * Ergebnis zurück.
 * @param documents - Extrahierte PDF-Texte mit Dateinamen
 * @returns Typisiertes AnalysisResult mit Widersprüchen, Risiken und Konsistenzproblemen
 * @throws {Error} Mit deutschsprachiger Fehlermeldung bei API- oder Parse-Fehlern
 */
export async function analyzeContract(
  documents: DocumentInput[]
): Promise<AnalysisResult> {
  const prompt = `
Du bist ein erfahrener deutscher Vertragsanwalt. Analysiere die folgenden Vertragstexte präzise und vollständig.

Aufgabe:
1. WIDERSPRÜCHE: Finde ALLE logischen Konflikte zwischen Klauseln – auch über mehrere Dokumente hinweg. Prüfe explizit:
   - Unterschiedliche Fristen (Zahlungsfristen, Kündigungsfristen)
   - Unterschiedliche Haftungsregelungen
   - Unterschiedliche Gerichtsstände
   - Fehlende Prioritätsregelungen bei mehreren Dokumenten
   - Rechte die durch andere Pflichten faktisch nicht ausübbar sind

2. RISIKEN: Identifiziere riskante Klauseln. Prüfe explizit:
   - Unlimitierte Haftung oder starke Haftungsasymmetrie
   - Fehlende DSGVO/AVV-Regelung (Art. 28 DSGVO)
   - Einseitige Kündigungsrechte
   - Unklare Leistungsbeschreibungen
   - Klauseln die nach §§ 305-310 BGB unwirksam sein könnten

3. KONSISTENZ: Prüfe bei mehreren Dokumenten:
   - Abweichende Firmierungen (§ 17 HGB, § 4 GmbHG)
   - Fehlende Prioritätsregelung zwischen Dokumenten
   - Inkonsistenter Datenschutzrahmen
   - Komplexe Abhängigkeiten bei separaten Kündigungsregelungen

4. SALVATORISCHE KLAUSEL: Prüfe ob eine salvatorische Klausel vorhanden ist.

Verwende bei Rechtsgrundlagen IMMER konkrete Normen. Verbotene Formulierung: "Vertragsrecht".
Stattdessen:
- Für Haftung / Fahrlässigkeit → § 276 BGB (Verantwortlichkeit des Schuldners)
- Für Auslegungsprobleme, unklare Priorität, fehlende Rangfolge → §§ 133, 157 BGB (Auslegung von Willenserklärungen und Verträgen)
- Für Zahlungsfristen → § 271 BGB (Fälligkeit)
- Für Kündigung → § 314 BGB (außerordentlich) oder § 621 BGB (ordentlich bei Dienstverhältnis)
- Für AGB-Kontrolle / einseitige Klauseln → §§ 305–310 BGB
- Für DSGVO → Art. 28 DSGVO (Auftragsverarbeitung), Art. 13/14 DSGVO (Informationspflichten)
- Für Firmenrecht → § 17 HGB (Firma), § 4 GmbHG (Firmenbezeichnung GmbH)
- Für Gerichtsstand → § 38 ZPO
Das Feld "rechtsgrundlage" darf NIEMALS nur "Vertragsrecht" enthalten. Immer Paragraph + Gesetz + kurze Bezeichnung.

Antworte AUSSCHLIESSLICH als valides JSON ohne Markdown:
{
  "widersprueche": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "details": "string",
      "rechtsgrundlage": "string (z.B. § 38 ZPO, Art. 28 DSGVO – leer wenn unklar)",
      "konfidenz": "hoch | mittel | niedrig",
      "empfehlung": "string",
      "conflicts": {
        "clause1": "string",
        "clause2": "string"
      }
    }
  ],
  "risiken": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "details": "string",
      "severity": "Hoch | Mittel | Niedrig",
      "rechtsgrundlage": "string",
      "konfidenz": "hoch | mittel | niedrig",
      "empfehlung": "string",
      "moeglicherweise_unwirksam": true
    }
  ],
  "konsistenzProbleme": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "details": "string",
      "rechtsgrundlage": "string",
      "konfidenz": "hoch | mittel | niedrig",
      "empfehlung": "string",
      "documents": ["string"]
    }
  ],
  "salvatorische_klausel_vorhanden": true
}

Vertragstexte:
${documents.map((d, i) => `--- Dokument ${i + 1}: ${d.name} ---\n${d.text}`).join("\n\n")}
`;

  const responseText = await callAnalyzeApi(prompt);

  const cleaned = responseText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      "Die KI-Antwort konnte nicht verarbeitet werden. Bitte versuche es erneut."
    );
  }

  return {
    widersprueche: parsed.widersprueche ?? [],
    risiken: parsed.risiken ?? [],
    konsistenzProbleme: parsed.konsistenzProbleme ?? [],
    salvatorischeKlausel: parsed.salvatorische_klausel_vorhanden ?? false,
  };
}
