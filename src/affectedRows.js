export function hasExactlyOneAffectedRow(rows) {
  if (!Array.isArray(rows) || rows.length !== 1) return false;
  const row = rows[0];
  return row !== null && typeof row === 'object' && row.id != null;
}
