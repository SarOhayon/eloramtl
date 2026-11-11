// Sprinkles copies of the ELORA MTL logo over the screen (used when a visitor claims the offer):
// they drift down from the top and fall past the bottom, about 5 seconds in all.
const COLORS = ["#503d32", "#a8875a", "#7d6b5d", "#c9a978"];

export function burstLogos(count = 44) {
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

  // Each logo drifts down from above the screen, swaying gently.
  for (let i = 0; i < count; i++) {
    const el = piece(i, rand(0, w), -160);
    const sway = rand(30, 90) * (Math.random() < 0.5 ? -1 : 1);
    const spin = rand(-1, 1) * 300;
    const delay = rand(0, 1000);
    const duration = rand(3600, 4000);
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
