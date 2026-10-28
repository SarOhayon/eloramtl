// Small brown paw prints that walk across their box and fade away, on a loop.
const STEPS = 7;

function Paw({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="currentColor" aria-hidden="true">
      <ellipse cx="12" cy="16" rx="5.2" ry="4.4" />
      <ellipse cx="5.6" cy="10.2" rx="2.1" ry="2.7" transform="rotate(-20 5.6 10.2)" />
      <ellipse cx="9.6" cy="6.4" rx="2.2" ry="2.8" transform="rotate(-6 9.6 6.4)" />
      <ellipse cx="14.4" cy="6.4" rx="2.2" ry="2.8" transform="rotate(6 14.4 6.4)" />
      <ellipse cx="18.4" cy="10.2" rx="2.1" ry="2.7" transform="rotate(20 18.4 10.2)" />
    </svg>
  );
}

export function PawTrail() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 w-[62%]" aria-hidden="true">
      {Array.from({ length: STEPS }, (_, i) => (
        <Paw
          key={i}
          className="paw-step absolute size-5 text-brown"
          style={{
            left: `${4 + i * 13}%`,
            top: i % 2 ? "56%" : "24%",
            transform: "rotate(90deg)",
            animationDelay: `${i * 0.45}s`,
          }}
        />
      ))}
    </div>
  );
}
