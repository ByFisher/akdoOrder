import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export type StaffRole = "chef" | "waiter";

export const STAFF_COOKIE = "akdo-staff-session";
const SESSION_DURATION_SECONDS = 60 * 60 * 12;

function getCredentials(role: StaffRole) {
  const prefix = role === "chef" ? "CHEF" : "WAITER";
  return {
    username: process.env[`${prefix}_USERNAME`],
    password: process.env[`${prefix}_PASSWORD`],
  };
}

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET;
}

function signSession(role: StaffRole, timestamp: string, secret: string) {
  return createHmac("sha256", secret)
    .update(`${role}.${timestamp}`)
    .digest("hex");
}

export function isStaffConfigured(role: StaffRole) {
  const credentials = getCredentials(role);
  return Boolean(credentials.username && credentials.password && getSessionSecret());
}

export function verifyStaffCredentials(
  role: StaffRole,
  username: string,
  password: string,
) {
  const credentials = getCredentials(role);
  if (!credentials.username || !credentials.password) return false;

  const providedUsername = Buffer.from(username.trim().toLocaleLowerCase("tr-TR"));
  const expectedUsername = Buffer.from(
    credentials.username.trim().toLocaleLowerCase("tr-TR"),
  );
  const providedPassword = Buffer.from(password);
  const expectedPassword = Buffer.from(credentials.password);

  return (
    providedUsername.length === expectedUsername.length &&
    timingSafeEqual(providedUsername, expectedUsername) &&
    providedPassword.length === expectedPassword.length &&
    timingSafeEqual(providedPassword, expectedPassword)
  );
}

export function createStaffSession(role: StaffRole) {
  const secret = getSessionSecret();
  if (!secret) throw new Error("ADMIN_SESSION_SECRET tanımlanmamış.");

  const timestamp = Date.now().toString();
  return `${role}.${timestamp}.${signSession(role, timestamp, secret)}`;
}

export function isValidStaffSession(token: string | undefined): StaffRole | null {
  const secret = getSessionSecret();
  if (!secret || !token) return null;

  const [role, timestamp, signature, extra] = token.split(".");
  const issuedAt = Number(timestamp);
  if (
    (role !== "chef" && role !== "waiter") ||
    !timestamp ||
    !signature ||
    extra !== undefined ||
    !Number.isSafeInteger(issuedAt) ||
    issuedAt > Date.now() ||
    Date.now() - issuedAt > SESSION_DURATION_SECONDS * 1000
  ) {
    return null;
  }

  const expected = Buffer.from(signSession(role, timestamp, secret));
  const provided = Buffer.from(signature);
  return expected.length === provided.length &&
    timingSafeEqual(expected, provided)
    ? role
    : null;
}

export async function getStaffRole() {
  const cookieStore = await cookies();
  return isValidStaffSession(cookieStore.get(STAFF_COOKIE)?.value);
}

export function staffCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  };
}
