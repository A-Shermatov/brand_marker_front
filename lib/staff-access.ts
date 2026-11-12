/**
 * Small things around giving somebody access to the admin panel: a password
 * worth handing over, and the note the administrator passes on.
 */

/** Letters and digits that are not mistaken for one another when read aloud or retyped. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"
const PASSWORD_LENGTH = 14

/** A random password for a new member of staff. */
export const generatePassword = (random: (max: number) => number = secureRandom): string => {
  let password = ""
  for (let i = 0; i < PASSWORD_LENGTH; i += 1) password += ALPHABET[random(ALPHABET.length)]
  return password
}

function secureRandom(max: number): number {
  // Values past the last full run of the alphabet are thrown away, so every letter is as likely.
  const limit = Math.floor(256 / max) * max
  const byte = new Uint8Array(1)
  do {
    crypto.getRandomValues(byte)
  } while (byte[0] >= limit)
  return byte[0] % max
}

export type StaffCredentials = {
  name: string
  email: string
  password: string
  role: string
}

/** What the administrator sends to the new member of staff, ready to paste into a message. */
export const accessNote = (credentials: StaffCredentials, origin: string): string =>
  [
    `${credentials.name}, вам открыт доступ к панели управления Brand Market (${credentials.role}).`,
    `Вход: ${origin}/admin/login`,
    `Email: ${credentials.email}`,
    `Пароль: ${credentials.password}`,
    "После первого входа смените пароль: меню профиля → «Мой аккаунт».",
  ].join("\n")
