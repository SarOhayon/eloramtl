"use client";

import { burstLogos } from "./logoBurst";

// "Claim the offer" link: sprinkles the logo and glides to the contact form.
export function ClaimOfferLink({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <a
      href="#visit"
      className={className}
      onClick={(e) => {
        e.preventDefault();
        burstLogos();
        document.getElementById("visit")?.scrollIntoView({ behavior: "smooth" });
      }}
    >
      {children}
    </a>
  );
}
