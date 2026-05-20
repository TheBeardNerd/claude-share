export interface Department {
  slug: string;
  label: string;
}

export const DEPARTMENTS: Department[] = [
  { slug: 'basketball-ops', label: 'Basketball Operations' },
  { slug: 'engineering', label: 'Engineering & Technology' },
  { slug: 'marketing', label: 'Marketing' },
  { slug: 'communications', label: 'Communications & PR' },
  { slug: 'finance', label: 'Finance' },
  { slug: 'legal', label: 'Legal' },
  { slug: 'people-culture', label: 'People & Culture' },
  { slug: 'ticket-sales', label: 'Ticket Sales' },
  { slug: 'partnerships', label: 'Partnerships' },
  { slug: 'media', label: 'Media' },
  { slug: 'creative', label: 'Creative' },
  { slug: 'it', label: 'IT' },
  { slug: 'strategy', label: 'Strategy & Analytics' },
  { slug: 'facilities', label: 'Facilities & Operations' },
  { slug: 'general', label: 'General / Cross-department' },
];

export function getDepartmentLabel(slug: string): string {
  return DEPARTMENTS.find((d) => d.slug === slug)?.label ?? slug;
}
