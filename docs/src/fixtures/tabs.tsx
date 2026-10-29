import { Tabs, TabsContent, TabsList, TabsSeparator, TabsTrigger, type TabDesign } from "@/components/ui/tabs"
import { attachment, employee, inbox, notes } from "@/lib/fiori-icons"

import { defineFixtures } from "../fixture-types"

export const TABS_WIDTH = "40rem"

export type TabSpec = { text?: string; icon?: "inbox" | "employee" | "attachment" | "notes"; count?: string; design?: TabDesign; disabled?: boolean } | "|"
type Props = { tabs: TabSpec[]; selected: number }
const icons = { inbox, employee, attachment, notes }

const designs: TabDesign[] = ["positive", "negative", "critical", "neutral"]

export default defineFixtures<Props>({
  name: "tabs",
  cases: [
    { id: "tabs-text", props: { selected: 1, tabs: [{ text: "Info" }, { text: "Attachments" }, { text: "Notes" }, { text: "People" }] } },
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
  ],
  react: ({ tabs, selected }) => {
    const value = (i: number) => `t${i}`
    return (
      <Tabs defaultValue={value(selected)} style={{ width: TABS_WIDTH }}>
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
