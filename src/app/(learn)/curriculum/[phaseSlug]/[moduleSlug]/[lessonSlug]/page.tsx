"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { LessonContent } from "@/components/curriculum/lesson-content";
import { QuizContainer } from "@/components/quiz/quiz-container";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useProgress } from "@/hooks/use-progress";
import {
  getLessonBySlug,
  getNextLesson,
  getPreviousLesson,
} from "@/lib/curriculum-helpers";
import { cn } from "@/lib/utils";

export default function LessonPage() {
  const params = useParams();
  const phaseSlug = params.phaseSlug as string;
  const moduleSlug = params.moduleSlug as string;
  const lessonSlug = params.lessonSlug as string;

  const { isLessonComplete, markLessonComplete, isLessonUnlocked } = useProgress();
  const lesson = getLessonBySlug(phaseSlug, moduleSlug, lessonSlug);

  if (!lesson) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-lg font-semibold">Lesson not found</h2>
      </div>
    );
  }

  if (!isLessonUnlocked(lesson.id)) {
    return (
      <div className="py-12 text-center space-y-4">
        <Lock className="size-10 text-muted-foreground mx-auto" />
        <h2 className="text-lg font-semibold">Lesson Locked</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Complete the previous lessons first to unlock this one. Learning is sequential to make sure you build a solid foundation.
        </p>
        <Button variant="outline" asChild>
          <Link href={`/curriculum/${phaseSlug}/${moduleSlug}`}>
            <ChevronLeft className="mr-1 size-4" />
            Back to Module
          </Link>
        </Button>
      </div>
    );
  }

  const completed = isLessonComplete(lesson.id);
  const next = getNextLesson(lesson.id);
  const prev = getPreviousLesson(lesson.id);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <PageHeader
        title={lesson.title}
        description={`~${lesson.estimatedMinutes} minutes`}
      />

      <LessonContent content={lesson.content} />

      {lesson.quiz && (
        <>
          <Separator />
          <QuizContainer
            quiz={lesson.quiz}
            lessonId={lesson.id}
            onComplete={() => {}}
          />
        </>
      )}

      <Separator />

      {/* Mark Complete + Navigation */}
      <div className="space-y-4">
        <Button
          onClick={() => markLessonComplete(lesson.id)}
          disabled={completed}
          className={cn("w-full", completed && "bg-emerald-600 hover:bg-emerald-600")}
        >
          <CheckCircle2 className="mr-2 size-4" />
          {completed ? "Completed" : "Mark as Complete"}
        </Button>

        <div className="flex justify-between">
          {prev ? (
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`/curriculum/${prev.phase.slug}/${prev.module.slug}/${prev.lesson.slug}`}
              >
                <ChevronLeft className="mr-1 size-4" />
                Previous
              </Link>
            </Button>
          ) : (
            <div />
          )}
          {next && isLessonUnlocked(next.lesson.id) ? (
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`/curriculum/${next.phase.slug}/${next.module.slug}/${next.lesson.slug}`}
              >
                Next
                <ChevronRight className="ml-1 size-4" />
              </Link>
            </Button>
          ) : next ? (
            <Button variant="outline" size="sm" disabled>
              <Lock className="mr-1 size-3" />
              Next
            </Button>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}
