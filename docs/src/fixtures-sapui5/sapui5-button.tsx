import { Button } from "@/components/ui/button"
import { defineFixtures } from "../fixture-types"

type Props = { variant: "default" | "emphasized"; text: string }

export default defineFixtures<Props>({
  name: "sapui5-button",
  cases: [
    { id: "sapui5-button-default", props: { variant: "default", text: "Button" } },
    { id: "sapui5-button-emphasized", props: { variant: "emphasized", text: "Button" } },
  ],
  react: ({ variant, text }) => (
    // sap/m/themes/base/Button.less (.sapMBtn) adds .25rem/.1875rem vertical hit-area padding;
    // themelib_sap_horizon's Button.less sets cozy height to 2.75rem. Reproduce that transparent
    // fixture framing around our painted Button without changing either implementation's surface.
    <div className="inline-flex py-1 [[data-density=compact]_&]:py-[0.1875rem]">
      {/* Use the shared fixture field width on both controls. UI5 WC's cozy HC button padding
          is .6875rem; OpenUI5's Horizon Button.less uses .5625rem. An explicit public width
          compares their painted surfaces without changing either control's natural sizing. */}
      <Button variant={variant} className="w-(--w)">{text}</Button>
    </div>
  ),
})
