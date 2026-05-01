export const MUSLIM_MAJORITY = new Set([
  'Afghanistan', 'Albania', 'Algeria', 'Azerbaijan', 'Bahrain',
  'Bangladesh', 'Bosnia and Herzegovina', 'Brunei', 'Chad', 'Comoros',
  'Djibouti', 'Egypt', 'Gambia', 'Guinea', 'Indonesia', 'Iran', 'Iraq',
  'Jordan', 'Kazakhstan', 'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Libya',
  'Malaysia', 'Maldives', 'Mali', 'Mauritania', 'Morocco', 'Niger',
  'Nigeria', 'Oman', 'Pakistan', 'Palestine', 'Qatar', 'Saudi Arabia',
  'Senegal', 'Sierra Leone', 'Somalia', 'Sudan', 'Syria', 'Tajikistan',
  'Tunisia', 'Turkey', 'Turkmenistan', 'United Arab Emirates',
  'Uzbekistan', 'Yemen',
]);

export const ALL_COUNTRIES: string[] = [
  'Australia', 'Brazil', 'Cambodia', 'Canada', 'China', 'France',
  'Germany', 'India', 'Italy', 'Japan', 'Laos', 'Mexico', 'Myanmar',
  'Nepal', 'New Zealand', 'Philippines', 'Russia', 'Singapore',
  'South Korea', 'Spain', 'Sri Lanka', 'Switzerland', 'Taiwan',
  'Thailand', 'United Kingdom', 'United States', 'Vietnam',
  ...Array.from(MUSLIM_MAJORITY),
].sort();

export function restrictionsForCountry(country: string): string[] {
  const r: string[] = [];
  if (MUSLIM_MAJORITY.has(country)) r.push('no_pork');
  return r;
}
