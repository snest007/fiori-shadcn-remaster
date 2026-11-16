import { Icon } from "@/components/ui/icon"
import { navigationRightArrow } from "@/lib/fiori-icons"
import { defineFixtures } from "../fixture-types"

export default defineFixtures({
  name: "icon",
  cases: ([{ id: "icon-navigation-arrow-rtl", props: {} }]).flatMap((fixture, index) => index === 0 ? [fixture, { ...fixture, id: "icon-rtl" }] : [fixture]),
  // Icon.js _dir and Icon.css.js mirror only icons with ltr:false metadata.
  react: () => <span dir="rtl" className="inline-flex text-(--sapContent_IconColor)"><Icon icon={navigationRightArrow} /></span>,
})
