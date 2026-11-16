import { Toast } from "@/components/ui/toast"

import { defineFixtures } from "../fixture-types"

type Props = { text: string; width: string }

// The toast is rendered open in place (portal={false}, no fixed placement) and with an infinite
// duration so it never fades while being screenshotted. UI5's side shows a closed ui5-toast in place
// (toast.ui5.ts). Widths are fixed so cells stay on whole pixels. Timing, pause-on-hover and placement
// are tested in tests/toast.spec.ts.
export default defineFixtures<Props>({
  name: "toast",
  cases: ([
    { id: "toast", props: { text: "Item saved", width: "8rem" } },
    { id: "toast-wrapping", props: { text: "The changes were saved and the approvers have been notified.", width: "15rem" } },
  ] satisfies import("../fixture-types").FixtureCase<Props>[]).flatMap((fixture, index) => index === 0 ? [fixture, { ...fixture, id: "toast-rtl" }] : [fixture]),
  react: ({ text, width }) => (
    <div className="p-3">
      <Toast open portal={false} duration={Infinity} style={{ width }}>{text}</Toast>
    </div>
  ),
})
