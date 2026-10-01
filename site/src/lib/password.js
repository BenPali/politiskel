/* The server's password rule (server/src/validate.rs), checked as the field
   is typed in rather than only once sent. Counted in characters, as the
   server counts them, not in UTF-16 units. */

export const PASSWORD_MIN = 10;

/** how many characters are still missing: 0 once long enough */
export const passwordMissing = (pw) => Math.max(0, PASSWORD_MIN - [...(pw || '')].length);
