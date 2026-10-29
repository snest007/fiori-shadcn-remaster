import * as React from "react"

import { Tabs, TabsContent, TabsList, TabsSeparator, TabsTrigger } from "@/components/ui/tabs"
import { attachment, employee, inbox, notes } from "@/lib/fiori-icons"

import { defineDemo } from "./types"

function TabsDemo() {
  const [value, setValue] = React.useState("info")
  return (
    <div className="grid gap-6">
      <Tabs value={value} onValueChange={setValue}>
        <TabsList aria-label="Order sections" id="demo-tabs-text">
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="items" additionalText="12">Items</TabsTrigger>
          <TabsTrigger value="approvals" design="positive">Approvals</TabsTrigger>
          <TabsTrigger value="locked" disabled>Locked</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>
        <TabsContent value="info">General information about the order.</TabsContent>
        <TabsContent value="items">12 line items.</TabsContent>
        <TabsContent value="approvals">All approvals granted.</TabsContent>
        <TabsContent value="locked">Not available.</TabsContent>
        <TabsContent value="notes">No notes yet.</TabsContent>
      </Tabs>
      <Tabs defaultValue="inbox">
        <TabsList aria-label="Mailbox">
          <TabsTrigger value="inbox" icon={inbox} additionalText="120">Inbox</TabsTrigger>
          <TabsTrigger value="people" icon={employee} additionalText="8" design="critical">People</TabsTrigger>
          <TabsSeparator />
          <TabsTrigger value="files" icon={attachment} design="negative">Files</TabsTrigger>
          <TabsTrigger value="notes" icon={notes} design="neutral">Notes</TabsTrigger>
        </TabsList>
        <TabsContent value="inbox">120 messages</TabsContent>
        <TabsContent value="people">8 people</TabsContent>
        <TabsContent value="files">Attachments</TabsContent>
        <TabsContent value="notes">Notes</TabsContent>
      </Tabs>
      <p className="text-(length:--sapFontSmallSize) text-(--sapContent_LabelColor)">
        Tabs keyboard: ←/→ move focus without selecting, Home/End jump, Enter or Space selects. Selected: <b>{value}</b>
      </p>
    </div>
  )
}

export default defineDemo({ title: "Tabs (IconTabBar)", order: 30, Demo: TabsDemo })
