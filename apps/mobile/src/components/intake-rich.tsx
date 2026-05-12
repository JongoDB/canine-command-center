// The "rich" intake sections B–E (origin/history, living, current state, goals)
// — mirrors the web `IntakeForm` B–E panels, native flavour. Each section takes
// the whole `IntakeAnswers` + a setter and patches its own slice. Optional enum
// fields use `''` as the "—" (unset) chip value, which can never collide with a
// real enum member.
import { View } from 'react-native';
import type { IntakeAnswers } from '@ccc/shared';
import {
  FieldRow,
  MultilineInput,
  MultiSelectRow,
  NumberFieldInput,
  OptionRow,
  StringInput,
  arrayToLines,
  linesToArray,
} from './intake-fields';

type SectionProps = {
  answers: IntakeAnswers;
  setAnswers: (next: IntakeAnswers) => void;
};

type Living = NonNullable<IntakeAnswers['living']>;
type Current = NonNullable<IntakeAnswers['current']>;
type Goals = NonNullable<IntakeAnswers['goals']>;

// --- B · origin & history ---------------------------------------------------

export function SectionBHistory({ answers, setAnswers }: SectionProps) {
  const h = answers.history ?? {};
  const setH = (patch: Partial<NonNullable<IntakeAnswers['history']>>) =>
    setAnswers({ ...answers, history: { ...h, ...patch } });
  return (
    <View>
      <FieldRow label="Anything you know about their prior life">
        <MultilineInput
          value={h.priorHistory}
          onChange={(v) => setH({ priorHistory: v ?? undefined })}
          rows={4}
        />
      </FieldRow>
      <FieldRow label="Prior training (if any)">
        <MultilineInput
          value={h.priorTraining}
          onChange={(v) => setH({ priorTraining: v ?? undefined })}
        />
      </FieldRow>
      <FieldRow label="Known triggers / fears (one per line)">
        <MultilineInput
          value={arrayToLines(h.knownTriggers)}
          onChange={(v) => setH({ knownTriggers: v ? linesToArray(v) : undefined })}
        />
      </FieldRow>
      <FieldRow label="Bite history (handled gently)">
        <MultilineInput
          value={h.biteHistory}
          onChange={(v) => setH({ biteHistory: v ?? undefined })}
        />
      </FieldRow>
      <FieldRow label="Prior medical history">
        <MultilineInput
          value={h.priorMedical}
          onChange={(v) => setH({ priorMedical: v ?? undefined })}
        />
      </FieldRow>
    </View>
  );
}

// --- C · life situation -----------------------------------------------------

const HOME_OPTS: ReadonlyArray<{ value: NonNullable<Living['homeType']> | ''; label: string }> = [
  { value: '', label: '—' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'acreage', label: 'Acreage' },
  { value: 'other', label: 'Other' },
];
const YARD_OPTS: ReadonlyArray<{ value: NonNullable<Living['yardFencing']> | ''; label: string }> =
  [
    { value: '', label: '—' },
    { value: 'none', label: 'No yard' },
    { value: 'unfenced', label: 'Unfenced' },
    { value: 'partial', label: 'Partly fenced' },
    { value: 'fenced', label: 'Fully fenced' },
  ];
const ACTIVITY_OPTS: ReadonlyArray<{
  value: NonNullable<Living['ownerActivityLevel']> | '';
  label: string;
}> = [
  { value: '', label: '—' },
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'high', label: 'High' },
  { value: 'very_high', label: 'Very high' },
];
const EXPERIENCE_OPTS: ReadonlyArray<{
  value: NonNullable<Living['ownerDogExperience']> | '';
  label: string;
}> = [
  { value: '', label: '—' },
  { value: 'first_dog', label: 'First dog' },
  { value: 'some', label: 'Some' },
  { value: 'experienced', label: 'Experienced' },
  { value: 'professional', label: 'Professional' },
];

export function SectionCLiving({ answers, setAnswers }: SectionProps) {
  const l = answers.living ?? {};
  const setL = (patch: Partial<Living>) => setAnswers({ ...answers, living: { ...l, ...patch } });
  return (
    <View>
      <FieldRow label="Home type">
        <OptionRow
          value={l.homeType ?? ''}
          onChange={(v) => setL({ homeType: v || undefined })}
          options={HOME_OPTS}
        />
      </FieldRow>
      <FieldRow label="Yard / fencing">
        <OptionRow
          value={l.yardFencing ?? ''}
          onChange={(v) => setL({ yardFencing: v || undefined })}
          options={YARD_OPTS}
        />
      </FieldRow>
      <FieldRow label="Other pets in the home">
        <MultilineInput value={l.otherPets} onChange={(v) => setL({ otherPets: v ?? undefined })} />
      </FieldRow>
      <FieldRow label="Kids and ages">
        <MultilineInput
          value={l.kidsAndAges}
          onChange={(v) => setL({ kidsAndAges: v ?? undefined })}
        />
      </FieldRow>
      <FieldRow label="Other handlers (who else handles the dog)">
        <MultilineInput
          value={l.otherHandlers}
          onChange={(v) => setL({ otherHandlers: v ?? undefined })}
        />
      </FieldRow>
      <FieldRow label="Hours alone on a typical day">
        <NumberFieldInput
          value={l.hoursAloneTypicalDay}
          onChange={(v) => setL({ hoursAloneTypicalDay: v ?? undefined })}
        />
      </FieldRow>
      <FieldRow label="Your activity level">
        <OptionRow
          value={l.ownerActivityLevel ?? ''}
          onChange={(v) => setL({ ownerActivityLevel: v || undefined })}
          options={ACTIVITY_OPTS}
        />
      </FieldRow>
      <FieldRow label="Your dog experience">
        <OptionRow
          value={l.ownerDogExperience ?? ''}
          onChange={(v) => setL({ ownerDogExperience: v || undefined })}
          options={EXPERIENCE_OPTS}
        />
      </FieldRow>
      <FieldRow label="Climate (e.g. hot/dry, cold/snowy)">
        <StringInput
          value={l.climate ?? null}
          onChangeText={(v) => setL({ climate: v ?? undefined })}
        />
      </FieldRow>
    </View>
  );
}

// --- D · current state ------------------------------------------------------

const VAX_OPTS: ReadonlyArray<{
  value: NonNullable<Current['vaccinationStatus']> | '';
  label: string;
}> = [
  { value: '', label: '—' },
  { value: 'up_to_date', label: 'Up to date' },
  { value: 'partial', label: 'Partial' },
  { value: 'unknown', label: 'Unknown' },
  { value: 'none', label: 'None' },
];

export function SectionDCurrent({ answers, setAnswers }: SectionProps) {
  const c = answers.current ?? {};
  const setC = (patch: Partial<Current>) => setAnswers({ ...answers, current: { ...c, ...patch } });
  return (
    <View>
      <FieldRow label="What does your dog already know? (one cue per line — sit, down, stay…)">
        <MultilineInput
          value={arrayToLines(c.knownSkills)}
          onChange={(v) => setC({ knownSkills: v ? linesToArray(v) : undefined })}
        />
      </FieldRow>
      <FieldRow label="Current problem behaviors (one per line — pulling, jumping, recall…)">
        <MultilineInput
          value={arrayToLines(c.problemBehaviors)}
          onChange={(v) => setC({ problemBehaviors: v ? linesToArray(v) : undefined })}
        />
      </FieldRow>
      <FieldRow label="Current diet (food, schedule)">
        <MultilineInput
          value={c.currentDiet}
          onChange={(v) => setC({ currentDiet: v ?? undefined })}
        />
      </FieldRow>
      <FieldRow label="Current medications">
        <MultilineInput
          value={c.currentMeds}
          onChange={(v) => setC({ currentMeds: v ?? undefined })}
        />
      </FieldRow>
      <FieldRow label="Last vet visit (YYYY-MM-DD)">
        <StringInput
          value={c.lastVetVisit ?? null}
          onChangeText={(v) => setC({ lastVetVisit: v ?? undefined })}
          placeholder="e.g. 2026-03-01"
          keyboardType="numbers-and-punctuation"
        />
      </FieldRow>
      <FieldRow label="Vaccination status">
        <OptionRow
          value={c.vaccinationStatus ?? ''}
          onChange={(v) => setC({ vaccinationStatus: v || undefined })}
          options={VAX_OPTS}
        />
      </FieldRow>
      <FieldRow label="Grooming routine">
        <MultilineInput
          value={c.groomingRoutine}
          onChange={(v) => setC({ groomingRoutine: v ?? undefined })}
        />
      </FieldRow>
    </View>
  );
}

// --- E · goals --------------------------------------------------------------

type Sport = NonNullable<Goals['sportInterest']>[number];
const SPORT_OPTS: ReadonlyArray<{ value: Sport; label: string }> = [
  { value: 'nosework', label: 'Nosework' },
  { value: 'agility', label: 'Agility' },
  { value: 'rally', label: 'Rally' },
  { value: 'dock_diving', label: 'Dock diving' },
  { value: 'herding', label: 'Herding' },
  { value: 'tracking', label: 'Tracking' },
  { value: 'protection_igp', label: 'Protection / IGP (opt-in, pro supervision)' },
  { value: 'canicross', label: 'Canicross' },
  { value: 'other', label: 'Other' },
];

export function SectionEGoals({ answers, setAnswers }: SectionProps) {
  const g = answers.goals ?? {};
  const setG = (patch: Partial<Goals>) => setAnswers({ ...answers, goals: { ...g, ...patch } });
  return (
    <View>
      <FieldRow label="What does 'great' look like? (a calm house dog? a hiking partner? a sport prospect?)">
        <MultilineInput
          value={g.summary}
          onChange={(v) => setG({ summary: v ?? undefined })}
          rows={4}
        />
      </FieldRow>
      <FieldRow label="Focus areas (one per line — 'off-leash recall', 'calm settle'…)">
        <MultilineInput
          value={arrayToLines(g.focusAreas)}
          onChange={(v) => setG({ focusAreas: v ? linesToArray(v) : undefined })}
        />
      </FieldRow>
      <FieldRow label="Sport interest (tap any that apply)">
        <MultiSelectRow
          values={g.sportInterest ?? []}
          onChange={(next) => setG({ sportInterest: next.length === 0 ? undefined : next })}
          options={SPORT_OPTS}
        />
      </FieldRow>
      <FieldRow label="Time per day you can commit (minutes)">
        <NumberFieldInput
          value={g.minutesPerDay}
          onChange={(v) => setG({ minutesPerDay: v ?? undefined })}
        />
      </FieldRow>
    </View>
  );
}
