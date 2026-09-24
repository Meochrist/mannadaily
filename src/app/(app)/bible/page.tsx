"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

// Minimal local type pour éviter d'ajouter une dépendance DOM externe sur SpeechRecognitionEvent
type SpeechRecognitionEvent = {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
};
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
  Link as LinkIcon,
  Share2
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as sounds from "@/lib/sounds";
import Manny from "@/components/mascot/Manny";
import SpeechMicButton from "@/components/meditation/SpeechMicButton";
import VerseShareModal from "@/components/bible/VerseShareModal";


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
  // Traductions françaises (générées par IA et mises en cache côté serveur)
  definitionFr?: string | null;
  kjvUsageFr?: string | null;
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
  const [selectedBook, setSelectedBook] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("manna_bible_position");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed.book === "string") {
            return parsed.book;
          }
        } catch {}
      }
    }
    return "Genèse";
  });
  const [selectedChapter, setSelectedChapter] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("manna_bible_position");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed.chapter === "number") {
            return parsed.chapter;
          }
        } catch {}
      }
    }
    return 1;
  });
  const [translation, setTranslation] = useState<string>("LSG");
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loadingVerses, setLoadingVerses] = useState<boolean>(false);
  const [showAT, setShowAT] = useState<boolean>(true);
  const [showNT, setShowNT] = useState<boolean>(true);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  // Synchronisation de la position de la Bible (Tâche #C)
  useEffect(() => {
    if (typeof window !== "undefined" && selectedBook) {
      sessionStorage.setItem(
        "manna_bible_position",
        JSON.stringify({ book: selectedBook, chapter: selectedChapter })
      );
    }
  }, [selectedBook, selectedChapter]);

  // User interactive state
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
  
  // Share state
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [shareVerseData, setShareVerseData] = useState<{ text: string; reference: string; translation: string } | null>(null);
  
  // Right sidebar state
  const [activeTab, setActiveTab] = useState<"notes" | "ai" | "strong" | "references" | "morphology" | "commentary">("notes");
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
  // Recherche Strong par mot (l'utilisateur ne connaît pas les codes H430/G3056)
  type StrongSearchResult = { id: string; number: string; language: string; lemma?: string | null; transliteration?: string | null; definition?: string | null; kjvUsage?: string | null; definitionFr?: string | null; kjvUsageFr?: string | null };
  const [strongResults, setStrongResults] = useState<StrongSearchResult[]>([]);
  const [strongSearching, setStrongSearching] = useState<boolean>(false);

  // Cross references state
  const [crossRefs, setCrossRefs] = useState<{id: string; text: string; refLabel?: string; toBook?: string | number; toChapter?: number; toVerse?: number; votes?: number}[]>([]);
  const [loadingCrossRefs, setLoadingCrossRefs] = useState<boolean>(false);
  const [pendingVerseSelection, setPendingVerseSelection] = useState<number | null>(null);

  // Morphology state
  type MorphologyWord = { id: string; strongNumber?: string; originalText?: string; transliteration?: string; root?: string; gloss?: string; morphology?: string; morphologyDesc?: string; language?: string; parsing?: string };
  const [morphologyWords, setMorphologyWords] = useState<MorphologyWord[]>([]);
  const [loadingMorphology, setLoadingMorphology] = useState<boolean>(false);

  // Commentary state
  type Commentary = { id: string; verse: number; author?: string; createdAt: string; content?: string };
  const [commentaries, setCommentaries] = useState<Commentary[]>([]);
  const [loadingCommentaries, setLoadingCommentaries] = useState<boolean>(false);
  const [generatingCommentary, setGeneratingCommentary] = useState<boolean>(false);

  // UI layout reference
  const containerRef = useRef<HTMLDivElement>(null);
  const speechRecognitionActive = useRef<boolean>(false);

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
    queueMicrotask(() => fetchUserNotes());
  }, []);

  // Synchroniser avec les query parameters de l'URL s'ils existent
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const bookParam = params.get("book");
      const chapterParam = params.get("chapter");
      if (bookParam) {
        queueMicrotask(() => setSelectedBook(bookParam));
      }
      if (chapterParam) {
        queueMicrotask(() => setSelectedChapter(parseInt(chapterParam, 10) || 1));
      }
    }
  }, []);

  // Fetch verses when book, chapter or translation changes
  // Fetch verses when book, chapter, translation or compareMode changes
  useEffect(() => {
    async function fetchVerses() {
      if (!selectedBook) return;
      setLoadingVerses(true);
      setSelectedVerse(null);

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
      queueMicrotask(() => setCurrentNoteText(selectedVerse.note?.content || ""));
    } else {
      queueMicrotask(() => setCurrentNoteText(""));
    }
  }, [selectedVerse, activeTab]);

  // Fetch cross references when selected verse changes
  useEffect(() => {
    async function fetchCrossRefs() {
      if (!selectedVerse || activeTab !== "references") {
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
      if (!selectedVerse || (activeTab !== "morphology" && activeTab !== "strong")) {
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

  // Fetch commentaries when selectedVerse or activeTab changes
  useEffect(() => {
    async function fetchCommentaries() {
      if (!selectedVerse || activeTab !== "commentary") {
        setCommentaries([]);
        return;
      }
      setLoadingCommentaries(true);
      try {
        let bookNum = selectedVerse.bookNumber;
        if (!bookNum || bookNum === 0) {
          const bookIdx = books.findIndex(b => b.name === selectedVerse.book);
          if (bookIdx !== -1) {
            bookNum = bookIdx + 1;
          }
        }
        if (!bookNum || bookNum === 0) {
          setCommentaries([]);
          return;
        }
        const res = await fetch(`/api/bible/commentary?book=${bookNum}&chapter=${selectedVerse.chapter}&verse=${selectedVerse.verse}`);
        if (res.ok) {
          const data = await res.json();
          setCommentaries(data.commentaries || []);
        } else {
          setCommentaries([]);
        }
      } catch (err) {
        console.error("Error fetching commentaries:", err);
        setCommentaries([]);
      } finally {
        setLoadingCommentaries(false);
      }
    }
    fetchCommentaries();
  }, [selectedVerse, activeTab, books]);

  // Handle pending verse selection when verses finish loading
  useEffect(() => {
    if (pendingVerseSelection && verses.length > 0 && !loadingVerses) {
      const targetVerse = verses.find(v => v.verse === pendingVerseSelection);
      if (targetVerse) {
        queueMicrotask(() => setSelectedVerse(targetVerse));
      }
      queueMicrotask(() => setPendingVerseSelection(null));
    }
  }, [verses, pendingVerseSelection, loadingVerses]);

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
    // Sélection simple : la barre d'actions fixe en bas prend le relais.
    // Un second clic sur le même verset le désélectionne.
    setWordPopover(null);

    setSelectedVerse((prev) => (prev?.id === verse.id ? null : verse));
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
        // Update local state — on garde le verset sélectionné (notes/IA restent actives)
        setVerses(prev => prev.map(v => v.id === selectedVerse.id ? { ...v, highlightColor: color } : v));
        setSelectedVerse(prev => prev ? { ...prev, highlightColor: color } : null);

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
        // Update local state — on garde le verset sélectionné
        setVerses(prev => prev.map(v => v.id === selectedVerse.id ? { ...v, highlightColor: null } : v));
        setSelectedVerse(prev => prev ? { ...prev, highlightColor: null } : null);

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

  // Poser question à l&apos;IA
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

  // Détermine le numéro Strong réel en interrogeant la morphologie (HebrewWord/GreekWord)
  const resolveStrongNumber = async (verse: Verse, wordIndex: number): Promise<{ strongNumber: string; originalText: string; gloss: string } | null> => {
    let bookNum = verse.bookNumber;
    if (!bookNum || bookNum === 0) {
      const bookIdx = books.findIndex(b => b.name === verse.book);
      bookNum = bookIdx !== -1 ? bookIdx + 1 : 0;
    }
    if (!bookNum || bookNum === 0) return null;

    const language = bookNum <= 39 ? "hebrew" : "greek";
    try {
      const res = await fetch(`/api/bible/morphology?book=${bookNum}&chapter=${verse.chapter}&verse=${verse.verse}&language=${language}`);
      if (!res.ok) return null;
      const data = await res.json();
      const words = (data.words || []) as { wordPosition: number; strongNumber?: string | null; originalText?: string; gloss?: string | null }[];
      const target = words.find((w) => w.wordPosition === wordIndex + 1);
      if (target?.strongNumber) {
        return { strongNumber: target.strongNumber, originalText: target.originalText || "", gloss: target.gloss || "" };
      }
      // Fallback : premier mot ayant un strongNumber (au cas où l'index diverge)
      const firstWithStrong = words.find((w) => w.strongNumber);
      if (firstWithStrong?.strongNumber) {
        return { strongNumber: firstWithStrong.strongNumber, originalText: firstWithStrong.originalText || "", gloss: firstWithStrong.gloss || "" };
      }
    } catch {
      return null;
    }
    return null;
  };

  // Clic sur un mot du verset → affiche popover Strong (avec le vrai numéro)
  const handleWordClick = async (
    e: React.MouseEvent<HTMLSpanElement>,
    word: string,
    wordIndex: number,
    verse: Verse
  ) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };

    setWordPopover({
      word,
      strongNumber: "",
      entry: null,
      loading: true,
      x: rect.left - containerRect.left,
      y: rect.bottom - containerRect.top + 6,
    });

    // 1. Résoudre le vrai numéro Strong via la morphologie
    const resolved = await resolveStrongNumber(verse, wordIndex);
    if (!resolved) {
      setWordPopover(prev => prev ? { ...prev, loading: false, strongNumber: "" } : null);
      return;
    }

    setWordPopover(prev => prev ? { ...prev, strongNumber: resolved.strongNumber } : null);

    // 2. Récupérer la définition Strong
    try {
      const res = await fetch(`/api/bible/strong/${resolved.strongNumber}`);
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

  /**
   * Recherche Strong intelligente : accepte un MOT ("amour", "lumière",
   * "elohim") aussi bien qu'un code (H430). L'utilisateur n'a plus besoin
   * de connaître les numéros.
   */
  const searchStrongByWord = useCallback(async (query: string) => {
    const raw = query.trim();
    if (raw.length < 2) {
      setStrongError("Tapez au moins 2 caractères.");
      setStrongResults([]);
      setStrongResult(null);
      return;
    }

    // Code Strong direct → affichage détaillé immédiat
    const asCode = raw.toUpperCase().replace(/^([HG])0+(\d+)$/, "$1$2");
    if (/^[HG]\d+$/.test(asCode)) {
      setStrongResults([]);
      await fetchStrongManual(asCode);
      return;
    }

    setStrongSearching(true);
    setStrongError("");
    setStrongResult(null);
    setStrongResults([]);
    try {
      const res = await fetch(`/api/bible/strong/search?q=${encodeURIComponent(raw)}`);
      if (res.ok) {
        const data = await res.json();
        const results = (data.results || []) as StrongSearchResult[];
        if (results.length === 0) {
          setStrongError(`Aucun mot original trouvé pour « ${raw} ». Essayez un autre terme (ex : amour, lumière, paix).`);
        } else if (results.length === 1) {
          // Un seul résultat → l'ouvrir directement avec tous ses détails
          await fetchStrongManual(results[0].number);
        } else {
          setStrongResults(results);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setStrongError(err.error || "Erreur lors de la recherche.");
      }
    } catch {
      setStrongError("Erreur lors de la recherche.");
    } finally {
      setStrongSearching(false);
    }
  }, [fetchStrongManual]);

  // Générer un commentaire via l&apos;IA
  const handleGenerateCommentary = async () => {
    if (!selectedVerse) return;
    setGeneratingCommentary(true);
    try {
      const res = await fetch("/api/meditation/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "commentary",
          verse: selectedVerse.text,
          reference: `${selectedVerse.book} ${selectedVerse.chapter}:${selectedVerse.verse}`
        })
      });
      if (res.ok) {
        sounds.playSuccess();
        const data = await res.json();
        if (data.commentary) {
          setCommentaries(prev => [...prev, data.commentary]);
        }
      }
    } catch (err) {
      console.error("Error generating commentary:", err);
    } finally {
      setGeneratingCommentary(false);
    }
  };

  return (
    <div className="relative flex flex-col h-full space-y-4 max-w-7xl mx-auto" ref={containerRef}>
      {/* Top Banner with statistics / information */}
      <div className="flex-shrink-0 bg-gradient-to-r from-indigo-700 via-indigo-800 to-indigo-900 text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="space-y-1 text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2 justify-center md:justify-start">
            <BookOpen className="w-8 h-8 text-indigo-300 animate-pulse" />
            La Sainte Bible
          </h1>
          <p className="text-indigo-200 text-sm max-w-md font-medium">
            Explorez les Écritures, surlignez des passages inspirants, rédigez vos annotations et conversez avec l&apos;intelligence artificielle pour approfondir votre foi.
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
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        
        {/* COLUMN 1: NAVIGATION (visible on desktop) */}
        <div className="hidden lg:flex lg:col-span-3 bg-white rounded-3xl border border-slate-100 shadow-sm p-4 flex-col overflow-hidden h-full">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-3 flex-shrink-0">
            <List className="w-5 h-5 text-indigo-600" />
            <h2 className="font-extrabold text-slate-800 text-sm">Livres & Chapitres</h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 bg-white">
            {/* Old Testament */}
            <div className="space-y-1.5">
              <button
                onClick={() => {
                  setShowAT(!showAT);
                  sounds.playXPGain();
                }}
                className="w-full flex items-center justify-between text-xs font-black text-indigo-900 bg-indigo-50 px-3 py-2.5 rounded-xl tracking-wider uppercase hover:bg-indigo-100/80 transition cursor-pointer"
              >
                <span>Ancien Testament ({oldTestament.length})</span>
                <span className="text-[10px]">{showAT ? "▼" : "▶"}</span>
              </button>
              {showAT && (
                <div className="space-y-1 pt-1.5 pl-1">
                  {oldTestament.map((book) => (
                    <button
                      key={book.name}
                      onClick={() => {
                        setSelectedBook(book.name);
                        setSelectedChapter(1);
                        sounds.playXPGain();
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded text-xs font-extrabold transition flex items-center justify-between cursor-pointer",
                        selectedBook === book.name
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <span className="whitespace-normal break-words">{book.name}</span>
                      {selectedBook === book.name && (
                        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* New Testament */}
            <div className="space-y-1.5">
              <button
                onClick={() => {
                  setShowNT(!showNT);
                  sounds.playXPGain();
                }}
                className="w-full flex items-center justify-between text-xs font-black text-emerald-900 bg-emerald-50 px-3 py-2.5 rounded-xl tracking-wider uppercase hover:bg-emerald-100/80 transition cursor-pointer"
              >
                <span>Nouveau Testament ({newTestament.length})</span>
                <span className="text-[10px]">{showNT ? "▼" : "▶"}</span>
              </button>
              {showNT && (
                <div className="space-y-1 pt-1.5 pl-1">
                  {newTestament.map((book) => (
                    <button
                      key={book.name}
                      onClick={() => {
                        setSelectedBook(book.name);
                        setSelectedChapter(1);
                        sounds.playXPGain();
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded text-xs font-extrabold transition flex items-center justify-between cursor-pointer",
                        selectedBook === book.name
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <span className="whitespace-normal break-words">{book.name}</span>
                      {selectedBook === book.name && (
                        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLUMN 2: READER (55% -> 6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden h-[70vh] lg:h-full">
          {/* Header of Reader */}
          <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => {
                  setDrawerOpen(true);
                  sounds.playXPGain();
                }}
                className="md:hidden flex items-center gap-1.5 px-3 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-black hover:bg-indigo-100/85 active:scale-95 transition cursor-pointer"
                title="Choisir un livre"
              >
                📚 <span className="sm:inline hidden">Livres</span>
              </button>
              <div className="flex items-center gap-1.5">
                <BookOpenCheck className="w-4 h-4 text-indigo-600" />
                <span className="font-extrabold text-slate-800 text-sm md:text-base">
                  {selectedBook} {selectedChapter}
                </span>
              </div>
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
          <div className={cn(
            "flex-1 overflow-y-auto p-6 space-y-4 relative",
            // Espace pour que la barre d'actions ne masque pas les derniers versets
            selectedVerse && "pb-56 md:pb-44"
          )}>
            {loadingVerses ? (
              <div className="absolute inset-0 flex flex-col justify-center items-center gap-2 bg-white/70 backdrop-blur-sm">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <span className="text-xs font-bold text-slate-500">Chargement des versets...</span>
              </div>
            ) : verses.length === 0 ? (
              <div className="flex flex-col justify-center items-center text-center h-full p-4 space-y-4">
                <Info className="w-12 h-12 text-slate-400" />
                <div>
                  <h3 className="font-bold text-slate-700">Aucun verset disponible</h3>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Ce chapitre n&apos;a pas encore été importé. Vérifiez vos paramètres ou revenez plus tard.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 select-text">
                {/* Aide contextuelle — disparaît dès qu'un verset est sélectionné */}
                {!selectedVerse && (
                  <div className="flex items-center gap-2 bg-indigo-50/70 border border-indigo-100 rounded-2xl px-3.5 py-2.5 text-[11px] text-indigo-800 font-semibold">
                    <Info className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <span>
                      Touchez un verset pour le surligner, l&apos;annoter ou le partager · Touchez un mot pour l&apos;hébreu/grec
                    </span>
                  </div>
                )}

                {verses.map((v) => (
                  <div
                    key={v.id}
                    onClick={(e) => handleVerseClick(e, v)}
                    className={cn(
                      "group relative py-2 px-3 rounded-2xl cursor-pointer hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all duration-300",
                      getHighlightClass(v.highlightColor),
                      selectedVerse?.id === v.id && "bg-indigo-50 border-indigo-300 ring-1 ring-indigo-200"
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
                            // Sélectionne le verset et charge le mot pour Strong,
                            // sans ouvrir de popover flottant (barre d'actions en bas).
                            setSelectedVerse(v);

                            handleWordClick(e, word, wi, v);
                          }}
                          className="cursor-pointer hover:text-indigo-600 hover:bg-indigo-100 rounded px-0.5 transition-colors duration-150"
                          title={`Voir « ${word} » en hébreu/grec`}
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

            {/* Strong Word Popover — pas de backdrop fixed (bloque le scroll) */}
            <AnimatePresence>
              {wordPopover && (
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
                        {(wordPopover.entry.definitionFr || wordPopover.entry.definition) && (
                          <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-2">
                            {(wordPopover.entry.definitionFr || wordPopover.entry.definition || "").substring(0, 220)}
                            {(wordPopover.entry.definitionFr || wordPopover.entry.definition || "").length > 220 ? '...' : ''}
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
                )}
            </AnimatePresence>

            {/* Ancien menu contextuel flottant remplacé par la barre d'actions fixe en bas de page */}
          </div>
        </div>

        {/* COLUMN 3: NOTES & AI (25% -> 3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden h-[75vh] lg:h-full">
          {/* Double Tabs — scrollable horizontalement pour accéder aux 6 onglets */}
          <div className="flex border-b border-slate-100 bg-slate-50/50 p-1 gap-1 overflow-x-auto flex-nowrap flex-shrink-0 scrollbar-thin scrollbar-thumb-slate-300 [scrollbar-width:thin]">
            <button
              onClick={() => {
                setActiveTab("notes");
                sounds.playXPGain();
              }}
              className={cn(
                "flex-shrink-0 px-3 py-2.5 text-[10px] md:text-xs font-black rounded-2xl transition flex items-center justify-center gap-1 whitespace-nowrap",
                activeTab === "notes"
                  ? "bg-white text-indigo-700 shadow-sm border border-slate-100"
                  : "text-slate-400 hover:text-slate-600"
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
                "flex-shrink-0 px-3 py-2.5 text-[10px] md:text-xs font-black rounded-2xl transition flex items-center justify-center gap-1 whitespace-nowrap",
                activeTab === "ai"
                  ? "bg-white text-indigo-700 shadow-sm border border-slate-100"
                  : "text-slate-400 hover:text-slate-600"
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
                "flex-shrink-0 px-3 py-2.5 text-[10px] md:text-xs font-black rounded-2xl transition flex items-center justify-center gap-1 whitespace-nowrap",
                activeTab === "strong"
                  ? "bg-white text-indigo-700 shadow-sm border border-slate-100"
                  : "text-slate-400 hover:text-slate-600"
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
                "flex-shrink-0 px-3 py-2.5 text-[10px] md:text-xs font-black rounded-2xl transition flex items-center justify-center gap-1 whitespace-nowrap",
                activeTab === "references"
                  ? "bg-white text-indigo-700 shadow-sm border border-slate-100"
                  : "text-slate-400 hover:text-slate-600"
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
                "flex-shrink-0 px-3 py-2.5 text-[10px] md:text-xs font-black rounded-2xl transition flex items-center justify-center gap-1 whitespace-nowrap",
                activeTab === "morphology"
                  ? "bg-white text-indigo-700 shadow-sm border border-slate-100"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Morpho.
            </button>
            <button
              onClick={() => {
                setActiveTab("commentary");
                sounds.playXPGain();
              }}
              className={cn(
                "flex-shrink-0 px-3 py-2.5 text-[10px] md:text-xs font-black rounded-2xl transition flex items-center justify-center gap-1 whitespace-nowrap",
                activeTab === "commentary"
                  ? "bg-white text-indigo-700 shadow-sm border border-slate-100"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Comment.
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
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-2">
                        <span className="text-xs font-black text-amber-700 block">
                          {selectedVerse.book} {selectedVerse.chapter}:{selectedVerse.verse}
                        </span>
                        <p className="text-[11px] text-slate-600 italic leading-relaxed line-clamp-3">
                          &quot;{selectedVerse.text}&quot;
                        </p>
                      </div>

                      {/* Note Edit Area */}
                      <div className="space-y-1.5 relative">
                        <label className="text-xs font-extrabold text-slate-700 block">
                          Votre annotation
                        </label>
                        <div className="relative">
                          <textarea
                            value={currentNoteText}
                            onChange={(e) => setCurrentNoteText(e.target.value)}
                            placeholder="Écrivez vos pensées, prières ou révélations sur ce verset ici..."
                            className="w-full min-h-[160px] border border-slate-200 rounded-2xl p-3.5 text-xs font-medium bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/80 focus:border-transparent pb-10"
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
                            Surlignez un verset puis cliquez sur &quot;Annoter&quot; pour enregistrer vos pensées ici.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {userNotes.map((note) => (
                          <div
                            key={note.id}
                            onClick={() => handleLoadNoteVerse(note)}
                            className="bg-slate-50 border border-slate-200 hover:border-indigo-100 hover:bg-indigo-50/10 rounded-2xl p-3.5 cursor-pointer transition-all duration-300 space-y-2 group"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-black text-indigo-700">
                                {note.verse.book} {note.verse.chapter}:{note.verse.verse}
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                            <p className="text-[11px] text-slate-700 leading-relaxed line-clamp-3 font-semibold">
                              {note.content}
                            </p>
                            <p className="text-[10px] text-slate-400 italic line-clamp-1">
                              &quot;{note.verse.text}&quot;
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
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="text-[11px] font-black text-amber-700">
                          {selectedVerse.book} {selectedVerse.chapter}:{selectedVerse.verse}
                        </span>
                        <button
                          onClick={() => setSelectedVerse(null)}
                          className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" /> Retour
                        </button>
                      </div>

                      {/* Rappel du texte du verset */}
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex-shrink-0">
                        <p className="text-[11px] text-slate-600 italic leading-relaxed line-clamp-3">
                          &quot;{selectedVerse.text}&quot;
                        </p>
                      </div>

                      {/* Messages History */}
                      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-1">
                        {activeVerseChat.length === 0 ? (
                          <div className="flex flex-col items-center justify-center text-center p-4 py-8 space-y-4">
                            <Manny mood="thinking" size={100} />
                            <div>
                              <h4 className="font-bold text-slate-700 text-xs">Parler à l&apos;Écriture</h4>
                              <p className="text-[10px] text-slate-500 mt-1 max-w-[190px] leading-relaxed">
                                Posez n&apos;importe quelle question sur ce verset. L&apos;IA vous guidera avec sagesse.
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
                                    : "bg-slate-100 text-slate-800 font-medium rounded-tl-none border border-slate-200/50"
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
                          className="w-full border border-slate-200 rounded-xl py-2.5 pl-3.5 pr-10 text-xs font-medium bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/80 focus:border-transparent disabled:bg-slate-50"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof window !== "undefined") {
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              const SpeechObj = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                              if (SpeechObj) {
                                sounds.playXPGain();
                                const rec = new SpeechObj();
                                rec.lang = "fr-FR";
                                rec.onresult = (evt: SpeechRecognitionEvent) => {
                                  const text = evt.results[0][0].transcript;
                                  if (text) {
                                    setAiQuestion(text);
                                  }
                                };
                                rec.start();
                              }
                            }
                          }}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                          title="Parler pour formuler"
                        >
                          <Mic className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        type="submit"
                        disabled={aiLoading || !aiQuestion.trim()}
                        className="bg-indigo-600 text-white rounded-xl px-3.5 flex items-center justify-center hover:bg-indigo-700 transition disabled:bg-slate-300 shadow-sm"
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
                      <h4 className="font-extrabold text-slate-800 text-sm">Dialogue avec l&apos;Écriture</h4>
                      <p className="text-xs text-slate-500 mt-1.5 max-w-[210px] leading-relaxed">
                        Sélectionnez un verset dans le lecteur puis cliquez sur <strong>&quot;IA Chat&quot;</strong> pour lui poser des questions et obtenir des explications.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STRONG TAB */}
            {activeTab === "strong" && (
              <div className="flex-1 flex flex-col space-y-4 overflow-y-auto">
                {/* Rappel du verset sélectionné — toujours visible */}
                {selectedVerse && (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 space-y-2 flex-shrink-0">
                    <span className="text-[10px] font-black text-amber-700 block">
                      {selectedVerse.book} {selectedVerse.chapter}:{selectedVerse.verse}
                    </span>
                    <p className="text-[11px] text-slate-700 italic leading-relaxed">
                      &quot;{selectedVerse.text}&quot;
                    </p>

                    {/* Mots du verset cliquables — on affiche le mot FRANÇAIS,
                        pas le code Strong (l'utilisateur ne connaît pas H430/G3056) */}
                    <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                        Touchez un mot pour voir son sens original
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                        {selectedVerse.text.split(/\s+/).map((word, idx) => {
                          const clean = word.replace(/[.,;:!?«»"'()]/g, "");
                          if (!clean) return null;
                          const morph = morphologyWords[idx];
                          const hasStrong = Boolean(morph?.strongNumber);
                          return (
                            <button
                              key={idx}
                              onClick={async () => {
                                if (morph?.strongNumber) {
                                  setStrongSearch(clean);
                                  setStrongResults([]);
                                  await fetchStrongManual(morph.strongNumber);
                                } else {
                                  setStrongSearch(clean);
                                  await searchStrongByWord(clean);
                                }
                              }}
                              className={cn(
                                "text-[11px] font-bold px-2 py-1 rounded-lg transition cursor-pointer border",
                                hasStrong
                                  ? "bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                  : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                              )}
                              title={
                                morph?.originalText
                                  ? `${morph.originalText}${morph.transliteration ? ` (${morph.transliteration})` : ""}`
                                  : `Rechercher « ${clean} »`
                              }
                            >
                              {clean}
                            </button>
                          );
                        })}
                      </div>
                      {loadingMorphology && (
                        <p className="text-[10px] text-slate-400">Chargement de l&apos;hébreu/grec…</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Search field — accepte un MOT ou un code Strong */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    Rechercher un mot
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="amour, lumière, paix, grâce…"
                        value={strongSearch}
                        onChange={(e) => setStrongSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && searchStrongByWord(strongSearch)}
                        className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 font-semibold"
                      />
                    </div>
                    <button
                      onClick={() => searchStrongByWord(strongSearch)}
                      disabled={strongLoading || strongSearching || !strongSearch}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition disabled:opacity-40"
                    >
                      {strongLoading || strongSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "OK"}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Tapez un mot en français, ou un code Strong si vous le connaissez (H430, G3056)
                  </p>

                  {/* Suggestions de mots courants */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {["amour", "lumière", "paix", "grâce", "foi", "esprit"].map((w) => (
                      <button
                        key={w}
                        onClick={() => {
                          setStrongSearch(w);
                          searchStrongByWord(w);
                        }}
                        className="text-[10px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-600 px-2 py-1 rounded-lg hover:bg-indigo-100 transition cursor-pointer"
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>

                {strongError && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-600 font-medium">
                    {strongError}
                  </div>
                )}

                {/* Liste de résultats quand plusieurs mots originaux correspondent */}
                {strongResults.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                      {strongResults.length} mots originaux trouvés — choisissez
                    </span>
                    <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                      {strongResults.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => {
                            setStrongResults([]);
                            fetchStrongManual(r.number);
                          }}
                          className="w-full text-left bg-white border border-slate-200 rounded-xl p-2.5 hover:border-indigo-300 hover:bg-indigo-50/40 transition cursor-pointer"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-black text-slate-800">
                              {r.lemma || r.transliteration || r.number}
                            </span>
                            <span className="text-[9px] font-black bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full flex-shrink-0">
                              {r.language === "hebrew" ? "Hébreu" : "Grec"}
                            </span>
                          </div>
                          {r.transliteration && r.lemma && (
                            <span className="text-[10px] font-bold text-indigo-500 block">
                              {r.transliteration}
                            </span>
                          )}
                          {(r.definitionFr || r.definition) && (
                            <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5 line-clamp-2">
                              {r.definitionFr || r.definition}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
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
                    {(strongResult.definitionFr || strongResult.definition) && (
                      <div className="border-t border-indigo-100 pt-3 space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Définition</span>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {strongResult.definitionFr || strongResult.definition}
                        </p>
                        {/* Version originale anglaise, repliée en petit */}
                        {strongResult.definitionFr && strongResult.definition && (
                          <details className="pt-1">
                            <summary className="text-[9px] font-bold text-slate-400 cursor-pointer hover:text-slate-600">
                              Voir la définition anglaise d&apos;origine
                            </summary>
                            <p className="text-[10px] text-slate-400 leading-relaxed mt-1 italic">
                              {strongResult.definition}
                            </p>
                          </details>
                        )}
                      </div>
                    )}
                    {(strongResult.kjvUsageFr || strongResult.kjvUsage) && (
                      <div className="border-t border-indigo-100 pt-3 space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          {strongResult.kjvUsageFr ? "Traduit par" : "Traductions KJV"}
                        </span>
                        <p className="text-xs text-slate-600 italic">
                          {strongResult.kjvUsageFr || strongResult.kjvUsage}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {!strongResult && !strongError && !strongLoading && !strongSearching && strongResults.length === 0 && !selectedVerse && (
                  <div className="flex flex-col items-center justify-center text-center py-6 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                      <Hash className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-600">Sens original des mots</p>
                      <p className="text-[10px] text-slate-400 mt-1 max-w-[210px] leading-relaxed">
                        Touchez un verset dans le texte, puis un de ses mots pour découvrir son sens en hébreu ou en grec.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {[
                        { word: "amour", label: "amour" },
                        { word: "lumière", label: "lumière" },
                        { word: "paix", label: "paix" },
                        { word: "grâce", label: "grâce" },
                      ].map(({ word, label }) => (
                        <button
                          key={word}
                          onClick={() => { setStrongSearch(word); searchStrongByWord(word); }}
                          className="text-[10px] font-bold bg-white border border-indigo-100 text-indigo-600 px-2 py-1 rounded-lg hover:bg-indigo-50 transition cursor-pointer"
                        >
                          {label}
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
                        Sélectionnez un verset dans le lecteur puis cliquez sur <strong>&quot;Références croisées&quot;</strong> dans le menu contextuel.
                      </p>
                    </div>
                  </div>
                ) : loadingCrossRefs ? (
                  <div className="flex-1 flex flex-col justify-center items-center gap-2">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    <span className="text-xs font-bold text-slate-500">Recherche des versets liés...</span>
                  </div>
                ) : crossRefs.length === 0 ? (
                  <div className="flex-1 flex flex-col justify-center items-center text-center p-4 space-y-4">
                    <Manny mood="thinking" size={110} />
                    <div>
                      <h4 className="font-bold text-slate-700 text-xs">Aucun verset lié</h4>
                      <p className="text-[10px] text-slate-500 mt-1 max-w-[180px] leading-relaxed">
                        Aucune référence croisée n&apos;a été répertoriée pour ce verset dans notre base.
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
                            const bookKey = typeof ref.toBook === "number" ? ref.toBook : Number(ref.toBook);
                            const bookName = BIBLE_BOOKS_MAP[bookKey];
                            if (bookName) {
                              sounds.playXPGain();
                              setSelectedBook(bookName);
                              setSelectedChapter(ref.toChapter ?? 1);
                              setPendingVerseSelection(ref.toVerse ?? null);
                            }
                          }}
                          className="bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/10 rounded-2xl p-3.5 cursor-pointer transition-all duration-300 space-y-2 group"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-indigo-700">
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
                        Sélectionnez un verset dans le lecteur puis cliquez sur <strong>&quot;Morphologie&quot;</strong> pour analyser le texte original (hébreu/grec).
                      </p>
                    </div>
                  </div>
                ) : loadingMorphology ? (
                  <div className="flex-1 flex flex-col justify-center items-center gap-2">
                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                    <span className="text-xs font-bold text-slate-500">Chargement de l&apos;analyse...</span>
                  </div>
                ) : morphologyWords.length === 0 ? (
                  <div className="flex-1 flex flex-col justify-center items-center text-center p-4 space-y-4">
                    <Manny mood="thinking" size={110} />
                    <div>
                      <h4 className="font-bold text-slate-700 text-xs">Aucune donnée disponible</h4>
                      <p className="text-[10px] text-slate-500 mt-1 max-w-[180px] leading-relaxed">
                        La morphologie n&apos;est pas encore importée pour ce livre. (Disponible pour Genèse et Jean).
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
                          className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3"
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
                                <span className="text-xs text-indigo-600 font-bold block">
                                  {word.transliteration}
                                </span>
                              )}
                            </div>
                            {word.strongNumber && (
                              <button
                                onClick={() => {
                                  setStrongSearch(word.strongNumber as string);
                                  setActiveTab("strong");
                                  fetchStrongManual(word.strongNumber as string);
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
                              <p className="text-xs text-slate-600 font-semibold leading-relaxed">
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

            {/* COMMENTARY TAB */}
            {activeTab === "commentary" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="text-xs font-bold text-slate-500 mb-3.5 flex items-center justify-between">
                  <span>Commentaires bibliques</span>
                  {selectedVerse && (
                    <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-black">
                      {selectedVerse.book} {selectedVerse.chapter}:{selectedVerse.verse}
                    </span>
                  )}
                </div>

                {!selectedVerse ? (
                  <div className="flex-1 flex flex-col justify-center items-center text-center p-4 space-y-4">
                    <Manny mood="happy" size={120} />
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm">Commentaires de versets</h4>
                      <p className="text-xs text-slate-500 mt-1.5 max-w-[210px] leading-relaxed">
                        Sélectionnez un verset dans le lecteur puis cliquez sur <strong>&quot;Commentaires&quot;</strong> pour voir l&apos;exégèse.
                      </p>
                    </div>
                  </div>
                ) : loadingCommentaries ? (
                  <div className="flex-1 flex flex-col justify-center items-center gap-2">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <span className="text-xs font-bold text-slate-500">Recherche des commentaires...</span>
                  </div>
                ) : commentaries.length === 0 ? (
                  <div className="flex-1 flex flex-col justify-center items-center text-center p-4 space-y-4">
                    <Manny mood="thinking" size={110} />
                    <div>
                      <h4 className="font-bold text-slate-700 text-xs">Aucun commentaire</h4>
                      <p className="text-[10px] text-slate-500 mt-1.5 max-w-[200px] leading-relaxed mb-4">
                        Aucun commentaire n&apos;est enregistré pour ce verset dans notre base de données.
                      </p>
                      <button
                        onClick={handleGenerateCommentary}
                        disabled={generatingCommentary}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition shadow-sm flex items-center gap-1.5 disabled:bg-slate-300 cursor-pointer"
                      >
                        {generatingCommentary ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Génération IA...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                            Générer un commentaire IA
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                    {/* Commentaire de chapitre (verse === 0) */}
                    {commentaries.filter((c) => c.verse === 0).map((com) => (
                      <div
                        key={com.id}
                        className="bg-blue-50/40 border border-blue-100/60 rounded-2xl p-4 space-y-3 shadow-sm"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                            📖 Chapitre · {com.author}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(com.createdAt).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                          {com.content}
                        </p>
                      </div>
                    ))}

                    {/* Commentaires de versets (verse !== 0) */}
                    {commentaries.filter((c) => c.verse !== 0).length > 0 && (
                      <div className="space-y-3 pt-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                          Commentaires du verset
                        </span>
                        {commentaries.filter((c) => c.verse !== 0).map((com) => (
                          <div
                            key={com.id}
                            className="bg-slate-50 border border-slate-105 rounded-2xl p-4 space-y-3"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-black bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                {com.author}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(com.createdAt).toLocaleDateString("fr-FR")}
                              </span>
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed font-medium">
                              {com.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 flex justify-center">
                      <button
                        onClick={handleGenerateCommentary}
                        disabled={generatingCommentary}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-black rounded-xl transition shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        {generatingCommentary ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Génération IA...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 text-blue-500" />
                            Générer un autre commentaire IA
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {shareVerseData && (
        <VerseShareModal
          verseText={shareVerseData.text}
          reference={shareVerseData.reference}
          translation={shareVerseData.translation}
          isOpen={isShareModalOpen}
          onClose={() => {
            setIsShareModalOpen(false);
            setShareVerseData(null);
          }}
        />
      )}

      {/* DRAWER MOBILE POUR LES LIVRES */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Overlay flou d'arrière-plan */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] md:hidden"
            />
            {/* Tiroir coulissant */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white z-[100] shadow-2xl p-5 flex flex-col h-full md:hidden"
            >
              {/* Header du Drawer */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <List className="w-5 h-5 text-indigo-600" />
                  <span className="font-black text-slate-800 text-base">Livres & Chapitres</span>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Contenu scrollable */}
              <div className="flex-1 overflow-y-auto space-y-5 pr-1">
                {/* Old Testament */}
                <div className="space-y-1.5">
                  <button
                    onClick={() => {
                      setShowAT(!showAT);
                      sounds.playXPGain();
                    }}
                    className="w-full flex items-center justify-between text-xs font-black text-indigo-900 bg-indigo-50 px-3 py-2.5 rounded-xl tracking-wider uppercase hover:bg-indigo-100/80 transition cursor-pointer"
                  >
                    <span>Ancien Testament ({oldTestament.length})</span>
                    <span className="text-[10px]">{showAT ? "▼" : "▶"}</span>
                  </button>
                  {showAT && (
                    <div className="space-y-1 pt-1.5 pl-1">
                      {oldTestament.map((book) => (
                        <button
                          key={book.name}
                          onClick={() => {
                            setSelectedBook(book.name);
                            setSelectedChapter(1);
                            sounds.playXPGain();
                            setDrawerOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2.5 rounded text-xs font-extrabold transition flex items-center justify-between cursor-pointer",
                            selectedBook === book.name
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          )}
                        >
                          <span className="whitespace-normal break-words">{book.name}</span>
                          {selectedBook === book.name && (
                            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* New Testament */}
                <div className="space-y-1.5">
                  <button
                    onClick={() => {
                      setShowNT(!showNT);
                      sounds.playXPGain();
                    }}
                    className="w-full flex items-center justify-between text-xs font-black text-emerald-900 bg-emerald-50 px-3 py-2.5 rounded-xl tracking-wider uppercase hover:bg-emerald-100/80 transition cursor-pointer"
                  >
                    <span>Nouveau Testament ({newTestament.length})</span>
                    <span className="text-[10px]">{showNT ? "▼" : "▶"}</span>
                  </button>
                  {showNT && (
                    <div className="space-y-1 pt-1.5 pl-1">
                      {newTestament.map((book) => (
                        <button
                          key={book.name}
                          onClick={() => {
                            setSelectedBook(book.name);
                            setSelectedChapter(1);
                            sounds.playXPGain();
                            setDrawerOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2.5 rounded text-xs font-extrabold transition flex items-center justify-between cursor-pointer",
                            selectedBook === book.name
                              ? "bg-emerald-600 text-white shadow-sm"
                              : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          )}
                        >
                          <span className="whitespace-normal break-words">{book.name}</span>
                          {selectedBook === book.name && (
                            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ============================================================
          BARRE D'ACTIONS FIXE — apparaît dès qu'un verset est touché.
          Remplace l'ancien menu flottant : plus besoin de faire glisser,
          tout est immédiatement visible et atteignable au pouce.
         ============================================================ */}
      <AnimatePresence>
        {selectedVerse && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="fixed bottom-16 md:bottom-4 left-2 right-2 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[640px] z-[80] bg-white border border-slate-200 shadow-2xl rounded-3xl p-3 space-y-2.5"
          >
            {/* Référence + fermer */}
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[11px] font-black text-indigo-700 block">
                  {selectedVerse.book} {selectedVerse.chapter}:{selectedVerse.verse}
                </span>
                <p className="text-[11px] text-slate-500 italic truncate">
                  {selectedVerse.text}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedVerse(null);
                  setWordPopover(null);
                }}
                className="flex-shrink-0 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                title="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Surlignage : 4 couleurs directement accessibles */}
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex-shrink-0">
                Surligner
              </span>
              <div className="flex items-center gap-2">
                {[
                  { color: "yellow", cls: "bg-yellow-300 border-yellow-400", label: "Jaune" },
                  { color: "green", cls: "bg-emerald-400 border-emerald-500", label: "Vert" },
                  { color: "blue", cls: "bg-sky-400 border-sky-500", label: "Bleu" },
                  { color: "pink", cls: "bg-rose-400 border-rose-500", label: "Rose" },
                ].map(({ color, cls, label }) => (
                  <button
                    key={color}
                    onClick={() => handleHighlight(color)}
                    className={cn(
                      "w-8 h-8 rounded-full border shadow-sm transition hover:scale-110 active:scale-95",
                      cls,
                      selectedVerse.highlightColor === color && "ring-2 ring-offset-1 ring-slate-800"
                    )}
                    title={`Surligner en ${label.toLowerCase()}`}
                  />
                ))}
                {selectedVerse.highlightColor && (
                  <button
                    onClick={handleDeleteHighlight}
                    className="w-8 h-8 rounded-full bg-white hover:bg-rose-50 border border-slate-300 flex items-center justify-center text-slate-500 hover:text-rose-600 transition"
                    title="Retirer le surlignage"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Actions principales */}
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => {
                  setActiveTab("notes");
                  sounds.playXPGain();
                }}
                className="flex flex-col items-center gap-1 py-2 rounded-2xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 transition active:scale-95"
                title="Écrire une note"
              >
                <Edit3 className="w-4 h-4" />
                <span className="text-[9px] font-black">Note</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab("ai");
                  sounds.playXPGain();
                }}
                className="flex flex-col items-center gap-1 py-2 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-100 text-purple-700 transition active:scale-95"
                title="Poser une question à l'IA"
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-[9px] font-black">IA</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab("strong");
                  sounds.playXPGain();
                }}
                className="flex flex-col items-center gap-1 py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-100 text-amber-700 transition active:scale-95"
                title="Hébreu / Grec (Strong)"
              >
                <Hash className="w-4 h-4" />
                <span className="text-[9px] font-black">Strong</span>
              </button>
              <button
                onClick={() => {
                  setShareVerseData({
                    text: selectedVerse.text,
                    reference: `${selectedVerse.book} ${selectedVerse.chapter}:${selectedVerse.verse}`,
                    translation: selectedVerse.translation || translation,
                  });
                  setIsShareModalOpen(true);
                }}
                className="flex flex-col items-center gap-1 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-700 transition active:scale-95"
                title="Partager ce verset"
              >
                <Share2 className="w-4 h-4" />
                <span className="text-[9px] font-black">Partager</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
