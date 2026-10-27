// Opens the building inquiry pop-up (InquiryDialog), optionally with a suite type picked.
// `askOnly` shows just the inquiry form, without the showing calendar (e.g. "Claim the offer").
export const INQUIRY_EVENT = "elora:inquiry";
export type InquiryOptions = { type?: string; askOnly?: boolean };
export const openInquiry = (options: InquiryOptions = {}) => window.dispatchEvent(new CustomEvent(INQUIRY_EVENT, { detail: options }));
