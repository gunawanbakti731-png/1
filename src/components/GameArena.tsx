import React, { useState, useEffect, useRef } from 'react';
import { GameLevel, QuestionPair, StudentSession } from '../types';
import { soundManager } from '../utils/audio';

interface GameArenaProps {
  levels: GameLevel[];
  session: StudentSession;
  onLevelComplete: (levelNumber: number, timeSpent: number, mistakes: number, score: number) => void;
  onAllLevelsComplete: () => void;
  onBackToMaterial: () => void;
}

// Memory Card Interface
interface MemoryCardItem {
  cardId: string;
  pairId: string;
  kind: 'term' | 'definition';
  text: string;
  isFlipped: boolean;
  isMatched: boolean;
  hasError: boolean;
}

// Drag & Drop Item Interface
interface DragPairItem {
  pairId: string;
  term: string;
  definition: string;
  clue?: string;
  isMatched: boolean;
}

export const GameArena: React.FC<GameArenaProps> = ({
  levels,
  session,
  onLevelComplete,
  onAllLevelsComplete,
  onBackToMaterial,
}) => {
  const currentLevelIndex = session.currentLevelIndex || 0;
  const currentLevel = levels[currentLevelIndex] || levels[0];

  // Game Arena States
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [levelMistakes, setLevelMistakes] = useState(0);
  const [levelScore, setLevelScore] = useState(1000);
  const [showLevelSuccessModal, setShowLevelSuccessModal] = useState(false);
  const [isLevelFinished, setIsLevelFinished] = useState(false);

  // Timer reference
  const timerRef = useRef<any>(null);

  // --- MODEL 1: MEMORY CARD MATCHING STATES ---
  const [memoryCards, setMemoryCards] = useState<MemoryCardItem[]>([]);
  const [selectedCards, setSelectedCards] = useState<MemoryCardItem[]>([]);
  const [isProcessingMatch, setIsProcessingMatch] = useState(false);

  // --- MODEL 2: DRAG AND DROP MATCHING STATES ---
  const [dragPool, setDragPool] = useState<{ id: string; text: string; pairId: string }[]>([]);
  const [dropTargets, setDropTargets] = useState<{
    id: string;
    definition: string;
    pairId: string;
    matchedTerm?: string;
    isCorrect: boolean;
    hasError: boolean;
  }[]>([]);
  const [selectedDraggable, setSelectedDraggable] = useState<{ id: string; text: string; pairId: string } | null>(null);
  const [draggedItem, setDraggedItem] = useState<{ id: string; text: string; pairId: string } | null>(null);

  // Reset or setup level when currentLevel changes
  useEffect(() => {
    setupCurrentLevel();
    setTimerSeconds(0);
    setLevelMistakes(0);
    setLevelScore(1000);
    setShowLevelSuccessModal(false);
    setIsLevelFinished(false);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentLevelIndex]);

  const setupCurrentLevel = () => {
    if (!currentLevel) return;

    if (currentLevel.type === 'memory') {
      // Build memory cards (Terms & Definitions)
      const cards: MemoryCardItem[] = [];
      currentLevel.pairs.forEach((p, idx) => {
        // Card Term
        cards.push({
          cardId: `term-${p.id}-${idx}`,
          pairId: p.id,
          kind: 'term',
          text: p.term,
          isFlipped: false,
          isMatched: false,
          hasError: false,
        });
        // Card Definition
        cards.push({
          cardId: `def-${p.id}-${idx}`,
          pairId: p.id,
          kind: 'definition',
          text: p.definition,
          isFlipped: false,
          isMatched: false,
          hasError: false,
        });
      });

      // Fisher-Yates Shuffle
      for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
      }

      setMemoryCards(cards);
      setSelectedCards([]);
      setIsProcessingMatch(false);
    } else {
      // Drag & Drop Setup
      const shuffledTerms = [...currentLevel.pairs].map((p, idx) => ({
        id: `drag-${p.id}-${idx}`,
        text: p.term,
        pairId: p.id,
      }));
      // Shuffle terms pool
      for (let i = shuffledTerms.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledTerms[i], shuffledTerms[j]] = [shuffledTerms[j], shuffledTerms[i]];
      }

      // Shuffled drop targets (definitions)
      const targets = [...currentLevel.pairs].map((p, idx) => ({
        id: `target-${p.id}-${idx}`,
        definition: p.definition,
        pairId: p.id,
        matchedTerm: undefined,
        isCorrect: false,
        hasError: false,
      }));
      for (let i = targets.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [targets[i], targets[j]] = [targets[j], targets[i]];
      }

      setDragPool(shuffledTerms);
      setDropTargets(targets);
      setSelectedDraggable(null);
      setDraggedItem(null);
    }
  };

  // --- MODEL 1: MEMORY CARD LOGIC ---
  const handleCardClick = (card: MemoryCardItem) => {
    if (isProcessingMatch || card.isFlipped || card.isMatched) return;

    soundManager.playCardFlip();

    // Flip card
    const updatedCards = memoryCards.map((c) =>
      c.cardId === card.cardId ? { ...c, isFlipped: true, hasError: false } : c
    );
    setMemoryCards(updatedCards);

    const newSelected = [...selectedCards, card];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setIsProcessingMatch(true);
      const [first, second] = newSelected;

      // Check if both match same pairId AND one is term, other is definition
      const isMatch = first.pairId === second.pairId && first.kind !== second.kind;

      if (isMatch) {
        soundManager.playMatchSuccess();
        setTimeout(() => {
          const matchedCards = memoryCards.map((c) => {
            if (c.cardId === first.cardId || c.cardId === second.cardId) {
              return { ...c, isFlipped: true, isMatched: true, hasError: false };
            }
            return c;
          });
          setMemoryCards(matchedCards);
          setSelectedCards([]);
          setIsProcessingMatch(false);

          // Check if all pairs are matched!
          const allDone = matchedCards.every((c) => c.isMatched);
          if (allDone) {
            handleLevelCleared();
          }
        }, 400);
      } else {
        // Mismatch! Error buzz & shake
        soundManager.playErrorBuzz();
        setLevelMistakes((prev) => prev + 1);
        setLevelScore((prev) => Math.max(200, prev - 50));

        setTimeout(() => {
          // Add error shake styling
          setMemoryCards((prev) =>
            prev.map((c) =>
              c.cardId === first.cardId || c.cardId === second.cardId
                ? { ...c, hasError: true }
                : c
            )
          );
        }, 150);

        // Flip back after 1.1s
        setTimeout(() => {
          setMemoryCards((prev) =>
            prev.map((c) =>
              c.cardId === first.cardId || c.cardId === second.cardId
                ? { ...c, isFlipped: false, hasError: false }
                : c
            )
          );
          setSelectedCards([]);
          setIsProcessingMatch(false);
        }, 1100);
      }
    }
  };

  // --- MODEL 2: DRAG & DROP / CLICK-TO-PAIR LOGIC ---
  const handleSelectDraggable = (item: { id: string; text: string; pairId: string }) => {
    soundManager.playCardFlip();
    if (selectedDraggable?.id === item.id) {
      setSelectedDraggable(null);
    } else {
      setSelectedDraggable(item);
    }
  };

  const handleDropOnTarget = (targetPairId: string, targetId: string) => {
    const itemToMatch = draggedItem || selectedDraggable;
    if (!itemToMatch) return;

    if (itemToMatch.pairId === targetPairId) {
      // CORRECT MATCH!
      soundManager.playMatchSuccess();

      // Remove from pool
      setDragPool((prev) => prev.filter((p) => p.id !== itemToMatch.id));

      // Update target
      const updatedTargets = dropTargets.map((t) => {
        if (t.id === targetId) {
          return {
            ...t,
            matchedTerm: itemToMatch.text,
            isCorrect: true,
            hasError: false,
          };
        }
        return t;
      });
      setDropTargets(updatedTargets);
      setSelectedDraggable(null);
      setDraggedItem(null);

      // Check if all matched!
      const allDone = updatedTargets.every((t) => t.isCorrect);
      if (allDone) {
        handleLevelCleared();
      }
    } else {
      // WRONG MATCH!
      soundManager.playErrorBuzz();
      setLevelMistakes((prev) => prev + 1);
      setLevelScore((prev) => Math.max(200, prev - 50));

      // Visual feedback: shake target
      setDropTargets((prev) =>
        prev.map((t) => (t.id === targetId ? { ...t, hasError: true } : t))
      );

      setTimeout(() => {
        setDropTargets((prev) =>
          prev.map((t) => (t.id === targetId ? { ...t, hasError: false } : t))
        );
      }, 700);

      setSelectedDraggable(null);
      setDraggedItem(null);
    }
  };

  const handleLevelCleared = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    soundManager.playLevelComplete();
    setIsLevelFinished(true);

    const calculatedScore = Math.max(400, levelScore - levelMistakes * 40);
    onLevelComplete(currentLevel.levelNumber, timerSeconds, levelMistakes, calculatedScore);
    setShowLevelSuccessModal(true);
  };

  const handleNextStep = () => {
    setShowLevelSuccessModal(false);
    if (currentLevelIndex < levels.length - 1) {
      // Go to next level
      // Current session level was updated by parent
    } else {
      // All levels completed!
      onAllLevelsComplete();
    }
  };

  // Helper formatting for seconds to MM:SS
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Matched counts
  const matchedPairsCount =
    currentLevel.type === 'memory'
      ? memoryCards.filter((c) => c.isMatched).length / 2
      : dropTargets.filter((t) => t.isCorrect).length;
  const totalPairsCount = currentLevel.pairs.length;
  const progressPercent = Math.round((matchedPairsCount / totalPairsCount) * 100);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 min-h-[calc(100vh-4rem)] flex flex-col justify-between">
      {/* Top Header & Level Stepper */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <button
            onClick={onBackToMaterial}
            className="text-xs font-semibold text-slate-400 hover:text-white inline-flex items-center gap-1.5 transition-colors"
          >
            <i className="fa-solid fa-book-open"></i>
            <span>Tinjau Ulang Materi Ajar</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300">
              Siswa: <strong className="text-white">{session.studentName}</strong> ({session.studentClass})
            </span>
          </div>
        </div>

        {/* Level Progression Stepper (Strict lock visualization) */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 mb-6 shadow-md">
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
            {levels.map((lvl, idx) => {
              const isCompleted = session.completedLevels.includes(lvl.levelNumber);
              const isCurrent = idx === currentLevelIndex;
              const isLocked = !isCompleted && !isCurrent;

              return (
                <div
                  key={lvl.levelNumber}
                  className={`flex-1 min-w-[140px] px-3 py-2 rounded-xl border flex items-center gap-2.5 transition-all select-none ${
                    isCurrent
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-600/10'
                      : isCompleted
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-70'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isCompleted
                        ? 'bg-emerald-500 text-slate-950'
                        : isCurrent
                        ? 'bg-indigo-500 text-white animate-pulse'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isCompleted ? (
                      <i className="fa-solid fa-check"></i>
                    ) : isLocked ? (
                      <i className="fa-solid fa-lock text-[10px]"></i>
                    ) : (
                      lvl.levelNumber
                    )}
                  </div>

                  <div className="truncate">
                    <div className="text-[10px] font-bold uppercase tracking-wider">
                      {isCompleted ? 'Selesai' : isCurrent ? 'Level Aktif' : 'Terkunci'}
                    </div>
                    <div className="text-xs font-semibold truncate">
                      Level {lvl.levelNumber}: {lvl.type === 'memory' ? 'Memori' : 'Drag & Drop'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Level Banner & Arena Stats Bar */}
        <div className="bg-gradient-to-r from-slate-850 via-slate-800 to-slate-850 border border-slate-700 rounded-2xl p-4 sm:p-5 mb-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase">
                {currentLevel.type === 'memory' ? 'Model 1: Kartu Memori' : 'Model 2: Drag & Drop Matching'}
              </span>
              <span className="text-xs text-amber-400 font-semibold">
                <i className="fa-solid fa-triangle-exclamation mr-1"></i>
                Wajib Benar 100% untuk Membuka Level Berikutnya
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              {currentLevel.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              {currentLevel.description}
            </p>
          </div>

          {/* Stats Badges */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Timer */}
            <div className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-center min-w-[70px]">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                <i className="fa-regular fa-clock mr-1 text-cyan-400"></i>Waktu
              </div>
              <div className="text-sm font-mono font-bold text-white">
                {formatTime(timerSeconds)}
              </div>
            </div>

            {/* Mistakes / Attempts */}
            <div className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-center min-w-[70px]">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                <i className="fa-solid fa-heart-crack mr-1 text-rose-400"></i>Salah
              </div>
              <div className="text-sm font-bold text-rose-400">
                {levelMistakes}x
              </div>
            </div>

            {/* Progress Count */}
            <div className="px-3.5 py-2 rounded-xl bg-indigo-950/60 border border-indigo-800/60 text-center min-w-[85px]">
              <div className="text-[10px] text-indigo-300 uppercase font-bold tracking-wider">
                <i className="fa-solid fa-bullseye mr-1 text-emerald-400"></i>Ketuntasan
              </div>
              <div className="text-sm font-bold text-emerald-400">
                {matchedPairsCount}/{totalPairsCount} ({progressPercent}%)
              </div>
            </div>
          </div>
        </div>

        {/* --- MAIN GAMEPLAY BOARD --- */}
        {currentLevel.type === 'memory' ? (
          /* ============================================================ */
          /* MODEL 1: KARTU MEMORI (MEMORY CARD MATCHING)                 */
          /* ============================================================ */
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3 px-1">
              <span>Buka 2 kartu untuk mencocokkan istilah dengan definisinya:</span>
              <span className="text-indigo-400 font-semibold">
                Tersisa {totalPairsCount - matchedPairsCount} pasangan
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {memoryCards.map((card) => {
                return (
                  <div
                    key={card.cardId}
                    onClick={() => handleCardClick(card)}
                    className={`relative h-32 sm:h-36 rounded-2xl cursor-pointer select-none transition-all duration-300 transform ${
                      card.isMatched
                        ? 'opacity-85 pointer-events-none scale-95'
                        : card.hasError
                        ? 'animate-shake'
                        : 'hover:scale-[1.02] active:scale-95'
                    }`}
                    style={{ perspective: '1000px' }}
                  >
                    {/* Inner Card Flipper */}
                    <div
                      className={`w-full h-full rounded-2xl transition-transform duration-500 relative shadow-lg ${
                        card.isFlipped || card.isMatched ? 'rotate-y-180' : ''
                      }`}
                      style={{
                        transformStyle: 'preserve-3d',
                        transform: card.isFlipped || card.isMatched ? 'rotateY(180deg)' : 'rotateY(0deg)',
                      }}
                    >
                      {/* CARD BACK (Hidden Face) */}
                      <div
                        className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br from-indigo-900/80 via-slate-850 to-slate-900 border-2 border-indigo-500/40 hover:border-indigo-400 flex flex-col items-center justify-center p-3 text-center"
                        style={{ backfaceVisibility: 'hidden' }}
                      >
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 mb-2">
                          <i className="fa-solid fa-brain text-lg"></i>
                        </div>
                        <span className="text-xs font-bold tracking-wider text-slate-300">
                          INTERAKTIF SMK
                        </span>
                        <span className="text-[10px] text-slate-500 mt-0.5">
                          Klik untuk Buka
                        </span>
                      </div>

                      {/* CARD FRONT (Revealed Face) */}
                      <div
                        className={`absolute inset-0 w-full h-full rounded-2xl p-3 sm:p-4 flex flex-col justify-between overflow-hidden border-2 transition-colors ${
                          card.isMatched
                            ? 'bg-emerald-950/90 border-emerald-400 text-white shadow-emerald-500/20'
                            : card.hasError
                            ? 'bg-rose-950/90 border-rose-500 text-white shadow-rose-500/20'
                            : card.kind === 'term'
                            ? 'bg-slate-850 border-cyan-400 text-white'
                            : 'bg-slate-850 border-amber-400 text-white'
                        }`}
                        style={{
                          backfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)',
                        }}
                      >
                        {/* Kind badge */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider ${
                              card.isMatched
                                ? 'bg-emerald-400/20 text-emerald-300'
                                : card.kind === 'term'
                                ? 'bg-cyan-500/20 text-cyan-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {card.kind === 'term' ? 'Istilah' : 'Definisi'}
                          </span>
                          {card.isMatched && (
                            <i className="fa-solid fa-circle-check text-emerald-400 text-xs"></i>
                          )}
                        </div>

                        {/* Card Text Content */}
                        <div className="my-auto overflow-y-auto max-h-[85px] scrollbar-thin">
                          <p
                            className={`leading-tight text-center ${
                              card.kind === 'term'
                                ? 'font-bold text-xs sm:text-sm text-cyan-100'
                                : 'font-medium text-[11px] sm:text-xs text-slate-200'
                            }`}
                          >
                            {card.text}
                          </p>
                        </div>

                        {/* Card footer indicator */}
                        <div className="text-[9px] text-center text-slate-400">
                          {card.isMatched ? '✓ Cocok' : 'Pasangkan'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ============================================================ */
          /* MODEL 2: DRAG AND DROP MATCHING                             */
          /* ============================================================ */
          <div className="mb-6">
            <div className="p-3.5 bg-slate-800/80 border border-slate-700/80 rounded-2xl mb-4 text-xs text-slate-300 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-hand-pointer text-indigo-400"></i>
                <span>
                  <strong>Tips Mobile & Desktop:</strong> Drag kartu kiri ke kotak kanan, ATAU cukup <strong>klik/tap kartu kiri</strong> lalu <strong>klik/tap target di kanan</strong> untuk memasangkan!
                </span>
              </div>
              {selectedDraggable && (
                <button
                  onClick={() => setSelectedDraggable(null)}
                  className="text-xs px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300"
                >
                  Batal Pilih
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* LEFT COLUMN: TERMS POOL */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <i className="fa-solid fa-cubes"></i>
                  <span>Pilihan Istilah / Pernyataan (Tersisa: {dragPool.length})</span>
                </h3>

                {dragPool.length === 0 ? (
                  <div className="p-6 bg-slate-900/60 border border-emerald-500/40 rounded-2xl text-center text-emerald-400 text-sm font-semibold">
                    <i className="fa-solid fa-circle-check text-xl mb-1 block"></i>
                    Semua istilah berhasil dipasangkan dengan benar!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5">
                    {dragPool.map((item) => {
                      const isSelected = selectedDraggable?.id === item.id;
                      return (
                        <div
                          key={item.id}
                          draggable
                          onDragStart={() => setDraggedItem(item)}
                          onDragEnd={() => setDraggedItem(null)}
                          onClick={() => handleSelectDraggable(item)}
                          className={`p-4 rounded-xl border cursor-pointer select-none transition-all duration-200 transform ${
                            isSelected
                              ? 'bg-cyan-950/80 border-cyan-400 ring-2 ring-cyan-400 shadow-lg shadow-cyan-950/50 scale-[1.02]'
                              : 'bg-slate-800 hover:bg-slate-750 border-slate-700 hover:border-cyan-500/50 hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-lg bg-slate-700/60 flex items-center justify-center text-slate-400 text-xs">
                                <i className="fa-solid fa-grip-vertical"></i>
                              </span>
                              <span className="font-bold text-sm text-white">
                                {item.text}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                isSelected
                                  ? 'bg-cyan-500 text-slate-950 animate-pulse'
                                  : 'bg-slate-700 text-slate-300'
                              }`}
                            >
                              {isSelected ? 'Terpilih' : 'Pilih'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: DROP TARGET DEFINITIONS */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <i className="fa-solid fa-bullseye"></i>
                  <span>Target Definisi / Penjelasan yang Tepat</span>
                </h3>

                <div className="grid grid-cols-1 gap-3">
                  {dropTargets.map((target) => {
                    return (
                      <div
                        key={target.id}
                        onDragOver={(e) => {
                          e.preventDefault();
                        }}
                        onDrop={() => handleDropOnTarget(target.pairId, target.id)}
                        onClick={() => {
                          if (selectedDraggable && !target.isCorrect) {
                            handleDropOnTarget(target.pairId, target.id);
                          }
                        }}
                        className={`p-4 rounded-2xl border transition-all duration-200 select-none ${
                          target.isCorrect
                            ? 'bg-emerald-950/70 border-emerald-500/80 shadow-md shadow-emerald-950/20'
                            : target.hasError
                            ? 'bg-rose-950/90 border-rose-500 animate-shake shadow-rose-950/40'
                            : selectedDraggable
                            ? 'bg-slate-800/90 border-dashed border-indigo-400/80 hover:bg-indigo-950/40 cursor-pointer hover:border-indigo-300'
                            : 'bg-slate-850 border-slate-700/80'
                        }`}
                      >
                        <div className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-3">
                          {target.definition}
                        </div>

                        {/* Drop Box Slot */}
                        <div
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                            target.isCorrect
                              ? 'bg-emerald-900/60 border-emerald-500 text-emerald-200 font-bold'
                              : target.hasError
                              ? 'bg-rose-900/60 border-rose-500 text-rose-200 font-bold'
                              : selectedDraggable
                              ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300 border-dashed animate-pulse'
                              : 'bg-slate-900/80 border-slate-700/70 text-slate-400 border-dashed'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <i
                              className={`fa-solid ${
                                target.isCorrect
                                  ? 'fa-circle-check text-emerald-400'
                                  : target.hasError
                                  ? 'fa-circle-xmark text-rose-400'
                                  : 'fa-arrow-turn-down text-slate-500'
                              }`}
                            ></i>
                            <span className="truncate">
                              {target.isCorrect
                                ? `Cocok: ${target.matchedTerm}`
                                : target.hasError
                                ? 'Salah! Coba pasangkan lagi!'
                                : selectedDraggable
                                ? `Klik untuk pasangkan "${selectedDraggable.text}"`
                                : 'Tarik atau klik istilah ke sini'}
                            </span>
                          </div>

                          {target.isCorrect && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 uppercase font-bold tracking-wider">
                              100% Benar
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- LEVEL SUCCESS MODAL --- */}
      {showLevelSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border-2 border-emerald-500/60 rounded-3xl p-6 sm:p-8 text-center shadow-2xl shadow-emerald-950/50 transform animate-scale-up">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-400 text-slate-950 flex items-center justify-center mx-auto mb-4 text-2xl font-black shadow-lg shadow-emerald-500/30">
              <i className="fa-solid fa-trophy"></i>
            </div>

            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
              Ketuntasan 100% Tercapai!
            </div>
            <h2 className="text-2xl font-black text-white mb-2">
              Level {currentLevel.levelNumber} Tuntas Sempurna!
            </h2>
            <p className="text-xs text-slate-300 mb-6">
              Hebat, <strong className="text-white">{session.studentName}</strong>! Seluruh pasangan soal telah terjawab dengan benar. Anda memenuhi syarat progresi keras untuk melanjutkan.
            </p>

            {/* Performance Stats */}
            <div className="grid grid-cols-3 gap-2.5 bg-slate-800/80 rounded-2xl p-3.5 mb-6 border border-slate-700/80 text-center">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Waktu</div>
                <div className="text-sm font-bold text-white font-mono mt-0.5">{formatTime(timerSeconds)}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Kesalahan</div>
                <div className="text-sm font-bold text-rose-400 mt-0.5">{levelMistakes}x</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Skor Level</div>
                <div className="text-sm font-bold text-amber-400 mt-0.5">+{levelScore}</div>
              </div>
            </div>

            <button
              onClick={handleNextStep}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/30 transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer"
            >
              {currentLevelIndex < levels.length - 1 ? (
                <span>Buka &amp; Lanjut ke Level {currentLevelIndex + 2}</span>
              ) : (
                <span>Klaim Kelulusan &amp; Buka Sertifikat</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
