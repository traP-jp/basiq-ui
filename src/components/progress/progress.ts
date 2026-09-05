export const defaultProgressMax = 100;

export function isValidProgressMax(max: number | undefined): max is number {
  return typeof max === "number" && Number.isFinite(max) && max > 0;
}

export function normalizeProgressMax(max: number | undefined) {
  return isValidProgressMax(max) ? max : defaultProgressMax;
}

export function normalizeProgressValue(value: number | undefined, max: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.min(Math.max(value, 0), max);
}
