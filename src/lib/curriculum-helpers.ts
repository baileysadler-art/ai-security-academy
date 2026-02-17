import { curriculum } from "@/data/curriculum";
import type { Phase, Module, Lesson } from "@/types";

export function getAllPhases(): Phase[] {
  return curriculum;
}

export function getPhaseBySlug(slug: string): Phase | undefined {
  return curriculum.find((p) => p.slug === slug);
}

export function getModuleBySlug(
  phaseSlug: string,
  moduleSlug: string
): Module | undefined {
  const phase = getPhaseBySlug(phaseSlug);
  if (!phase) return undefined;
  return phase.modules.find((m) => m.slug === moduleSlug);
}

export function getLessonBySlug(
  phaseSlug: string,
  moduleSlug: string,
  lessonSlug: string
): Lesson | undefined {
  const module = getModuleBySlug(phaseSlug, moduleSlug);
  if (!module) return undefined;
  return module.lessons.find((l) => l.slug === lessonSlug);
}

export function getAllLessonsFlat(): Lesson[] {
  return curriculum.flatMap((phase) =>
    phase.modules.flatMap((module) => module.lessons)
  );
}

export function getTotalLessonCount(): number {
  return getAllLessonsFlat().length;
}

export function getNextLesson(
  currentLessonId: string
): { phase: Phase; module: Module; lesson: Lesson } | null {
  const allLessons = getAllLessonsWithContext();
  const currentIndex = allLessons.findIndex(
    (item) => item.lesson.id === currentLessonId
  );
  if (currentIndex === -1 || currentIndex === allLessons.length - 1)
    return null;
  return allLessons[currentIndex + 1];
}

export function getPreviousLesson(
  currentLessonId: string
): { phase: Phase; module: Module; lesson: Lesson } | null {
  const allLessons = getAllLessonsWithContext();
  const currentIndex = allLessons.findIndex(
    (item) => item.lesson.id === currentLessonId
  );
  if (currentIndex <= 0) return null;
  return allLessons[currentIndex - 1];
}

export function getFirstIncompleteLessonId(
  completedIds: string[]
): string | null {
  const allLessons = getAllLessonsFlat();
  const firstIncomplete = allLessons.find(
    (lesson) => !completedIds.includes(lesson.id)
  );
  return firstIncomplete?.id ?? null;
}

export function getFirstIncompleteLessonWithContext(
  completedIds: string[]
): { phase: Phase; module: Module; lesson: Lesson } | null {
  const allLessons = getAllLessonsWithContext();
  return (
    allLessons.find((item) => !completedIds.includes(item.lesson.id)) ?? null
  );
}

export function getLessonContext(
  lessonId: string
): { phase: Phase; module: Module; lesson: Lesson } | null {
  const allLessons = getAllLessonsWithContext();
  return allLessons.find((item) => item.lesson.id === lessonId) ?? null;
}

export function getModuleProgress(
  moduleId: string,
  completedIds: string[]
): { completed: number; total: number } {
  for (const phase of curriculum) {
    const module = phase.modules.find((m) => m.id === moduleId);
    if (module) {
      const total = module.lessons.length;
      const completed = module.lessons.filter((l) =>
        completedIds.includes(l.id)
      ).length;
      return { completed, total };
    }
  }
  return { completed: 0, total: 0 };
}

export function getPhaseProgress(
  phaseId: string,
  completedIds: string[]
): { completed: number; total: number } {
  const phase = curriculum.find((p) => p.id === phaseId);
  if (!phase) return { completed: 0, total: 0 };
  const total = phase.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const completed = phase.modules.reduce(
    (sum, m) =>
      sum + m.lessons.filter((l) => completedIds.includes(l.id)).length,
    0
  );
  return { completed, total };
}

export function getOverallProgress(completedIds: string[]): {
  completed: number;
  total: number;
  percentage: number;
} {
  const total = getTotalLessonCount();
  const completed = completedIds.length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, total, percentage };
}

function getAllLessonsWithContext(): {
  phase: Phase;
  module: Module;
  lesson: Lesson;
}[] {
  const result: { phase: Phase; module: Module; lesson: Lesson }[] = [];
  for (const phase of curriculum) {
    for (const module of phase.modules) {
      for (const lesson of module.lessons) {
        result.push({ phase, module, lesson });
      }
    }
  }
  return result;
}

// ============================================================
// SEQUENTIAL GATING HELPERS
// ============================================================

/** Phase is unlocked if it's the first phase OR all lessons in the previous phase are complete */
export function isPhaseUnlocked(
  phaseId: string,
  completedIds: string[]
): boolean {
  const phaseIndex = curriculum.findIndex((p) => p.id === phaseId);
  if (phaseIndex <= 0) return true; // first phase always unlocked
  const prevPhase = curriculum[phaseIndex - 1];
  const prevLessons = prevPhase.modules.flatMap((m) => m.lessons);
  return prevLessons.every((l) => completedIds.includes(l.id));
}

/** Module is unlocked if its phase is unlocked AND it's the first module in its phase OR all lessons in the previous module are complete */
export function isModuleUnlocked(
  moduleId: string,
  completedIds: string[]
): boolean {
  for (const phase of curriculum) {
    const moduleIndex = phase.modules.findIndex((m) => m.id === moduleId);
    if (moduleIndex === -1) continue;

    // Phase itself must be unlocked
    if (!isPhaseUnlocked(phase.id, completedIds)) return false;

    // First module in phase is unlocked (if phase is unlocked)
    if (moduleIndex === 0) return true;

    // Previous module's lessons must all be complete
    const prevModule = phase.modules[moduleIndex - 1];
    return prevModule.lessons.every((l) => completedIds.includes(l.id));
  }
  return false;
}

/** Lesson is unlocked if its module is unlocked AND it's the first lesson in the module OR the previous lesson is complete */
export function isLessonUnlocked(
  lessonId: string,
  completedIds: string[]
): boolean {
  for (const phase of curriculum) {
    for (const module of phase.modules) {
      const lessonIndex = module.lessons.findIndex((l) => l.id === lessonId);
      if (lessonIndex === -1) continue;

      // Module must be unlocked
      if (!isModuleUnlocked(module.id, completedIds)) return false;

      // First lesson in module is unlocked (if module is unlocked)
      if (lessonIndex === 0) return true;

      // Previous lesson must be complete
      return completedIds.includes(module.lessons[lessonIndex - 1].id);
    }
  }
  return false;
}
