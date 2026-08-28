import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import test from "node:test";

import { createPublishPlan, loadPublishPlan } from "./create-publish-plan.mjs";

const scriptPath = path.join(import.meta.dirname, "create-publish-plan.mjs");
const publishablePackage = {
  name: "basiq-ui",
  version: "0.1.0-beta.0",
  repository: {
    type: "git",
    url: "git+https://github.com/traP-jp/basiq-ui.git",
  },
  publishConfig: {
    access: "public",
    provenance: true,
  },
};

test("creates beta and stable publish plans", () => {
  assert.deepEqual(createPublishPlan(publishablePackage), {
    packageName: "basiq-ui",
    version: "0.1.0-beta.0",
    branchName: "release/v0.1.0-beta.0",
    tagName: "v0.1.0-beta.0",
    npmDistTag: "next",
    prerelease: true,
  });

  assert.deepEqual(createPublishPlan({ ...publishablePackage, version: "0.1.0" }), {
    packageName: "basiq-ui",
    version: "0.1.0",
    branchName: "release/v0.1.0",
    tagName: "v0.1.0",
    npmDistTag: "latest",
    prerelease: false,
  });

  assert.equal(
    createPublishPlan({
      ...publishablePackage,
      publishConfig: {
        ...publishablePackage.publishConfig,
        registry: "https://registry.npmjs.org/",
      },
    }).npmDistTag,
    "next",
  );
});

test("rejects packages that are not ready to publish", () => {
  const invalidPackages = [
    { ...publishablePackage, name: "other-package" },
    { ...publishablePackage, private: true },
    { ...publishablePackage, version: "0.1.0-alpha.0" },
    { ...publishablePackage, repository: { url: "https://example.com/repository.git" } },
    { ...publishablePackage, publishConfig: { access: "restricted", provenance: true } },
    { ...publishablePackage, publishConfig: { access: "public", provenance: false } },
    {
      ...publishablePackage,
      publishConfig: {
        access: "public",
        provenance: true,
        registry: "https://registry.example.com/",
      },
    },
  ];

  for (const packageJson of invalidPackages) {
    assert.throws(() => createPublishPlan(packageJson));
  }
});

test("loads the publish plan from package.json", async (context) => {
  const rootDirectory = await createFixture(context);
  assert.equal((await loadPublishPlan(rootDirectory)).npmDistTag, "next");
});

test("CLI prints JSON and rejects arguments", async (context) => {
  const rootDirectory = await createFixture(context);
  const result = await runCli([], rootDirectory);

  assert.equal(result.code, 0);
  assert.equal(result.stderr, "");
  assert.deepEqual(JSON.parse(result.stdout), createPublishPlan(publishablePackage));

  const invalidResult = await runCli(["--unexpected"], rootDirectory);
  assert.notEqual(invalidResult.code, 0);
  assert.equal(invalidResult.stdout, "");
  assert.match(invalidResult.stderr, /does not accept arguments/);
});

async function createFixture(context) {
  const rootDirectory = await mkdtemp(path.join(tmpdir(), "basiq-ui-publish-test-"));
  context.after(() => rm(rootDirectory, { recursive: true, force: true }));
  await writeFile(
    path.join(rootDirectory, "package.json"),
    `${JSON.stringify(publishablePackage, null, 2)}\n`,
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
