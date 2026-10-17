export type QuestionType = 'memory' | 'dragdrop';

export interface QuestionPair {
  id: string;
  term: string;        // Istilah / Kunci / Pernyataan
  definition: string;  // Definisi / Jawaban / Penjelasan
  clue?: string;       // Bantuan tambahan jika siswa ragu
  category?: string;
}

export interface GameLevel {
  levelNumber: number;
  title: string;
  type: QuestionType;
  description: string;
  pairs: QuestionPair[];
}

export interface LearningMaterial {
  id: string;
  topic: string;
  subject: string;
  targetGrade: string;
  summaryPoints: string[];
  detailedContent?: string;
  levels: GameLevel[];
  updatedAt: string;
}

export interface StudentSession {
  studentName: string;
  studentClass: string;
  startedAt: number;
  hasReviewedMaterial: boolean;
  currentLevelIndex: number;
  completedLevels: number[];
  levelStats: {
    [levelNumber: number]: {
      timeSpentSeconds: number;
      attempts: number;
      mistakes: number;
      completed: boolean;
    };
  };
  totalScore: number;
  completedAt?: number;
  certificateId?: string;
}

export interface TeacherAuth {
  username: string;
  passwordHash: string; // stored or default
  isLoggedIn: boolean;
}
