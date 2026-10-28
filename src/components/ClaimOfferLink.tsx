"use client";

import { openInquiry } from "./inquiry";
import { burstLogos } from "./logoBurst";
import { track } from "./track";

// "Claim the offer" link: sprinkles the logo and opens the inquiry form.
export function ClaimOfferLink({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <a
      href="#visit"
      className={className}
      onClick={(e) => {
        e.preventDefault();
        track("claim");
        burstLogos();
        openInquiry();
      }}
    >
      {children}
    </a>
  );
}
