import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
  compareParsedReleaseVersions,
  createReleaseMetadata,
  parseReleaseVersion,
} from "./release-version.mjs";

export function createReleasePlan(currentVersion, targetVersion) {
  const current = parseReleaseVersion(currentVersion);
  const target = parseReleaseVersion(targetVersion);

  if (compareParsedReleaseVersions(target, current) <= 0) {
    throw new Error(
      `Release version ${targetVersion} must be newer than current version ${currentVersion}.`,
    );
  }

  const metadata = createReleaseMetadata(targetVersion);

  return {
    currentVersion,
    targetVersion,
    branchName: metadata.branchName,
    tagName: metadata.tagName,
    npmDistTag: metadata.npmDistTag,
    prerelease: metadata.prerelease,
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
