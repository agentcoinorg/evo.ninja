import { splitArray } from "../agent-core/embeddings/utils";

describe('splitArray function', () => {
  const countBytes = (input: string) => Buffer.byteLength(input, "utf-8");

  test('Basic functionality', () => {
    const input = ['a', 'b', 'c', 'd'];
    const maxLength = 2;
    const maxBytes = 10;
    const expected = [['a', 'b'], ['c', 'd']];
    expect(splitArray(input, maxLength, maxBytes, countBytes)).toEqual(expected);
  });

  test('Max length constraint', () => {
    const input = ['a', 'b', 'c', 'd'];
    const maxLength = 1;
    const maxBytes = 10;
    const expected = [['a'], ['b'], ['c'], ['d']];
    expect(splitArray(input, maxLength, maxBytes, countBytes)).toEqual(expected);
  });

  test('Max bytes constraint', () => {
    const input = ['abc', 'def', 'ghijkl'];
    const maxLength = 3;
    const maxBytes = 6;
    const expected = [['abc', 'def'], ['ghijkl']];
    expect(splitArray(input, maxLength, maxBytes, countBytes)).toEqual(expected);
  });

  test('Empty array', () => {
    const input: string[] = [];
    const maxLength = 2;
    const maxBytes = 10;
    const expected: string[] = [];
    expect(splitArray(input, maxLength, maxBytes, countBytes)).toEqual(expected);
  });

  test('Single long string', () => {
    const input = ['abcdefgh'];
    const maxLength = 2;
    const maxBytes = 8;
    const expected = [['abcdefgh']];
    expect(splitArray(input, maxLength, maxBytes, countBytes)).toEqual(expected);
  });
});
