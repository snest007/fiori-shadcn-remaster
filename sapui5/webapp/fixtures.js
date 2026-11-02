// Dev-only OpenUI5 oracle; keep ids/props aligned with fixtures-sapui5/sapui5-button.tsx.
sap.ui.define(["sap/m/Button"], (Button) => [{
  name: "sapui5-button",
  cases: [
    { id: "sapui5-button-default", props: { variant: "default", text: "Button" } },
    { id: "sapui5-button-emphasized", props: { variant: "emphasized", text: "Button" } },
  ],
  render: ({ variant, text }, cell) => {
    // FIELD_WIDTH from docs/src/fixture-types.ts, used as an explicit width on both sides.
    new Button({ text, width: "13.125rem", type: variant === "emphasized" ? "Emphasized" : "Default" }).placeAt(cell)
  },
}])
