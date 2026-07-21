// Kratos node names are dot-paths (e.g. "traits.email") that the JSON body
// must nest ({ traits: { email } }) rather than send flat — this walks any
// flat name/value map into the nested shape generically, so it works for
// whatever traits or methods a flow's nodes name, not just email/password.
export function toNestedPayload(values: Readonly<Record<string, unknown>>): object {
  const payload: Record<string, unknown> = {};

  for (const [path, value] of Object.entries(values)) {
    const segments = path.split('.');
    let target = payload;

    for (let i = 0; i < segments.length - 1; i++) {
      const segment = segments[i];
      const next = target[segment];
      target = (
        typeof next === 'object' && next !== null ? next : (target[segment] = {})
      ) as Record<string, unknown>;
    }

    target[segments[segments.length - 1]] = value;
  }

  return payload;
}
