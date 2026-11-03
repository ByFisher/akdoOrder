import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const ADMIN_COOKIE = "akdo-admin-session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8;

function getAdminUsername() {
  return process.env.ADMIN_USERNAME;
}

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD;
}

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET;
}

function signTimestamp(timestamp: string, secret: string) {
  return createHmac("sha256", secret).update(timestamp).digest("hex");
}

export function isAdminConfigured() {
  return Boolean(getAdminUsername() && getAdminPassword() && getSessionSecret());
}

export function verifyAdminCredentials(username: string, password: string) {
  const expectedUsername = getAdminUsername();
  const expectedPassword = getAdminPassword();

  if (!expectedUsername || !expectedPassword) {
    return false;
  }

  const providedUsername = Buffer.from(username.trim().toLowerCase());
  const configuredUsername = Buffer.from(expectedUsername.trim().toLowerCase());
  const providedPassword = Buffer.from(password);
  const configuredPassword = Buffer.from(expectedPassword);

  return (
    providedUsername.length === configuredUsername.length &&
    timingSafeEqual(providedUsername, configuredUsername) &&
    providedPassword.length === configuredPassword.length &&
    timingSafeEqual(providedPassword, configuredPassword)
  );
}

export function createAdminSession() {
  const secret = getSessionSecret();

  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET tanımlanmamış.");
  }

  const timestamp = Date.now().toString();

  return `${timestamp}.${signTimestamp(timestamp, secret)}`;
}

export function isValidAdminSession(token: string | undefined) {
  const secret = getSessionSecret();

  if (!secret || !token) {
    return false;
  }

  const [timestamp, signature, extra] = token.split(".");
  const issuedAt = Number(timestamp);

  if (
    extra !== undefined ||
    !timestamp ||
    !signature ||
    !Number.isSafeInteger(issuedAt) ||
    issuedAt > Date.now() ||
    Date.now() - issuedAt > SESSION_DURATION_SECONDS * 1000
  ) {
    return false;
  }

  const expected = Buffer.from(signTimestamp(timestamp, secret));
  const provided = Buffer.from(signature);

  return (
    expected.length === provided.length && timingSafeEqual(expected, provided)
  );
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();

  return isValidAdminSession(cookieStore.get(ADMIN_COOKIE)?.value);
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  };
}

export { ADMIN_COOKIE };
