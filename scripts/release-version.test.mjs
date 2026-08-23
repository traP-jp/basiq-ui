import assert from "node:assert/strict";
import test from "node:test";

import {
  compareParsedReleaseVersions,
  createReleaseMetadata,
  parseReleaseVersion,
} from "./release-version.mjs";

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

test("creates release metadata", () => {
  assert.deepEqual(createReleaseMetadata("0.1.0-beta.0"), {
    version: "0.1.0-beta.0",
    branchName: "release/v0.1.0-beta.0",
    tagName: "v0.1.0-beta.0",
    npmDistTag: "next",
    prerelease: true,
  });
  assert.equal(createReleaseMetadata("0.1.0").npmDistTag, "latest");
});
