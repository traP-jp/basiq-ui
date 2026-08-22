import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

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

export function createReleasePlan(currentVersion, targetVersion) {
  const current = parseReleaseVersion(currentVersion);
  const target = parseReleaseVersion(targetVersion);

  if (compareParsedReleaseVersions(target, current) <= 0) {
    throw new Error(
      `Release version ${targetVersion} must be newer than current version ${currentVersion}.`,
    );
  }

  const prerelease = target.beta !== null;

  return {
    currentVersion,
    targetVersion,
    branchName: `release/v${targetVersion}`,
    tagName: `v${targetVersion}`,
    npmDistTag: prerelease ? "next" : "latest",
    prerelease,
  };
}

export async function prepareRelease({ rootDirectory, version, dryRun }) {
  const packagePath = path.join(rootDirectory, "package.json");
  const packageSource = await readFile(packagePath, "utf8");
  const packageJson = JSON.parse(packageSource);

  if (packageJson.name !== "basiq-ui") {
    throw new Error(`Unexpected package name: ${packageJson.name ?? "(missing)"}.`);
  }

  const plan = createReleasePlan(packageJson.version, version);

  if (!dryRun) {
    packageJson.version = version;
    delete packageJson.private;
    await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");
  }

  return { ...plan, dryRun };
}

function parseArguments(arguments_) {
  let version;
  let dryRun = false;

  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];

    if (argument === "--version") {
      if (version !== undefined) {
        throw new Error("Duplicate --version argument.");
      }

      const value = arguments_[index + 1];

      if (value === undefined || value.startsWith("-")) {
        throw new Error("Missing value for --version argument.");
      }

      version = value;
      index += 1;
    } else if (argument === "--dry-run") {
      dryRun = true;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!version) {
    throw new Error("Missing required --version argument.");
  }

  return { version, dryRun };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const result = await prepareRelease({
    rootDirectory: process.cwd(),
    ...options,
  });
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

const isEntrypoint =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isEntrypoint) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
