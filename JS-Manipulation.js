/**
 * @template T
 * @param {T} value
 * @return {T}
 */
function trim(value) {
  if (isArray(value)) return value.map(trim)
  if (isObject(value)) return Object.fromEntries(Object.entries(value).map(([key,  value]) => [key, trim(value)]))
  return typeof value === 'string' ? value.trim() : value
}