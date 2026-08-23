import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { createReleaseMetadata } from "./release-version.mjs";

const PACKAGE_NAME = "basiq-ui";
const REPOSITORY_URL = "git+https://github.com/traP-jp/basiq-ui.git";
const NPM_REGISTRY_URL = "https://registry.npmjs.org/";

export function createPublishPlan(packageJson) {
  if (packageJson.name !== PACKAGE_NAME) {
    throw new Error(`Unexpected package name: ${packageJson.name ?? "(missing)"}.`);
  }

  if (packageJson.private === true) {
    throw new Error(`${PACKAGE_NAME} is still marked as private.`);
  }

  if (packageJson.repository?.url !== REPOSITORY_URL) {
    throw new Error(`Unexpected repository URL: ${packageJson.repository?.url ?? "(missing)"}.`);
  }

  if (packageJson.publishConfig?.access !== "public") {
    throw new Error("publishConfig.access must be public.");
  }

  if (packageJson.publishConfig?.provenance !== true) {
    throw new Error("publishConfig.provenance must be enabled.");
  }

  const registry = packageJson.publishConfig.registry;

  if (registry !== undefined && registry !== NPM_REGISTRY_URL) {
    throw new Error(`Unexpected npm registry: ${registry}.`);
  }

  return {
    packageName: PACKAGE_NAME,
    ...createReleaseMetadata(packageJson.version),
  };
}

export async function loadPublishPlan(rootDirectory) {
  const packageSource = await readFile(path.join(rootDirectory, "package.json"), "utf8");
  return createPublishPlan(JSON.parse(packageSource));
}

async function main() {
  if (process.argv.length !== 2) {
    throw new Error("create-publish-plan.mjs does not accept arguments.");
  }

  const plan = await loadPublishPlan(process.cwd());
  process.stdout.write(`${JSON.stringify(plan)}\n`);
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
