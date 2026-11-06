import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const scrypt = promisify(scryptCallback);
export const MEMBER_COOKIE = "akdo-member-session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET;
}

function signSession(memberId: string, timestamp: string, secret: string) {
  return createHmac("sha256", secret)
    .update(`${memberId}.${timestamp}`)
    .digest("hex");
}

export async function hashMemberPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyMemberPassword(
  password: string,
  passwordHash: string,
) {
  const [salt, savedKey, extra] = passwordHash.split(":");
  if (!salt || !savedKey || extra !== undefined || !/^[a-f0-9]{128}$/i.test(savedKey)) {
    return false;
  }

  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(savedKey, "hex");
  return (
    expected.length === derivedKey.length &&
    timingSafeEqual(expected, derivedKey)
  );
}

export function createMemberSession(memberId: string) {
  const secret = getSessionSecret();
  if (!secret) throw new Error("ADMIN_SESSION_SECRET tanımlanmamış.");

  const timestamp = Date.now().toString();
  return `${memberId}.${timestamp}.${signSession(memberId, timestamp, secret)}`;
}

export function isValidMemberSession(token: string | undefined) {
  const secret = getSessionSecret();
  if (!secret || !token) return null;

  const [memberId, timestamp, signature, extra] = token.split(".");
  const issuedAt = Number(timestamp);
  if (
    !memberId ||
    !timestamp ||
    !signature ||
    extra !== undefined ||
    !Number.isSafeInteger(issuedAt) ||
    issuedAt > Date.now() ||
    Date.now() - issuedAt > SESSION_DURATION_SECONDS * 1000
  ) {
    return null;
  }

  const expected = Buffer.from(signSession(memberId, timestamp, secret));
  const provided = Buffer.from(signature);
  return expected.length === provided.length &&
    timingSafeEqual(expected, provided)
    ? memberId
    : null;
}

export async function getCurrentMember() {
  const cookieStore = await cookies();
  const memberId = isValidMemberSession(
    cookieStore.get(MEMBER_COOKIE)?.value,
  );
  if (!memberId) return null;

  return prisma.member.findFirst({
    where: { id: memberId, isActive: true },
    select: {
      id: true,
      memberNumber: true,
      username: true,
      firstName: true,
      lastName: true,
      balance: true,
    },
  });
}

export function memberCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  };
}

export function createMemberNumber() {
  return randomBytes(4).readUInt32BE(0) % 100_000_000;
}
