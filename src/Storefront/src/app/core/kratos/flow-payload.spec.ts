import { toNestedPayload } from './flow-payload';

describe('toNestedPayload', () => {
  it('nests dot-path keys under shared parents without overwriting siblings', () => {
    const result = toNestedPayload({
      'traits.email': 'a@b.com',
      'traits.name': 'Jan',
      password: 'x',
    });

    expect(result).toEqual({
      traits: { email: 'a@b.com', name: 'Jan' },
      password: 'x',
    });
  });

  it('handles flat keys with no dots', () => {
    expect(toNestedPayload({ method: 'password' })).toEqual({ method: 'password' });
  });

  it('handles multiple levels of nesting', () => {
    expect(toNestedPayload({ 'a.b.c': 1 })).toEqual({ a: { b: { c: 1 } } });
  });

  it('returns an empty object for empty input', () => {
    expect(toNestedPayload({})).toEqual({});
  });
});
