# S4 accessibility candidate: FlexibleColumnLayout nested separator arrow

Owner: E4 (not merged when this defect was found). The candidate patch is **not applied**.

The focusable start role="separator" contains a second focusable control, its layout-switch arrow.
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
It checks the actual component-owned start separator, its exact labels, visible grip, single native
arrow, roles/orientation/value and focusability, in explicitly named S4 stories. For a live primary
Control it additionally checks the exact layout argument and component state. Other nodes/rules,
unknown stories, extra focusable descendants and changed labels remain unexpected. Remove this
marker when the component fix lands.

Verification status at this fourth-attempt stop: the marker is provisional. Its first live Controls
check still reports nested-interactive on a separator configuration without the resizable attributes
required by the predicate. No second hypothesis was attempted because the separately confirmed
shared Show code defect invokes S4's stop rule. This candidate/marker is not an acceptance pass;
the owning repair must finish exact matching checks.
