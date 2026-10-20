// Bursts copies of the ELORA MTL logo across the screen (used when a visitor claims the offer).
const COLORS = ["#503d32", "#a8875a", "#7d6b5d", "#c9a978"];

export function burstLogos(count = 40) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  // Reuse the logo already on the page (header) so there's a single copy of the artwork.
  const logo = document.querySelector<SVGSVGElement>('svg[aria-label="Elora MTL"]');
  if (!logo) return;

  const layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:70;overflow:hidden";
  document.body.appendChild(layer);

  const { innerWidth: w, innerHeight: h } = window;
  let longest = 0;
  for (let i = 0; i < count; i++) {
    const piece = logo.cloneNode(true) as SVGSVGElement;
    piece.removeAttribute("class");
    piece.removeAttribute("role");
    piece.removeAttribute("aria-label");
    const size = 80 + Math.random() * 130;
    piece.style.cssText = `position:absolute;left:${w / 2 - size / 2}px;top:${h * 0.45}px;width:${size}px;height:auto;color:${COLORS[i % COLORS.length]};stroke:currentColor;stroke-width:1.2`;
    layer.appendChild(piece);

    // Fly out from the centre, then drift down while spinning and fading.
    const angle = Math.random() * Math.PI * 2;
    const reach = 0.35 + Math.random() * 0.45;
    const dx = Math.cos(angle) * w * reach;
    const dy = Math.sin(angle) * h * reach * 0.8;
    const spin = (Math.random() - 0.5) * 540;
    const duration = 1700 + Math.random() * 1100;
    longest = Math.max(longest, duration);
    piece.animate(
      [
        { transform: "translate(0,0) scale(0.2) rotate(0deg)", opacity: 0 },
        { transform: `translate(${dx * 0.7}px,${dy * 0.7}px) scale(1) rotate(${spin * 0.5}deg)`, opacity: 1, offset: 0.35 },
        { transform: `translate(${dx}px,${dy + h * 0.35}px) scale(0.9) rotate(${spin}deg)`, opacity: 0 },
      ],
      { duration, easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" },
    );
  }
  window.setTimeout(() => layer.remove(), longest + 100);
}
