// Ideal product-image resolver shared by every card / modal on the site.
//
// Priority (matches the mobile app so both platforms show the same picture):
//   1. selected variant's own image (when a variant is chosen)
//   2. any other variant that has an image
//   3. product's own image
//   4. category's image
//   5. null (caller renders the empty-state icon)
//
// Why the fallback matters: many products were uploaded with a generic
// display-shelf photo, while the actual variants have real product photos
// (e.g. "Xavfsizlik tizimlari"'s hero is a store scene but the "Seyf" variant
// would want the safe). Preferring the variant image gives every card a more
// specific picture without any data migration.

const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8888'

// Accepts `unknown` on purpose: every caller has its own narrow local Product
// interface (with or without `image` on category, with or without variant
// images typed), and the resolver only touches three optional fields at
// runtime. Widening every call site to a shared interface would ripple
// through page files that don't otherwise care about the shape.

function url(folder: string, name: unknown): string | null {
  if (name == null) return null
  const s = String(name).trim()
  if (!s || s === 'null') return null
  return `${BASE_URL}/static/${folder}/${s}`
}

function pick(o: unknown, key: string): unknown {
  return o && typeof o === 'object' ? (o as Record<string, unknown>)[key] : undefined
}

/** Card thumbnail: variant → product → category → null. */
export function productImageUrl(p: unknown): string | null {
  if (!p) return null
  const items = pick(p, 'items')
  if (Array.isArray(items)) {
    for (const it of items) {
      const u = url('product-items', pick(it, 'image'))
      if (u) return u
    }
  }
  const pu = url('products', pick(p, 'image'))
  if (pu) return pu
  return url('categories', pick(pick(p, 'category'), 'image'))
}

/** Detail hero when a specific variant is highlighted (or null for no pick). */
export function heroImageUrl(p: unknown, selectedVariant?: unknown): string | null {
  if (!p) return null
  if (selectedVariant) {
    const sel = url('product-items', pick(selectedVariant, 'image'))
    if (sel) return sel
  }
  return productImageUrl(p)
}

/** Just for a variant row (e.g. thumbnail next to the variant label). */
export function variantImageUrl(v: unknown): string | null {
  return url('product-items', pick(v, 'image'))
}
