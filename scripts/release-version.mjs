const RELEASE_VERSION_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-beta\.(0|[1-9]\d*))?$/;
const MAX_VERSION_LENGTH = 256;
const MAX_SAFE_COMPONENT = BigInt(Number.MAX_SAFE_INTEGER);

export function parseReleaseVersion(value) {
  if (typeof value !== "string" || value.length > MAX_VERSION_LENGTH) {
    throw new Error(`Invalid release version: ${String(value)}.`);
  }

  const match = RELEASE_VERSION_PATTERN.exec(value);

  if (!match) {
    throw new Error(
      `Invalid release version: ${value}. Expected X.Y.Z or X.Y.Z-beta.N without leading zeroes.`,
    );
  }

  const [, major, minor, patch, beta] = match;
  const core = [BigInt(major), BigInt(minor), BigInt(patch)];

  if (core.some((component) => component > MAX_SAFE_COMPONENT)) {
    throw new Error(`Invalid release version: ${value}. Core numbers exceed npm limits.`);
  }

  return {
    value,
    major: core[0],
    minor: core[1],
    patch: core[2],
    beta: beta === undefined ? null : BigInt(beta),
  };
}

export function compareParsedReleaseVersions(left, right) {
  for (const key of ["major", "minor", "patch"]) {
    if (left[key] < right[key]) return -1;
    if (left[key] > right[key]) return 1;
  }

  if (left.beta === null && right.beta === null) return 0;
  if (left.beta === null) return 1;
  if (right.beta === null) return -1;
  if (left.beta < right.beta) return -1;
  if (left.beta > right.beta) return 1;
  return 0;
}

export function createReleaseMetadata(value) {
  const version = parseReleaseVersion(value);
  const prerelease = version.beta !== null;

  return {
    version: version.value,
    branchName: `release/v${version.value}`,
    tagName: `v${version.value}`,
    npmDistTag: prerelease ? "next" : "latest",
    prerelease,
  };
}
