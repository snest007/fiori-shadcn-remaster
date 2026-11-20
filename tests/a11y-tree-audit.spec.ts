import { execFileSync } from "node:child_process"
import { existsSync } from "node:fs"
import { expect, test } from "@playwright/test"

test("accessibility audit gap and unverified counts cannot rise", () => {
  expect(existsSync("tests/a11y-audit-baseline.json"), "E4 must create the initial audit ratchet before acceptance").toBe(true)
  expect(execFileSync(process.execPath, ["scripts/a11y-audit.mjs", "--check-baseline"], { encoding: "utf8" })).toContain("0 increased counts")
})
