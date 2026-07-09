/**
 * Escapes special regex characters from a string so it can be safely used
 * as a literal pattern inside a RegExp constructor.
 * Prevents ReDoS attacks when user input is used in regex queries.
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
