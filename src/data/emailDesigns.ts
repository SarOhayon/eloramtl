import type { Bilingual } from "./content";

// The designed (HTML) emails. Email apps only understand simple tables and inline styles, so they're
// written the old-fashioned way. Words in braces ({name}, {date}…) are filled in when an email is
// sent, and {#promotion}…{/promotion} parts only appear when there's something to put in them.
// The admin can replace any of these with their own HTML.

const MAP = "https://www.google.com/maps/search/?api=1&query=2855+chemin+Bates%2C+Montr%C3%A9al%2C+QC+H3S+0A6";
const font = "font-family:Georgia,'Times New Roman',serif";
const p = (text: string, extra = "") => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#503d32;${extra}">${text}</p>`;
export const button = (href: string, label: string) =>
  `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 24px;"><tr><td style="background-color:#503d32;"><a href="${href}" style="display:inline-block;color:#ffffff;text-decoration:none;font-size:13px;letter-spacing:2px;text-transform:uppercase;padding:14px 28px;">${label}</a></td></tr></table>`;

// The frame every email shares: beige background, ELORA MTL lettering, white card, footer.
export function layout({ lang, title, preheader, body }: { lang: string; title: string; preheader: string; body: string }) {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f3f0;font-family:Arial,Helvetica,sans-serif;color:#292929;">
  <div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f3f0;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background-color:#ffffff;border-top:3px solid #a8875a;">
          <tr>
            <td align="center" style="padding:36px 32px 8px;">
              <div style="${font};font-size:28px;letter-spacing:10px;color:#503d32;">ELORA</div>
              <div style="font-size:10px;letter-spacing:4px;color:#7d6b5d;padding-top:4px;">MTL</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 32px;">
              <p style="margin:0 0 6px;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#a8875a;">${title}</p>
${body}
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;font-size:12px;color:#7d6b5d;">Elora MTL · {address} · <a href="tel:+15143411212" style="color:#7d6b5d;">{phone}</a> · <a href="https://www.instagram.com/eloramtl/" style="color:#7d6b5d;">@eloramtl</a></p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const hello = (text: string) => `<h1 style="margin:0 0 18px;${font};font-weight:normal;font-size:28px;line-height:1.25;color:#1d1814;">${text}</h1>`;
const signoff = (a: string, b: string) => `<p style="margin:8px 0 0;font-size:15px;color:#1d1814;">${a}<br><span style="color:#7d6b5d;">${b}</span></p>`;

// When / Where card for showings.
const whenWhere = (when: string, where: string, directions: string) => `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f5f2;border:1px solid #e8e2da;margin:0 0 24px;">
  <tr><td style="padding:20px 24px;border-bottom:1px solid #e8e2da;">
    <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#7d6b5d;">${when}</p>
    <p style="margin:0;${font};font-size:20px;color:#1d1814;">{date}</p>
    <p style="margin:2px 0 0;font-size:15px;color:#503d32;">{time}</p>
  </td></tr>
  <tr><td style="padding:20px 24px;">
    <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#7d6b5d;">${where}</p>
    <p style="margin:0 0 8px;font-size:15px;color:#1d1814;">{address}</p>
    <a href="${MAP}" style="font-size:13px;color:#503d32;text-decoration:underline;">${directions}</a>
  </td></tr>
</table>`;

// A highlighted promotion line (only shown while a promotion is running).
const promo = (label: string) => `{#promotion}<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;background-color:#503d32;">
  <tr><td style="padding:20px 24px;">
    <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#e9dcc6;">${label}</p>
    <p style="margin:0;${font};font-size:20px;color:#ffffff;">{promotion}</p>
  </td></tr>
</table>{/promotion}`;

const both = (fr: string, en: string): Bilingual => ({ fr, en });

// Showing confirmation, sent right after booking.
export const CONFIRMATION_HTML = both(
  layout({
    lang: "fr",
    title: "Votre visite est confirmée",
    preheader: "Au plaisir de vous accueillir à Elora MTL le {date} à {time}.",
    body: [
      hello("Bonjour {name},"),
      p("Merci d'avoir réservé une visite privée. Nous avons hâte de vous faire découvrir Elora."),
      whenWhere("Quand", "Où", "Itinéraire dans Google Maps"),
      p("L'invitation jointe ajoute la visite à votre calendrier, avec un rappel 30 minutes avant."),
      p("Un empêchement? Répondez simplement à ce courriel ou appelez-nous au {phone} pour changer l'heure."),
      signoff("À bientôt!", "L'équipe Elora"),
    ].join("\n"),
  }),
  layout({
    lang: "en",
    title: "Your showing is confirmed",
    preheader: "We look forward to welcoming you to Elora MTL on {date} at {time}.",
    body: [
      hello("Hi {name},"),
      p("Thank you for booking a private showing. We look forward to showing you around Elora."),
      whenWhere("When", "Where", "Directions in Google Maps"),
      p("The attached invite adds the showing to your calendar, with a reminder 30 minutes before."),
      p("Can't make it? Just reply to this email or call us at {phone} to change the time."),
      signoff("See you soon!", "The Elora team"),
    ].join("\n"),
  }),
);

// Automatic reply to inquiries and applications.
export const AUTO_REPLY_HTML = both(
  layout({
    lang: "fr",
    title: "Nous avons bien reçu votre message",
    preheader: "Merci de votre intérêt pour Elora MTL. Nous vous répondons d'ici 24 heures.",
    body: [
      hello("Bonjour {name},"),
      p("Merci de votre intérêt pour Elora MTL! Nous avons bien reçu votre message et un membre de notre équipe de location vous répondra d'ici 24 heures."),
      promo("Offre en cours"),
      p("D'ici là, vous pouvez réserver une visite privée en ligne ou nous écrire sur WhatsApp au {phone}."),
      button("{website}#visit", "Réserver une visite"),
      signoff("Au plaisir,", "L'équipe Elora"),
    ].join("\n"),
  }),
  layout({
    lang: "en",
    title: "We received your message",
    preheader: "Thank you for your interest in Elora MTL. We'll get back to you within 24 hours.",
    body: [
      hello("Hi {name},"),
      p("Thank you for your interest in Elora MTL! We received your message and a member of our leasing team will get back to you within 24 hours."),
      promo("Current offer"),
      p("In the meantime, you can book a private showing online or message us on WhatsApp at {phone}."),
      button("{website}#visit", "Book a showing"),
      signoff("Talk soon,", "The Elora team"),
    ].join("\n"),
  }),
);

// Follow-up, sent a few days after someone came to a showing.
export const FOLLOW_UP_HTML = both(
  layout({
    lang: "fr",
    title: "Merci de votre visite",
    preheader: "Qu'avez-vous pensé d'Elora MTL?",
    body: [
      hello("Bonjour {name},"),
      p("Merci d'être venu visiter Elora le {date}. Nous espérons que les lieux vous ont plu!"),
      p("Avez-vous trouvé le logement qui vous convient? Si vous êtes prêt, vous pouvez déposer votre demande en ligne en quelques minutes."),
      promo("Offre en cours"),
      button("{website}#apply", "Postuler"),
      p("Des questions, ou envie de revoir un logement? Répondez à ce courriel ou appelez-nous au {phone}."),
      signoff("Au plaisir,", "L'équipe Elora"),
    ].join("\n"),
  }),
  layout({
    lang: "en",
    title: "Thank you for visiting",
    preheader: "What did you think of Elora MTL?",
    body: [
      hello("Hi {name},"),
      p("Thank you for coming to see Elora on {date}. We hope you enjoyed the visit!"),
      p("Did you find the right home for you? When you're ready, you can apply online in a few minutes."),
      promo("Current offer"),
      button("{website}#apply", "Apply now"),
      p("Any questions, or want to see a suite again? Just reply to this email or call us at {phone}."),
      signoff("Talk soon,", "The Elora team"),
    ].join("\n"),
  }),
);
