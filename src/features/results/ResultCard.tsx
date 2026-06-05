/**
 * @file ResultCard.tsx
 * @description Expandierbare Karte für eine Analysekategorie.
 * Zeigt Widersprüche, Risiken oder Konsistenzprobleme mit Detail-Ansicht.
 */

import { useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  FileText,
  TrendingDown,
  TrendingUp,
  Minus,
} from "lucide-react";
import type { ResultItem } from "../../types/analysis";

export function ResultCard({
  title,
  items,
  icon: Icon,
  accentColor,
  type,
}: {
  title: string;
  items: ResultItem[];
  icon: any;
  accentColor: string;
  type: "contradiction" | "risk" | "consistency";
}) {
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all">
      <div className={`px-6 py-4 border-b border-white/10 ${accentColor}`}>
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-foreground" />
          <h3 className="text-foreground">{title}</h3>
          <span className="ml-auto text-sm text-muted-foreground px-2.5 py-1 rounded-lg bg-white/10">
            {items.length}
          </span>
        </div>
      </div>

      <div className="divide-y divide-white/10">
        {items.map((item) => {
          const isExpanded = expandedIds.includes(item.id);

          return (
            <div key={item.id}>
              <button
                onClick={() => toggleExpand(item.id)}
                className="w-full px-6 py-5 text-left hover:bg-white/5 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                        marginBottom: "4px",
                      }}
                    >
                      <p className="text-foreground" style={{ flex: 1, minWidth: 0 }}>
                        {item.title}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          flexShrink: 0,
                        }}
                      >
                        {item.konfidenz && !item.severity && (
                          <span
                            className={`
                              px-2.5 py-1 rounded-lg text-xs border
                              ${item.konfidenz === "hoch" ? "bg-green-500/10 text-green-400 border-green-500/30" : ""}
                              ${item.konfidenz === "mittel" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" : ""}
                              ${item.konfidenz === "niedrig" ? "bg-white/5 text-muted-foreground border-white/10" : ""}
                            `}
                          >
                            {item.konfidenz}
                          </span>
                        )}
                        {item.severity && (
                          <span
                            className={`
                              px-3 py-1 rounded-lg text-xs border
                              ${item.severity === "Hoch" ? "bg-danger-bg text-danger border-danger/30" : ""}
                              ${item.severity === "Mittel" ? "bg-warning-bg text-warning border-warning/30" : ""}
                              ${item.severity === "Niedrig" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" : ""}
                            `}
                          >
                            {item.severity === "Hoch" && (
                              <TrendingUp className="w-3 h-3 inline mr-1" />
                            )}
                            {item.severity === "Mittel" && (
                              <Minus className="w-3 h-3 inline mr-1" />
                            )}
                            {item.severity === "Niedrig" && (
                              <TrendingDown className="w-3 h-3 inline mr-1" />
                            )}
                            {item.severity}
                          </span>
                        )}
                      </div>
                    </div>
                    {item.rechtsgrundlage && (
                      <p className="text-xs text-muted-foreground/60 mb-1">
                        {item.rechtsgrundlage}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="px-6 pb-6 pt-2 bg-white/5">
                  <div className="pl-8 space-y-4">
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      {item.details}
                    </p>

                    {type === "risk" && item.moeglicherweise_unwirksam && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        Möglicherweise unwirksam (§ 307 BGB)
                      </div>
                    )}

                    {item.empfehlung && (
                      <div className="px-4 py-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
                        <p className="text-xs text-blue-400/80 mb-1">Empfehlung</p>
                        <p className="text-sm text-foreground/80">{item.empfehlung}</p>
                      </div>
                    )}

                    {item.conflicts && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                          <p className="text-xs text-muted-foreground mb-2">Klausel 1</p>
                          <p className="text-sm text-foreground/90">
                            {item.conflicts.clause1}
                          </p>
                        </div>
                        <div className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                          <p className="text-xs text-muted-foreground mb-2">Klausel 2</p>
                          <p className="text-sm text-foreground/90">
                            {item.conflicts.clause2}
                          </p>
                        </div>
                      </div>
                    )}

                    {item.documents && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">
                          Betroffene Dokumente:
                        </p>
                        <div className="flex gap-2">
                          {item.documents.map((doc, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 px-3 py-2 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10"
                            >
                              <FileText className="w-4 h-4 text-blue-400" />
                              <span className="text-sm text-foreground/90">{doc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
