export type PublicContentLink = {label: string; href: string; openInNewTab?: boolean; eyebrow?: string; description?: string}

export function isSafePublicHref(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const href = value.trim()
  if (!href) return false
  if ((href.startsWith('/') && !href.startsWith('//')) || href.startsWith('#')) return true
  if (/^(mailto|tel):[^\s]+$/i.test(href)) return true

  try {
    return new URL(href).protocol === 'https:'
  } catch {
    return false
  }
}

export function sanitisePublicLink(value: Partial<PublicContentLink> | null | undefined): PublicContentLink | undefined {
  if (!value || typeof value.label !== 'string' || !value.label.trim() || !isSafePublicHref(value.href)) return undefined
  return {
    label: value.label.trim(),
    href: value.href.trim(),
    openInNewTab: value.openInNewTab === true,
    eyebrow: typeof value.eyebrow === 'string' && value.eyebrow.trim() ? value.eyebrow.trim() : undefined,
    description: typeof value.description === 'string' && value.description.trim() ? value.description.trim() : undefined,
  }
}
