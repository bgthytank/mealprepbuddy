import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, RotateCcw, Square } from 'lucide-react';
import './DiceOptions.css';

type Style = 'classic' | 'bounce' | 'pair';
type Phase = 'idle' | 'rolling' | 'settling' | 'done';
type Pose = { x: number; y: number; rx: number; ry: number; rz: number };

const options: {
  id: Style;
  title: string;
  description: string;
  detail: string;
}[] = [
  {
    id: 'classic',
    title: 'Classic tumble',
    description:
      'One ivory die turns through the air, then settles with a soft landing.',
    detail: 'Quiet · clean · familiar',
  },
  {
    id: 'bounce',
    title: 'Tabletop roll',
    description:
      'An amber die rolls across the surface, takes a few small bounces, and comes to rest.',
    detail: 'Tactile · warm · playful',
  },
  {
    id: 'pair',
    title: 'A lucky pair',
    description:
      'Two contrasting dice tumble together and settle one after the other in a shallow tray.',
    detail: 'Playful · a little more ceremony',
  },
];

// Opposite sides sum to seven, as on a physical six-sided die.
const faces = [
  { side: 'front', value: 1, pips: [5] },
  { side: 'back', value: 6, pips: [1, 3, 4, 6, 7, 9] },
  { side: 'right', value: 3, pips: [1, 5, 9] },
  { side: 'left', value: 4, pips: [1, 3, 7, 9] },
  { side: 'top', value: 2, pips: [1, 9] },
  { side: 'bottom', value: 5, pips: [1, 3, 5, 7, 9] },
];

const restPose = (i: number, pair: boolean): Pose => ({
  x: pair ? (i === 0 ? -58 : 58) : 0,
  y: 0,
  rx: -24,
  ry: i === 1 ? -122 : -32,
  rz: 0,
});

function DiceCard({
  option,
  index,
}: {
  option: (typeof options)[number];
  index: number;
}) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [reducedMotion, setReducedMotion] = useState(false);
  const group = useRef<HTMLButtonElement>(null);
  const poses = useRef<Pose[]>([
    restPose(0, option.id === 'pair'),
    restPose(1, true),
  ]);
  const starts = useRef<Pose[]>([]);
  const phaseRef = useRef<Phase>('idle');
  const pair = option.id === 'pair';

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const dice = group.current?.querySelectorAll<HTMLElement>('.study-die');
    const shadows =
      group.current?.querySelectorAll<HTMLElement>('.study-shadow');
    if (!dice) return;
    const paint = (values: Pose[]) =>
      values.forEach((pose, i) => {
        const die = dice[i];
        if (!die) return;
        die.style.transform = `translate3d(${pose.x}px, ${pose.y}px, 0) rotateX(${pose.rx}deg) rotateY(${pose.ry}deg) rotateZ(${pose.rz}deg)`;
        if (shadows?.[i]) {
          shadows[i].style.transform =
            `translateX(${pose.x}px) scale(${Math.max(0.55, 1 + pose.y / 180)})`;
          shadows[i].style.opacity = String(Math.max(0.1, 0.28 + pose.y / 350));
        }
      });
    if (phase === 'idle' || phase === 'done' || reducedMotion) {
      paint(Array.from({ length: pair ? 2 : 1 }, (_, i) => restPose(i, pair)));
      if (phase === 'settling') {
        const timer = window.setTimeout(() => {
          phaseRef.current = 'done';
          setPhase('done');
        }, 1600);
        return () => clearTimeout(timer);
      }
      return;
    }
    let frame = 0;
    const start = performance.now();
    const animate = (now: number) => {
      const t = (now - start) / 1000;
      const duration = pair ? 1.75 : 1.6;
      const progress = Math.min(t / duration, 1);
      const values = Array.from({ length: pair ? 2 : 1 }, (_, i) => {
        if (phase === 'rolling') {
          const offset = i * 1.7;
          return {
            x: pair
              ? (i === 0 ? -58 : 58) + Math.sin(t * 2.7 + offset) * 17
              : option.id === 'bounce'
                ? Math.sin(t * 2.3) * 62
                : 0,
            y:
              option.id === 'classic'
                ? -26 + Math.sin(t * 4) * 10
                : -Math.abs(Math.sin(t * (pair ? 5 : 6) + offset)) *
                  (pair ? 40 : 66),
            rx:
              -24 +
              t * (option.id === 'bounce' ? 640 : 330) * (i === 1 ? -1 : 1),
            ry: -32 + t * (pair ? 430 : 490),
            rz: Math.sin(t * 3 + offset) * (pair ? 16 : 9),
          };
        }
        // The pair finishes at 1.45s and 1.75s. Both stay within the 1–2s stop window.
        const p = Math.min(t / (pair ? (i === 0 ? 1.45 : 1.75) : 1.6), 1);
        const ease = 1 - Math.pow(1 - p, 3);
        const from = starts.current[i];
        const rest = restPose(i, pair);
        const rx = Math.ceil((from.rx - rest.rx) / 360) * 360 + 360 + rest.rx;
        const ry = Math.ceil((from.ry - rest.ry) / 360) * 360 + 360 + rest.ry;
        return {
          x: from.x + (rest.x - from.x) * ease,
          y:
            from.y * (1 - ease) -
            (option.id === 'classic'
              ? Math.sin(p * Math.PI) * 10
              : Math.abs(Math.sin(p * Math.PI * 3)) * 30 * (1 - p)),
          rx: from.rx + (rx - from.rx) * ease,
          ry: from.ry + (ry - from.ry) * ease,
          rz: from.rz * (1 - ease),
        };
      });
      poses.current = values;
      paint(values);
      if (phase === 'settling' && progress === 1) {
        phaseRef.current = 'done';
        setPhase('done');
        return;
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [phase, pair, option.id, reducedMotion]);

  function action() {
    if (phaseRef.current === 'settling') return;
    if (phaseRef.current === 'rolling') {
      starts.current = poses.current.map((p) => ({ ...p }));
      phaseRef.current = 'settling';
      setPhase('settling');
    } else {
      phaseRef.current = 'rolling';
      setPhase('rolling');
    }
  }

  const actionLabel =
    phase === 'rolling'
      ? 'Stop dice'
      : phase === 'settling'
        ? 'Settling…'
        : phase === 'done'
          ? 'Roll again'
          : 'Try this roll';
  return (
    <article
      className={`dice-study-card study-${option.id}`}
      data-option={option.id}
    >
      <div className="study-card-heading">
        <span className="study-number">0{index + 1}</span>
        {index === 0 && <span className="study-recommendation">Selected</span>}
      </div>
      <button
        ref={group}
        className={`study-scene phase-${phase}`}
        onClick={action}
        disabled={phase === 'settling'}
        aria-label={`${option.title}: ${phase === 'rolling' ? 'stop dice' : phase === 'settling' ? 'dice settling' : 'roll dice'}`}
      >
        {pair && <span className="study-tray" />}
        {Array.from({ length: pair ? 2 : 1 }, (_, i) => (
          <span
            key={i}
            className={`study-die-set die-set-${i}`}
            aria-hidden="true"
          >
            <span className="study-shadow" />
            <span className="study-die">
              {faces.map((face) => (
                <span
                  key={face.side}
                  className={`study-face face-${face.side}`}
                  data-face={face.value}
                >
                  {Array.from({ length: 9 }, (_, cell) => (
                    <i
                      key={cell}
                      className={
                        face.pips.includes(cell + 1) ? 'pip is-pip' : 'pip'
                      }
                    />
                  ))}
                </span>
              ))}
            </span>
          </span>
        ))}
        <span className="study-scene-hint">
          {phase === 'rolling'
            ? 'Click the dice to stop'
            : phase === 'settling'
              ? 'Finding your five…'
              : phase === 'done'
                ? 'Ready to reveal five lunches'
                : 'Six sides. Familiar dots.'}
        </span>
      </button>
      <div className="study-card-copy">
        <h2>{option.title}</h2>
        <p>{option.description}</p>
        <span className="study-detail">{option.detail}</span>
        <button
          className={`study-action ${phase === 'rolling' ? 'action-stop' : ''}`}
          onClick={action}
          disabled={phase === 'settling'}
        >
          {phase === 'rolling' ? <Square size={14} /> : <RotateCcw size={16} />}
          {actionLabel}
        </button>
        <span className="study-status" role="status" aria-live="polite">
          {phase === 'done'
            ? 'Roll complete. Preview only; your calendar is unchanged.'
            : reducedMotion
              ? 'Reduced motion is on.'
              : '\u00a0'}
        </span>
      </div>
    </article>
  );
}

export function DiceOptions() {
  return (
    <main className="dice-studies">
      <header className="study-nav">
        <a href="/">
          <ArrowLeft size={16} />
          Back to planner
        </a>
        <span>
          MEALPREP <b>BUDDY</b>
        </span>
        <span className="study-preview-label">Animation preview</span>
      </header>
      <div className="study-content">
        <div className="study-intro">
          <p className="study-eyebrow">
            A LITTLE LUNCH LUCK / THREE DIRECTIONS
          </p>
          <h1>A better roll.</h1>
          <p>Real dice. Three ways to bring them to life.</p>
          <p className="study-instructions">
            Try a roll, then click the dice to stop. Recipe names will appear
            after the chosen animation in the planner.
          </p>
        </div>
        <div className="study-options">
          {options.map((option, index) => (
            <DiceCard key={option.id} option={option} index={index} />
          ))}
        </div>
        <footer className="study-footer">
          <span>
            Previews only. Your recipes and calendar stay unchanged.
          </span>
          <a href="/">
            Return to your weekly plan
            <ArrowUpRight size={14} />
          </a>
        </footer>
      </div>
    </main>
  );
}
