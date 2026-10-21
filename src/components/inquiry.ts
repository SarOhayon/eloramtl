// Opens the building inquiry pop-up (InquiryDialog), optionally with a suite type picked.
export const INQUIRY_EVENT = "elora:inquiry";
export const openInquiry = (type?: string) => window.dispatchEvent(new CustomEvent(INQUIRY_EVENT, { detail: { type } }));
