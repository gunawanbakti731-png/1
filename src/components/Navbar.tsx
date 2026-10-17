import React from 'react';
import { soundManager } from '../utils/audio';

interface NavbarProps {
  currentView: 'student' | 'teacher';
  activeTopic: string;
  onSwitchToTeacher: () => void;
  onSwitchToStudent: () => void;
  isTeacherLoggedIn: boolean;
  onTeacherLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  activeTopic,
  onSwitchToTeacher,
  onSwitchToStudent,
  isTeacherLoggedIn,
  onTeacherLogout,
}) => {
  const [isMuted, setIsMuted] = React.useState(soundManager.isMuted);

  const toggleSound = () => {
    const newSoundState = soundManager.toggleMute();
    setIsMuted(!newSoundState);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div 
          onClick={onSwitchToStudent}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            <i className="fa-solid fa-gamepad text-lg"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                INTERAKTIF SMK
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                SMK BISA HEBAT
              </span>
            </div>
            <p className="text-xs text-slate-400 line-clamp-1 hidden md:block">
              {activeTopic || 'Media Pembelajaran Berbasis Game'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Sound Toggle Button */}
          <button
            onClick={toggleSound}
            title={isMuted ? 'Nyalakan Suara Game' : 'Bisukan Suara Game'}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <i className={`fa-solid ${isMuted ? 'fa-volume-xmark text-rose-400' : 'fa-volume-high text-emerald-400'}`}></i>
          </button>

          {/* Mode Switcher */}
          {currentView === 'teacher' ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onSwitchToStudent}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all duration-200"
              >
                <i className="fa-solid fa-play"></i>
                <span>Mode Siswa</span>
              </button>
              {isTeacherLoggedIn && (
                <button
                  onClick={onTeacherLogout}
                  title="Logout Mode Guru"
                  className="px-3 py-2 text-xs sm:text-sm font-medium rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/50 transition-colors"
                >
                  <i className="fa-solid fa-right-from-bracket sm:mr-1.5"></i>
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onSwitchToTeacher}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 hover:border-slate-600 shadow-sm transition-all duration-200"
            >
              <i className="fa-solid fa-chalkboard-user text-amber-400"></i>
              <span>Mode Guru / Kelola</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
