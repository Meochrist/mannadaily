"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  Sparkles, 
  Send, 
  Trash2, 
  Edit3, 
  MessageSquare, 
  ChevronRight, 
  ChevronLeft, 
  Mic, 
  X, 
  Bookmark, 
  BookOpenCheck, 
  List, 
  Loader2, 
  Info,
  Volume2
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
  const [activeTab, setActiveTab] = useState<"notes" | "ai">("notes");
  const [userNotes, setUserNotes] = useState<SavedNote[]>([]);
  
  // Current editing note state
  const [currentNoteText, setCurrentNoteText] = useState<string>("");
  const [savingNote, setSavingNote] = useState<boolean>(false);

  // AI chat state
  const [aiQuestion, setAiQuestion] = useState<string>("");
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [chatHistories, setChatHistories] = useState<Record<string, ChatMessage[]>>({}); // Keyed by verseId

  // UI layout reference
  const containerRef = useRef<HTMLDivElement>(null);
  const speechRecognitionActive = useRef<boolean>(false);

  // Fetch books on mount
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
    fetchBooks();
    fetchUserNotes();
  }, []);

  // Fetch verses when book, chapter or translation changes
  useEffect(() => {
    async function fetchVerses() {
      if (!selectedBook) return;
      setLoadingVerses(true);
      setSelectedVerse(null);
      setContextMenuPosition(null);
      try {
        const res = await fetch(
          `/api/bible/${encodeURIComponent(selectedBook)}/${selectedChapter}?translation=${translation}`
        );
        if (res.ok) {
          const data = await res.json();
          setVerses(data.verses || []);
        }
      } catch (err) {
        console.error("Error fetching verses:", err);
      } finally {
        setLoadingVerses(false);
      }
    }
    fetchVerses();
  }, [selectedBook, selectedChapter, translation]);

  // Load verse text if active verse changes to edit notes
  useEffect(() => {
    if (selectedVerse) {
      setCurrentNoteText(selectedVerse.note?.content || "");
    } else {
      setCurrentNoteText("");
    }
  }, [selectedVerse]);

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
        <div className="flex gap-4 items-center">
          <div className="bg-indigo-950/40 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-indigo-500/20 text-center">
            <span className="block text-xs font-bold text-indigo-300 uppercase tracking-wider">Notes Sauvegardées</span>
            <span className="text-xl font-black">{userNotes.length}</span>
          </div>
          <select 
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
            className="bg-indigo-950/60 backdrop-blur-md text-white border border-indigo-500/30 rounded-2xl px-3 py-2 text-sm font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
          >
            <option value="LSG">LSG (Louis Segond)</option>
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
                      {v.text}
                    </span>

                    {/* Small note icon if note exists */}
                    {v.note && (
                      <span className="inline-flex ml-2 align-middle" title="Ce verset contient une note">
                        <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                      </span>
                    )}

                    {/* Quick indicator when hovering */}
                    <span className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-50 text-indigo-600 text-[10px] font-black px-1.5 py-0.5 rounded-lg">
                      Surligner / Annoter
                    </span>
                  </div>
                ))}
              </div>
            )}

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
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setActiveTab("notes");
                          setContextMenuPosition(null);
                        }}
                        className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-slate-200 text-[11px] font-black text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Annoter
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab("ai");
                          setContextMenuPosition(null);
                        }}
                        className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-indigo-600 text-[11px] font-black text-white hover:bg-indigo-700 hover:scale-102 transition shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                        IA Chat
                      </button>
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
          <div className="flex border-b border-slate-100 bg-slate-50/50 p-1">
            <button
              onClick={() => {
                setActiveTab("notes");
                sounds.playXPGain();
              }}
              className={cn(
                "flex-1 py-3 text-xs font-black rounded-2xl transition flex items-center justify-center gap-1.5",
                activeTab === "notes"
                  ? "bg-white text-indigo-750 shadow-sm border border-slate-100"
                  : "text-slate-400 hover:text-slate-650"
              )}
            >
              <Edit3 className="w-4 h-4" />
              Notes
            </button>
            <button
              onClick={() => {
                setActiveTab("ai");
                sounds.playXPGain();
              }}
              className={cn(
                "flex-1 py-3 text-xs font-black rounded-2xl transition flex items-center justify-center gap-1.5",
                activeTab === "ai"
                  ? "bg-white text-indigo-750 shadow-sm border border-slate-100"
                  : "text-slate-400 hover:text-slate-650"
              )}
            >
              <Sparkles className="w-4 h-4" />
              Parler à l'Écriture
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

          </div>
        </div>

      </div>
    </div>
  );
}
