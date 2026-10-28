/**
 * Helper to deeply serialize Prisma objects and convert all Decimal objects to plain numbers.
 * Next.js Server Components / React Flight protocol throws warnings/errors if Prisma Decimal objects
 * are passed to Client Components.
 */
export function serializeDecimal<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj
  }

  // Check if it's a Prisma Decimal (or any Decimal.js object)
  if (typeof obj === 'object') {
    if (typeof (obj as any).toNumber === 'function') {
      return (obj as any).toNumber()
    }
    // Check if it has Decimal.js structure { s, e, d }
    if ('s' in (obj as any) && 'e' in (obj as any) && 'd' in (obj as any) && Array.isArray((obj as any).d)) {
      return Number(obj) as any
    }

    if (obj instanceof Date) {
      return obj
    }

    if (Array.isArray(obj)) {
      return obj.map(item => serializeDecimal(item)) as any
    }

    // Plain object
    const copy: any = {}
    for (const [key, value] of Object.entries(obj)) {
      copy[key] = serializeDecimal(value)
    }
    return copy
  }

  return obj
}
