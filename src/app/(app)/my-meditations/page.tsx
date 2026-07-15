"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Search,
  Calendar,
  Sun,
  Moon,
  Eye,
  Sparkles,
  ArrowUpDown,
  Heart,
  Layers,
  BookMarked,
  Clock,
} from "lucide-react";
import { format, parseISO, isToday, isYesterday, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { fr } from "date-fns/locale";

// === Parsing helpers for notes ===
interface ParsedNotes {
  verseRef: string;
  verseText: string;
  theme: string;
  notes_excerpt: string;
  summary: string;
  prayer: string;
}

function parseNotes(notes: string | null): ParsedNotes {
  const empty: ParsedNotes = {
    verseRef: "",
    verseText: "",
    theme: "",
    notes_excerpt: "",
    summary: "",
    prayer: "",
  };
  if (!notes) return empty;

  // Extract verse reference (first line starting with [VERS DU JOUR] or similar)
  const verseRefMatch = notes.match(/\[VERS DU JOUR\][\s\S]*?([A-Za-zÉéÀàÊêÎîÔôÛû]+)\s+(\d+):(\d+)/);
  const verseRef = verseRefMatch ? `${verseRefMatch[1]} ${verseRefMatch[2]}:${verseRefMatch[3]}` : "";

  // Extract verse text (between :" and " (Theme :))
  const verseTextMatch = notes.match(/: "([^"]+)"/);
  const verseText = verseTextMatch ? verseTextMatch[1] : "";

  // Extract theme
  const themeMatch = notes.match(/Thème\s*:\s*([^\n]+)/);
  const theme = themeMatch ? themeMatch[1].trim() : "";

  // Extract summary (between "Ce que Dieu m'a dit" markers if they exist)
  const summaryMatch = notes.match(/Ce que Dieu m'a dit[\s\S]*?(\d+\.\s*[^\n]+)/);
  const summary = summaryMatch ? summaryMatch[1].trim() : "";

  // Extract prayer
  const prayerMatch = notes.match(/\[PRIÈRE REÇUE\][\s\S]*?"([^"]+)"/);
  const prayer = prayerMatch ? prayerMatch[1] : "";

  // Build notes excerpt (first ~150 chars of meaningful content)
  const lines = notes.split("\n").filter(l => l.trim() && !l.startsWith("===") && !l.startsWith("["));
  const excerpt = lines.slice(0, 5).join(" ").substring(0, 200);

  return {
    verseRef,
    verseText,
    theme,
    notes_excerpt: excerpt + (excerpt.length >= 200 ? "..." : ""),
    summary,
    prayer,
  };
}

// === Group sessions by date category ===
type DateGroup = "today" | "yesterday" | "this_week" | "older";

interface GroupedSessions {
  label: string;
  dateKey: string;
  sessions: SessionCard[];
}

interface SessionCard {
  id: string;
  type: string;
  period: string;
  xpEarned: number;
  duration: number;
  createdAt: string;
  parsed: ParsedNotes;
}

function getDateGroup(date: Date): DateGroup {
  if (isToday(date)) return "today";
  if (isYesterday(date)) return "yesterday";
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  if (isWithinInterval(date, { start: weekStart, end: weekEnd })) return "this_week";
  return "older";
}

function getGroupLabel(date: Date): string {
  if (isToday(date)) return "Aujourd'hui";
  if (isYesterday(date)) return "Hier";
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  if (isWithinInterval(date, { start: weekStart, end: weekEnd })) return "Cette semaine";
  return format(date, "MMMM yyyy", { locale: fr });
}

function formatDate(dateStr: string): string {
  const d = parseISO(dateStr);
  if (isToday(d)) return `Aujourd'hui à ${format(d, "HH:mm")}`;
  if (isYesterday(d)) return `Hier à ${format(d, "HH:mm")}`;
  return format(d, "d MMMM yyyy 'à' HH:mm", { locale: fr });
}

export default function MyMeditationsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [sortAsc, setSortAsc] = useState(false);

  // Fetch sessions
  useEffect(() => {
    async function fetchSessions() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/meditations");
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Erreur lors du chargement");
        }
        const data = await res.json();
        const cards: SessionCard[] = (data.sessions || []).map((s: any) => ({
          id: s.id,
          type: s.type,
          period: s.period,
          xpEarned: s.xpEarned,
          duration: s.duration,
          createdAt: s.createdAt,
          parsed: parseNotes(s.notes),
        }));
        setSessions(cards);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    }
    fetchSessions();
  }, []);

  // Filtering logic
  const filteredSessions = useMemo(() => {
    let result = [...sessions];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) => {
        const p = s.parsed;
        return (
          p.verseRef.toLowerCase().includes(q) ||
          p.verseText.toLowerCase().includes(q) ||
          p.notes_excerpt.toLowerCase().includes(q) ||
          p.summary.toLowerCase().includes(q) ||
          p.prayer.toLowerCase().includes(q) ||
          p.theme.toLowerCase().includes(q)
        );
      });
    }

    // Month filter (YYYY-MM)
    if (monthFilter) {
      result = result.filter((s) => {
        const d = parseISO(s.createdAt);
        const ym = format(d, "yyyy-MM");
        return ym === monthFilter;
      });
    }

    // Sort
    result.sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortAsc ? diff : -diff;
    });

    return result;
  }, [sessions, searchQuery, monthFilter, sortAsc]);

  // Group by date category
  const grouped = useMemo(() => {
    const groupsMap = new Map<string, SessionCard[]>();

    filteredSessions.forEach((s) => {
      const d = parseISO(s.createdAt);
      const groupLabel = getGroupLabel(d);
      const dateKey = format(d, "yyyy-MM-dd");
      const key = `${groupLabel}::${dateKey}`;
      if (!groupsMap.has(key)) {
        groupsMap.set(key, []);
      }
      groupsMap.get(key)!.push(s);
    });

    const result: GroupedSessions[] = [];
    // Sort groups by date descending
    const sortedKeys = Array.from(groupsMap.keys()).sort((a, b) => {
      const dateA = a.split("::")[1];
      const dateB = b.split("::")[1];
      return dateB.localeCompare(dateA);
    });

    sortedKeys.forEach((key) => {
      const [label] = key.split("::");
      const dateKey = key.split("::")[1];
      result.push({
        label,
        dateKey,
        sessions: groupsMap.get(key)!,
      });
    });

    return result;
  }, [filteredSessions]);

  // Get current month value for the input
  const currentMonth = monthFilter || format(new Date(), "yyyy-MM");

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 pb-24 md:pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <BookMarked className="w-8 h-8 text-indigo-600" />
            Mes Méditations
          </h1>
          <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">
            {sessions.length === 0
              ? "Commencez votre première méditation aujourd'hui !"
              : `${sessions.length} session${sessions.length > 1 ? "s" : ""} de méditation enregistrée${sessions.length > 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 md:p-5 shadow-sm space-y-3 md:space-y-0 md:flex md:items-center md:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par mot-clé, verset, thème..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-700 transition"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-700 transition w-full md:w-auto"
            />
          </div>

          <button
            onClick={() => setSortAsc(!sortAsc)}
            className={cn(
              "p-2.5 rounded-xl border transition text-sm font-bold flex items-center gap-1.5",
              sortAsc
                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                : "bg-slate-50 dark:bg-slate-700/60 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:text-slate-700"
            )}
            title={sortAsc ? "Du plus récent au plus ancien" : "Du plus ancien au plus récent"}
          >
            <ArrowUpDown className="w-4 h-4" />
            <span className="hidden md:inline text-xs">{sortAsc ? "↑" : "↓"}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold text-slate-400">Chargement de vos méditations...</span>
        </div>
      ) : error ? (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 p-8 rounded-3xl text-center space-y-4 max-w-md mx-auto">
          <p className="text-rose-600 dark:text-rose-400 font-bold text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-sm shadow-md transition"
          >
            Réessayer
          </button>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-6 text-center">
          <BookMarked className="w-16 h-16 text-slate-300 dark:text-slate-600" />
          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-600 dark:text-slate-400">
              {searchQuery || monthFilter
                ? "Aucune méditation trouvée"
                : "Commencez votre première méditation aujourd'hui !"}
            </h3>
            <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 max-w-sm">
              {searchQuery || monthFilter
                ? "Essayez de modifier vos filtres ou votre recherche."
                : "La méditation quotidienne vous permet de grandir spirituellement et de recevoir la Parole de Dieu."}
            </p>
          </div>
          {!searchQuery && !monthFilter && (
            <button
              onClick={() => router.push("/meditate")}
              className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-lg transition"
            >
              Commencer à méditer
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <div key={group.dateKey} className="space-y-3">
              <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
                {group.label}
                <span className="ml-2 text-slate-300 dark:text-slate-600 font-bold">
                  — {group.sessions.length} session{group.sessions.length > 1 ? "s" : ""}
                </span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {group.sessions.map((session) => {
                  const d = parseISO(session.createdAt);
                  const isMorning = session.period === "morning";
                  return (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition-all group cursor-pointer"
                      onClick={() => router.push(`/meditate?sessionId=${session.id}`)}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Period badge */}
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                              isMorning
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            )}
                          >
                            {isMorning ? (
                              <Sun className="w-3 h-3" />
                            ) : (
                              <Moon className="w-3 h-3" />
                            )}
                            {isMorning ? "Matin" : "Soir"}
                          </span>

                          {/* Type badge */}
                          {session.type !== "classic" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-200">
                              {session.type}
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 whitespace-nowrap">
                          <Clock className="w-3 h-3" />
                          {format(d, "HH:mm")}
                        </span>
                      </div>

                      {/* Verse */}
                      <div className="space-y-2 mb-3">
                        {session.parsed.verseRef && (
                          <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wide block">
                            {session.parsed.verseRef}
                          </span>
                        )}
                        {session.parsed.verseText && (
                          <blockquote className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-2 italic">
                            « {session.parsed.verseText} »
                          </blockquote>
                        )}
                        {session.parsed.theme && (
                          <span className="inline-block px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-full">
                            {session.parsed.theme}
                          </span>
                        )}
                      </div>

                      {/* Notes excerpt */}
                      {session.parsed.notes_excerpt && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-2 mb-3 bg-slate-50 dark:bg-slate-700/40 p-2.5 rounded-xl">
                          {session.parsed.notes_excerpt}
                        </div>
                      )}

                      {/* Summary teaser */}
                      {session.parsed.summary && (
                        <div className="flex items-start gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-2">
                          <Sparkles className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{session.parsed.summary}</span>
                        </div>
                      )}

                      {/* Prayer teaser */}
                      {session.parsed.prayer && (
                        <div className="flex items-start gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold">
                          <Heart className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-1 italic">« {session.parsed.prayer} »</span>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                          <Layers className="w-3 h-3" />
                          +{session.xpEarned} XP
                        </div>
                        <span className="text-[10px] font-bold text-indigo-500 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          <Eye className="w-3 h-3" />
                          Voir
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}