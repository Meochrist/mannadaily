"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  Sparkles, 
  Send, 
  Trash2, 
  Edit3, 
  ChevronRight, 
  ChevronLeft, 
  Mic, 
  X, 
  Bookmark, 
  BookOpenCheck, 
  List, 
  Loader2, 
  Info,
  Search,
  Hash,
  Link as LinkIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as sounds from "@/lib/sounds";
import Manny from "@/components/mascot/Manny";
import SpeechMicButton from "@/components/meditation/SpeechMicButton";

interface BibleBook {
  name: string;
  chapters: number;
}

interface Verse {
  id: string;
  book: string;
  bookNumber: number;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
  highlightColor: string | null;
  note: {
    content: string;
    isVoice: boolean;
  } | null;
}

interface SavedNote {
  id: string;
  content: string;
  isVoice: boolean;
  verse: {
    id: string;
    book: string;
    chapter: number;
    verse: number;
    text: string;
  };
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface StrongEntry {
  number: string;
  language: string;
  lemma: string | null;
  transliteration: string | null;
  pronunciation: string | null;
  definition: string | null;
  kjvUsage: string | null;
}

interface WordPopover {
  word: string;
  strongNumber: string;
  entry: StrongEntry | null;
  loading: boolean;
  x: number;
  y: number;
}

export default function BiblePage() {
  // Navigation State
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<string>("Genèse");
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [translation, setTranslation] = useState<string>("LSG");
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loadingVerses, setLoadingVerses] = useState<boolean>(false);

  // User interactive state
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  
  // Right sidebar state
  const [activeTab, setActiveTab] = useState<"notes" | "ai" | "strong" | "references" | "morphology">("notes");
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [compareVerses, setCompareVerses] = useState<Verse[]>([]);
  const [availableTranslations, setAvailableTranslations] = useState<string[]>(["LSG", "Darby", "Martin"]);
  const [userNotes, setUserNotes] = useState<SavedNote[]>([]);
  
  // Current editing note state
  const [currentNoteText, setCurrentNoteText] = useState<string>("");
  const [savingNote, setSavingNote] = useState<boolean>(false);

  // AI chat state
  const [aiQuestion, setAiQuestion] = useState<string>("");
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [chatHistories, setChatHistories] = useState<Record<string, ChatMessage[]>>({}); // Keyed by verseId

  // Strong concordance state
  const [wordPopover, setWordPopover] = useState<WordPopover | null>(null);
  const [strongSearch, setStrongSearch] = useState<string>("");
  const [strongResult, setStrongResult] = useState<StrongEntry | null>(null);
  const [strongLoading, setStrongLoading] = useState<boolean>(false);
  const [strongError, setStrongError] = useState<string>("");

  // Cross references state
  const [crossRefs, setCrossRefs] = useState<any[]>([]);
  const [loadingCrossRefs, setLoadingCrossRefs] = useState<boolean>(false);
  const [pendingVerseSelection, setPendingVerseSelection] = useState<number | null>(null);

  // Morphology state
  const [morphologyWords, setMorphologyWords] = useState<any[]>([]);
  const [loadingMorphology, setLoadingMorphology] = useState<boolean>(false);

  // UI layout reference
  const containerRef = useRef<HTMLDivElement>(null);
  const speechRecognitionActive = useRef<boolean>(false);

  // Fetch books and translations on mount
  useEffect(() => {
    async function fetchBooks() {
      try {
        const res = await fetch("/api/bible/books");
        if (res.ok) {
          const data = await res.json();
          setBooks(data);
        }
      } catch (err) {
        console.error("Error fetching books:", err);
      }
    }
    async function fetchTranslations() {
      try {
        const res = await fetch("/api/bible/translations");
        if (res.ok) {
          const data = await res.json();
          if (data.translations && data.translations.length > 0) {
            setAvailableTranslations(data.translations);
          }
        }
      } catch (err) {
        console.error("Error fetching translations:", err);
      }
    }
    fetchBooks();
    fetchTranslations();
    fetchUserNotes();
  }, []);

  // Fetch verses when book, chapter or translation changes
  // Fetch verses when book, chapter, translation or compareMode changes
  useEffect(() => {
    async function fetchVerses() {
      if (!selectedBook) return;
      setLoadingVerses(true);
      setSelectedVerse(null);
      setContextMenuPosition(null);
      try {
        if (compareMode) {
          const [resLsg, resDarby] = await Promise.all([
            fetch(`/api/bible/${encodeURIComponent(selectedBook)}/${selectedChapter}?translation=LSG`).then(r => r.json()),
            fetch(`/api/bible/${encodeURIComponent(selectedBook)}/${selectedChapter}?translation=Darby`).then(r => r.json())
          ]);
          setVerses(resLsg.verses || []);
          setCompareVerses(resDarby.verses || []);
        } else {
          const res = await fetch(
            `/api/bible/${encodeURIComponent(selectedBook)}/${selectedChapter}?translation=${translation}`
          );
          if (res.ok) {
            const data = await res.json();
            setVerses(data.verses || []);
            setCompareVerses([]);
          }
        }
      } catch (err) {
        console.error("Error fetching verses:", err);
      } finally {
        setLoadingVerses(false);
      }
    }
    fetchVerses();
  }, [selectedBook, selectedChapter, translation, compareMode]);

  // Load verse text if active verse changes to edit notes
  useEffect(() => {
    if (selectedVerse) {
      setCurrentNoteText(selectedVerse.note?.content || "");
    } else {
      setCurrentNoteText("");
    }
  }, [selectedVerse]);

  // Fetch cross references when selected verse changes
  useEffect(() => {
    async function fetchCrossRefs() {
      if (!selectedVerse) {
        setCrossRefs([]);
        return;
      }
      setLoadingCrossRefs(true);
      try {
        let bookNum = selectedVerse.bookNumber;
        if (!bookNum || bookNum === 0) {
          const bookIdx = books.findIndex(b => b.name === selectedVerse.book);
          if (bookIdx !== -1) {
            bookNum = bookIdx + 1;
          }
        }
        if (!bookNum || bookNum === 0) {
          setCrossRefs([]);
          return;
        }
        const res = await fetch(`/api/bible/crossrefs?book=${bookNum}&chapter=${selectedVerse.chapter}&verse=${selectedVerse.verse}`);
        if (res.ok) {
          const data = await res.json();
          setCrossRefs(data.crossRefs || []);
        } else {
          setCrossRefs([]);
        }
      } catch (err) {
        console.error("Error fetching cross references:", err);
        setCrossRefs([]);
      } finally {
        setLoadingCrossRefs(false);
      }
    }
    fetchCrossRefs();
  }, [selectedVerse, books]);

  // Fetch morphology when selectedVerse or activeTab changes
  useEffect(() => {
    async function fetchMorphology() {
      if (!selectedVerse || activeTab !== "morphology") {
        setMorphologyWords([]);
        return;
      }
      setLoadingMorphology(true);
      try {
        let bookNum = selectedVerse.bookNumber;
        if (!bookNum || bookNum === 0) {
          const bookIdx = books.findIndex(b => b.name === selectedVerse.book);
          if (bookIdx !== -1) {
            bookNum = bookIdx + 1;
          }
        }
        if (!bookNum || bookNum === 0) {
          setMorphologyWords([]);
          return;
        }
        const language = bookNum <= 39 ? "hebrew" : "greek";
        const res = await fetch(`/api/bible/morphology?book=${bookNum}&chapter=${selectedVerse.chapter}&verse=${selectedVerse.verse}&language=${language}`);
        if (res.ok) {
          const data = await res.json();
          setMorphologyWords(data.words || []);
        } else {
          setMorphologyWords([]);
        }
      } catch (err) {
        console.error("Error fetching morphology:", err);
        setMorphologyWords([]);
      } finally {
        setLoadingMorphology(false);
      }
    }
    fetchMorphology();
  }, [selectedVerse, activeTab, books]);

  // Handle pending verse selection when verses finish loading
  useEffect(() => {
    if (pendingVerseSelection && verses.length > 0 && !loadingVerses) {
      const targetVerse = verses.find(v => v.verse === pendingVerseSelection);
      if (targetVerse) {
        setSelectedVerse(targetVerse);
      }
      setPendingVerseSelection(null);
    }
  }, [verses, pendingVerseSelection, loadingVerses]);

  // Fetch all user notes
  const fetchUserNotes = async () => {
    try {
      const res = await fetch("/api/bible/note");
      if (res.ok) {
        const data = await res.json();
        setUserNotes(data.notes || []);
      }
    } catch (err) {
      console.error("Error fetching user notes:", err);
    }
  };

  // Helper to split books into Old and New Testament
  const oldTestament = books.slice(0, 39);
  const newTestament = books.slice(39);

  const currentBookData = books.find(b => b.name === selectedBook);
  const totalChapters = currentBookData?.chapters || 1;

  // Handle previous / next chapter
  const handlePrevChapter = () => {
    if (selectedChapter > 1) {
      setSelectedChapter(selectedChapter - 1);
    } else {
      // Go to previous book's last chapter if possible
      const bookIndex = books.findIndex(b => b.name === selectedBook);
      if (bookIndex > 0) {
        const prevBook = books[bookIndex - 1];
        setSelectedBook(prevBook.name);
        setSelectedChapter(prevBook.chapters);
      }
    }
  };

  const handleNextChapter = () => {
    if (selectedChapter < totalChapters) {
      setSelectedChapter(selectedChapter + 1);
    } else {
      // Go to next book's first chapter
      const bookIndex = books.findIndex(b => b.name === selectedBook);
      if (bookIndex < books.length - 1) {
        const nextBook = books[bookIndex + 1];
        setSelectedBook(nextBook.name);
        setSelectedChapter(1);
      }
    }
  };

  // Handle click on verse to display menu contextuel
  const handleVerseClick = (e: React.MouseEvent, verse: Verse) => {
    e.preventDefault();
    setSelectedVerse(verse);

    // Calculate position relative to container
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      // Keep inside bounds roughly
      const boundedX = Math.min(clickX, rect.width - 240);
      setContextMenuPosition({ x: boundedX, y: clickY });
    }
  };

  // Surlignage action
  const handleHighlight = async (color: string) => {
    if (!selectedVerse) return;
    try {
      sounds.playXPGain();
      const res = await fetch("/api/bible/highlight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verseId: selectedVerse.id, color })
      });

      if (res.ok) {
        // Update local state
        setVerses(prev => prev.map(v => v.id === selectedVerse.id ? { ...v, highlightColor: color } : v));
        setSelectedVerse(prev => prev ? { ...prev, highlightColor: color } : null);
        setContextMenuPosition(null);
      }
    } catch (err) {
      console.error("Error highlighting verse:", err);
    }
  };

  // Supprimer surlignage
  const handleDeleteHighlight = async () => {
    if (!selectedVerse) return;
    try {
      const res = await fetch(`/api/bible/highlight?verseId=${selectedVerse.id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        // Update local state
        setVerses(prev => prev.map(v => v.id === selectedVerse.id ? { ...v, highlightColor: null } : v));
        setSelectedVerse(prev => prev ? { ...prev, highlightColor: null } : null);
        setContextMenuPosition(null);
      }
    } catch (err) {
      console.error("Error deleting highlight:", err);
    }
  };

  // Enregistrer note
  const handleSaveNote = async () => {
    if (!selectedVerse) return;
    setSavingNote(true);
    try {
      const res = await fetch("/api/bible/note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verseId: selectedVerse.id,
          content: currentNoteText,
          isVoice: speechRecognitionActive.current
        })
      });

      if (res.ok) {
        sounds.playSuccess();
        const data = await res.json();
        
        // Update verses list
        const updatedNote = currentNoteText.trim() === "" ? null : { content: currentNoteText, isVoice: false };
        setVerses(prev => prev.map(v => v.id === selectedVerse.id ? { ...v, note: updatedNote } : v));
        
        // Refresh full notes list
        fetchUserNotes();
        
        // Reset selected verse view
        setSelectedVerse(prev => prev ? { ...prev, note: updatedNote } : null);
      }
    } catch (err) {
      console.error("Error saving note:", err);
    } finally {
      setSavingNote(false);
    }
  };

  // Poser question à l'IA
  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVerse || !aiQuestion.trim() || aiLoading) return;

    const questionText = aiQuestion.trim();
    const verseId = selectedVerse.id;
    const verseContext = `${selectedVerse.book} ${selectedVerse.chapter}:${selectedVerse.verse} - "${selectedVerse.text}"`;

    // Add user message to local history
    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: "user",
      content: questionText
    };

    setChatHistories(prev => ({
      ...prev,
      [verseId]: [...(prev[verseId] || []), userMsg]
    }));
    setAiQuestion("");
    setAiLoading(true);

    try {
      const res = await fetch("/api/meditation/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "bible_chat",
          question: questionText,
          verseContext
        })
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: ChatMessage = {
          id: Math.random().toString(),
          role: "assistant",
          content: data.answer || data.meditation || "Une erreur est survenue lors de la génération."
        };
        
        setChatHistories(prev => ({
          ...prev,
          [verseId]: [...(prev[verseId] || []), aiMsg]
        }));
        sounds.playXPGain();
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate AI response");
      }
    } catch (err) {
      console.error("AI Error:", err);
      const errorMsg: ChatMessage = {
        id: Math.random().toString(),
        role: "assistant",
        content: "Désolé, je ne parviens pas à répondre à cette question pour le moment. Veuillez réessayer."
      };
      setChatHistories(prev => ({
        ...prev,
        [verseId]: [...(prev[verseId] || []), errorMsg]
      }));
    } finally {
      setAiLoading(false);
    }
  };

  // Load a note's verse into reader
  const handleLoadNoteVerse = (note: SavedNote) => {
    setSelectedBook(note.verse.book);
    setSelectedChapter(note.verse.chapter);
    
    // Auto-select the verse in reader
    setTimeout(() => {
      const targetVerse = verses.find(v => v.id === note.verse.id);
      if (targetVerse) {
        setSelectedVerse(targetVerse);
      } else {
        // If not loaded yet, wait a bit or let selection happen
        setSelectedVerse({
          id: note.verse.id,
          book: note.verse.book,
          bookNumber: 0,
          chapter: note.verse.chapter,
          verse: note.verse.verse,
          text: note.verse.text,
          translation: "LSG",
          highlightColor: null,
          note: { content: note.content, isVoice: note.isVoice }
        });
      }
      setActiveTab("notes");
    }, 300);
  };

  const getHighlightClass = (color: string | null) => {
    switch (color) {
      case "yellow":
        return "bg-yellow-100/85 dark:bg-yellow-950/30 border-l-2 border-yellow-400 pl-1.5";
      case "green":
        return "bg-emerald-100/85 dark:bg-emerald-950/30 border-l-2 border-emerald-400 pl-1.5";
      case "blue":
        return "bg-sky-100/85 dark:bg-sky-950/30 border-l-2 border-sky-400 pl-1.5";
      case "pink":
        return "bg-rose-100/85 dark:bg-rose-950/30 border-l-2 border-rose-400 pl-1.5";
      default:
        return "";
    }
  };

  const activeVerseChat = selectedVerse ? chatHistories[selectedVerse.id] || [] : [];

  // Détermine le numéro Strong MVP : Hébreu pour AT (livres 1-39), Grec pour NT (40-66)
  const getStrongNumber = (bookNumber: number, wordIndex: number): string => {
    if (bookNumber <= 39) {
      return `H${wordIndex + 1}`;
    } else {
      return `G${wordIndex + 1}`;
    }
  };

  // Clic sur un mot du verset → affiche popover Strong
  const handleWordClick = async (
    e: React.MouseEvent<HTMLSpanElement>,
    word: string,
    wordIndex: number,
    verse: Verse
  ) => {
    e.stopPropagation();
    const strongNumber = getStrongNumber(verse.bookNumber, wordIndex);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };

    setWordPopover({
      word,
      strongNumber,
      entry: null,
      loading: true,
      x: rect.left - containerRect.left,
      y: rect.bottom - containerRect.top + 6,
    });

    try {
      const res = await fetch(`/api/bible/strong/${strongNumber}`);
      if (res.ok) {
        const data: StrongEntry = await res.json();
        setWordPopover(prev => prev ? { ...prev, entry: data, loading: false } : null);
      } else {
        setWordPopover(prev => prev ? { ...prev, loading: false } : null);
      }
    } catch {
      setWordPopover(prev => prev ? { ...prev, loading: false } : null);
    }
  };

  // Recherche Strong manuelle
  const fetchStrongManual = useCallback(async (query: string) => {
    const normalized = query.trim().toUpperCase();
    if (!normalized.match(/^[HG]\d+$/)) {
      setStrongError("Format invalide. Exemples : H430, G3056");
      setStrongResult(null);
      return;
    }
    setStrongLoading(true);
    setStrongError("");
    setStrongResult(null);
    try {
      const res = await fetch(`/api/bible/strong/${normalized}`);
      if (res.ok) {
        const data: StrongEntry = await res.json();
        setStrongResult(data);
      } else {
        setStrongError(`Entrée "${normalized}" introuvable dans la concordance.`);
      }
    } catch {
      setStrongError("Erreur lors de la recherche.");
    } finally {
      setStrongLoading(false);
    }
  }, []);

  return (
    <div className="flex flex-col h-full space-y-4 max-w-7xl mx-auto" ref={containerRef}>
      {/* Top Banner with statistics / information */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-indigo-900 text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="space-y-1 text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2 justify-center md:justify-start">
            <BookOpen className="w-8 h-8 text-indigo-300 animate-pulse" />
            La Sainte Bible
          </h1>
          <p className="text-indigo-200 text-sm max-w-md font-medium">
            Explorez les Écritures, surlignez des passages inspirants, rédigez vos annotations et conversez avec l'intelligence artificielle pour approfondir votre foi.
          </p>
        </div>
        <div className="flex gap-4 items-center flex-wrap justify-center md:justify-end">
          <div className="bg-indigo-950/40 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-indigo-500/20 text-center">
            <span className="block text-xs font-bold text-indigo-300 uppercase tracking-wider">Notes Sauvegardées</span>
            <span className="text-xl font-black">{userNotes.length}</span>
          </div>

          <button
            onClick={() => {
              setCompareMode(!compareMode);
              sounds.playXPGain();
            }}
            className={cn(
              "px-4 py-2 rounded-2xl text-xs font-extrabold transition-all border cursor-pointer",
              compareMode
                ? "bg-amber-500 border-amber-600 text-white shadow-md hover:bg-amber-600"
                : "bg-indigo-950/60 backdrop-blur-md border-indigo-500/30 text-indigo-200 hover:bg-indigo-900/60"
            )}
          >
            {compareMode ? "✨ Comparaison active" : "📖 Comparer les versions"}
          </button>

          <select 
            value={translation}
            disabled={compareMode}
            onChange={(e) => setTranslation(e.target.value)}
            className="bg-indigo-950/60 backdrop-blur-md text-white border border-indigo-500/30 rounded-2xl px-3 py-2 text-sm font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer transition disabled:opacity-40"
          >
            {availableTranslations.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-270px)] min-h-[500px]">
        
        {/* COLUMN 1: NAVIGATION (20% -> 2 cols or 3 cols depending on breakpoint) */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-100 shadow-sm p-4 flex flex-col overflow-hidden h-full">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-3">
            <List className="w-5 h-5 text-indigo-600" />
            <h2 className="font-extrabold text-slate-800 text-sm">Livres & Chapitres</h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Old Testament */}
            <div className="space-y-1">
              <h3 className="text-xs font-black text-indigo-900 bg-indigo-50 px-2.5 py-1.5 rounded-lg tracking-wider uppercase">
                Ancien Testament ({oldTestament.length})
              </h3>
              <div className="space-y-0.5 pt-1 pl-1">
                {oldTestament.map((book) => (
                  <button
                    key={book.name}
                    onClick={() => {
                      setSelectedBook(book.name);
                      setSelectedChapter(1);
                      sounds.playXPGain();
                    }}
                    className={cn(
                      "w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-between",
                      selectedBook === book.name
                        ? "bg-indigo-650 text-white shadow-sm"
                        : "text-slate-650 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <span>{book.name}</span>
                    {selectedBook === book.name && (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* New Testament */}
            <div className="space-y-1">
              <h3 className="text-xs font-black text-emerald-900 bg-emerald-50 px-2.5 py-1.5 rounded-lg tracking-wider uppercase">
                Nouveau Testament ({newTestament.length})
              </h3>
              <div className="space-y-0.5 pt-1 pl-1">
                {newTestament.map((book) => (
                  <button
                    key={book.name}
                    onClick={() => {
                      setSelectedBook(book.name);
                      setSelectedChapter(1);
                      sounds.playXPGain();
                    }}
                    className={cn(
                      "w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-between",
                      selectedBook === book.name
                        ? "bg-emerald-650 text-white shadow-sm"
                        : "text-slate-650 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <span>{book.name}</span>
                    {selectedBook === book.name && (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 2: READER (55% -> 6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden h-full">
          {/* Header of Reader */}
          <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <BookOpenCheck className="w-5 h-5 text-indigo-600" />
              <span className="font-extrabold text-slate-800 text-sm md:text-base">
                {selectedBook} {selectedChapter}
              </span>
            </div>
            
            {/* Quick selector of chapters */}
            {currentBookData && (
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevChapter}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition"
                  title="Chapitre précédent"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <select
                  value={selectedChapter}
                  onChange={(e) => {
                    setSelectedChapter(parseInt(e.target.value, 10));
                    sounds.playXPGain();
                  }}
                  className="bg-white border border-slate-200 rounded-xl px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none"
                >
                  {Array.from({ length: totalChapters }, (_, i) => i + 1).map((ch) => (
                    <option key={ch} value={ch}>
                      Ch. {ch}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleNextChapter}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition"
                  title="Chapitre suivant"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Verses Container */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 relative">
            {loadingVerses ? (
              <div className="absolute inset-0 flex flex-col justify-center items-center gap-2 bg-white/70 backdrop-blur-sm">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <span className="text-xs font-bold text-slate-500">Chargement des versets...</span>
              </div>
            ) : verses.length === 0 ? (
              <div className="flex flex-col justify-center items-center text-center h-full p-4 space-y-4">
                <Info className="w-12 h-12 text-slate-350" />
                <div>
                  <h3 className="font-bold text-slate-700">Aucun verset disponible</h3>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Ce chapitre n'a pas encore été importé. Vérifiez vos paramètres ou revenez plus tard.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 select-text">
                {verses.map((v) => (
                  <div
                    key={v.id}
                    onClick={(e) => handleVerseClick(e, v)}
                    className={cn(
                      "group relative py-2 px-3 rounded-2xl cursor-pointer hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all duration-300",
                      getHighlightClass(v.highlightColor),
                      selectedVerse?.id === v.id && "bg-indigo-50/40 border-indigo-200"
                    )}
                  >
                    <span className="inline-block text-[11px] font-black text-amber-600 mr-2.5 select-none align-super">
                      {v.verse}
                    </span>
                    <span className="text-slate-800 text-sm leading-relaxed font-medium">
                      {v.text.split(/\s+/).map((word, wi) => (
                        <span
                          key={wi}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWordClick(e, word, wi, v);
                          }}
                          className="cursor-pointer hover:text-indigo-600 hover:bg-indigo-50 rounded px-0.5 transition-colors duration-150"
                          title={`Cliquer pour voir Strong ${v.bookNumber <= 39 ? 'H' : 'G'}${wi + 1}`}
                        >
                          {word}{' '}
                        </span>
                      ))}
                    </span>

                    {/* Small note icon if note exists */}
                    {v.note && (
                      <span className="inline-flex ml-2 align-middle" title="Ce verset contient une note">
                        <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                      </span>
                    )}

                    {compareMode && (
                      (() => {
                        const darbyVerse = compareVerses.find(dv => dv.verse === v.verse);
                        return darbyVerse ? (
                          <div className="text-xs text-slate-500/80 italic mt-1.5 pl-4 border-l-2 border-slate-200 leading-relaxed font-medium">
                            <span className="text-[10px] font-black text-amber-600/70 mr-1.5 select-none uppercase tracking-wider">Darby</span>
                            {darbyVerse.text}
                          </div>
                        ) : null;
                      })()
                    )}

                    {/* Quick indicator when hovering */}
                    <span className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-50 text-indigo-600 text-[10px] font-black px-1.5 py-0.5 rounded-lg">
                      Surligner / Mot → Strong
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Strong Word Popover */}
            <AnimatePresence>
              {wordPopover && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setWordPopover(null)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -4 }}
                    style={{
                      position: "absolute",
                      left: Math.max(0, wordPopover.x),
                      top: wordPopover.y,
                    }}
                    className="z-40 bg-white border border-indigo-100 shadow-2xl rounded-2xl p-4 w-72 max-w-xs"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">
                          Concordance Strong
                        </span>
                        <span className="font-black text-slate-800 text-sm">« {wordPopover.word} »</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 font-black px-2 py-0.5 rounded-full">
                          {wordPopover.strongNumber}
                        </span>
                        <button
                          onClick={() => setWordPopover(null)}
                          className="p-0.5 rounded-full hover:bg-slate-100 text-slate-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {wordPopover.loading ? (
                      <div className="flex items-center gap-2 text-slate-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-xs">Chargement...</span>
                      </div>
                    ) : wordPopover.entry ? (
                      <div className="space-y-2">
                        {wordPopover.entry.lemma && (
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-slate-700">{wordPopover.entry.lemma}</span>
                            {wordPopover.entry.pronunciation && (
                              <span className="text-xs text-slate-500 italic">/{wordPopover.entry.pronunciation}/</span>
                            )}
                          </div>
                        )}
                        {wordPopover.entry.transliteration && (
                          <div className="text-xs font-bold text-indigo-600">{wordPopover.entry.transliteration}</div>
                        )}
                        {wordPopover.entry.definition && (
                          <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-2">
                            {wordPopover.entry.definition.substring(0, 200)}
                            {wordPopover.entry.definition.length > 200 ? '...' : ''}
                          </p>
                        )}
                        <button
                          onClick={() => {
                            setStrongSearch(wordPopover.strongNumber);
                            setActiveTab("strong");
                            setWordPopover(null);
                            fetchStrongManual(wordPopover.strongNumber);
                          }}
                          className="text-[10px] text-indigo-500 hover:text-indigo-700 font-bold underline"
                        >
                          Voir la définition complète →
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Entrée Strong non trouvée pour {wordPopover.strongNumber}</p>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Context Menu / Tooltip Flottant */}
            <AnimatePresence>
              {contextMenuPosition && selectedVerse && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => {
                      setContextMenuPosition(null);
                      setSelectedVerse(null);
                    }} 
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    style={{
                      position: "absolute",
                      left: contextMenuPosition.x,
                      top: contextMenuPosition.y,
                    }}
                    className="z-50 bg-white border border-slate-200/80 shadow-2xl rounded-2xl p-3 flex flex-col gap-2.5 w-60"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-xs font-black text-slate-800">
                        Verset {selectedVerse.verse}
                      </span>
                      <button 
                        onClick={() => {
                          setContextMenuPosition(null);
                          setSelectedVerse(null);
                        }} 
                        className="p-0.5 rounded-full hover:bg-slate-100 text-slate-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Colors for highlighting */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Surligner
                      </span>
                      <div className="flex justify-between items-center gap-1 bg-slate-50 p-1.5 rounded-xl">
                        <button
                          onClick={() => handleHighlight("yellow")}
                          className="w-7 h-7 rounded-full bg-yellow-350 hover:scale-110 shadow-sm transition border border-yellow-400"
                          title="Surligner en jaune"
                        />
                        <button
                          onClick={() => handleHighlight("green")}
                          className="w-7 h-7 rounded-full bg-emerald-400 hover:scale-110 shadow-sm transition border border-emerald-500"
                          title="Surligner en vert"
                        />
                        <button
                          onClick={() => handleHighlight("blue")}
                          className="w-7 h-7 rounded-full bg-sky-400 hover:scale-110 shadow-sm transition border border-sky-500"
                          title="Surligner en bleu"
                        />
                        <button
                          onClick={() => handleHighlight("pink")}
                          className="w-7 h-7 rounded-full bg-rose-450 hover:scale-110 shadow-sm transition border border-rose-500"
                          title="Surligner en rose"
                        />
                        {selectedVerse.highlightColor && (
                          <button
                            onClick={handleDeleteHighlight}
                            className="w-7 h-7 rounded-full bg-white hover:bg-rose-50 border border-slate-250 flex items-center justify-center hover:text-rose-600 transition"
                            title="Supprimer le surlignage"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setActiveTab("notes");
                            setContextMenuPosition(null);
                          }}
                          className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-slate-200 text-[11px] font-black text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Annoter
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab("ai");
                            setContextMenuPosition(null);
                          }}
                          className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-indigo-600 text-[11px] font-black text-white hover:bg-indigo-700 hover:scale-102 transition shadow-sm cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                          IA Chat
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab("references");
                          setContextMenuPosition(null);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-indigo-200 bg-indigo-50/50 text-[11px] font-black text-indigo-700 hover:bg-indigo-100 hover:text-indigo-850 transition cursor-pointer"
                      >
                        <LinkIcon className="w-3.5 h-3.5 animate-pulse text-indigo-500" />
                        Références croisées
                      </button>
                      {(() => {
                        let bookNum = selectedVerse.bookNumber;
                        if (!bookNum || bookNum === 0) {
                          const bookIdx = books.findIndex(b => b.name === selectedVerse.book);
                          if (bookIdx !== -1) bookNum = bookIdx + 1;
                        }
                        const isHebrew = bookNum <= 39;
                        return (
                          <button
                            onClick={() => {
                              setActiveTab("morphology");
                              setContextMenuPosition(null);
                            }}
                            className="w-full flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-emerald-250 bg-emerald-50/50 text-[11px] font-black text-emerald-700 hover:bg-emerald-100 hover:text-emerald-850 transition cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                            {isHebrew ? "Morphologie hébraïque" : "Morphologie grecque"}
                          </button>
                        );
                      })()}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* COLUMN 3: NOTES & AI (25% -> 3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden h-full">
          {/* Double Tabs */}
          <div className="flex border-b border-slate-100 bg-slate-50/50 p-1 flex-wrap md:flex-nowrap">
            <button
              onClick={() => {
                setActiveTab("notes");
                sounds.playXPGain();
              }}
              className={cn(
                "flex-1 py-2 md:py-3 text-[10px] md:text-xs font-black rounded-2xl transition flex items-center justify-center gap-1 min-w-[70px]",
                activeTab === "notes"
                  ? "bg-white text-indigo-750 shadow-sm border border-slate-100"
                  : "text-slate-400 hover:text-slate-650"
              )}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Notes
            </button>
            <button
              onClick={() => {
                setActiveTab("ai");
                sounds.playXPGain();
              }}
              className={cn(
                "flex-1 py-2 md:py-3 text-[10px] md:text-xs font-black rounded-2xl transition flex items-center justify-center gap-1 min-w-[70px]",
                activeTab === "ai"
                  ? "bg-white text-indigo-750 shadow-sm border border-slate-100"
                  : "text-slate-400 hover:text-slate-650"
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              IA Chat
            </button>
            <button
              onClick={() => {
                setActiveTab("strong");
                sounds.playXPGain();
              }}
              className={cn(
                "flex-1 py-2 md:py-3 text-[10px] md:text-xs font-black rounded-2xl transition flex items-center justify-center gap-1 min-w-[70px]",
                activeTab === "strong"
                  ? "bg-white text-indigo-750 shadow-sm border border-slate-100"
                  : "text-slate-400 hover:text-slate-650"
              )}
            >
              <Hash className="w-3.5 h-3.5" />
              Strong
            </button>
            <button
              onClick={() => {
                setActiveTab("references");
                sounds.playXPGain();
              }}
              className={cn(
                "flex-1 py-2 md:py-3 text-[10px] md:text-xs font-black rounded-2xl transition flex items-center justify-center gap-1 min-w-[70px]",
                activeTab === "references"
                  ? "bg-white text-indigo-750 shadow-sm border border-slate-100"
                  : "text-slate-400 hover:text-slate-655"
              )}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              Réf.
            </button>
            <button
              onClick={() => {
                setActiveTab("morphology");
                sounds.playXPGain();
              }}
              className={cn(
                "flex-1 py-2 md:py-3 text-[10px] md:text-xs font-black rounded-2xl transition flex items-center justify-center gap-1 min-w-[70px]",
                activeTab === "morphology"
                  ? "bg-white text-indigo-750 shadow-sm border border-slate-100"
                  : "text-slate-400 hover:text-slate-655"
              )}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Morpho.
            </button>
          </div>

          {/* TAB CONTENTS */}
          <div className="flex-1 flex flex-col overflow-hidden p-4">
            
            {/* NOTES TAB */}
            {activeTab === "notes" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {selectedVerse ? (
                  // Edition de note pour un verset actif
                  <div className="flex-1 flex flex-col space-y-3 justify-between">
                    <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                      {/* Back button to all notes */}
                      <button
                        onClick={() => setSelectedVerse(null)}
                        className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        Voir toutes mes notes
                      </button>

                      {/* Verse preview */}
                      <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3.5 space-y-2">
                        <span className="text-xs font-black text-amber-700 block">
                          {selectedVerse.book} {selectedVerse.chapter}:{selectedVerse.verse}
                        </span>
                        <p className="text-[11px] text-slate-600 italic leading-relaxed line-clamp-3">
                          "{selectedVerse.text}"
                        </p>
                      </div>

                      {/* Note Edit Area */}
                      <div className="space-y-1.5 relative">
                        <label className="text-xs font-extrabold text-slate-755 block">
                          Votre annotation
                        </label>
                        <div className="relative">
                          <textarea
                            value={currentNoteText}
                            onChange={(e) => setCurrentNoteText(e.target.value)}
                            placeholder="Écrivez vos pensées, prières ou révélations sur ce verset ici..."
                            className="w-full min-h-[160px] border border-slate-200 rounded-2xl p-3.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400/80 focus:border-transparent pb-10"
                          />
                          <SpeechMicButton
                            value={currentNoteText}
                            onChange={(val) => {
                              setCurrentNoteText(val);
                              speechRecognitionActive.current = true;
                            }}
                            className="bottom-3.5 right-3.5"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={handleSaveNote}
                        disabled={savingNote}
                        className="flex-1 bg-indigo-600 text-white rounded-xl py-2.5 text-xs font-extrabold hover:bg-indigo-700 disabled:bg-slate-300 transition flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        {savingNote ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Enregistrement...
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-3.5 h-3.5" />
                            Sauvegarder
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  // Liste de toutes les notes existantes
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="text-xs font-bold text-slate-500 mb-3.5">
                      Toutes vos annotations ({userNotes.length})
                    </div>

                    {userNotes.length === 0 ? (
                      <div className="flex-1 flex flex-col justify-center items-center text-center p-4 space-y-3">
                        <Manny mood="happy" size={110} />
                        <div>
                          <h4 className="font-bold text-slate-700 text-xs">Aucune note pour le moment</h4>
                          <p className="text-[10px] text-slate-500 mt-1 max-w-[180px]">
                            Surlignez un verset puis cliquez sur "Annoter" pour enregistrer vos pensées ici.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                        {userNotes.map((note) => (
                          <div
                            key={note.id}
                            onClick={() => handleLoadNoteVerse(note)}
                            className="bg-slate-50 border border-slate-105 hover:border-indigo-150 hover:bg-indigo-50/10 rounded-2xl p-3.5 cursor-pointer transition-all duration-300 space-y-2 group"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-black text-indigo-750">
                                {note.verse.book} {note.verse.chapter}:{note.verse.verse}
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                            <p className="text-[11px] text-slate-750 leading-relaxed line-clamp-3 font-semibold">
                              {note.content}
                            </p>
                            <p className="text-[10px] text-slate-400 italic line-clamp-1">
                              "{note.verse.text}"
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* AI CHAT TAB */}
            {activeTab === "ai" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {selectedVerse ? (
                  // Conversation active pour le verset sélectionné
                  <div className="flex-1 flex flex-col overflow-hidden justify-between">
                    
                    {/* Chat Area Header & history */}
                    <div className="flex-1 flex flex-col overflow-hidden space-y-3">
                      {/* Back to all notes or reset selection */}
                      <div className="flex justify-between items-center pb-2 border-b border-slate-150">
                        <span className="text-[11px] font-black text-amber-700">
                          {selectedVerse.book} {selectedVerse.chapter}:{selectedVerse.verse}
                        </span>
                        <button
                          onClick={() => setSelectedVerse(null)}
                          className="text-[10px] font-black text-indigo-650 hover:text-indigo-855 flex items-center gap-0.5"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" /> Retour
                        </button>
                      </div>

                      {/* Messages History */}
                      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-1">
                        {activeVerseChat.length === 0 ? (
                          <div className="flex flex-col items-center justify-center text-center p-4 py-8 space-y-4">
                            <Manny mood="thinking" size={100} />
                            <div>
                              <h4 className="font-bold text-slate-700 text-xs">Parler à l'Écriture</h4>
                              <p className="text-[10px] text-slate-500 mt-1 max-w-[190px] leading-relaxed">
                                Posez n'importe quelle question sur ce verset. L'IA vous guidera avec sagesse.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {activeVerseChat.map((msg) => (
                              <div
                                key={msg.id}
                                className={cn(
                                  "flex gap-2 max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed",
                                  msg.role === "user"
                                    ? "bg-indigo-600 text-white font-semibold ml-auto rounded-tr-none"
                                    : "bg-slate-105 text-slate-800 font-medium rounded-tl-none border border-slate-200/50"
                                )}
                              >
                                {msg.role === "assistant" && (
                                  <div className="w-5 h-5 flex-shrink-0 relative overflow-hidden select-none pointer-events-none mt-0.5">
                                    <img 
                                      src="/assets/characters/manny/pose_idle.svg" 
                                      alt="Manny Icon" 
                                      className="w-full h-full object-contain" 
                                    />
                                  </div>
                                )}
                                <p>{msg.content}</p>
                              </div>
                            ))}

                            {/* Assistant is generating */}
                            {aiLoading && (
                              <div className="flex gap-2 max-w-[80%] bg-slate-100 text-slate-800 rounded-2xl rounded-tl-none p-3 text-xs border border-slate-200/50">
                                <div className="w-5 h-5 flex-shrink-0 relative overflow-hidden select-none mt-0.5">
                                  <img 
                                    src="/assets/characters/manny/pose_idle.svg" 
                                    alt="Manny Icon" 
                                    className="w-full h-full object-contain animate-bounce" 
                                  />
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100" />
                                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200" />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Question Input Form */}
                    <form onSubmit={handleAskAI} className="pt-2 border-t border-slate-100 flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={aiQuestion}
                          onChange={(e) => setAiQuestion(e.target.value)}
                          placeholder="Posez votre question..."
                          disabled={aiLoading}
                          className="w-full border border-slate-200 rounded-xl py-2.5 pl-3.5 pr-10 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400/80 focus:border-transparent disabled:bg-slate-50"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof window !== "undefined") {
                              const SpeechObj = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                              if (SpeechObj) {
                                sounds.playXPGain();
                                const rec = new SpeechObj();
                                rec.lang = "fr-FR";
                                rec.onresult = (evt: any) => {
                                  const text = evt.results[0][0].transcript;
                                  if (text) {
                                    setAiQuestion(text);
                                  }
                                };
                                rec.start();
                              }
                            }
                          }}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-655"
                          title="Parler pour formuler"
                        >
                          <Mic className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        type="submit"
                        disabled={aiLoading || !aiQuestion.trim()}
                        className="bg-indigo-650 text-white rounded-xl px-3.5 flex items-center justify-center hover:bg-indigo-750 transition disabled:bg-slate-350 shadow-sm"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>

                  </div>
                ) : (
                  // Aucun verset sélectionné
                  <div className="flex-1 flex flex-col justify-center items-center text-center p-4 space-y-4">
                    <Manny mood="praying" size={130} />
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm">Dialogue avec l'Écriture</h4>
                      <p className="text-xs text-slate-500 mt-1.5 max-w-[210px] leading-relaxed">
                        Sélectionnez un verset dans le lecteur puis cliquez sur <strong>"IA Chat"</strong> pour lui poser des questions et obtenir des explications.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STRONG TAB */}
            {activeTab === "strong" && (
              <div className="flex-1 flex flex-col space-y-4 overflow-y-auto">
                {/* Search field */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    Recherche Concordance Strong
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="H430, G3056..."
                        value={strongSearch}
                        onChange={(e) => setStrongSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && fetchStrongManual(strongSearch)}
                        className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 font-mono font-bold"
                      />
                    </div>
                    <button
                      onClick={() => fetchStrongManual(strongSearch)}
                      disabled={strongLoading || !strongSearch}
                      className="px-3 py-2 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition disabled:opacity-40"
                    >
                      {strongLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "OK"}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Hébreu (H1–H8674) · Grec (G1–G5523) · Appuyez sur Entrée
                  </p>
                </div>

                {strongError && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-600 font-medium">
                    {strongError}
                  </div>
                )}

                {strongResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black text-indigo-700">{strongResult.number}</span>
                      <span className={cn(
                        "text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide",
                        strongResult.language === "hebrew" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                      )}>
                        {strongResult.language === "hebrew" ? "🔤 Hébreu" : "🔤 Grec"}
                      </span>
                    </div>
                    {strongResult.lemma && (
                      <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-bold text-slate-800">{strongResult.lemma}</span>
                        {strongResult.pronunciation && (
                          <span className="text-xs text-slate-500 italic">/{strongResult.pronunciation}/</span>
                        )}
                      </div>
                    )}
                    {strongResult.transliteration && (
                      <div className="text-sm font-bold text-indigo-600">{strongResult.transliteration}</div>
                    )}
                    {strongResult.definition && (
                      <div className="border-t border-indigo-100 pt-3 space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Définition</span>
                        <p className="text-xs text-slate-700 leading-relaxed">{strongResult.definition}</p>
                      </div>
                    )}
                    {strongResult.kjvUsage && (
                      <div className="border-t border-indigo-100 pt-3 space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Traductions KJV</span>
                        <p className="text-xs text-slate-600 italic">{strongResult.kjvUsage}</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {!strongResult && !strongError && !strongLoading && (
                  <div className="flex flex-col items-center justify-center text-center py-6 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                      <Hash className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-600">Concordance Strong</p>
                      <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] leading-relaxed">
                        Entrez un numéro Strong (ex: H430 = Elohim, G3056 = Logos) ou cliquez sur un mot dans un verset.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {["H430", "H3068", "G3056", "G26", "G5547"].map(num => (
                        <button
                          key={num}
                          onClick={() => { setStrongSearch(num); fetchStrongManual(num); }}
                          className="text-[10px] font-black bg-white border border-indigo-100 text-indigo-600 px-2 py-1 rounded-lg hover:bg-indigo-50 transition"
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
 
            {/* REFERENCES TAB */}
            {activeTab === "references" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="text-xs font-bold text-slate-500 mb-3.5 flex items-center justify-between">
                  <span>Versets liés</span>
                  {selectedVerse && (
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-black">
                      {selectedVerse.book} {selectedVerse.chapter}:{selectedVerse.verse}
                    </span>
                  )}
                </div>

                {!selectedVerse ? (
                  <div className="flex-1 flex flex-col justify-center items-center text-center p-4 space-y-4">
                    <Manny mood="happy" size={120} />
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm">Références Croisées</h4>
                      <p className="text-xs text-slate-500 mt-1.5 max-w-[210px] leading-relaxed">
                        Sélectionnez un verset dans le lecteur puis cliquez sur <strong>"Références croisées"</strong> dans le menu contextuel.
                      </p>
                    </div>
                  </div>
                ) : loadingCrossRefs ? (
                  <div className="flex-1 flex flex-col justify-center items-center gap-2">
                    <Loader2 className="w-8 h-8 text-indigo-650 animate-spin" />
                    <span className="text-xs font-bold text-slate-500">Recherche des versets liés...</span>
                  </div>
                ) : crossRefs.length === 0 ? (
                  <div className="flex-1 flex flex-col justify-center items-center text-center p-4 space-y-4">
                    <Manny mood="thinking" size={110} />
                    <div>
                      <h4 className="font-bold text-slate-700 text-xs">Aucun verset lié</h4>
                      <p className="text-[10px] text-slate-500 mt-1 max-w-[180px] leading-relaxed">
                        Aucune référence croisée n'a été répertoriée pour ce verset dans notre base.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {crossRefs.map((ref) => {
                      const BIBLE_BOOKS_MAP: Record<number, string> = {
                        1: "Genèse", 2: "Exode", 3: "Lévitique", 4: "Nombres", 5: "Deutéronome",
                        6: "Josué", 7: "Juges", 8: "Ruth", 9: "1 Samuel", 10: "2 Samuel",
                        11: "1 Rois", 12: "2 Rois", 13: "1 Chroniques", 14: "2 Chroniques",
                        15: "Esdras", 16: "Néhémie", 17: "Esther", 18: "Job", 19: "Psaumes",
                        20: "Proverbes", 21: "Ecclésiaste", 22: "Cantique des Cantiques",
                        23: "Ésaïe", 24: "Jérémie", 25: "Lamentations", 26: "Ézéchiel",
                        27: "Daniel", 28: "Osée", 29: "Joël", 30: "Amos", 31: "Abdias",
                        32: "Jonas", 33: "Michée", 34: "Nahum", 35: "Habacuc", 36: "Sophonie",
                        37: "Aggée", 38: "Zacharie", 39: "Malachie", 40: "Matthieu",
                        41: "Marc", 42: "Luc", 43: "Jean", 44: "Actes", 45: "Romains",
                        46: "1 Corinthiens", 47: "2 Corinthiens", 48: "Galates", 49: "Éphésiens",
                        50: "Philippiens", 51: "Colossiens", 52: "1 Thessaloniciens",
                        53: "2 Thessaloniciens", 54: "1 Timothée", 55: "2 Timothée",
                        56: "Tite", 57: "Philémon", 58: "Hébreux", 59: "Jacques",
                        60: "1 Pierre", 61: "2 Pierre", 62: "1 Jean", 63: "2 Jean",
                        64: "3 Jean", 65: "Jude", 66: "Apocalypse"
                      };

                      return (
                        <div
                          key={ref.id}
                          onClick={() => {
                            const bookName = BIBLE_BOOKS_MAP[ref.toBook];
                            if (bookName) {
                              sounds.playXPGain();
                              setSelectedBook(bookName);
                              setSelectedChapter(ref.toChapter);
                              setPendingVerseSelection(ref.toVerse);
                            }
                          }}
                          className="bg-slate-50 border border-slate-105 hover:border-indigo-150 hover:bg-indigo-50/10 rounded-2xl p-3.5 cursor-pointer transition-all duration-300 space-y-2 group"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-indigo-750">
                              {ref.refLabel}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] bg-slate-200 text-slate-600 font-extrabold px-1.5 py-0.5 rounded">
                                {ref.votes} votes
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-700 leading-relaxed line-clamp-2 font-medium">
                            {ref.text.length > 100 ? `${ref.text.substring(0, 100)}...` : ref.text}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* MORPHOLOGY TAB */}
            {activeTab === "morphology" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="text-xs font-bold text-slate-500 mb-3.5 flex items-center justify-between">
                  <span>Analyse morphologique</span>
                  {selectedVerse && (
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-black">
                      {selectedVerse.book} {selectedVerse.chapter}:{selectedVerse.verse}
                    </span>
                  )}
                </div>

                {!selectedVerse ? (
                  <div className="flex-1 flex flex-col justify-center items-center text-center p-4 space-y-4">
                    <Manny mood="happy" size={120} />
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm">Morphologie des mots</h4>
                      <p className="text-xs text-slate-500 mt-1.5 max-w-[210px] leading-relaxed">
                        Sélectionnez un verset dans le lecteur puis cliquez sur <strong>"Morphologie"</strong> pour analyser le texte original (hébreu/grec).
                      </p>
                    </div>
                  </div>
                ) : loadingMorphology ? (
                  <div className="flex-1 flex flex-col justify-center items-center gap-2">
                    <Loader2 className="w-8 h-8 text-emerald-650 animate-spin" />
                    <span className="text-xs font-bold text-slate-500">Chargement de l'analyse...</span>
                  </div>
                ) : morphologyWords.length === 0 ? (
                  <div className="flex-1 flex flex-col justify-center items-center text-center p-4 space-y-4">
                    <Manny mood="thinking" size={110} />
                    <div>
                      <h4 className="font-bold text-slate-700 text-xs">Aucune donnée disponible</h4>
                      <p className="text-[10px] text-slate-500 mt-1 max-w-[180px] leading-relaxed">
                        La morphologie n'est pas encore importée pour ce livre. (Disponible pour Genèse et Jean).
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
                    {morphologyWords.map((word) => {
                      const isHebrew = word.strongNumber?.startsWith("H");
                      return (
                        <div
                          key={word.id}
                          className="bg-slate-50 border border-slate-105 rounded-2xl p-4 space-y-3"
                        >
                          {/* En-tête : Mot original, translittération, Strong */}
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-1">
                              <span
                                className={cn(
                                  "text-2xl font-bold block text-slate-800",
                                  isHebrew && "text-right font-serif"
                                )}
                                dir={isHebrew ? "rtl" : "ltr"}
                              >
                                {word.originalText}
                              </span>
                              {word.transliteration && (
                                <span className="text-xs text-indigo-650 font-bold block">
                                  {word.transliteration}
                                </span>
                              )}
                            </div>
                            {word.strongNumber && (
                              <button
                                onClick={() => {
                                  setStrongSearch(word.strongNumber);
                                  setActiveTab("strong");
                                  fetchStrongManual(word.strongNumber);
                                }}
                                className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-black px-2.5 py-1 rounded-lg hover:bg-indigo-100 transition cursor-pointer"
                                title="Voir la définition Strong"
                              >
                                {word.strongNumber}
                              </button>
                            )}
                          </div>

                          {/* Lemme/Racine & Gloss */}
                          <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-200/60 pt-2.5">
                            <div>
                              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                Lemme / Racine
                              </span>
                              <span className="font-bold text-slate-700">{word.root || "—"}</span>
                            </div>
                            <div>
                              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                Traduction (Gloss)
                              </span>
                              <span className="font-bold text-slate-700">{word.gloss || "—"}</span>
                            </div>
                          </div>

                          {/* Morphologie */}
                          {word.morphology && (
                            <div className="border-t border-slate-200/60 pt-2.5 space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                  Morphologie ({word.morphology})
                                </span>
                              </div>
                              <p className="text-xs text-slate-650 font-semibold leading-relaxed">
                                {word.morphologyDesc || "Aucune description disponible."}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
