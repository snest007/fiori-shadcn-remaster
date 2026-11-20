import { FioriLocaleProvider } from "@/lib/fiori-locale"
import { StepInput } from "@/components/ui/step-input"
import de from "../../../registry/i18n/de.json"
import { defineDemo } from "./types"

function LocaleDemo() {
  return <div id="locale-demo"><FioriLocaleProvider locale="de-DE" texts={de}><StepInput defaultValue={1.5} valuePrecision={1} aria-label="German quantity" /></FioriLocaleProvider><p><a href="#/i18n">Explore languages, text overrides and number parsing</a></p></div>
}

export default defineDemo({
  title: "Fiori locale", category: "Display", order: 99, Demo: LocaleDemo,
  docs: [{ name: "locale", description: "Set locale and optional SAP translations for child components. Text props override the provider; the application owns document direction.", props: [
    { name: "locale", type: "string", description: "BCP 47 language tag inherited by child components." },
    { name: "texts", type: "FioriTexts", description: "SAP-keyed strings, function texts or plural-category templates; nested providers inherit their parent table." },
    { name: "dir", type: '"ltr" | "rtl"', description: "Explicit direction returned by the locale hook; the provider does not mutate the document." },
  ] }],
})
