import { useEffect, useRef } from 'react';
import './ClassicDice.css';

type Pose = { y: number; rx: number; ry: number; rz: number };
const rest: Pose = { y: 0, rx: -24, ry: -32, rz: 0 };
const faces = [
  { side: 'front', value: 1, pips: [5] },
  { side: 'back', value: 6, pips: [1, 3, 4, 6, 7, 9] },
  { side: 'right', value: 3, pips: [1, 5, 9] },
  { side: 'left', value: 4, pips: [1, 3, 7, 9] },
  { side: 'top', value: 2, pips: [1, 9] },
  { side: 'bottom', value: 5, pips: [1, 3, 5, 7, 9] },
];

export function ClassicDice({
  phase,
  onStop,
}: {
  phase: 'spinning' | 'settling';
  onStop: () => void;
}) {
  const die = useRef<HTMLSpanElement>(null);
  const shadow = useRef<HTMLSpanElement>(null);
  const pose = useRef<Pose>(rest);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const paint = (next: Pose) => {
      pose.current = next;
      if (die.current)
        die.current.style.transform = `translateY(${next.y}px) rotateX(${next.rx}deg) rotateY(${next.ry}deg) rotateZ(${next.rz}deg)`;
      if (shadow.current) {
        shadow.current.style.transform = `scale(${Math.max(0.55, 1 + next.y / 180)})`;
        shadow.current.style.opacity = String(
          Math.max(0.1, 0.28 + next.y / 350),
        );
      }
    };
    const start = performance.now();
    const from = { ...pose.current };
    const targetX = Math.ceil((from.rx - rest.rx) / 360) * 360 + 360 + rest.rx;
    const targetY = Math.ceil((from.ry - rest.ry) / 360) * 360 + 360 + rest.ry;
    const animate = (now: number) => {
      if (media.matches) {
        paint(rest);
        return;
      }
      const t = (now - start) / 1000;
      if (phase === 'spinning') {
        paint({
          y: -26 + Math.sin(t * 4) * 10,
          rx: -24 + t * 330,
          ry: -32 + t * 490,
          rz: Math.sin(t * 3) * 9,
        });
      } else {
        const p = Math.min(t / 1.6, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        paint({
          y: from.y * (1 - ease) - Math.sin(p * Math.PI) * 10,
          rx: from.rx + (targetX - from.rx) * ease,
          ry: from.ry + (targetY - from.ry) * ease,
          rz: from.rz * (1 - ease),
        });
        if (p === 1) return;
      }
      frame = requestAnimationFrame(animate);
    };
    const restart = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(animate);
    };
    restart();
    media.addEventListener('change', restart);
    return () => {
      cancelAnimationFrame(frame);
      media.removeEventListener('change', restart);
    };
  }, [phase]);

  return (
    <button
      type="button"
      className="classic-dice-control"
      onClick={onStop}
      disabled={phase === 'settling'}
      aria-label={phase === 'settling' ? 'Dice slowing down' : 'Stop dice'}
    >
      <span className="classic-dice-position" aria-hidden="true">
        <span ref={shadow} className="classic-dice-shadow" />
        <span ref={die} className="classic-dice-cube">
          {faces.map((face) => (
            <span
              key={face.side}
              className={`classic-dice-face classic-face-${face.side}`}
              data-face={face.value}
            >
              {Array.from({ length: 9 }, (_, i) => (
                <i
                  key={i}
                  className={
                    face.pips.includes(i + 1)
                      ? 'classic-pip is-pip'
                      : 'classic-pip'
                  }
                />
              ))}
            </span>
          ))}
        </span>
      </span>
    </button>
  );
}
