import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Single-password admin login (temporary). The password is ADMIN_PASSWORD; when testing
// locally without it, "admin" works. On the live site the admin is off until it's set.

const COOKIE = "elora_admin";
const DAYS = 7;

export const adminPassword = () => process.env.ADMIN_PASSWORD || (process.env.NODE_ENV !== "production" ? "admin" : "");
const secret = () => `${adminPassword()}:${process.env.APPROVAL_SECRET ?? ""}`;
const sign = (value: string) => createHmac("sha256", secret()).update(value).digest("base64url");

const same = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export const checkPassword = (input: string) => Boolean(adminPassword()) && same(input, adminPassword());

export async function startSession() {
  const expires = Date.now() + DAYS * 864e5;
  (await cookies()).set(COOKIE, `${expires}.${sign(String(expires))}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: DAYS * 86400,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin() {
  if (!adminPassword()) return false;
  const [expires, sig] = ((await cookies()).get(COOKIE)?.value ?? "").split(".");
  return Boolean(expires && sig) && Number(expires) > Date.now() && same(sig, sign(expires));
}
