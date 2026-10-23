import { useEffect, useRef, useState } from 'react';
import {
  Dices,
  Sparkles,
  RotateCcw,
  Check,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { Modal } from './ui/Modal';
import { ClassicDice } from './ClassicDice';
import type { Recipe } from '../types';

export type DrawMode = 'powerball' | 'dice';
const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Fisher–Yates: sample without replacement, with equal probability for each order.
export function pickLunches(recipes: Recipe[]): Recipe[] {
  const shuffled = [...recipes];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 5);
}

export function LuckyLunch({
  recipes,
  mode,
  weekLabel,
  replacing,
  onClose,
  onConfirm,
}: {
  recipes: Recipe[];
  mode: DrawMode;
  weekLabel: string;
  replacing: boolean;
  onClose: () => void;
  onConfirm: (ids: string[]) => Promise<void>;
}) {
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<'spinning' | 'settling' | 'result'>(
    'spinning',
  );
  const [picks, setPicks] = useState(() => pickLunches(recipes));
  const [revealed, setRevealed] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const stopRequested = useRef(false);
  useEffect(() => {
    if (mode !== 'powerball' || phase !== 'spinning') return;
    const timer = window.setInterval(
      () => setRevealed((n) => Math.min(n + 1, 5)),
      650,
    );
    const finish = window.setTimeout(() => setPhase('result'), 3900);
    return () => {
      clearInterval(timer);
      clearTimeout(finish);
    };
  }, [mode, phase, round]);

  useEffect(() => {
    if (phase !== 'settling') return;
    const timer = window.setTimeout(() => setPhase('result'), 1800);
    return () => clearTimeout(timer);
  }, [phase]);

  function stopDice() {
    if (phase !== 'spinning' || stopRequested.current) return;
    stopRequested.current = true;
    setPicks(pickLunches(recipes));
    setPhase('settling');
  }

  function redraw() {
    setPicks(pickLunches(recipes));
    setRevealed(0);
    stopRequested.current = false;
    setError('');
    setPhase('spinning');
    setRound((n) => n + 1);
  }

  async function confirm() {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      await onConfirm(picks.map((r) => r.recipe_id));
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not save lunches. Try again.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={() => {
        if (!saving) onClose();
      }}
      title="A little lunch luck"
      size="lg"
    >
      <div className="lucky-lunch">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Ran’s school lunch
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {weekLabel} · Five days. Five different recipes.
            </p>
          </div>
          <span className="lucky-badge">
            {mode === 'dice' ? <Dices size={14} /> : <Sparkles size={14} />}
            {mode === 'dice' ? 'Dice' : 'Powerball'}
          </span>
        </div>
        {phase !== 'result' && mode === 'powerball' && (
          <div
            className="powerball-stage"
            aria-label="Powerball draw in progress"
          >
            <div className="lottery-machine">
              <div className="lottery-shine" />
              {recipes.map((r, i) =>
                picks
                  .slice(0, revealed)
                  .some((pick) => pick.recipe_id === r.recipe_id) ? null : (
                  <div
                    key={r.recipe_id}
                    className="lottery-orbit"
                    style={
                      {
                        '--i': i,
                        '--delay': `${-i * 0.31}s`,
                        '--duration': `${1.6 + (i % 5) * 0.23}s`,
                      } as React.CSSProperties
                    }
                  >
                    <span className="lottery-ball" title={r.title}>
                      <b>{String(i + 1).padStart(2, '0')}</b>
                      <small>{r.title}</small>
                    </span>
                  </div>
                ),
              )}
            </div>
            <div className="lottery-base" />
            <p className="text-sm font-bold mt-4">Mixing up the menu…</p>
            <div className="lottery-tray">
              {picks.map((r, i) => (
                <div
                  key={i}
                  className={`draw-slot ${i < revealed ? 'is-revealed' : ''}`}
                >
                  <span>
                    {i < revealed
                      ? String(recipes.indexOf(r) + 1).padStart(2, '0')
                      : '·'}
                  </span>
                  <small>
                    {i < revealed ? r.title : weekdays[i].slice(0, 3)}
                  </small>
                </div>
              ))}
            </div>
          </div>
        )}
        {phase !== 'result' && mode === 'dice' && (
          <div className="dice-stage">
            <ClassicDice phase={phase} onStop={stopDice} />
            <p className="text-sm font-bold">
              {phase === 'settling'
                ? 'Finding your five…'
                : 'Click the dice to stop'}{' '}
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Classic tumble · Five unique lunches from all tagged recipes
            </p>
          </div>
        )}
        {phase === 'result' && (
          <div className="lucky-results">
            <div className="flex items-center gap-3 mb-5">
              <span className="p-2 bg-amber-100 rounded-xl">
                <Sparkles size={20} />
              </span>
              <div>
                <h4 className="font-black text-xl tracking-tight">
                  Lunch, sorted.
                </h4>
                <p className="text-xs text-slate-500">
                  Here’s your Monday–Friday line-up.
                </p>
              </div>
            </div>
            <ol className="space-y-2" aria-label="Selected school lunches">
              {picks.map((r, i) => (
                <li
                  key={r.recipe_id}
                  className="lunch-result"
                  style={{ animationDelay: `${i * 65}ms` }}
                >
                  <span className="text-xs font-bold text-slate-400 w-20 shrink-0">
                    {weekdays[i]}
                  </span>
                  <strong className="text-sm flex-1">{r.title}</strong>
                  <Check size={16} className="text-slate-400 shrink-0" />
                </li>
              ))}
            </ol>
            <p className="text-xs text-slate-500 mt-4">
              {replacing
                ? 'Confirm replaces the five school lunches for this week. Dinner stays as planned.'
                : 'Confirm adds these lunches to this week’s school lunch row.'}
            </p>
            {error && (
              <p role="alert" className="text-sm text-red-600 mt-3">
                {error}
              </p>
            )}
            <div className="flex gap-3 mt-6">
              <button
                disabled={saving}
                onClick={redraw}
                className="lucky-secondary flex-1"
              >
                <RotateCcw size={16} />
                Do it again
              </button>
              <button
                disabled={saving}
                onClick={confirm}
                className="lucky-primary flex-1"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ArrowRight size={16} />
                )}{' '}
                {saving ? 'Saving…' : 'Confirm'}
              </button>
            </div>
          </div>
        )}
        <p
          className="text-[11px] text-slate-400 mt-5 text-center"
          role="status"
          aria-live="polite"
        >
          {phase === 'result'
            ? 'Five recipes selected. Review before confirming.'
            : phase === 'settling'
              ? 'Dice slowing down. Results in a moment.'
              : `${recipes.length} eligible recipes · No repeats in a week`}
        </p>
      </div>
    </Modal>
  );
}
