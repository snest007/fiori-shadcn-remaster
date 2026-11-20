# S4 accessibility candidate: FlexibleColumnLayout nested separator arrow

Owner: E4 (not merged when this defect was found). The candidate patch is **not applied**.

The start role="separator" contains a focusable layout-switch arrow. When its resize grip is visible,
the separator is focusable too; end-expanded layouts omit resize tabindex/value/name while retaining
the separator role and arrow. Axe reports nested-interactive in both structures.
Strict axe reports nested-interactive. This reproduces in the normal docs demo with
ThreeColumnsMidExpanded, independently of Storybook, and in a fresh real UI5 Web Components
2.28.1 instance at the same desktop width. UI5 has the same problem.

Sources:

- registry/ui/flexible-column-layout.tsx: separatorProps, start-separator JSX and onSeparatorKeyDown.
- node_modules/@ui5/webcomponents-fiori/dist/FlexibleColumnLayoutTemplate.js:
  the start separator contains arrowStart() and gripStart().
- node_modules/@ui5/webcomponents-fiori/dist/FlexibleColumnLayout.js:
  startSeparatorTabIndex, _onSeparatorKeydown, _onArrowKeydown, startSeparatorValue.
- UI5's generated FlexibleColumnLayout CSS keeps the separator focus outline, full-height drag area,
  top-positioned arrow and arrow-specific grip hover decoration.

Evidence: .integration/S4-evidence/fourth-resume-20261118/fcl-component-diagnostic.json and
fcl-component-direct-diagnostic.log. The React reproduction uses the demo's real layout select.
The UI5 reproduction uses the installed component with ordinary content/layout/size properties;
its roles and ARIA are not modified. The full fixture page also contains unrelated open modal fixtures,
so the accessibility reproduction isolates a fresh UI5 instance rather than auditing a hidden cell.

0001-flexible-column-layout-sibling-arrow.patch proposes a neutral positioning frame around
the existing semantic separator and its arrow as siblings. Both remain focusable and named;
separator value/orientation, resize handlers/ref, arrow callback and keyboard handling stay intact.
The CSS portion preserves the arrow-specific hover decoration. git apply --check passes.
No component runtime or CSS source was changed by S4.

The owning implementation must prove the proposal with:

1. Strict axe on ThreeColumnsMidExpanded and ThreeColumnsStartHiddenMidExpanded, including
   live layout Controls, custom labels and RTL; both controls remain independently reachable/named.
2. tests/flexible-column-layout.spec.ts: pointer and keyboard resize, focus retention, arrow
   layout switching, minimum-width constraints, Home/End and RTL.
3. All affected UI5 pixel fixtures, focus/hover states, four themes and two densities with unchanged
   dimensions/tolerance. Neutral wrapper positioning and hover inheritance need real visual validation.
4. Accessibility-tree comparison: document the reproduced UI5 bug when justifying the sibling
   semantic structure; do not trim separator ARIA or remove the arrow from the keyboard model.

S4's temporary marker is the self-contained // S4 block in tests-storybook/known-issues.ts.
It checks the actual component-owned start separator and its single visible native arrow, the exact
labels, orientation, children and arrow focusability, only on the four desktop arrow layouts in
explicit S4 stories. Mid-expanded layouts require a visible grip, tabindex=0 and a numeric current
value. End-expanded layouts require the grip hidden and resize tabindex/value absent; the default
separator label is absent as in UI5. For live Controls, the exact layout argument must match the
component state. Hidden or arrowless separators need no marker. Other nodes/rules, unknown stories,
extra focusable descendants and changed labels remain unexpected. Remove the marker after the fix.

Second and last marker hypothesis: remove the incorrect assumption that every visible arrow's
separator has a visible resize grip, and validate the two exact source-backed structures instead.
All layout Control choices in Morning/HCB pass:
2 passed, 0 failed, 0 flaky, 0 skipped (11.6s).

Fresh outside-Storybook evidence in .integration/S4-evidence/fourth-owner-20261118/
fcl-marker-diagnostic.json compares the ordinary React demo and an isolated installed UI5 instance
in all four arrow layouts. Both reproduce the same defect in every one. OneColumn and
MidColumnFullScreen report no nested-interactive violation. The live Control matrix also confirms
that all other choices have no offending arrow/visible separator combination and no such violation.
The candidate patch remains unapplied and still passes git apply --check.
