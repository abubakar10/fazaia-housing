import { hash, verify } from "@node-rs/argon2";

/** OWASP-aligned Argon2id. Params are stored in the hash; verify reads them from there. */
const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
};

export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(
  passwordHash: string,
  password: string,
): Promise<boolean> {
  try {
    // Do not pass options — encoded hash already contains algorithm parameters.
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}
