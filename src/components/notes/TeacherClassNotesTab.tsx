import React from "react";
import { StudentNotesSearchTab } from "./StudentNotesSearchTab";
import type { NotesTeacherContext } from "../../types/notes.types";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  teacherContext: NotesTeacherContext;
  schoolSlug: string;
  bottomInset: number;
  initialStudentId?: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Onglet Notes de l'enseignant : une classe unique, donc pas de nom de
 * classe affiché dans la recherche. Fine couche au-dessus de
 * `StudentNotesSearchTab`, partagée avec la vue school admin (multi-classes).
 */
export function TeacherClassNotesTab({
  teacherContext,
  schoolSlug,
  bottomInset,
  initialStudentId,
}: Props) {
  return (
    <StudentNotesSearchTab
      students={teacherContext.students}
      subjects={teacherContext.subjects}
      schoolSlug={schoolSlug}
      bottomInset={bottomInset}
      initialStudentId={initialStudentId}
    />
  );
}
