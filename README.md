# ClauseCheck ⚖️

**KI-gestützte Vertragsanalyse für Juristen und Rechtsabteilungen**

ClauseCheck analysiert bis zu 3 deutsche Vertrags-PDFs gleichzeitig und
identifiziert Widersprüche zwischen Klauseln, rechtliche Risiken und
Konsistenzprobleme über mehrere Dokumente hinweg.

---

## Features

- **Widerspruchsanalyse** – Erkennt kollidierenede Klauseln (z.B.
  widersprüchliche Haftungsgrenzen, abweichende Fristen)
- **Risiko-Highlights** – Bewertet Klauseln nach Schweregrad mit
  Rechtsgrundlagen (§§ BGB, DSGVO, ZPO)
- **Konsistenzprüfung** – Vergleicht Definitionen, Firmierungen und
  Regelungen über mehrere Dokumente
- **§ 307 BGB Check** – Markiert AGB-Klauseln, die einer
  Inhaltskontrolle möglicherweise nicht standhalten
- **DSGVO-Compliance** – Prüft auf fehlende AVV-Regelungen nach Art. 28 DSGVO

---

## Tech Stack

| Schicht | Technologie | Begründung |
|---|---|---|
| UI Framework | React 18 + Vite | Schnelle Builds, HMR, kein SSR nötig |
| Styling | Tailwind CSS + shadcn/ui | Konsistentes Design-System |
| PDF-Parsing | pdfjs-dist | Browser-native, kein Backend erforderlich |
| KI-Analyse | Google Gemini 2.5 Flash | Kostenloser Tier, stark bei deutschen Rechtstexten |
| Routing | React Router v7 | Client-seitiges Routing mit State-Übergabe |
| Typsystem | TypeScript (strict) | Vollständige Typsicherheit aller Domain-Objekte |
| Deployment | Vercel | Statisches Hosting, keine Serverinfrastruktur |

---

## Architektur

```
src/
├── types/                        # Zentrale Domain-Typen
│   └── analysis.ts               # AnalysisResult, ResultItem, DocumentInput
│
├── services/                     # Business Logic (framework-agnostisch)
│   ├── pdfParser.service.ts      # PDF → Text (pdfjs-dist)
│   └── contractAnalysis.service.ts  # Text → AnalysisResult (Gemini API)
│
├── features/                     # Feature-Module (UI-Schicht)
│   ├── upload/
│   │   └── UploadPage.tsx        # Drag & Drop Upload + Analyse-Trigger
│   └── results/
│       ├── ResultsPage.tsx       # Ergebnis-Übersicht mit Statistiken
│       └── ResultCard.tsx        # Expandierbare Ergebnis-Karte
│
├── app/
│   ├── App.tsx                   # Router-Konfiguration
│   ├── components/ui/            # Wiederverwendbare UI-Komponenten (shadcn)
│   └── main.tsx                  # Entry Point
│
└── styles/
    ├── theme.css                 # Design Tokens (Dark Navy Theme)
    └── globals.css
```

**Architektur-Prinzipien:**

- **Service Layer**: Alle KI- und Parser-Logik ist framework-unabhängig in
  `services/` gekapselt und kann unabhängig von der UI getestet werden
- **Feature Isolation**: Jedes Feature (`upload`, `results`) besitzt seine
  eigenen Komponenten und kann unabhängig weiterentwickelt werden
- **Single Source of Truth**: Domain-Typen leben ausschließlich in `types/` –
  keine doppelten Interface-Definitionen
- **Zero Backend**: Die App läuft vollständig clientseitig; der Gemini API Key
  wird niemals an einen eigenen Server übermittelt

---

## Analyse-Pipeline

```
PDF Upload (1–3 Dateien)
       │
       ▼
pdfParser.service.ts
(pdfjs-dist → Rohtext)
       │
       ▼
contractAnalysis.service.ts
(Gemini 2.5 Flash API)
(Strukturierter Prompt → JSON)
       │
       ▼
AnalysisResult (typisiert)
       │
       ▼
ResultsPage (React Router State)
```

---

## Setup

### Voraussetzungen

- Node.js ≥ 18
- Gemini API Key (kostenlos: https://aistudio.google.com/apikey)

### Installation

```bash
git clone https://github.com/dein-username/clausecheck.git
cd clausecheck
npm install
```

### Umgebungsvariablen

```bash
cp .env.example .env.local
# VITE_GEMINI_API_KEY in .env.local eintragen
```

### Entwicklung

```bash
npm run dev
```

### Build

```bash
npm run build
npm run preview
```

---

## Lizenz

MIT

---

*Gebaut mit Figma AI (UI-Design) + Claude Code (Implementierung) + Google Gemini (Analyse-Engine)*
