import * as React from "react"

import { Tabs, TabsContent, TabsList, TabsSeparator, TabsTrigger, type TabDesign } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { List, ListItemCustom } from "@/components/ui/list"
import { Icon } from "@/components/ui/icon"
import { attachment, employee, inbox, notes, sysEnter2, error, alert } from "@/lib/fiori-icons"

import { defineFixtures } from "../fixture-types"

export const TABS_WIDTH = "40rem"

export type TabSpec = { text?: string; icon?: "inbox" | "employee" | "attachment" | "notes"; count?: string; design?: TabDesign; disabled?: boolean } | "|"
type Props = { tabs: TabSpec[]; selected: number; width?: string; overflowMode?: "end" | "startAndEnd"; list?: boolean; customStart?: boolean; customEnd?: boolean }
const icons = { inbox, employee, attachment, notes }

export const overflowTextTabs: TabSpec[] = Array.from({ length: 10 }, (_, i) => ({ text: `Section ${i + 1}` }))
export const overflowIconTabs: TabSpec[] = Array.from({ length: 10 }, (_, i) => ({ icon: (["inbox", "employee", "attachment", "notes"] as const)[i % 4], text: `Section ${i + 1}`, count: String(i + 2), design: i % 3 === 0 ? "positive" : i % 3 === 1 ? "critical" : "negative", disabled: i === 8 }))
const popupTabs: TabSpec[] = [{ icon: "inbox", text: "All" }, "|", { icon: "employee", text: "People", count: "8", design: "positive" }, { icon: "attachment", text: "Files", count: "3", design: "negative" }, { icon: "notes", text: "Notes", design: "critical" }, { text: "Locked", disabled: true }]
const semanticIcons = { positive: sysEnter2, negative: error, critical: alert }

// Static overflow surface, matching the real list painted in place by tabs.ui5.ts. Its opening,
// keyboard selection and focus restoration are exercised on the live component in tabs.spec.ts.
function OverflowSurface({ tabs }: { tabs: TabSpec[] }) {
  return <div style={{ padding: ".75rem", overflow: "hidden" }}>
    <div className="fiori-popup fiori-popover-surface fiori-tabs__popover" data-hide-arrow="" style={{ width: "15rem" }}>
      <div className="fiori-popup__root">
        <div className="fiori-tabs__overflow-list"><List selectionMode="single" separators="none" aria-label="Hidden tabs">
          {tabs.slice(1).map((tab, i) => {
            if (tab === "|") return <ListItemCustom key={i} disabled aria-hidden className="fiori-tabs__overflow-separator" />
            const semantic = semanticIcons[tab.design as keyof typeof semanticIcons]
            return <ListItemCustom key={i} value={`t${i + 1}`} disabled={tab.disabled} data-design={tab.design ?? "default"} className="fiori-tabs__overflow-item">
              <div className="fiori-tabs__overflow-wrapper" data-semantic=""><div className="fiori-tabs__overflow-content">
                {semantic && <Icon icon={semantic} className="fiori-tabs__overflow-semantic" />}
                {tab.icon && <Icon icon={icons[tab.icon]} className="fiori-tabs__overflow-icon" />}
                {tab.text}{tab.count && <>{"\u00a0("}{tab.count}{")"}</>}
              </div></div>
            </ListItemCustom>
          })}
        </List></div>
      </div>
    </div>
  </div>
}

const designs: TabDesign[] = ["positive", "negative", "critical", "neutral"]

export default defineFixtures<Props>({
  name: "tabs",
  cases: ([
    { id: "tabs-overflow-custom-end", props: { selected: 9, width: "30rem", tabs: overflowTextTabs, customEnd: true } },
    { id: "tabs-overflow-custom-start-end", props: { selected: 5, width: "30rem", tabs: overflowTextTabs, overflowMode: "startAndEnd", customStart: true, customEnd: true } },
    { id: "tabs-overflow-custom-start-empty", props: { selected: 0, width: "30rem", tabs: overflowTextTabs, overflowMode: "startAndEnd", customStart: true, customEnd: true } },
    { id: "tabs-overflow-end", props: { selected: 2, width: "30rem", tabs: overflowTextTabs } },
    { id: "tabs-overflow-end-selected-last", props: { selected: 9, width: "30rem", tabs: overflowTextTabs } },
    { id: "tabs-overflow-start-end", props: { selected: 5, width: "30rem", tabs: overflowTextTabs, overflowMode: "startAndEnd" } },
    { id: "tabs-overflow-icons", props: { selected: 2, width: "30rem", tabs: overflowIconTabs } },
    { id: "tabs-overflow-open", props: { selected: 0, width: "10rem", tabs: popupTabs, list: true } },
    { id: "tabs-text", props: { selected: 1, tabs: [{ text: "Info" }, { text: "Attachments" }, { text: "Notes" }, { text: "People" }] }, interact: { selector: '[role="tab"][aria-selected="true"]', ui5Selector: '[role="tab"][aria-selected="true"]' } },
    { id: "tabs-text-disabled", props: { selected: 0, tabs: [{ text: "Info" }, { text: "Attachments", disabled: true }, { text: "Notes" }] } },
    { id: "tabs-text-counts", props: { selected: 0, tabs: [{ text: "Info", count: "12" }, { text: "Attachments", count: "3" }, { text: "Notes" }] } },
    { id: "tabs-text-designs", props: { selected: 1, tabs: [{ text: "Default" }, ...designs.map((d) => ({ text: d[0].toUpperCase() + d.slice(1), design: d }))] } },
    { id: "tabs-text-separator", props: { selected: 0, tabs: [{ text: "Info" }, "|", { text: "Attachments" }, { text: "Notes" }] } },
    {
      id: "tabs-icons",
      props: { selected: 0, tabs: [{ icon: "inbox", text: "Inbox", count: "120" }, { icon: "employee", text: "People", count: "8" }, { icon: "attachment", text: "Files" }, { icon: "notes", text: "Notes", disabled: true }] },
    },
    { id: "tabs-icons-only", props: { selected: 1, tabs: [{ icon: "inbox" }, { icon: "employee" }, { icon: "attachment" }] } },
    {
      id: "tabs-icons-designs",
      props: { selected: 2, tabs: [{ icon: "inbox", text: "All", count: "20" }, ...designs.map((d, i) => ({ icon: (["employee", "attachment", "notes", "inbox"] as const)[i], text: d, count: String(i + 2), design: d }))] },
    },
    {
      id: "tabs-mixed",
      props: { selected: 2, tabs: [{ icon: "inbox", count: "20" }, "|", { text: "Approved", count: "10", design: "positive" }, { text: "Rejected", count: "4", design: "negative" }, { text: "Open", count: "6" }] },
    },
  ] satisfies import("../fixture-types").FixtureCase<Props>[]).flatMap((fixture, index) => index === 0 ? [fixture, { ...fixture, id: "tabs-rtl" }] : [fixture]),
  react: ({ tabs, selected, width = TABS_WIDTH, overflowMode, list, customStart, customEnd }) => {
    if (list) return <OverflowSurface tabs={tabs} />
    const value = (i: number) => `t${i}`
    return (
      <Tabs defaultValue={value(selected)} style={{ width }} overflowMode={overflowMode} startOverflowButton={customStart ? <Button>Previous</Button> : undefined} overflowButton={customEnd ? <Button>Next</Button> : undefined}>
        <TabsList aria-label="Sections">
          {tabs.map((t, i) =>
            t === "|" ? (
              <TabsSeparator key={i} />
            ) : (
              <TabsTrigger key={i} value={value(i)} icon={t.icon && icons[t.icon]} additionalText={t.count} design={t.design} disabled={t.disabled}>
                {t.text}
              </TabsTrigger>
            )
          )}
        </TabsList>
        {tabs.map((t, i) => t !== "|" && <TabsContent key={i} value={value(i)}>Content {i}</TabsContent>)}
      </Tabs>
    )
  },
})
