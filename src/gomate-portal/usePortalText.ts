import { useLanguage } from '../i18n/LanguageContext';

export function usePortalText() {
  const { translate } = useLanguage();
  return function text<T>(value: T): T | string {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    const translated = translate(trimmed);
    if (translated !== trimmed) return value.replace(trimmed, translated);
    for (const [pattern, template] of [[/^Create post and (\d+) groups$/, 'Create post and {count} groups'], [/^(\d+) payment\(s\) pending$/, '{count} payment(s) pending']] as const) {
      const match = trimmed.match(pattern);
      if (match) return translate(template).replace('{count}', match[1]);
    }
    // Counts are UI copy; names, addresses, input values and submitted data stay intact.
    return value.replace(/^(\d+) (saved locations|active groups|branches|groups|members|accounts|total|paid|recipients|seats available)( ·)?$/, (_, count, label, suffix) => `${count} ${translate(label)}${suffix || ''}`);
  };
}
