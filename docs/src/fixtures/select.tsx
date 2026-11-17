import type { ValueState } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FioriLocaleProvider } from "@/lib/fiori-locale"
import de from "../../../registry/i18n/de.json"
import zh from "../../../registry/i18n/zh-CN.json"
import ar from "../../../registry/i18n/ar.json"

import { defineFixtures, readPageOptions } from "../fixture-types"

type Props = { options: string[]; groups?: { label: string; options: string[] }[]; selected: string; valueState?: ValueState; disabled?: boolean; locale?: string }
const states = ["negative", "critical", "positive", "information"] as const
const grouped = { options: ["Standalone"], groups: [{ label: "First", options: ["Alpha", "Beta"] }, { label: "Second", options: ["Gamma"] }], selected: "Standalone" }

export default defineFixtures<Props>({
  name: "select",
  cases: ([
    { id: "select", props: { options: ["Germany", "France", "China"], selected: "Germany" } },
    { id: "select-grouped", props: grouped },
    { id: "select-grouped-rtl", props: grouped },
    ...["de-DE", "zh-CN", "ar-EG"].map(locale => ({ id: `select-l10n-${locale}`, props: { ...grouped, locale } })),
    ...states.map((valueState) => ({ id: `select-${valueState}`, props: { options: ["Germany", "France"], selected: "Germany", valueState } })),
    { id: "select-disabled", props: { options: ["Germany", "France"], selected: "Germany", disabled: true } },
  ] satisfies import("../fixture-types").FixtureCase<Props>[]).flatMap((fixture, index) => index === 0 ? [fixture, { ...fixture, id: "select-rtl" }] : [fixture]).filter(fixture => !fixture.id.includes("-l10n-") || ("locale" in fixture.props && fixture.props.locale === readPageOptions().locale)),
  react: ({ options, groups, selected, valueState, disabled, locale }) => {
    const content = (
    <Select defaultValue={selected} disabled={disabled}>
      <SelectTrigger wrapperClassName="w-(--w)" valueState={valueState} valueStateMessage={null} disabled={disabled} aria-label="Select">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        {groups?.map(group => <SelectGroup key={group.label}><SelectLabel>{group.label}</SelectLabel>{group.options.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectGroup>)}
      </SelectContent>
    </Select>
    )
    return locale ? <FioriLocaleProvider locale={locale} texts={locale === "de-DE" ? de : locale === "zh-CN" ? zh : ar}>{content}</FioriLocaleProvider> : content
  },
})
