export function hasExactlyOneAffectedRow(rows) {
  return Array.isArray(rows) && rows.length === 1;
}
