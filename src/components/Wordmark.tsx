// Stand-in for the Elora logo, drawn after the wordmark on eloramtl.com.
// Replace with the official SVG when it is supplied.
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 246 52" className={className} role="img" aria-label="Elora">
      <g fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="butt">
        <path d="M2 3h24M2 26h18M2 49h24" />
        <path d="M52 2v47h22" />
        <path d="M100.4 13.5A24 24 0 1 1 98 40" />
        <path d="M152 3h18a11.5 11.5 0 0 1 0 23h-14l22 23" />
        <path d="M200 50l20-47 20 47" />
      </g>
    </svg>
  );
}
