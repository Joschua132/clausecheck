# ClauseCheck – Projektbriefing für Claude Code

## Was ist ClauseCheck?

ClauseCheck ist eine Web-App zur KI-gestützten Prüfung von Verträgen.
Nutzer laden 1–3 PDF-Verträge hoch, die App analysiert diese und gibt eine
strukturierte Auswertung zurück: Widersprüche zwischen Klauseln, Risiko-Highlights
und Konsistenzprobleme bei mehreren Dokumenten.

**Zielgruppe:** Jurastudierende, Junior-Anwälte, Rechtsabteilungen  
**Sprache:** Deutsch (UI, Fehlermeldungen, Analyse-Output)  
**Deployment:** Vercel (als statische React-App)

---

## Wichtig: Figma AI hat bereits die UI als Code exportiert

Das Projekt startet NICHT bei null. Figma AI hat beide Screens bereits als
fertigen React-Code exportiert:

- `src/app/components/UploadPage.tsx` → Upload-Screen mit Drag & Drop, komplett fertig
- `src/app/components/ResultsPage.tsx` → Ergebnis-Screen mit expandierbaren Cards, komplett fertig
- `src/styles/theme.css` → Vollständiges Dark Theme (Navy/Glassmorphism)
- `src/app/components/ui/` → Alle shadcn/ui Komponenten bereits vorhanden

**Claude Code soll diese Komponenten NICHT neu schreiben.**
Stattdessen: Echte Logik einbauen wo aktuell noch Dummy-Daten stehen.

---

## Tech Stack

| Bereich | Technologie | Grund |
|---|---|---|
| Framework | Vite + React (bereits vorhanden) | Figma-Export-Basis, kein Umbau nötig |
| Styling | Tailwind CSS + theme.css | Bereits konfiguriert |
| PDF-Parsing | `pdfjs-dist` | Läuft im Browser, kein Server nötig |
| KI-Analyse | `@google/generative-ai` (Gemini 2.0 Flash) | Kostenloser Tier, gut für deutsche Texte |
| Routing | React Router (bereits vorhanden) | Im Figma-Export enthalten |
| Deployment | Vercel (statische App) | Kein Backend benötigt |

**Kein Next.js, kein separates Backend.** Alles läuft clientseitig.
Gemini API Key wird als `VITE_GEMINI_API_KEY` in `.env.local` gespeichert.

---

## Projektstruktur (Figma-Export als Basis)

```
clausecheck/
├── src/
│   ├── main.tsx                          # Entry point (bereits vorhanden)
│   ├── app/
│   │   ├── App.tsx                       # Router Setup (bereits vorhanden)
│   │   ├── components/
│   │   │   ├── UploadPage.tsx            # ✅ FERTIG – nur Logik ergänzen
│   │   │   ├── ResultsPage.tsx           # ✅ FERTIG – Dummy-Daten ersetzen
│   │   │   └── ui/                       # ✅ FERTIG – alle shadcn/ui Komponenten
│   └── styles/
│       ├── theme.css                     # ✅ FERTIG – Dark Navy Theme
│       └── globals.css                   # ✅ FERTIG
├── lib/                                  # NEU ERSTELLEN
│   ├── parsePdf.ts                       # pdfjs-dist Wrapper
│   └── analyzeContract.ts               # Gemini API Aufruf + Prompt
├── .env.local                            # VITE_GEMINI_API_KEY (nie committen!)
└── CLAUDE.md                             # Diese Datei
```

---

## Was Claude Code konkret tun soll

### Schritt 1: Dependencies installieren
```bash
npm install pdfjs-dist @google/generative-ai
```

### Schritt 2: `lib/parsePdf.ts` erstellen
- Nimmt eine `File` (PDF) entgegen
- Extrahiert den Text mit `pdfjs-dist` (browser-kompatibel)
- Gibt den reinen Text als `string` zurück
- Funktioniert für bis zu 3 Dateien gleichzeitig

### Schritt 3: `lib/analyzeContract.ts` erstellen
- Nimmt ein Array von `{ name: string, text: string }` entgegen
- Ruft Gemini 2.0 Flash auf mit dem Analyse-Prompt (siehe unten)
- Parst die JSON-Antwort und gibt ein typisiertes `AnalysisResult`-Objekt zurück
- Fehlerbehandlung: deutsche Fehlermeldungen

### Schritt 4: `UploadPage.tsx` anpassen
- Die echten File-Objekte beim Upload speichern (nicht nur Name+Größe)
- Beim Klick auf "Analyse starten":
  1. PDFs mit `parsePdf` extrahieren
  2. Loading-State anzeigen ("Analysiere Verträge...")
  3. `analyzeContract` aufrufen
  4. Ergebnis per React Router State an ResultsPage übergeben
- Fehlerzustand anzeigen wenn Analyse fehlschlägt

### Schritt 5: `ResultsPage.tsx` anpassen
- Dummy-Daten (`contradictions`, `risks`, `consistencyIssues`) entfernen
- Echte Daten aus React Router Location State lesen
- Falls kein State vorhanden: zurück zur UploadPage navigieren

---

## Gemini API Prompt

```typescript
const prompt = `
Du bist ein erfahrener Vertragsanwalt. Analysiere die folgenden Vertragstexte.

Aufgabe:
1. Finde alle logischen Widersprüche zwischen Klauseln – auch über mehrere Dokumente hinweg.
   Besonders: Rechte, die durch andere Pflichten, Fristen oder Bedingungen faktisch nicht ausübbar sind.
2. Identifiziere besonders riskante Klauseln (unlimitierte Haftung, einseitige Rechte, unklare Penalties, fehlende DSGVO-Regelungen).
3. Prüfe Konsistenz zwischen Dokumenten: gleiche Definitionen? Klare Rangfolge? Abweichende Firmierungen?

Antworte AUSSCHLIESSLICH als valides JSON, ohne Markdown oder Erklärungen:
{
  "widersprueche": [
    {
      "id": "c1",
      "title": "Kurzer Titel",
      "description": "Kurze Beschreibung",
      "details": "Ausführliche Erklärung",
      "conflicts": {
        "clause1": "Exakter Text Klausel 1",
        "clause2": "Exakter Text Klausel 2"
      }
    }
  ],
  "risiken": [
    {
      "id": "r1",
      "title": "Kurzer Titel",
      "description": "Kurze Beschreibung",
      "details": "Ausführliche Erklärung",
      "severity": "Hoch" | "Mittel" | "Niedrig"
    }
  ],
  "konsistenzProbleme": [
    {
      "id": "co1",
      "title": "Kurzer Titel",
      "description": "Kurze Beschreibung",
      "details": "Ausführliche Erklärung",
      "documents": ["Dateiname1.pdf", "Dateiname2.pdf"]
    }
  ]
}

Vertragstexte:
${documents.map((d, i) => `--- Dokument ${i + 1}: ${d.name} ---\n${d.text}`).join('\n\n')}
`;
```

---

## TypeScript Types

```typescript
// In lib/analyzeContract.ts definieren und in ResultsPage.tsx importieren

export interface ResultItem {
  id: string;
  title: string;
  description: string;
  details: string;
  severity?: "Hoch" | "Mittel" | "Niedrig";
  documents?: string[];
  conflicts?: { clause1: string; clause2: string };
}

export interface AnalysisResult {
  widersprueche: ResultItem[];
  risiken: ResultItem[];
  konsistenzProbleme: ResultItem[];
}
```

---

## Coding-Konventionen

- **TypeScript** überall – keine impliziten `any`
- Vorhandene Komponenten **nicht umschreiben** – nur ergänzen wo nötig
- **Fehlerbehandlung** immer mit deutschsprachigen Meldungen für den Nutzer
- `VITE_GEMINI_API_KEY` niemals hardcoden – immer aus `import.meta.env`
- Keine neuen npm-Pakete außer `pdfjs-dist` und `@google/generative-ai`
- Loading-States: einfaches `useState<boolean>` in UploadPage reicht

---

## Environment Variables

`.env.local` (nicht committen):
```
VITE_GEMINI_API_KEY=dein_schlüssel_hier
```

Gemini API Key kostenlos holen: https://aistudio.google.com/apikey

---

## Was Claude Code NICHT tun soll

- Die vorhandenen UI-Komponenten nicht neu schreiben
- Kein Backend, kein Next.js, keine Datenbank
- Kein User-Login / Auth
- Keine kostenpflichtigen APIs
- Keine unnötigen npm-Pakete

---

## Nächste Schritte zum Start

1. Figma-Export-Ordner als Basis verwenden (bereits vorhanden)
2. `npm install` ausführen
3. `npm install pdfjs-dist @google/generative-ai` ausführen
4. `.env.local` mit Gemini API Key anlegen
5. Mit Claude Code: Schritt 2–5 aus "Was Claude Code tun soll" abarbeiten