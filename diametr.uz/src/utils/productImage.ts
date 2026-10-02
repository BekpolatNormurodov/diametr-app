// Product-image resolver shared by every card / modal on the site.
//
// Priority (same as the mobile app):
//   1. the chosen variant's own image (when a variant is chosen)
//   2. the product's own image — admins upload a dedicated photo per product
//      and expect it on the product card/page (it used to lose to any
//      variant's photo, so "Suv isitgichlari" showed one heater instead)
//   3. any variant's image (product has no photo of its own)
//   4. category's image
//   5. null (caller renders the empty-state icon)

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

/** Card thumbnail: product → any variant → category → null. */
export function productImageUrl(p: unknown): string | null {
  if (!p) return null
  const pu = url('products', pick(p, 'image'))
  if (pu) return pu
  const items = pick(p, 'items')
  if (Array.isArray(items)) {
    for (const it of items) {
      const u = url('product-items', pick(it, 'image'))
      if (u) return u
    }
  }
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

/** A product's own photo, then its category's — never a sibling variant's
 *  (for a chosen variant that has no photo of its own). */
export function productOwnImageUrl(p: unknown): string | null {
  if (!p) return null
  return url('products', pick(p, 'image')) || url('categories', pick(pick(p, 'category'), 'image'))
}

/** Just for a variant row (e.g. thumbnail next to the variant label). */
export function variantImageUrl(v: unknown): string | null {
  return url('product-items', pick(v, 'image'))
}
