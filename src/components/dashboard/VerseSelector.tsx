"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, Search, ChevronDown } from "lucide-react";

interface BibleBook {
  name: string;
  chapters: number;
}

export default function VerseSelector() {
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [selectedBook, setSelectedBook] = useState("");
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [selectedVerse, setSelectedVerse] = useState(1);
  const [chapters, setChapters] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les livres
  useEffect(() => {
    async function loadBooks() {
      try {
        const res = await fetch("/api/bible/books");
        if (res.ok) {
          const data = await res.json();
          setBooks(data);
        }
      } catch (err) {
        console.error("Erreur chargement des livres:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBooks();
  }, []);

  // Mettre à jour les chapitres quand un livre est sélectionné
  useEffect(() => {
    if (selectedBook) {
      const book = books.find((b) => b.name === selectedBook);
      if (book) {
        queueMicrotask(() => {
          setChapters(Array.from({ length: book.chapters }, (_, i) => i + 1));
          setSelectedChapter(1);
          setSelectedVerse(1);
        });
      }
    }
  }, [selectedBook, books]);

  const maxVerse = 176; // Psaumes 119 a 176 versets, le max dans la Bible
  const verses = Array.from({ length: maxVerse }, (_, i) => i + 1);

  const isComplete = selectedBook && selectedChapter > 0 && selectedVerse > 0;

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4 transition-colors">
      <div className="space-y-1">
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Méditation personnelle
        </h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          Choisis un verset de la Bible et médite en profondeur avec le parcours OIA+ complet.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <div className="w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Sélecteur de livre */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Livre</label>
            <div className="relative">
              <select
                value={selectedBook}
                onChange={(e) => setSelectedBook(e.target.value)}
                className="w-full appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition pr-8"
              >
                <option value="">Sélectionne un livre...</option>
                {books.map((book) => (
                  <option key={book.name} value={book.name}>
                    {book.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Sélecteurs chapitre + verset côte à côte */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Chapitre</label>
              <div className="relative">
                <select
                  value={selectedChapter}
                  onChange={(e) => { setSelectedChapter(Number(e.target.value)); setSelectedVerse(1); }}
                  disabled={!selectedBook}
                  className="w-full appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition pr-8 disabled:opacity-50"
                >
                  {chapters.map((ch) => (
                    <option key={ch} value={ch}>{ch}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Verset</label>
              <div className="relative">
                <select
                  value={selectedVerse}
                  onChange={(e) => setSelectedVerse(Number(e.target.value))}
                  disabled={!selectedBook}
                  className="w-full appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition pr-8 disabled:opacity-50"
                >
                  {verses.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Bouton de méditation */}
          {isComplete ? (
            <Link
              href={`/meditate?book=${encodeURIComponent(selectedBook)}&chapter=${selectedChapter}&verse=${selectedVerse}`}
              className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-black text-sm rounded-xl shadow-lg hover:from-indigo-500 hover:to-indigo-600 transition-all active:scale-[0.98]"
            >
              <BookOpen className="w-4 h-4" />
              Commencer la méditation OIA+
            </Link>
          ) : (
            <div className="flex items-center justify-center gap-2 w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold text-sm rounded-xl cursor-not-allowed">
              <Search className="w-4 h-4" />
              Sélectionne un verset pour commencer
            </div>
          )}
        </div>
      )}
    </div>
  );
}
