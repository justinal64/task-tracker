import bcrypt from "bcryptjs";

const PIN_PATTERN = /^\d{4}$/;
const SALT_ROUNDS = 10;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;

export function isValidPin(pin: string): boolean {
  return PIN_PATTERN.test(pin);
}

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, SALT_ROUNDS);
}

export async function verifyPin(pin: string, pinHash: string): Promise<boolean> {
  return bcrypt.compare(pin, pinHash);
}

export { MAX_FAILED_ATTEMPTS, LOCKOUT_MS };

/** 'YYYY-MM-DD' in the server's local time zone. */
export function dateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
