import React, { useState, useEffect } from 'react';
import { LearningMaterial, StudentSession } from './types';
import { storageManager } from './utils/storage';
import { Navbar } from './components/Navbar';
import { StudentHome } from './components/StudentHome';
import { MaterialReview } from './components/MaterialReview';
import { GameArena } from './components/GameArena';
import { GraduationCertificate } from './components/GraduationCertificate';
import { TeacherMode } from './components/TeacherMode';

export default function App() {
  // Load material from localStorage or default
  const [material, setMaterial] = useState<LearningMaterial>(() => storageManager.getMaterial());

  // Views & Screens
  const [currentView, setCurrentView] = useState<'student' | 'teacher'>('student');
  const [studentScreen, setStudentScreen] = useState<'home' | 'material-review' | 'game-arena' | 'certificate'>('home');

  // Teacher Authentication state
  const [isTeacherLoggedIn, setIsTeacherLoggedIn] = useState(false);

  // Student Session state
  const [session, setSession] = useState<StudentSession | null>(() => storageManager.getStudentSession());

  // Save session to storage when it changes
  useEffect(() => {
    storageManager.saveStudentSession(session);
  }, [session]);

  // Handler: Start from Home
  const handleStartGame = (studentName: string, studentClass: string) => {
    const newSession: StudentSession = {
      studentName,
      studentClass,
      startedAt: Date.now(),
      hasReviewedMaterial: false,
      currentLevelIndex: 0,
      completedLevels: [],
      levelStats: {},
      totalScore: 0,
    };
    setSession(newSession);
    setStudentScreen('material-review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler: From Material Review -> Game Arena Level 1
  const handleProceedToLevel1 = () => {
    if (!session) return;
    const updatedSession: StudentSession = {
      ...session,
      hasReviewedMaterial: true,
      currentLevelIndex: 0,
    };
    setSession(updatedSession);
    setStudentScreen('game-arena');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler: Level Completed in Game Arena
  const handleLevelComplete = (
    levelNumber: number,
    timeSpent: number,
    mistakes: number,
    score: number
  ) => {
    if (!session) return;

    const nextCompletedLevels = session.completedLevels.includes(levelNumber)
      ? session.completedLevels
      : [...session.completedLevels, levelNumber];

    const nextLevelIndex = session.currentLevelIndex + 1;

    const updatedSession: StudentSession = {
      ...session,
      completedLevels: nextCompletedLevels,
      totalScore: session.totalScore + score,
      currentLevelIndex: nextLevelIndex < material.levels.length ? nextLevelIndex : session.currentLevelIndex,
      levelStats: {
        ...session.levelStats,
        [levelNumber]: {
          timeSpentSeconds: timeSpent,
          attempts: mistakes + 1,
          mistakes,
          completed: true,
        },
      },
    };

    setSession(updatedSession);
  };

  // Handler: All Levels Completed -> Show Certificate
  const handleAllLevelsComplete = () => {
    if (!session) return;
    const finishedSession: StudentSession = {
      ...session,
      completedAt: Date.now(),
      totalScore: Math.max(session.totalScore, 2000),
    };
    setSession(finishedSession);
    setStudentScreen('certificate');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler: Play Again (Reset Levels for same student)
  const handlePlayAgain = () => {
    if (!session) return;
    const resetSession: StudentSession = {
      ...session,
      completedLevels: [],
      currentLevelIndex: 0,
      totalScore: 0,
      levelStats: {},
    };
    setSession(resetSession);
    setStudentScreen('game-arena');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler: Back to Home (New Student)
  const handleBackToHome = () => {
    setSession(null);
    setStudentScreen('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Teacher Handlers
  const handleSaveMaterial = (updated: LearningMaterial) => {
    setMaterial(updated);
    storageManager.saveMaterial(updated);
  };

  const handleResetToDefault = () => {
    const def = storageManager.resetMaterialToDefault();
    setMaterial(def);
    return def;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        activeTopic={material.topic}
        onSwitchToTeacher={() => setCurrentView('teacher')}
        onSwitchToStudent={() => setCurrentView('student')}
        isTeacherLoggedIn={isTeacherLoggedIn}
        onTeacherLogout={() => setIsTeacherLoggedIn(false)}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'teacher' ? (
          <TeacherMode
            material={material}
            onSaveMaterial={handleSaveMaterial}
            onResetToDefault={handleResetToDefault}
            onSwitchToStudent={() => setCurrentView('student')}
            isLoggedIn={isTeacherLoggedIn}
            onLoginSuccess={() => setIsTeacherLoggedIn(true)}
            onLogout={() => setIsTeacherLoggedIn(false)}
          />
        ) : (
          <>
            {/* Student Flow Router */}
            {studentScreen === 'home' && (
              <StudentHome
                material={material}
                onStartGame={handleStartGame}
                onOpenTeacherMode={() => setCurrentView('teacher')}
              />
            )}

            {studentScreen === 'material-review' && session && (
              <MaterialReview
                material={material}
                session={session}
                onProceedToLevel1={handleProceedToLevel1}
                onBackToHome={handleBackToHome}
              />
            )}

            {studentScreen === 'game-arena' && session && (
              <GameArena
                levels={material.levels}
                session={session}
                onLevelComplete={handleLevelComplete}
                onAllLevelsComplete={handleAllLevelsComplete}
                onBackToMaterial={() => setStudentScreen('material-review')}
              />
            )}

            {studentScreen === 'certificate' && session && (
              <GraduationCertificate
                material={material}
                session={session}
                onPlayAgain={handlePlayAgain}
                onBackToHome={handleBackToHome}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-400">INTERAKTIF SMK</span>
            <span>•</span>
            <span>Media Pembelajaran Berbasis Game SMK Indonesia</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            Mode Guru: Keamanan Terproteksi • AI Generator Soal • Sertifikat Digital Otomatis
          </div>
        </div>
      </footer>
    </div>
  );
}
