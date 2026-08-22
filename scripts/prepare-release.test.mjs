import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import test from "node:test";

import {
  compareParsedReleaseVersions,
  createReleasePlan,
  parseReleaseVersion,
  prepareRelease,
} from "./prepare-release.mjs";

const scriptPath = path.join(import.meta.dirname, "prepare-release.mjs");

test("accepts stable and beta release versions", () => {
  assert.deepEqual(parseReleaseVersion("0.1.0-beta.0"), {
    value: "0.1.0-beta.0",
    major: 0n,
    minor: 1n,
    patch: 0n,
    beta: 0n,
  });
  assert.equal(parseReleaseVersion("1.0.0").beta, null);
});

test("rejects versions outside the supported release channels", () => {
  const oversizedCore = (BigInt(Number.MAX_SAFE_INTEGER) + 1n).toString();

  for (const version of [
    "v0.1.0",
    "0.1",
    "0.1.0-alpha.0",
    "0.1.0-beta",
    "0.1.0-beta.01",
    "01.0.0",
    "0.1.0+build",
    `${oversizedCore}.0.0`,
    `1.0.0-beta.${"1".repeat(246)}`,
  ]) {
    assert.throws(() => parseReleaseVersion(version), /Invalid release version/);
  }
});

test("orders beta and stable releases", () => {
  assert.equal(
    compareParsedReleaseVersions(
      parseReleaseVersion("0.1.0-beta.1"),
      parseReleaseVersion("0.1.0-beta.0"),
    ),
    1,
  );
  assert.equal(
    compareParsedReleaseVersions(parseReleaseVersion("0.1.0"), parseReleaseVersion("0.1.0-beta.1")),
    1,
  );
  assert.equal(
    compareParsedReleaseVersions(parseReleaseVersion("0.2.0-beta.0"), parseReleaseVersion("0.1.0")),
    1,
  );
});

test("creates release metadata from the version", () => {
  assert.deepEqual(createReleasePlan("0.0.0", "0.1.0-beta.0"), {
    currentVersion: "0.0.0",
    targetVersion: "0.1.0-beta.0",
    branchName: "release/v0.1.0-beta.0",
    tagName: "v0.1.0-beta.0",
    npmDistTag: "next",
    prerelease: true,
  });
  assert.equal(createReleasePlan("0.1.0-beta.1", "0.1.0").npmDistTag, "latest");
  assert.throws(() => createReleasePlan("0.1.0", "0.1.0-beta.1"), /must be newer/);
});

test("CLI dry-run prints a release plan and leaves package.json unchanged", async (context) => {
  const rootDirectory = await createFixture(context);
  const packagePath = path.join(rootDirectory, "package.json");
  const before = await readFile(packagePath, "utf8");

  const result = await runCli(["--version", "0.1.0-beta.0", "--dry-run"], rootDirectory);
  const plan = JSON.parse(result.stdout);

  assert.equal(result.code, 0);
  assert.equal(result.stderr, "");
  assert.equal(plan.npmDistTag, "next");
  assert.equal(plan.dryRun, true);
  assert.equal(await readFile(packagePath, "utf8"), before);
});

test("CLI rejects malformed arguments", async (context) => {
  const rootDirectory = await createFixture(context);

  for (const arguments_ of [
    [],
    ["--version", "--dry-run"],
    ["--version", "0.1.0", "--version", "0.2.0"],
    ["--unknown"],
  ]) {
    const result = await runCli(arguments_, rootDirectory);
    assert.notEqual(result.code, 0);
    assert.equal(result.stdout, "");
    assert.notEqual(result.stderr, "");
  }
});

test("updates version and removes the private guard", async (context) => {
  const rootDirectory = await createFixture(context);
  const packagePath = path.join(rootDirectory, "package.json");

  await prepareRelease({
    rootDirectory,
    version: "0.1.0-beta.0",
    dryRun: false,
  });

  const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
  assert.equal(packageJson.name, "basiq-ui");
  assert.equal(packageJson.version, "0.1.0-beta.0");
  assert.equal("private" in packageJson, false);
  assert.equal(packageJson.license, "MIT");
});

async function createFixture(context) {
  const rootDirectory = await mkdtemp(path.join(tmpdir(), "basiq-ui-release-test-"));
  context.after(() => rm(rootDirectory, { recursive: true, force: true }));
  await writeFile(
    path.join(rootDirectory, "package.json"),
    `${JSON.stringify(
      {
        name: "basiq-ui",
        version: "0.0.0",
        private: true,
        license: "MIT",
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  return rootDirectory;
}

function runCli(arguments_, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...arguments_], {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}
