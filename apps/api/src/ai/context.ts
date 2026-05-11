import { and, asc, desc, eq, isNull } from 'drizzle-orm';
import { ageMonthsFrom, breedLabel, type IntakeAnswers } from '@ccc/shared';
import { getDb } from '../db/client';
import { breedProfile, dog as dogTable, intakeResponse } from '../db/schema';

const RECENT_DOGS_LIMIT = 8;

interface BuildContextInput {
  userId: string;
  /** When set, the context centres on this dog. */
  anchorDogId?: string | null | undefined;
}

/**
 * Per-conversation context block — sits inside the persona system prompt
 * (Block 6). Same caching strategy as plant-app: this text varies turn-to-turn,
 * but the cached system prefix lives above it; we regenerate this on every
 * call rather than try to cache it.
 *
 * Sections:
 *  - Anchored dog (if any): full profile + breed-library entry + latest intake.
 *  - The user's other dogs (brief catalogue) — so "what about Rex?" works.
 *
 * Returns an empty string when there's nothing meaningful to include.
 */
export async function buildContext({ userId, anchorDogId }: BuildContextInput): Promise<string> {
  const db = getDb();
  const lines: string[] = [];

  // Anchor dog (only if it actually belongs to this user — silent guard).
  let anchor: typeof dogTable.$inferSelect | null = null;
  if (anchorDogId) {
    const rows = await db
      .select()
      .from(dogTable)
      .where(
        and(eq(dogTable.id, anchorDogId), eq(dogTable.userId, userId), isNull(dogTable.archivedAt)),
      )
      .limit(1);
    anchor = rows[0] ?? null;
  }

  if (anchor) {
    const breed = breedLabel({
      kind: anchor.breedKind,
      ...(anchor.breedPrimary ? { primary: anchor.breedPrimary } : {}),
      ...(anchor.breedSecondary ? { secondary: anchor.breedSecondary } : {}),
      isGuess: anchor.breedIsGuess,
    });
    const months = ageMonthsFrom(anchor.birthDate ?? null);
    lines.push('## Currently focused dog');
    lines.push(`- id: ${anchor.id}`);
    lines.push(`- name: ${anchor.name}`);
    lines.push(`- breed: ${breed}${anchor.breedIsGuess ? ' (guess)' : ''}`);
    if (anchor.sex !== 'unknown') lines.push(`- sex: ${anchor.sex}`);
    if (anchor.neuterStatus !== 'unknown') lines.push(`- neuter status: ${anchor.neuterStatus}`);
    if (anchor.birthDate)
      lines.push(
        `- birth date: ${anchor.birthDate}${anchor.birthDateIsEstimate ? ' (estimate)' : ''}` +
          (months !== null
            ? ` — ${Math.floor(months / 12)}y ${months % 12}mo (${months} months total)`
            : ''),
      );
    if (anchor.weightKg !== null && anchor.weightKg !== undefined)
      lines.push(`- weight: ${anchor.weightKg} kg`);
    if (anchor.color) lines.push(`- color: ${anchor.color}`);
    if (anchor.source !== 'unknown') lines.push(`- source: ${anchor.source}`);
    if (anchor.acquiredOn) lines.push(`- got them on: ${anchor.acquiredOn}`);
    if (anchor.notes) lines.push(`- notes: ${anchor.notes}`);
    lines.push('');

    // Pull the breed-library entry if we have one (slug-by-convention).
    const slugs: string[] = [];
    if (anchor.breedKind === 'mix' && anchor.breedPrimary && anchor.breedSecondary) {
      slugs.push(slugify(`${anchor.breedPrimary} x ${anchor.breedSecondary}`));
    }
    if (anchor.breedPrimary) slugs.push(slugify(anchor.breedPrimary));
    if (anchor.breedSecondary) slugs.push(slugify(anchor.breedSecondary));

    for (const slug of slugs.slice(0, 3)) {
      const breedRows = await db
        .select()
        .from(breedProfile)
        .where(eq(breedProfile.slug, slug))
        .limit(1);
      const b = breedRows[0];
      if (!b) continue;
      lines.push(`## Breed-library entry: ${b.name} (${b.slug})`);
      if (b.bredFor) lines.push(`- bred for: ${b.bredFor}`);
      lines.push(`- energy: ${b.energyLevel}; trainability: ${b.trainability}`);
      const wr = b.weightKgRange as { min: number; max: number } | null;
      const lr = b.lifespanYearsRange as { min: number; max: number } | null;
      if (wr) lines.push(`- typical adult weight: ${wr.min}–${wr.max} kg`);
      if (lr) lines.push(`- lifespan: ${lr.min}–${lr.max} years`);
      const traits = (b.temperament as string[]) ?? [];
      if (traits.length > 0) lines.push(`- temperament: ${traits.join(', ')}`);
      const health = (b.healthPredispositions as string[]) ?? [];
      if (health.length > 0) lines.push(`- health watch-list: ${health.join(', ')}`);
      if (b.dailyExerciseTarget) lines.push(`- daily exercise reality: ${b.dailyExerciseTarget}`);
      if (b.notes) lines.push(`- notes: ${b.notes}`);
      lines.push('');
      break; // one breed entry is enough; don't crowd the prompt
    }

    // Latest intake answers — only fields the owner actually filled in.
    const intakeRows = await db
      .select()
      .from(intakeResponse)
      .where(and(eq(intakeResponse.dogId, anchor.id), eq(intakeResponse.userId, userId)))
      .orderBy(desc(intakeResponse.version))
      .limit(1);
    const intake = intakeRows[0];
    if (intake) {
      const ans = intake.answers as IntakeAnswers;
      lines.push(`## Latest intake (v${intake.version})`);
      if (ans.living) lines.push(`- living: ${JSON.stringify(ans.living)}`);
      if (ans.current) lines.push(`- current: ${JSON.stringify(ans.current)}`);
      if (ans.history) lines.push(`- history: ${JSON.stringify(ans.history)}`);
      if (ans.goals) lines.push(`- goals: ${JSON.stringify(ans.goals)}`);
      lines.push('');
    }
  }

  // Brief catalogue of the user's other dogs.
  const catalogue = await db
    .select({
      id: dogTable.id,
      name: dogTable.name,
      breedKind: dogTable.breedKind,
      breedPrimary: dogTable.breedPrimary,
      breedSecondary: dogTable.breedSecondary,
      breedIsGuess: dogTable.breedIsGuess,
    })
    .from(dogTable)
    .where(and(eq(dogTable.userId, userId), isNull(dogTable.archivedAt)))
    .orderBy(asc(dogTable.createdAt))
    .limit(RECENT_DOGS_LIMIT);

  if (catalogue.length > 0) {
    lines.push(
      anchor && catalogue.some((c) => c.id !== anchor!.id)
        ? '## The owner’s other dogs (brief)'
        : '## The owner’s dogs',
    );
    for (const d of catalogue) {
      if (anchor && d.id === anchor.id) continue;
      const lbl = breedLabel({
        kind: d.breedKind,
        ...(d.breedPrimary ? { primary: d.breedPrimary } : {}),
        ...(d.breedSecondary ? { secondary: d.breedSecondary } : {}),
        isGuess: d.breedIsGuess,
      });
      lines.push(`- ${d.id}: ${d.name} — ${lbl}`);
    }
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/×/g, 'x')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
