// Opens the building inquiry pop-up (InquiryDialog), optionally with a suite type picked.
export const INQUIRY_EVENT = "elora:inquiry";
export type InquiryOptions = { type?: string };
export const openInquiry = (options: InquiryOptions = {}) => window.dispatchEvent(new CustomEvent(INQUIRY_EVENT, { detail: options }));

// Opens the "Apply now" form (ApplyDialog).
export const APPLY_EVENT = "elora:apply";
export const openApply = () => window.dispatchEvent(new Event(APPLY_EVENT));
