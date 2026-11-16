import { Link, type LinkDesign } from "@/components/ui/link"
import { calendar } from "@/lib/fiori-icons"

import { defineFixtures } from "../fixture-types"

type Props = { design: LinkDesign; disabled?: boolean; text?: string; width?: string; nowrap?: boolean; icon?: boolean; large?: boolean }

export default defineFixtures<Props>({
  name: "link",
  cases: ([
    { id: "link-default", props: { design: "default" } },
    { id: "link-subtle", props: { design: "subtle" } },
    { id: "link-emphasized", props: { design: "emphasized" } },
    { id: "link-disabled", props: { design: "default", disabled: true } },
    { id: "link-icon", props: { design: "default", icon: true } },
    { id: "link-large", props: { design: "default", large: true } },
    { id: "link-wrap", props: { design: "default", text: "A long link text that wraps onto the next line", width: "10rem" } },
    { id: "link-nowrap", props: { design: "default", text: "A long link text that is truncated", width: "10rem", nowrap: true } },
  ] satisfies import("../fixture-types").FixtureCase<Props>[]).flatMap((fixture, index) => index === 0 ? [fixture, { ...fixture, id: "link-rtl" }] : [fixture]),
  react: ({ design, disabled, text, width, nowrap, icon, large }) => (
    <Link
      href="#"
      design={design}
      disabled={disabled}
      wrappingType={nowrap ? "none" : "normal"}
      interactiveAreaSize={large ? "large" : "normal"}
      icon={icon ? calendar : undefined}
      style={width ? { width } : undefined}
    >
      {text ?? "Link text"}
    </Link>
  ),
})
