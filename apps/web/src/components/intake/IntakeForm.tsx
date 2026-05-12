import { type ReactNode, useState } from 'react';
import {
  type Breed,
  type DogProfileInput,
  type DogSex,
  type DogSource,
  EMPTY_DEFAULT_PROFILE,
  type IntakeAnswers,
  MAL_DUTCH_DEFAULT_PROFILE,
  type NeuterStatus,
  type SubmitIntakeInput,
} from '@ccc/shared';
import { mediaUrl, uploadPhoto } from '../../lib/media';

// ---------------------------------------------------------------------------
// State + defaults
// ---------------------------------------------------------------------------

export interface IntakeFormState {
  profile: DogProfileInput;
  answers: IntakeAnswers;
}

/** The web stepper default: shared profile + a couple of intake-answers seeds. */
export const MAL_DUTCH_DEFAULT: IntakeFormState = {
  profile: MAL_DUTCH_DEFAULT_PROFILE,
  answers: {
    living: { ownerActivityLevel: 'high', ownerDogExperience: 'experienced' },
    goals: { focusAreas: ['off-leash recall', 'calm settle'], minutesPerDay: 90 },
  },
};

/** A blank form, for users who don't want the example. */
export const EMPTY_DEFAULT: IntakeFormState = {
  profile: EMPTY_DEFAULT_PROFILE,
  answers: {},
};

type Setter = (next: IntakeFormState) => void;
type SectionProps = { state: IntakeFormState; set: Setter };

// ---------------------------------------------------------------------------
// Tiny field helpers
// ---------------------------------------------------------------------------

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label>{label}</label>
      {children}
    </div>
  );
}

function TextArea({
  value,
  onChange,
  rows = 3,
}: {
  value: string | null | undefined;
  onChange: (v: string | null) => void;
  rows?: number;
}) {
  return (
    <textarea
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
      rows={rows}
      style={{
        width: '100%',
        background: 'var(--black)',
        border: '1px solid var(--steel-mid)',
        color: 'var(--cream)',
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        padding: '10px 12px',
        resize: 'vertical',
      }}
    />
  );
}

function NumberInput({
  value,
  onChange,
  step,
  min,
  max,
}: {
  value: number | null | undefined;
  onChange: (v: number | null) => void;
  step?: string;
  min?: number;
  max?: number;
}) {
  return (
    <input
      type="number"
      value={value ?? ''}
      step={step}
      min={min}
      max={max}
      onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
    />
  );
}

function Select<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: ReadonlyArray<{ value: T; label: string }>;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      style={{
        width: '100%',
        background: 'var(--black)',
        border: '1px solid var(--steel-mid)',
        color: 'var(--cream)',
        fontFamily: 'var(--font-body)',
        fontSize: 15,
        padding: '10px 12px',
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

const linesToArray = (s: string): string[] =>
  s
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
const arrayToLines = (a: string[] | undefined): string => (a ?? []).join('\n');

// ---------------------------------------------------------------------------
// Section A — identity (also reused by EditDog)
// ---------------------------------------------------------------------------

const SEX_OPTIONS: ReadonlyArray<{ value: DogSex; label: string }> = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'unknown', label: 'Unknown' },
];
const NEUTER_OPTIONS: ReadonlyArray<{ value: NeuterStatus; label: string }> = [
  { value: 'intact', label: 'Intact' },
  { value: 'spayed', label: 'Spayed' },
  { value: 'neutered', label: 'Neutered' },
  { value: 'unknown', label: 'Unknown' },
];
const SOURCE_OPTIONS: ReadonlyArray<{ value: DogSource; label: string }> = [
  { value: 'breeder', label: 'Breeder' },
  { value: 'shelter', label: 'Shelter' },
  { value: 'rescue', label: 'Rescue' },
  { value: 'stray', label: 'Stray' },
  { value: 'bred_by_me', label: 'Bred by me' },
  { value: 'gift', label: 'Gift' },
  { value: 'other', label: 'Other' },
  { value: 'unknown', label: 'Unknown' },
];
const BREED_KIND_OPTIONS: ReadonlyArray<{ value: Breed['kind']; label: string }> = [
  { value: 'pure', label: 'Pure breed' },
  { value: 'mix', label: 'Mix' },
  { value: 'unknown', label: 'Unknown / mutt' },
];

export function SectionAIdentity({ state, set }: SectionProps) {
  const p = state.profile;
  const setP = (patch: Partial<DogProfileInput>) => set({ ...state, profile: { ...p, ...patch } });
  const setBreed = (patch: Partial<Breed>) => setP({ breed: { ...p.breed, ...patch } });
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    setPhotoBusy(true);
    setPhotoError(null);
    try {
      const media = await uploadPhoto(file);
      setP({ photoMediaId: media.id });
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : 'Could not upload that image.');
    } finally {
      setPhotoBusy(false);
    }
  }

  return (
    <div className="stack">
      <Field label="Photo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {p.photoMediaId ? (
            <img
              src={mediaUrl(p.photoMediaId)}
              alt=""
              style={{
                width: 56,
                height: 56,
                objectFit: 'cover',
                border: '1px solid var(--steel-mid)',
              }}
            />
          ) : (
            <div
              style={{
                width: 56,
                height: 56,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--steel-mid)',
                color: 'var(--text-muted)',
                fontSize: 20,
              }}
            >
              🐾
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            disabled={photoBusy}
            onChange={(e) => void onPhoto(e.target.files?.[0])}
            style={{ fontSize: 13 }}
          />
          {p.photoMediaId && (
            <button
              type="button"
              className="ghost"
              style={{ width: 'auto', padding: '4px 10px' }}
              onClick={() => setP({ photoMediaId: null })}
            >
              Remove
            </button>
          )}
        </div>
        {photoBusy && (
          <div className="muted" style={{ fontSize: 12 }}>
            Uploading…
          </div>
        )}
        {photoError && <div className="error">{photoError}</div>}
      </Field>
      <Field label="Name">
        <input value={p.name} onChange={(e) => setP({ name: e.target.value })} required />
      </Field>
      <Field label="Breed">
        <Select
          value={p.breed.kind}
          onChange={(v) => setBreed({ kind: v })}
          options={BREED_KIND_OPTIONS}
        />
      </Field>
      {p.breed.kind !== 'unknown' && (
        <Field label="Primary breed">
          <input
            value={p.breed.primary ?? ''}
            onChange={(e) => setBreed({ primary: e.target.value || undefined })}
            placeholder="e.g. Belgian Malinois"
          />
        </Field>
      )}
      {p.breed.kind === 'mix' && (
        <Field label="Secondary breed">
          <input
            value={p.breed.secondary ?? ''}
            onChange={(e) => setBreed({ secondary: e.target.value || undefined })}
            placeholder="e.g. Dutch Shepherd"
          />
        </Field>
      )}
      <Field label="Is the breed a guess?">
        <input
          type="checkbox"
          checked={p.breed.isGuess}
          onChange={(e) => setBreed({ isGuess: e.target.checked })}
        />
      </Field>
      <Field label="Sex">
        <Select value={p.sex} onChange={(v) => setP({ sex: v })} options={SEX_OPTIONS} />
      </Field>
      <Field label="Neuter status">
        <Select
          value={p.neuterStatus}
          onChange={(v) => setP({ neuterStatus: v })}
          options={NEUTER_OPTIONS}
        />
      </Field>
      <Field label="Birth date (or your estimate)">
        <input
          type="date"
          value={p.birthDate ?? ''}
          onChange={(e) => setP({ birthDate: e.target.value === '' ? null : e.target.value })}
        />
      </Field>
      <Field label="Birth date is an estimate">
        <input
          type="checkbox"
          checked={p.birthDateIsEstimate}
          onChange={(e) => setP({ birthDateIsEstimate: e.target.checked })}
        />
      </Field>
      <Field label="Weight (kg)">
        <NumberInput
          value={p.weightKg}
          onChange={(v) => setP({ weightKg: v })}
          step="0.1"
          min={0}
          max={200}
        />
      </Field>
      <Field label="Color">
        <input value={p.color ?? ''} onChange={(e) => setP({ color: e.target.value || null })} />
      </Field>
      <Field label="Microchip">
        <input
          value={p.microchip ?? ''}
          onChange={(e) => setP({ microchip: e.target.value || null })}
        />
      </Field>
      <Field label="Source">
        <Select value={p.source} onChange={(v) => setP({ source: v })} options={SOURCE_OPTIONS} />
      </Field>
      <Field label="Got them on">
        <input
          type="date"
          value={p.acquiredOn ?? ''}
          onChange={(e) => setP({ acquiredOn: e.target.value === '' ? null : e.target.value })}
        />
      </Field>
      <Field label="Age (weeks) when you got them">
        <NumberInput
          value={p.acquiredAtAgeWeeks}
          onChange={(v) => setP({ acquiredAtAgeWeeks: v === null ? null : Math.round(v) })}
          min={0}
          max={2000}
        />
      </Field>
      <Field label="Notes (anything else about identity / origin)">
        <TextArea value={p.notes} onChange={(v) => setP({ notes: v })} />
      </Field>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section B — history
// ---------------------------------------------------------------------------

function SectionBHistory({ state, set }: SectionProps) {
  const a = state.answers;
  const h = a.history ?? {};
  const setH = (patch: Partial<NonNullable<IntakeAnswers['history']>>) =>
    set({ ...state, answers: { ...a, history: { ...h, ...patch } } });
  return (
    <div className="stack">
      <Field label="Anything you know about their prior life">
        <TextArea
          value={h.priorHistory}
          onChange={(v) => setH({ priorHistory: v ?? undefined })}
          rows={4}
        />
      </Field>
      <Field label="Prior training (if any)">
        <TextArea
          value={h.priorTraining}
          onChange={(v) => setH({ priorTraining: v ?? undefined })}
        />
      </Field>
      <Field label="Known triggers / fears (one per line)">
        <TextArea
          value={arrayToLines(h.knownTriggers)}
          onChange={(v) => setH({ knownTriggers: v ? linesToArray(v) : undefined })}
        />
      </Field>
      <Field label="Bite history (handle gently)">
        <TextArea value={h.biteHistory} onChange={(v) => setH({ biteHistory: v ?? undefined })} />
      </Field>
      <Field label="Prior medical history">
        <TextArea value={h.priorMedical} onChange={(v) => setH({ priorMedical: v ?? undefined })} />
      </Field>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section C — living situation
// ---------------------------------------------------------------------------

function SectionCLiving({ state, set }: SectionProps) {
  const a = state.answers;
  const l = a.living ?? {};
  const setL = (patch: Partial<NonNullable<IntakeAnswers['living']>>) =>
    set({ ...state, answers: { ...a, living: { ...l, ...patch } } });
  return (
    <div className="stack">
      <Field label="Home type">
        <Select
          value={l.homeType ?? ''}
          onChange={(v) =>
            setL({
              homeType: v === '' ? undefined : (v as 'apartment' | 'house' | 'acreage' | 'other'),
            })
          }
          options={[
            { value: '', label: '—' },
            { value: 'apartment', label: 'Apartment' },
            { value: 'house', label: 'House' },
            { value: 'acreage', label: 'Acreage' },
            { value: 'other', label: 'Other' },
          ]}
        />
      </Field>
      <Field label="Yard / fencing">
        <Select
          value={l.yardFencing ?? ''}
          onChange={(v) =>
            setL({
              yardFencing: v === '' ? undefined : (v as 'none' | 'unfenced' | 'partial' | 'fenced'),
            })
          }
          options={[
            { value: '', label: '—' },
            { value: 'none', label: 'No yard' },
            { value: 'unfenced', label: 'Yard, unfenced' },
            { value: 'partial', label: 'Partially fenced' },
            { value: 'fenced', label: 'Fully fenced' },
          ]}
        />
      </Field>
      <Field label="Other pets in the home">
        <TextArea value={l.otherPets} onChange={(v) => setL({ otherPets: v ?? undefined })} />
      </Field>
      <Field label="Kids and ages">
        <TextArea value={l.kidsAndAges} onChange={(v) => setL({ kidsAndAges: v ?? undefined })} />
      </Field>
      <Field label="Other handlers (who else handles the dog)">
        <TextArea
          value={l.otherHandlers}
          onChange={(v) => setL({ otherHandlers: v ?? undefined })}
        />
      </Field>
      <Field label="Hours alone on a typical day">
        <NumberInput
          value={l.hoursAloneTypicalDay}
          onChange={(v) => setL({ hoursAloneTypicalDay: v ?? undefined })}
          min={0}
          max={24}
          step="0.5"
        />
      </Field>
      <Field label="Your activity level">
        <Select
          value={l.ownerActivityLevel ?? ''}
          onChange={(v) =>
            setL({
              ownerActivityLevel:
                v === '' ? undefined : (v as 'low' | 'moderate' | 'high' | 'very_high'),
            })
          }
          options={[
            { value: '', label: '—' },
            { value: 'low', label: 'Low' },
            { value: 'moderate', label: 'Moderate' },
            { value: 'high', label: 'High' },
            { value: 'very_high', label: 'Very high' },
          ]}
        />
      </Field>
      <Field label="Your dog experience">
        <Select
          value={l.ownerDogExperience ?? ''}
          onChange={(v) =>
            setL({
              ownerDogExperience:
                v === '' ? undefined : (v as 'first_dog' | 'some' | 'experienced' | 'professional'),
            })
          }
          options={[
            { value: '', label: '—' },
            { value: 'first_dog', label: 'First dog' },
            { value: 'some', label: 'Some experience' },
            { value: 'experienced', label: 'Experienced' },
            { value: 'professional', label: 'Professional' },
          ]}
        />
      </Field>
      <Field label="Climate (e.g. hot/dry, cold/snowy)">
        <input
          value={l.climate ?? ''}
          onChange={(e) => setL({ climate: e.target.value || undefined })}
        />
      </Field>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section D — current state
// ---------------------------------------------------------------------------

function SectionDCurrent({ state, set }: SectionProps) {
  const a = state.answers;
  const c = a.current ?? {};
  const setC = (patch: Partial<NonNullable<IntakeAnswers['current']>>) =>
    set({ ...state, answers: { ...a, current: { ...c, ...patch } } });
  return (
    <div className="stack">
      <Field label="What does your dog already know? (one cue per line, e.g. sit, down, stay)">
        <TextArea
          value={arrayToLines(c.knownSkills)}
          onChange={(v) => setC({ knownSkills: v ? linesToArray(v) : undefined })}
        />
      </Field>
      <Field label="Current problem behaviors (one per line, e.g. pulling, jumping, recall)">
        <TextArea
          value={arrayToLines(c.problemBehaviors)}
          onChange={(v) => setC({ problemBehaviors: v ? linesToArray(v) : undefined })}
        />
      </Field>
      <Field label="Current diet (food, schedule)">
        <TextArea value={c.currentDiet} onChange={(v) => setC({ currentDiet: v ?? undefined })} />
      </Field>
      <Field label="Current medications">
        <TextArea value={c.currentMeds} onChange={(v) => setC({ currentMeds: v ?? undefined })} />
      </Field>
      <Field label="Last vet visit">
        <input
          type="date"
          value={c.lastVetVisit ?? ''}
          onChange={(e) =>
            setC({ lastVetVisit: e.target.value === '' ? undefined : e.target.value })
          }
        />
      </Field>
      <Field label="Vaccination status">
        <Select
          value={c.vaccinationStatus ?? ''}
          onChange={(v) =>
            setC({
              vaccinationStatus:
                v === '' ? undefined : (v as 'up_to_date' | 'partial' | 'unknown' | 'none'),
            })
          }
          options={[
            { value: '', label: '—' },
            { value: 'up_to_date', label: 'Up to date' },
            { value: 'partial', label: 'Partial' },
            { value: 'unknown', label: 'Unknown' },
            { value: 'none', label: 'None' },
          ]}
        />
      </Field>
      <Field label="Grooming routine">
        <TextArea
          value={c.groomingRoutine}
          onChange={(v) => setC({ groomingRoutine: v ?? undefined })}
        />
      </Field>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section E — goals
// ---------------------------------------------------------------------------

type Sport = NonNullable<NonNullable<IntakeAnswers['goals']>['sportInterest']>[number];
const SPORT_OPTIONS: ReadonlyArray<{ value: Sport; label: string }> = [
  { value: 'nosework', label: 'Nosework / scent work' },
  { value: 'agility', label: 'Agility' },
  { value: 'rally', label: 'Rally obedience' },
  { value: 'dock_diving', label: 'Dock diving' },
  { value: 'herding', label: 'Herding instinct' },
  { value: 'tracking', label: 'Tracking' },
  {
    value: 'protection_igp',
    label: 'Protection / IGP (opt-in, professional supervision required)',
  },
  { value: 'canicross', label: 'Canicross / bikejor' },
  { value: 'other', label: 'Other' },
];

function SectionEGoals({ state, set }: SectionProps) {
  const a = state.answers;
  const g = a.goals ?? {};
  const setG = (patch: Partial<NonNullable<IntakeAnswers['goals']>>) =>
    set({ ...state, answers: { ...a, goals: { ...g, ...patch } } });
  const sports = new Set(g.sportInterest ?? []);
  return (
    <div className="stack">
      <Field label="What does ‘great’ look like to you? (a calm house dog? a hiking partner? a sport prospect?)">
        <TextArea value={g.summary} onChange={(v) => setG({ summary: v ?? undefined })} rows={4} />
      </Field>
      <Field label="Focus areas (one per line, e.g. ‘off-leash recall’, ‘calm settle’)">
        <TextArea
          value={arrayToLines(g.focusAreas)}
          onChange={(v) => setG({ focusAreas: v ? linesToArray(v) : undefined })}
        />
      </Field>
      <Field label="Sport interest (any apply)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {SPORT_OPTIONS.map((o) => (
            <label
              key={o.value}
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                textTransform: 'none',
                letterSpacing: 0,
                fontFamily: 'var(--font-body)',
                color: 'var(--cream)',
                fontSize: 14,
                marginBottom: 0,
              }}
            >
              <input
                type="checkbox"
                checked={sports.has(o.value)}
                onChange={(e) => {
                  const next = new Set(sports);
                  if (e.target.checked) next.add(o.value);
                  else next.delete(o.value);
                  setG({ sportInterest: next.size === 0 ? undefined : Array.from(next) });
                }}
              />
              {o.label}
            </label>
          ))}
        </div>
      </Field>
      <Field label="Time per day you can commit (minutes)">
        <NumberInput
          value={g.minutesPerDay}
          onChange={(v) => setG({ minutesPerDay: v ?? undefined })}
          min={0}
          max={600}
        />
      </Field>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The stepper
// ---------------------------------------------------------------------------

const STEPS = [
  { key: 'A', title: 'Identity', desc: 'Who is your dog?', Component: SectionAIdentity },
  {
    key: 'B',
    title: 'Origin & history',
    desc: 'What do you know about their past?',
    Component: SectionBHistory,
  },
  {
    key: 'C',
    title: 'Life situation',
    desc: 'Where and how do you live?',
    Component: SectionCLiving,
  },
  {
    key: 'D',
    title: 'Current state',
    desc: 'What do they already know — and not?',
    Component: SectionDCurrent,
  },
  { key: 'E', title: 'Goals', desc: 'Where do you want to get to?', Component: SectionEGoals },
] as const;

export function IntakeStepper({
  initial = MAL_DUTCH_DEFAULT,
  onSubmit,
  submitLabel = 'Build this dog’s plan',
}: {
  initial?: IntakeFormState;
  onSubmit: (input: SubmitIntakeInput & { profile: DogProfileInput }) => Promise<void> | void;
  submitLabel?: string;
}) {
  const [state, setState] = useState<IntakeFormState>(initial);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLast = step === STEPS.length - 1;
  const Step = STEPS[step]!;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ profile: state.profile, answers: state.answers });
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : 'Something went wrong submitting intake.');
      return;
    }
    setBusy(false);
  }

  return (
    <div className="stack">
      <div className="eyebrow">
        Step {step + 1} of {STEPS.length} · Section {Step.key}
      </div>
      <h2>{Step.title}</h2>
      <p className="muted" style={{ marginTop: -6 }}>
        {Step.desc}
      </p>
      <Step.Component state={state} set={setState} />
      {error && <div className="error">{error}</div>}
      <div style={{ display: 'flex', gap: 12 }}>
        {step > 0 && (
          <button
            className="ghost"
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={busy}
            style={{ flex: 1 }}
          >
            Back
          </button>
        )}
        {!isLast ? (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            disabled={busy || (step === 0 && state.profile.name.trim() === '')}
            style={{ flex: 2 }}
          >
            Next
          </button>
        ) : (
          <button type="button" onClick={submit} disabled={busy} style={{ flex: 2 }}>
            {busy ? 'Saving…' : submitLabel}
          </button>
        )}
      </div>
    </div>
  );
}
