import { LearningMaterial, StudentSession } from '../types';
import { DEFAULT_MATERIAL } from '../data/defaultContent';

const MATERIAL_STORAGE_KEY = 'interaktif_smk_material_v1';
const TEACHER_AUTH_KEY = 'interaktif_smk_teacher_auth_v1';
const STUDENT_SESSION_KEY = 'interaktif_smk_student_session_v1';

export const storageManager = {
  // --- Learning Material ---
  getMaterial(): LearningMaterial {
    try {
      const stored = localStorage.getItem(MATERIAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.levels && Array.isArray(parsed.levels)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading material from localStorage:', e);
    }
    // Default fallback
    return DEFAULT_MATERIAL;
  },

  saveMaterial(material: LearningMaterial): boolean {
    try {
      material.updatedAt = new Date().toISOString();
      localStorage.setItem(MATERIAL_STORAGE_KEY, JSON.stringify(material));
      return true;
    } catch (e) {
      console.error('Error saving material to localStorage:', e);
      return false;
    }
  },

  resetMaterialToDefault(): LearningMaterial {
    try {
      localStorage.removeItem(MATERIAL_STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_MATERIAL;
  },

  exportMaterialJSON(material: LearningMaterial) {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(material, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    const cleanTopic = (material.topic || 'materi').toLowerCase().replace(/[^a-z0-9]/g, '-');
    downloadAnchor.setAttribute('download', `materi-smk-${cleanTopic}-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  parseImportedJSON(jsonString: string): LearningMaterial {
    const data = JSON.parse(jsonString);
    if (!data.topic || !Array.isArray(data.levels) || data.levels.length === 0) {
      throw new Error('Format materi tidak valid. File harus memiliki properti "topic" dan array "levels".');
    }
    // normalize levels
    data.levels.forEach((lvl: any, idx: number) => {
      lvl.levelNumber = idx + 1;
      if (!lvl.type) lvl.type = idx % 2 === 0 ? 'memory' : 'dragdrop';
      if (!Array.isArray(lvl.pairs) || lvl.pairs.length === 0) {
        throw new Error(`Level ${idx + 1} tidak memiliki pasangan soal.`);
      }
    });
    return data as LearningMaterial;
  },

  // --- Teacher Authentication ---
  getTeacherCredentials(): { username: string; password: string } {
    try {
      const stored = localStorage.getItem(TEACHER_AUTH_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.username && parsed.password) {
          return parsed;
        }
      }
    } catch (e) {
      // ignore
    }
    // Default teacher credentials
    return {
      username: 'guru',
      password: 'smkbisa123',
    };
  },

  updateTeacherPassword(newPassword: string): boolean {
    try {
      const current = this.getTeacherCredentials();
      localStorage.setItem(
        TEACHER_AUTH_KEY,
        JSON.stringify({
          username: current.username,
          password: newPassword,
        })
      );
      return true;
    } catch {
      return false;
    }
  },

  // --- Student Session ---
  getStudentSession(): StudentSession | null {
    try {
      const stored = sessionStorage.getItem(STUDENT_SESSION_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  },

  saveStudentSession(session: StudentSession | null) {
    try {
      if (session) {
        sessionStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify(session));
      } else {
        sessionStorage.removeItem(STUDENT_SESSION_KEY);
      }
    } catch (e) {
      console.error(e);
    }
  },
};
