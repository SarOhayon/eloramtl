// Sprinkles copies of the ELORA MTL logo over the screen (used when a visitor claims the offer):
// a few burst up from the centre, the rest rain down from the top, all falling past the bottom.
const COLORS = ["#503d32", "#a8875a", "#7d6b5d", "#c9a978"];

export function burstLogos({ burst = 16, rain = 32 } = {}) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  // Reuse the logo already on the page (header) so there's a single copy of the artwork.
  const logo = document.querySelector<SVGSVGElement>('svg[aria-label="Elora MTL"]');
  if (!logo) return;

  const layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:70;overflow:hidden";
  document.body.appendChild(layer);

  const { innerWidth: w, innerHeight: h } = window;
  const rand = (min: number, max: number) => min + Math.random() * (max - min);
  let last = 0;

  const piece = (i: number, left: number, top: number) => {
    const el = logo.cloneNode(true) as SVGSVGElement;
    el.removeAttribute("class");
    el.removeAttribute("role");
    el.removeAttribute("aria-label");
    const size = rand(80, 200);
    el.style.cssText = `position:absolute;left:${left - size / 2}px;top:${top}px;width:${size}px;height:auto;color:${COLORS[i % COLORS.length]};stroke:currentColor;stroke-width:1.2`;
    layer.appendChild(el);
    return el;
  };

  // Burst: pop up and out from the centre, then fall slowly off the bottom.
  for (let i = 0; i < burst; i++) {
    const el = piece(i, w / 2, h * 0.45);
    const dx = rand(-0.45, 0.45) * w;
    const up = -rand(0.1, 0.35) * h;
    const spin = rand(-1, 1) * 360;
    const duration = rand(3800, 5200);
    last = Math.max(last, duration);
    el.animate(
      [
        { transform: "translate(0,0) scale(0.2) rotate(0deg)", opacity: 0, easing: "cubic-bezier(.2,.8,.4,1)" },
        { transform: `translate(${dx * 0.6}px,${up}px) scale(1) rotate(${spin * 0.3}deg)`, opacity: 1, offset: 0.22, easing: "cubic-bezier(.45,0,.8,.6)" },
        { transform: `translate(${dx}px,${h * 0.75}px) scale(0.95) rotate(${spin}deg)`, opacity: 1, offset: 0.85 },
        { transform: `translate(${dx * 1.05}px,${h * 0.95}px) scale(0.9) rotate(${spin * 1.1}deg)`, opacity: 0 },
      ],
      { duration, fill: "forwards" },
    );
  }

  // Rain: drift down from above the screen, swaying gently.
  for (let i = 0; i < rain; i++) {
    const el = piece(i + 1, rand(0, w), -160);
    const sway = rand(30, 90) * (Math.random() < 0.5 ? -1 : 1);
    const spin = rand(-1, 1) * 300;
    const delay = rand(0, 1600);
    const duration = rand(3800, 5600);
    last = Math.max(last, delay + duration);
    el.animate(
      [
        { transform: "translate(0,0) rotate(0deg)", opacity: 0 },
        { transform: `translate(${sway}px,${h * 0.3}px) rotate(${spin * 0.3}deg)`, opacity: 1, offset: 0.15 },
        { transform: `translate(${-sway}px,${h * 0.7}px) rotate(${spin * 0.7}deg)`, opacity: 1, offset: 0.6 },
        { transform: `translate(${sway * 0.5}px,${h + 200}px) rotate(${spin}deg)`, opacity: 0.6 },
      ],
      { duration, delay, easing: "cubic-bezier(.35,0,.65,1)", fill: "both" },
    );
  }

  window.setTimeout(() => layer.remove(), last + 150);
}
