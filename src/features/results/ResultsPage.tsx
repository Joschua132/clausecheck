/**
 * @file ResultsPage.tsx
 * @description Ergebnis-Screen mit Statistiken und expandierbaren Analysekarten.
 * Liest das AnalysisResult aus dem React Router Location State.
 */

import { FileCheck, AlertTriangle, FileText, ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import type { AnalysisResult } from "../../types/analysis";
import { ResultCard } from "./ResultCard";

export function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const result = (location.state as { result: AnalysisResult } | null)?.result;

  if (!result) {
    navigate("/", { replace: true });
    return null;
  }

  const contradictions = result.widersprueche;
  const risks = result.risiken;
  const consistencyIssues = result.konsistenzProbleme;

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

      <div className="relative z-10">
        <header className="border-b border-white/10 backdrop-blur-xl bg-card/50 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-8 py-6">
            <div className="flex items-center justify-between">
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

              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-foreground hover:bg-white/15 hover:border-white/20 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Neue Analyse
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-8 py-12">
          {/* Stats Summary */}
          <div className="mb-10 p-8 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 shadow-2xl">
            <div className="flex items-center gap-12 justify-center">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/20 to-pink-500/20 flex items-center justify-center border border-red-500/20">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <div>
                  <p className="text-3xl text-foreground">{contradictions.length}</p>
                  <p className="text-sm text-muted-foreground mt-1">Widersprüche</p>
                </div>
              </div>

              <div className="w-px h-16 bg-white/10"></div>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/20">
                  <AlertTriangle className="w-8 h-8 text-amber-400" />
                </div>
                <div>
                  <p className="text-3xl text-foreground">{risks.length}</p>
                  <p className="text-sm text-muted-foreground mt-1">Risiken</p>
                </div>
              </div>

              <div className="w-px h-16 bg-white/10"></div>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/20">
                  <FileText className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <p className="text-3xl text-foreground">{consistencyIssues.length}</p>
                  <p className="text-sm text-muted-foreground mt-1">Konsistenzprobleme</p>
                </div>
              </div>

              <div className="w-px h-16 bg-white/10"></div>

              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm ${
                  result.salvatorischeKlausel
                    ? "bg-green-500/10 border-green-500/30 text-green-400"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                }`}
              >
                {result.salvatorischeKlausel ? "✓" : "⚠"} Salvatorische Klausel{" "}
                {result.salvatorischeKlausel ? "vorhanden" : "nicht gefunden"}
              </div>
            </div>
          </div>

          {/* Results Cards */}
          <div className="space-y-6">
            <ResultCard
              title="⚠️ Widersprüche"
              items={contradictions}
              icon={AlertTriangle}
              accentColor="bg-gradient-to-r from-red-500/10 to-pink-500/10"
              type="contradiction"
            />

            <ResultCard
              title="🔴 Risiken"
              items={risks}
              icon={AlertTriangle}
              accentColor="bg-gradient-to-r from-amber-500/10 to-orange-500/10"
              type="risk"
            />

            <ResultCard
              title="📋 Konsistenz"
              items={consistencyIssues}
              icon={FileText}
              accentColor="bg-gradient-to-r from-blue-500/10 to-purple-500/10"
              type="consistency"
            />
          </div>
        </main>
      </div>
    </div>
  );
}
