import NoData from "@/lib/fiori-illustrations/NoData"
import NoSearchResults from "@/lib/fiori-illustrations/NoSearchResults"
import UnableToLoad from "@/lib/fiori-illustrations/UnableToLoad"
import SuccessScreen from "@/lib/fiori-illustrations/SuccessScreen"
import Tent from "@/lib/fiori-illustrations/Tent"
import SuccessBalloon from "@/lib/fiori-illustrations/SuccessBalloon"
import TntSuccess from "@/lib/fiori-illustrations/tnt/Success"
import { Button } from "@/components/ui/button"
import { IllustratedMessage, type IllustratedMessageDesign } from "@/components/ui/illustrated-message"

import { defineFixtures } from "../fixture-types"

export const illustrations = { NoData, NoSearchResults, UnableToLoad, SuccessScreen, Tent, SuccessBalloon, TntSuccess }
export type IllustrationName = keyof typeof illustrations

type Props = {
  name: IllustrationName
  design: IllustratedMessageDesign
  width: string
  title?: string
  subtitle?: string
  action?: string
}

export default defineFixtures<Props>({
  name: "illustrated-message",
  cases: ([
    { id: "illustrated-message-scene", props: { name: "NoData", design: "Scene", width: "44rem", action: "Create" } },
    { id: "illustrated-message-dialog", props: { name: "UnableToLoad", design: "Dialog", width: "30rem", action: "Retry" } },
    { id: "illustrated-message-spot", props: { name: "NoSearchResults", design: "Spot", width: "22rem" } },
    { id: "illustrated-message-dot", props: { name: "Tent", design: "Dot", width: "16rem", title: "No files found", subtitle: "Drop files here" } },
    { id: "illustrated-message-base", props: { name: "SuccessScreen", design: "Base", width: "10rem", action: "Hidden in Base" } },
    { id: "illustrated-message-auto-spot", props: { name: "SuccessScreen", design: "Auto", width: "20rem" } },
    { id: "illustrated-message-auto-dot", props: { name: "NoData", design: "Auto", width: "15rem" } },
    { id: "illustrated-message-patterns", props: { name: "SuccessBalloon", design: "Spot", width: "22rem" } },
    { id: "illustrated-message-tnt", props: { name: "TntSuccess", design: "Dialog", width: "30rem", title: "All set", subtitle: "Your account is ready." } },
  ] satisfies import("../fixture-types").FixtureCase<Props>[]).flatMap((fixture, index) => index === 0 ? [fixture, { ...fixture, id: "illustrated-message-rtl" }] : [fixture]),
  react: ({ name, design, width, title, subtitle, action }) => (
    <IllustratedMessage illustration={illustrations[name]} design={design} titleText={title} subtitleText={subtitle} style={{ width }}>
      {action && <Button variant="emphasized">{action}</Button>}
    </IllustratedMessage>
  ),
})
