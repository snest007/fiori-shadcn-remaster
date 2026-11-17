# Usage skill evaluation evidence

`evals.json` is hand-written. The offline runner validates registry names, avoidance edges and floorplan-picker rows; it does not interpret prompts. The 27 cases cover all seven blocks and the look-alike groups named in G0–G4. A separate fresh subject read only the generated skill and neutral prompts for manual choices, then only the generated skill and actual shadcn-installed consumer sources for the six pages. It did not read repository demos or tests.

The initial manual read matched all expected items in 26/27 cases. In case-11 it chose the correct Toast and omitted the supporting Button. Expectations were preserved. This manual sanity check is not a CI gate.

The first output gate stopped before compilation because case-01 re-composed the installed floorplan without importing `list-report`. Inspection found the same issue in case-02, which that gate did not reach. Both were corrected to directly render the installed block. The original case-03, case-08, case-10 and case-11 files were unchanged. No compiler, build, page or console errors were observed in the second passing gate.

The ListReport and ObjectPageBlock templates accept no data, section or action props. The corrected case-01 and case-02 wrappers therefore retain the shipped product and sales-order sample domains; they demonstrate buildable floorplan use and are not complete purchase-order or supplier applications. Case-03 matches the installed product wizard and uses its local sample completion flow. The component-choice pages use deterministic sample data and local state.

Outputs are hand-recorded evidence, not snapshots to keep green by editing. Re-record them in fresh skill-and-installed-source-only context when guidance changes materially. `scripts/eval-skill-build.mjs` installs actual imported items in a fresh consumer, requires expected runtime imports, rejects excluded imports, typechecks, builds and renders every page in Chromium. This gate is required for integration PASS next to the existing smoke installation.
