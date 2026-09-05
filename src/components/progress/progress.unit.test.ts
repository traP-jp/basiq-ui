import { describe, expect, it } from "vitest";

import {
  defaultProgressMax,
  isValidProgressMax,
  normalizeProgressMax,
  normalizeProgressValue,
} from "./progress";

describe("progress normalization", () => {
  it.each([1, 2.5, 100])("accepts a positive finite max: %s", (max) => {
    expect(isValidProgressMax(max)).toBe(true);
    expect(normalizeProgressMax(max)).toBe(max);
  });

  it.each([undefined, 0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    "falls back for an invalid max: %s",
    (max) => {
      expect(isValidProgressMax(max)).toBe(false);
      expect(normalizeProgressMax(max)).toBe(defaultProgressMax);
    },
  );

  it("clamps values to the resolved range", () => {
    expect(normalizeProgressValue(-1, 5)).toBe(0);
    expect(normalizeProgressValue(2.5, 5)).toBe(2.5);
    expect(normalizeProgressValue(6, 5)).toBe(5);
    expect(normalizeProgressValue(Number.NaN, 5)).toBe(0);
  });
});
