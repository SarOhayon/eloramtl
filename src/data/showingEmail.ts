import type { Bilingual } from "./content";

// The designed (HTML) showing confirmation email. Email apps only understand simple tables and
// inline styles, so it's written the old-fashioned way. {name}, {date}, {time}, {address} and
// {phone} are filled in when it's sent; the admin can replace it with their own HTML.

const MAP = "https://www.google.com/maps/search/?api=1&query=2855+chemin+Bates%2C+Montr%C3%A9al%2C+QC+H3S+0A6";

type Words = { lang: string; title: string; preheader: string; hello: string; intro: string; when: string; where: string; directions: string; calendar: string; change: string; signoff: string; team: string };

const page = (w: Words) => `<!DOCTYPE html>
<html lang="${w.lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${w.title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f3f0;font-family:Arial,Helvetica,sans-serif;color:#292929;">
  <div style="display:none;max-height:0;overflow:hidden;">${w.preheader}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f3f0;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background-color:#ffffff;border-top:3px solid #a8875a;">
          <tr>
            <td align="center" style="padding:36px 32px 8px;">
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:28px;letter-spacing:10px;color:#503d32;">ELORA</div>
              <div style="font-size:10px;letter-spacing:4px;color:#7d6b5d;padding-top:4px;">MTL</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 0;">
              <p style="margin:0 0 6px;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#a8875a;">${w.title}</p>
              <h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:28px;line-height:1.25;color:#1d1814;">${w.hello}</h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#503d32;">${w.intro}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f5f2;border:1px solid #e8e2da;">
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #e8e2da;">
                    <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#7d6b5d;">${w.when}</p>
                    <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:20px;color:#1d1814;">{date}</p>
                    <p style="margin:2px 0 0;font-size:15px;color:#503d32;">{time}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#7d6b5d;">${w.where}</p>
                    <p style="margin:0 0 8px;font-size:15px;color:#1d1814;">{address}</p>
                    <a href="${MAP}" style="font-size:13px;color:#503d32;text-decoration:underline;">${w.directions}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 0;">
              <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#503d32;">${w.calendar}</p>
              <p style="margin:0 0 28px;font-size:14px;line-height:1.6;color:#503d32;">${w.change}</p>
              <p style="margin:0;font-size:15px;color:#1d1814;">${w.signoff}<br><span style="color:#7d6b5d;">${w.team}</span></p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:32px 40px;">
              <a href="tel:+15143411212" style="display:inline-block;background-color:#503d32;color:#ffffff;text-decoration:none;font-size:13px;letter-spacing:2px;text-transform:uppercase;padding:14px 28px;">{phone}</a>
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;font-size:12px;color:#7d6b5d;">Elora MTL · {address} · <a href="https://www.instagram.com/eloramtl/" style="color:#7d6b5d;">@eloramtl</a></p>
      </td>
    </tr>
  </table>
</body>
</html>`;

export const SHOWING_EMAIL_HTML: Bilingual = {
  fr: page({
    lang: "fr",
    title: "Votre visite est confirmée",
    preheader: "Au plaisir de vous accueillir à Elora MTL le {date} à {time}.",
    hello: "Bonjour {name},",
    intro: "Merci d'avoir réservé une visite privée. Nous avons hâte de vous faire découvrir Elora.",
    when: "Quand",
    where: "Où",
    directions: "Itinéraire dans Google Maps",
    calendar: "L'invitation jointe ajoute la visite à votre calendrier, avec un rappel 30 minutes avant.",
    change: "Un empêchement? Répondez simplement à ce courriel ou appelez-nous pour changer l'heure.",
    signoff: "À bientôt!",
    team: "L'équipe Elora",
  }),
  en: page({
    lang: "en",
    title: "Your showing is confirmed",
    preheader: "We look forward to welcoming you to Elora MTL on {date} at {time}.",
    hello: "Hi {name},",
    intro: "Thank you for booking a private showing. We look forward to showing you around Elora.",
    when: "When",
    where: "Where",
    directions: "Directions in Google Maps",
    calendar: "The attached invite adds the showing to your calendar, with a reminder 30 minutes before.",
    change: "Can't make it? Just reply to this email or call us to change the time.",
    signoff: "See you soon!",
    team: "The Elora team",
  }),
};
