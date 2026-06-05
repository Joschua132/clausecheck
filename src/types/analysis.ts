/**
 * @file analysis.ts
 * @description Zentrale Domain-Typen für die Vertragsanalyse.
 * Alle Komponenten und Services importieren Types ausschließlich von hier.
 */

/**
 * Ein einzelnes Analyseergebnis (Widerspruch, Risiko oder Konsistenzproblem).
 */
export interface ResultItem {
  id: string;
  title: string;
  description: string;
  details: string;
  /** Nur bei Risiken: Schweregrad */
  severity?: "Hoch" | "Mittel" | "Niedrig";
  /** Nur bei Konsistenzproblemen: betroffene Dokumente */
  documents?: string[];
  /** Nur bei Widersprüchen: die kollidierenden Klauseln */
  conflicts?: { clause1: string; clause2: string };
  /** Rechtliche Grundlage (§ BGB / ZPO / DSGVO etc.) */
  rechtsgrundlage?: string;
  /** Analyseempfehlung an den Nutzer */
  empfehlung?: string;
  /** Konfidenz der KI-Analyse */
  konfidenz?: "hoch" | "mittel" | "niedrig";
  /** Ob die Klausel möglicherweise nach § 307 BGB unwirksam ist */
  moeglicherweise_unwirksam?: boolean;
}

/**
 * Vollständiges Ergebnisobjekt der Gemini-Analyse.
 */
export interface AnalysisResult {
  widersprueche: ResultItem[];
  risiken: ResultItem[];
  konsistenzProbleme: ResultItem[];
  salvatorischeKlausel?: boolean;
}

/**
 * Eingabe für den Analyse-Service: extrahierter PDF-Text mit Dateiname.
 */
export interface DocumentInput {
  name: string;
  text: string;
}
