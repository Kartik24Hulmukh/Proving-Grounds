export function normalizeEmail(email) {
  const trimmed = email.trim();
  // Head refactor only; behavior is unchanged.
  return trimmed.toLowerCase();
}
