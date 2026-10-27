// Thin line icons for the admin, drawn in the current text colour.
type P = { className?: string };

function Icon({ className = "size-5", children }: P & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const TagIcon = (p: P) => (
  <Icon {...p}>
    <path d="M3.5 12.6V4.5a1 1 0 0 1 1-1h8.1a1 1 0 0 1 .7.3l7.2 7.2a1 1 0 0 1 0 1.4l-8.1 8.1a1 1 0 0 1-1.4 0l-7.2-7.2a1 1 0 0 1-.3-.7Z" />
    <circle cx="8.2" cy="8.2" r="1.4" />
  </Icon>
);
export const BuildingIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4.5 20.5v-15a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v15M14.5 10.5h4a1 1 0 0 1 1 1v9M3 20.5h18" />
    <path d="M8 8h3M8 11.5h3M8 15h3M17 14h0M17 17h0" />
  </Icon>
);
export const ImageIcon = (p: P) => (
  <Icon {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="m4 17.5 4.6-4.4a1 1 0 0 1 1.4 0l2.5 2.4M11.5 14.5l2.6-2.5a1 1 0 0 1 1.4 0l5 4.8" />
  </Icon>
);
export const PriceIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M14.6 9.2c-.4-.9-1.4-1.5-2.6-1.5-1.5 0-2.6.8-2.6 2s1 1.7 2.6 2.1 2.7.9 2.7 2.2-1.2 2-2.7 2c-1.3 0-2.4-.6-2.8-1.6M12 6.3v1.4M12 16.3v1.4" />
  </Icon>
);
export const TextIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4.5 6.5v-2h15v2M12 4.5v15M9 19.5h6" />
  </Icon>
);
export const UploadIcon = (p: P) => (
  <Icon {...p}>
    <path d="M12 15.5v-11M7.5 9 12 4.5 16.5 9M4.5 15v3.5a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1V15" />
  </Icon>
);
export const PlusIcon = (p: P) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);
export const CheckIcon = (p: P) => (
  <Icon {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icon>
);
export const AlertIcon = (p: P) => (
  <Icon {...p}>
    <path d="M12 4 3.5 19h17L12 4ZM12 10v4M12 16.8v.2" />
  </Icon>
);
export const CloseIcon = (p: P) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
);
export const ArrowLeftIcon = (p: P) => (
  <Icon {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Icon>
);
export const ExternalIcon = (p: P) => (
  <Icon {...p}>
    <path d="M13.5 4.5h6v6M19.5 4.5l-8 8M17.5 13.5v5a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1h5" />
  </Icon>
);

export const MegaphoneIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4.5 10v4a1 1 0 0 0 1 1h2l7.5 4V5L7.5 9h-2a1 1 0 0 0-1 1ZM7.5 15l1.2 4.2a1 1 0 0 0 1 .8h.9M18 9.5a3.5 3.5 0 0 1 0 5" />
  </Icon>
);
export const InboxIcon = (p: P) => (
  <Icon {...p}>
    <path d="M3.5 13.5 6 5.2a1 1 0 0 1 1-.7h10a1 1 0 0 1 1 .7l2.5 8.3v5a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-5Z" />
    <path d="M3.5 13.5h4.5l1.5 2.5h5l1.5-2.5h4.5" />
  </Icon>
);
export const CalendarIcon = (p: P) => (
  <Icon {...p}>
    <rect x="3.5" y="5" width="17" height="15" rx="1.5" />
    <path d="M3.5 9.5h17M8 3v4M16 3v4M8 13h2M14 13h2M8 16.5h2" />
  </Icon>
);
export const ChartIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4 20h16M7 16.5v-5M12 16.5v-9M17 16.5v-6.5" />
  </Icon>
);
export const TableIcon = (p: P) => (
  <Icon {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
    <path d="M3.5 9.5h17M3.5 14.5h17M9.5 9.5v10" />
  </Icon>
);

export const TrashIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4.5 6.5h15M9.5 6.5V4.8a.8.8 0 0 1 .8-.8h3.4a.8.8 0 0 1 .8.8v1.7M6.5 6.5l.8 12.1a1 1 0 0 0 1 .9h7.4a1 1 0 0 0 1-.9l.8-12.1M10 10.5v5.5M14 10.5v5.5" />
  </Icon>
);

export const SparkleIcon = (p: P) => (
  <Icon {...p}>
    <path d="M12 3.5 13.8 9a1 1 0 0 0 .7.7l5.5 1.8-5.5 1.8a1 1 0 0 0-.7.7L12 19.5 10.2 14a1 1 0 0 0-.7-.7L4 11.5l5.5-1.8a1 1 0 0 0 .7-.7L12 3.5ZM19 3v3M17.5 4.5h3" />
  </Icon>
);

export const MailIcon = (p: P) => (
  <Icon {...p}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="1.5" />
    <path d="m4 7 8 6 8-6" />
  </Icon>
);

// A round, gold-ringed badge for an icon (home tiles and screen titles).
export function IconBadge({ children, className = "size-14" }: { children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex shrink-0 items-center justify-center rounded-full bg-cream-deep text-brown ring-1 ring-gold/50 ${className}`}>{children}</span>;
}
