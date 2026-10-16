export function formatBirthInput(input: string, previous = '') {
  const digits = input.replace(/\D/g, '').slice(0, 8);
  // Backspacing a trailing separator should remove the preceding digit too.
  if (previous.endsWith('-') && input === previous.slice(0, -1)) return formatBirthInput(digits.slice(0, -1));
  return digits.slice(0, 2) + (digits.length >= 2 ? '-' : '') + digits.slice(2, 4) + (digits.length >= 4 ? '-' : '') + digits.slice(4);
}
export function birthDateDisplay(iso: string) { const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso); return match ? `${match[3]}-${match[2]}-${match[1]}` : iso; }
export function birthDateIso(value: string) {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);
  if (!match) throw new Error('Nhập ngày sinh theo DD-MM-YYYY.');
  const iso = `${match[3]}-${match[2]}-${match[1]}`, date = new Date(`${iso}T00:00:00Z`);
  const today = new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== iso || iso < '1900-01-01' || iso > today) throw new Error('Ngày sinh không hợp lệ.');
  return iso;
}
export function daysInMonth(month: number, year: number) { return new Date(Date.UTC(year, month, 0)).getUTCDate(); }
