// Kratos node names are dot-paths (e.g. "traits.email") that the JSON body
// must nest ({ traits: { email } }) rather than send flat — this walks any
// flat name/value map into the nested shape generically, so it works for
// whatever traits or methods a flow's nodes name, not just email/password.
export function toNestedPayload(values: Readonly<Record<string, unknown>>): object {
  const payload: Record<string, unknown> = {};

  for (const [path, value] of Object.entries(values)) {
    const segments = path.split('.');
    const lastSegment = segments.pop()!;

    let target = payload;
    for (const segment of segments) {
      if (typeof target[segment] !== 'object' || target[segment] === null) {
        target[segment] = {};
      }
      target = target[segment] as Record<string, unknown>;
    }

    target[lastSegment] = value;
  }

  return payload;
}
