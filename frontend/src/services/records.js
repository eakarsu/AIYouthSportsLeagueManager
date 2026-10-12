// Collection routes currently return arrays; accept named and paginated API envelopes too.
export function recordsFrom(payload, key) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  for (const candidate of [payload[key], payload.data, payload.items, payload.results]) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}
