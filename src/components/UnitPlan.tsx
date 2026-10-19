import type { UnitType } from "@/data/building";
import type { Dictionary } from "@/i18n/dictionaries";

type RoomKind = "living" | "kitchen" | "bed" | "bath" | "den" | "entry" | "laundry";
type Room = { kind: RoomKind; x: number; y: number; w: number; h: number };

// Illustrative layouts per suite type, used until the rendered plans arrive.
const LAYOUTS: Record<UnitType, { width: number; rooms: Room[] }> = {
  studio: {
    width: 300,
    rooms: [
      { kind: "bath", x: 0, y: 0, w: 90, h: 85 },
      { kind: "laundry", x: 0, y: 85, w: 90, h: 45 },
      { kind: "entry", x: 0, y: 130, w: 90, h: 100 },
      { kind: "kitchen", x: 90, y: 0, w: 210, h: 80 },
      { kind: "living", x: 90, y: 80, w: 210, h: 150 },
    ],
  },
  "1br": {
    width: 320,
    rooms: [
      { kind: "bed", x: 0, y: 0, w: 130, h: 130 },
      { kind: "bath", x: 0, y: 130, w: 80, h: 100 },
      { kind: "laundry", x: 80, y: 130, w: 50, h: 45 },
      { kind: "entry", x: 80, y: 175, w: 50, h: 55 },
      { kind: "kitchen", x: 130, y: 0, w: 190, h: 85 },
      { kind: "living", x: 130, y: 85, w: 190, h: 145 },
    ],
  },
  "1br-den": {
    width: 330,
    rooms: [
      { kind: "bed", x: 0, y: 0, w: 125, h: 125 },
      { kind: "den", x: 0, y: 125, w: 125, h: 105 },
      { kind: "bath", x: 125, y: 0, w: 80, h: 90 },
      { kind: "laundry", x: 125, y: 90, w: 80, h: 50 },
      { kind: "entry", x: 125, y: 140, w: 80, h: 90 },
      { kind: "kitchen", x: 205, y: 0, w: 125, h: 100 },
      { kind: "living", x: 205, y: 100, w: 125, h: 130 },
    ],
  },
  "2br": {
    width: 340,
    rooms: [
      { kind: "bed", x: 0, y: 0, w: 120, h: 115 },
      { kind: "bed", x: 0, y: 115, w: 120, h: 115 },
      { kind: "bath", x: 120, y: 0, w: 80, h: 75 },
      { kind: "bath", x: 120, y: 75, w: 80, h: 70 },
      { kind: "laundry", x: 120, y: 145, w: 80, h: 40 },
      { kind: "entry", x: 120, y: 185, w: 80, h: 45 },
      { kind: "kitchen", x: 200, y: 0, w: 140, h: 95 },
      { kind: "living", x: 200, y: 95, w: 140, h: 135 },
    ],
  },
  "3br": {
    width: 420,
    rooms: [
      { kind: "bed", x: 0, y: 0, w: 115, h: 115 },
      { kind: "bed", x: 0, y: 115, w: 115, h: 115 },
      { kind: "bath", x: 115, y: 0, w: 80, h: 75 },
      { kind: "bath", x: 115, y: 75, w: 80, h: 70 },
      { kind: "laundry", x: 115, y: 145, w: 80, h: 40 },
      { kind: "entry", x: 115, y: 185, w: 80, h: 45 },
      { kind: "kitchen", x: 195, y: 0, w: 125, h: 95 },
      { kind: "living", x: 195, y: 95, w: 125, h: 135 },
      { kind: "bed", x: 320, y: 0, w: 100, h: 230 },
    ],
  },
};

const FILL: Record<RoomKind, string> = {
  living: "#faf8f5",
  kitchen: "#f2eee8",
  bed: "#f4f1ec",
  bath: "#f3f0ec",
  den: "#f2eee8",
  entry: "#f0ece6",
  laundry: "#f3f0ec",
};

function Furniture({ r }: { r: Room }) {
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const s = { fill: "none", stroke: "#a39383", strokeWidth: 1.2 };
  switch (r.kind) {
    case "bed": {
      const bw = Math.min(64, r.w - 30);
      const bh = Math.min(78, r.h - 30);
      return (
        <g {...s}>
          <rect x={cx - bw / 2} y={cy - bh / 2 + 6} width={bw} height={bh} rx={3} />
          <rect x={cx - bw / 2 + 5} y={cy - bh / 2 + 10} width={bw / 2 - 7} height={12} rx={3} />
          <rect x={cx + 2} y={cy - bh / 2 + 10} width={bw / 2 - 7} height={12} rx={3} />
        </g>
      );
    }
    case "kitchen":
      return (
        <g {...s}>
          <rect x={r.x + 6} y={r.y + 6} width={r.w - 12} height={16} />
          <rect x={cx - 32} y={r.y + r.h - 34} width={64} height={18} rx={2} />
        </g>
      );
    case "living":
      return (
        <g {...s}>
          <rect x={cx - 40} y={r.y + r.h - 40} width={80} height={24} rx={6} />
          <rect x={cx - 18} y={r.y + r.h - 74} width={36} height={22} rx={11} />
        </g>
      );
    case "bath":
      return (
        <g {...s}>
          <rect x={r.x + 6} y={r.y + 6} width={r.w - 12} height={26} rx={6} />
          <circle cx={r.x + r.w - 18} cy={r.y + r.h - 18} r={8} />
        </g>
      );
    case "den":
      return <rect {...s} x={cx - 28} y={r.y + 10} width={56} height={22} rx={2} />;
    default:
      return null;
  }
}

export function UnitPlan({ type, t }: { type: UnitType; t: Dictionary }) {
  const layout = LAYOUTS[type];
  const W = layout.width;
  const H = 230;
  const pad = 10;
  return (
    <svg
      viewBox={`${-pad} ${-pad} ${W + pad * 2} ${H + 36 + pad * 2}`}
      className="h-auto w-full"
      role="img"
      aria-label={t.types[type]}
    >
      {/* balcony */}
      <rect x={W * 0.45} y={H} width={W * 0.55} height={32} fill="#f3f0ec" stroke="#503d32" strokeWidth={1.4} strokeDasharray="4 3" />
      <text x={W * 0.725} y={H + 21} textAnchor="middle" className="fill-action-deep" fontSize={10} letterSpacing={1}>
        {t.explorer.rooms.balcony.toUpperCase()}
      </text>

      {layout.rooms.map((r, i) => (
        <g key={i}>
          <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={FILL[r.kind]} stroke="#503d32" strokeWidth={1.6} />
          <Furniture r={r} />
          <text
            x={r.x + r.w / 2}
            y={r.kind === "kitchen" ? r.y + r.h / 2 + 2 : r.kind === "bath" ? r.y + r.h / 2 + 8 : r.y + 18}
            textAnchor="middle"
            fontSize={r.w < 60 ? 8.5 : 10}
            letterSpacing={0.8}
            className="fill-brown"
          >
            {t.explorer.rooms[r.kind].toUpperCase()}
          </text>
        </g>
      ))}

      {/* outer wall */}
      <rect x={0} y={0} width={W} height={H} fill="none" stroke="#3a2c24" strokeWidth={5} />
      {/* windows along the balcony side */}
      <line x1={W * 0.5} y1={H} x2={W * 0.95} y2={H} stroke="#faf8f5" strokeWidth={3} />
      <line x1={W * 0.5} y1={H} x2={W * 0.95} y2={H} stroke="#503d32" strokeWidth={1} />
    </svg>
  );
}
