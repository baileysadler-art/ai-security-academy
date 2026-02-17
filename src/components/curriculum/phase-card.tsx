"use client";

import Link from "next/link";
import {
  Monitor,
  Shield,
  BrainCircuit,
  Database,
  ShieldAlert,
  Briefcase,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useProgress } from "@/hooks/use-progress";
import { phaseColorMap } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Phase } from "@/types";

const iconMap: Record<string, LucideIcon> = {
  Monitor,
  Shield,
  BrainCircuit,
  Database,
  ShieldAlert,
  Briefcase,
};

interface PhaseCardProps {
  phase: Phase;
}

export function PhaseCard({ phase }: PhaseCardProps) {
  const { getPhaseProgress, isPhaseUnlocked } = useProgress();
  const progress = getPhaseProgress(phase.id);
  const percentage =
    progress.total === 0
      ? 0
      : Math.round((progress.completed / progress.total) * 100);
  const Icon = iconMap[phase.icon] || Monitor;
  const colorClasses = phaseColorMap[phase.color] || phaseColorMap.blue;
  const unlocked = isPhaseUnlocked(phase.id);

  const content = (
    <Card
      className={cn(
        "transition-all h-full",
        unlocked
          ? "hover:shadow-md hover:border-primary/20 cursor-pointer"
          : "opacity-60 cursor-not-allowed"
      )}
    >
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              "flex items-center justify-center size-10 rounded-lg border",
              unlocked ? colorClasses : "bg-muted text-muted-foreground border-muted"
            )}
          >
            {unlocked ? <Icon className="size-5" /> : <Lock className="size-5" />}
          </div>
          <Badge variant="secondary" className="text-xs">
            {unlocked ? `${phase.modules.length} modules` : "Locked"}
          </Badge>
        </div>
        <div>
          <h3 className="font-semibold">{phase.title}</h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {unlocked
              ? phase.description
              : "Complete the previous phase to unlock this one."}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{phase.weekRange}</span>
          <span>&middot;</span>
          <span>~{phase.estimatedHours}h</span>
        </div>
        {unlocked && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>
                {progress.completed}/{progress.total} lessons
              </span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (!unlocked) return content;

  return <Link href={`/curriculum/${phase.slug}`}>{content}</Link>;
}
