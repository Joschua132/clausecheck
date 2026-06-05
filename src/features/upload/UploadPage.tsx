/**
 * @file UploadPage.tsx
 * @description Upload-Screen mit Drag & Drop für bis zu 3 PDF-Dateien.
 * Orchestriert die Analyse-Pipeline: PDF-Parsing → Gemini-Analyse → Navigation.
 */

import { useState, useRef } from "react";
import {
  Upload,
  FileCheck,
  AlertTriangle,
  CheckCircle,
  X,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router";
import { parseMultiplePdfs } from "../../services/pdfParser.service";
import { analyzeContract } from "../../services/contractAnalysis.service";
import { useRateLimit } from "../../hooks/useRateLimit";

/**
 * Validiert eine hochgeladene Datei auf Magic Bytes und Größe.
 * Client-seitige Prüfung dient der UX – keine Sicherheitsgarantie.
 * @throws {Error} mit deutschem Fehlertext wenn Validierung fehlschlägt
 */
async function validatePdfFile(file: File): Promise<void> {
  // Größenlimit: 10MB pro Datei
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error(`"${file.name}" ist zu groß (max. 10 MB).`);
  }

  // MIME-Type Prüfung (kann vom Browser umgangen werden – nur erste Prüfung)
  if (file.type !== 'application/pdf') {
    throw new Error(`"${file.name}" ist keine PDF-Datei.`);
  }

  // Magic Bytes Prüfung (PDF beginnt immer mit %PDF)
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer).slice(0, 4);
  const header = String.fromCharCode(...bytes);
  if (header !== '%PDF') {
    throw new Error(`"${file.name}" ist keine gültige PDF-Datei.`);
  }
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  file: File;
}

export function UploadPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { checkAndRecord, isLimited } = useRateLimit();
  const navigate = useNavigate();
  const detailsRef = useRef<HTMLDivElement>(null);

  const scrollToDetails = () => {
    detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files)
      .filter((file) => file.type === "application/pdf")
      .slice(0, 3 - files.length);

    addFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).slice(0, 3 - files.length);
      addFiles(selectedFiles);
    }
  };

  const addFiles = (newFiles: File[]) => {
    const uploadedFiles: UploadedFile[] = newFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      file,
    }));

    setFiles((prev) => [...prev, ...uploadedFiles].slice(0, 3));
    setError(null);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleAnalyze = async () => {
    if (files.length === 0 || isLoading || isLimited) return;
    if (!checkAndRecord()) {
      setError('Zu viele Analysen. Bitte warte eine Minute.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      for (const f of files) {
        await validatePdfFile(f.file);
      }
      const documents = await parseMultiplePdfs(files.map((f) => f.file));
      const result = await analyzeContract(documents);
      navigate("/results", { state: { result } });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unbekannter Fehler bei der Analyse."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradient and grid */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy via-background to-navy-light opacity-50"></div>
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      ></div>

      {/* Radial gradient spotlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-500/5 rounded-full blur-3xl"></div>

      <div className="relative z-10">
        <header className="border-b border-border/50 backdrop-blur-xl bg-card/30">
          <div className="max-w-6xl mx-auto px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-white to-gray-300 flex items-center justify-center shadow-lg">
                <FileCheck className="w-6 h-6 text-navy" />
              </div>
              <div>
                <h1 className="text-foreground">ClauseCheck</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Verträge intelligent prüfen
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-8 py-20">
          <div className="max-w-3xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-muted-foreground">
                  KI-gestützte Vertragsanalyse
                </span>
              </div>
              <h2 className="text-4xl mb-4 text-foreground">
                Vertragsprüfung in Sekunden
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Laden Sie Ihre Verträge hoch und erhalten Sie eine detaillierte Analyse
                von Widersprüchen, Risiken und Inkonsistenzen.
              </p>
            </div>

            {/* Upload Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative border-2 border-dashed rounded-3xl p-20 text-center cursor-pointer
                transition-all duration-300 backdrop-blur-sm
                ${
                  isDragging
                    ? "border-white/40 bg-white/10 scale-[1.01]"
                    : "border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/8"
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="flex flex-col items-center gap-5">
                <div
                  className={`
                  w-24 h-24 rounded-2xl flex items-center justify-center transition-all duration-300
                  ${
                    isDragging
                      ? "bg-gradient-to-br from-white to-gray-200 shadow-2xl scale-110"
                      : "bg-gradient-to-br from-white/10 to-white/5 border border-white/10"
                  }
                `}
                >
                  <Upload
                    className={`w-12 h-12 transition-colors ${
                      isDragging ? "text-navy" : "text-white"
                    }`}
                  />
                </div>

                <div>
                  <p className="text-foreground text-lg mb-2">
                    PDFs hier ablegen oder klicken
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Bis zu 3 Dateien • Nur PDF-Format • Max. 10 MB pro Datei
                  </p>
                </div>
              </div>
            </div>

            {/* Uploaded Files */}
            {files.length > 0 && (
              <div className="mt-8 space-y-3">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-5 py-4 hover:bg-white/8 transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0 border border-white/10">
                      <FileCheck className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(file.id);
                      }}
                      className="w-9 h-9 rounded-xl hover:bg-white/10 flex items-center justify-center transition-colors flex-shrink-0"
                    >
                      <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Features Grid */}
            <div className="mt-16 grid grid-cols-3 gap-5">
              <button
                onClick={scrollToDetails}
                className="group flex flex-col items-center text-center gap-4 p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all cursor-pointer"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform">
                  <AlertTriangle className="w-7 h-7 text-amber-400" />
                </div>
                <p className="text-sm text-foreground">Widersprüche erkennen</p>
              </button>

              <button
                onClick={scrollToDetails}
                className="group flex flex-col items-center text-center gap-4 p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all cursor-pointer"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500/20 to-pink-500/20 flex items-center justify-center border border-red-500/20 group-hover:scale-110 transition-transform">
                  <AlertTriangle className="w-7 h-7 text-red-400" />
                </div>
                <p className="text-sm text-foreground">Risiken markieren</p>
              </button>

              <button
                onClick={scrollToDetails}
                className="group flex flex-col items-center text-center gap-4 p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all cursor-pointer"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center border border-green-500/20 group-hover:scale-110 transition-transform">
                  <CheckCircle className="w-7 h-7 text-green-400" />
                </div>
                <p className="text-sm text-foreground">Konsistenz prüfen</p>
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div className="mt-6 px-5 py-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* CTA Button */}
            <button
              onClick={handleAnalyze}
              disabled={files.length === 0 || isLoading || isLimited}
              className={`
                mt-6 w-full py-5 rounded-2xl transition-all duration-300 relative overflow-hidden group
                ${
                  files.length > 0 && !isLoading && !isLimited
                    ? "bg-gradient-to-r from-white to-gray-200 text-navy shadow-2xl shadow-white/20 hover:shadow-white/30 hover:scale-[1.02]"
                    : "bg-white/5 text-muted-foreground cursor-not-allowed border border-white/10"
                }
              `}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analysiere Verträge...
                  </>
                ) : (
                  "Analyse starten"
                )}
              </span>
              {files.length > 0 && !isLoading && !isLimited && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              )}
            </button>

            {/* Detailed Explanations Section */}
            <div ref={detailsRef} className="mt-32 pt-16 border-t border-white/10">
              <div className="text-center mb-12">
                <h3 className="text-2xl text-foreground mb-3">
                  Wie funktioniert die Analyse?
                </h3>
                <p className="text-muted-foreground">
                  Unsere KI prüft Ihre Verträge auf drei kritische Bereiche
                </p>
              </div>

              <div className="space-y-8">
                {/* Widersprüche */}
                <div className="p-8 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 backdrop-blur-sm">
                  <div className="flex gap-6">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/30 flex items-center justify-center border border-amber-500/30 flex-shrink-0">
                      <AlertTriangle className="w-8 h-8 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-foreground text-lg mb-3">
                        Widersprüche erkennen
                      </h4>
                      <p className="text-muted-foreground leading-relaxed mb-4">
                        Unsere KI-Engine durchsucht Ihre Verträge nach sich widersprechenden
                        Klauseln und Regelungen. Sie identifiziert automatisch Paragraphen,
                        die inkonsistente oder widersprüchliche Aussagen enthalten – zum
                        Beispiel unterschiedliche Kündigungsfristen oder gegensätzliche
                        Haftungsregelungen.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1.5 rounded-lg bg-white/10 text-sm text-foreground/80 border border-white/10">
                          Kündigungsfristen
                        </span>
                        <span className="px-3 py-1.5 rounded-lg bg-white/10 text-sm text-foreground/80 border border-white/10">
                          Haftungsklauseln
                        </span>
                        <span className="px-3 py-1.5 rounded-lg bg-white/10 text-sm text-foreground/80 border border-white/10">
                          Zahlungsbedingungen
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Risiken */}
                <div className="p-8 rounded-2xl bg-gradient-to-br from-red-500/10 to-pink-500/10 border border-red-500/20 backdrop-blur-sm">
                  <div className="flex gap-6">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-red-500/30 to-pink-500/30 flex items-center justify-center border border-red-500/30 flex-shrink-0">
                      <AlertTriangle className="w-8 h-8 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-foreground text-lg mb-3">Risiken markieren</h4>
                      <p className="text-muted-foreground leading-relaxed mb-4">
                        Die Analyse bewertet jede Klausel auf potenzielle rechtliche und
                        finanzielle Risiken. Fehlende DSGVO-Klauseln, einseitige
                        Preisanpassungen oder unklare Leistungsbeschreibungen werden
                        automatisch erkannt und nach Schweregrad (Hoch, Mittel, Niedrig)
                        kategorisiert.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1.5 rounded-lg bg-white/10 text-sm text-foreground/80 border border-white/10">
                          DSGVO-Compliance
                        </span>
                        <span className="px-3 py-1.5 rounded-lg bg-white/10 text-sm text-foreground/80 border border-white/10">
                          Preisgestaltung
                        </span>
                        <span className="px-3 py-1.5 rounded-lg bg-white/10 text-sm text-foreground/80 border border-white/10">
                          Gewährleistung
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Konsistenz */}
                <div className="p-8 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 backdrop-blur-sm">
                  <div className="flex gap-6">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-500/30 to-emerald-500/30 flex items-center justify-center border border-green-500/30 flex-shrink-0">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-foreground text-lg mb-3">Konsistenz prüfen</h4>
                      <p className="text-muted-foreground leading-relaxed mb-4">
                        Bei mehreren Dokumenten überprüft das System die Konsistenz zwischen
                        allen hochgeladenen Dateien. Abweichende Firmierungen,
                        unterschiedliche Daten oder variierende Angaben werden sofort erkannt
                        und mit Quellenangabe dokumentiert.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1.5 rounded-lg bg-white/10 text-sm text-foreground/80 border border-white/10">
                          Firmierungen
                        </span>
                        <span className="px-3 py-1.5 rounded-lg bg-white/10 text-sm text-foreground/80 border border-white/10">
                          Datumsangaben
                        </span>
                        <span className="px-3 py-1.5 rounded-lg bg-white/10 text-sm text-foreground/80 border border-white/10">
                          Dokumentenreferenzen
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
