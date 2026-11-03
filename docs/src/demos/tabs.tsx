import * as React from "react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsSeparator, TabsTrigger } from "@/components/ui/tabs"
import { attachment, employee, inbox, notes } from "@/lib/fiori-icons"

import { defineDemo } from "./types"

// Consumers may wrap a trigger in their own component; overflow reads the mounted trigger metadata.
function OrderSectionTrigger({ number, disabled }: { number: number; disabled?: boolean }) {
  return <TabsTrigger value={`section-${number}`} disabled={disabled}>Section {number}</TabsTrigger>
}

function TabsDemo() {
  const [value, setValue] = React.useState("info")
  const [overflowValue, setOverflowValue] = React.useState("section-3")
  return (
    <div id="tabs-demo" className="grid gap-6">
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
      <div id="tabs-overflow-demo" style={{ width: "100%", maxWidth: "70rem" }}>
        <Tabs value={overflowValue} onValueChange={setOverflowValue} overflowListAriaLabel="Hidden order sections">
          <TabsList aria-label="Overflow order sections">
            {Array.from({ length: 10 }, (_, i) => <OrderSectionTrigger key={i} number={i + 1} disabled={i === 7} />)}
          </TabsList>
          {Array.from({ length: 10 }, (_, i) => <TabsContent key={i} value={`section-${i + 1}`}>Order section {i + 1}.</TabsContent>)}
        </Tabs>
        <Button id="tabs-select-last" onClick={() => setOverflowValue("section-10")}>Select last section</Button>
      </div>
      <Tabs id="tabs-start-end-demo" defaultValue="section-6" overflowMode="startAndEnd" overflowListAriaLabel="Hidden mailbox sections" style={{ width: "30rem" }}>
        <TabsList aria-label="Start and end sections">
          {Array.from({ length: 10 }, (_, i) => <TabsTrigger key={i} value={`section-${i + 1}`}>Section {i + 1}</TabsTrigger>)}
        </TabsList>
        {Array.from({ length: 10 }, (_, i) => <TabsContent key={i} value={`section-${i + 1}`}>Mailbox section {i + 1}.</TabsContent>)}
      </Tabs>
      <Tabs id="tabs-custom-overflow-demo" defaultValue="section-6" overflowMode="startAndEnd" startOverflowButton={<Button aria-label="Previous sections">Previous sections</Button>} moreText="More sections" overflowMenuTitle="Choose a section" overflowListAriaLabel="Custom hidden sections" overflowButton={<Button aria-label="Choose sections">Choose sections</Button>} style={{ width: "30rem" }}>
        <TabsList aria-label="Custom overflow sections">
          {Array.from({ length: 10 }, (_, i) => <TabsTrigger key={i} value={`section-${i + 1}`}>Section {i + 1}</TabsTrigger>)}
        </TabsList>
        {Array.from({ length: 10 }, (_, i) => <TabsContent key={i} value={`section-${i + 1}`}>Custom section {i + 1}.</TabsContent>)}
      </Tabs>
      <Tabs id="tabs-long-overflow-demo" defaultValue="long-1" overflowListAriaLabel="Hidden long sections" style={{ width: "30rem" }}>
        <TabsList aria-label="Long overflow sections">
          {Array.from({ length: 30 }, (_, i) => <TabsTrigger key={i} value={`long-${i + 1}`}>Long section {i + 1}</TabsTrigger>)}
        </TabsList>
        {Array.from({ length: 30 }, (_, i) => <TabsContent key={i} value={`long-${i + 1}`}>Long content {i + 1}.</TabsContent>)}
      </Tabs>
      <Tabs id="tabs-empty-value-demo" defaultValue="empty-1" overflowListAriaLabel="Hidden empty-value sections" style={{ width: "30rem" }}>
        <TabsList aria-label="Empty-value overflow sections">
          {Array.from({ length: 9 }, (_, i) => <TabsTrigger key={i} value={`empty-${i + 1}`}>Empty section {i + 1}</TabsTrigger>)}
          <TabsTrigger value="">Empty value section</TabsTrigger>
        </TabsList>
        {Array.from({ length: 9 }, (_, i) => <TabsContent key={i} value={`empty-${i + 1}`}>Empty content {i + 1}.</TabsContent>)}
        <TabsContent value="">Content for the empty tab value.</TabsContent>
      </Tabs>
      <p className="text-(length:--sapFontSmallSize) text-(--sapContent_LabelColor)">
        Tabs keyboard: ←/→ move focus without selecting, Home/End jump, Enter or Space selects. Selected: <b>{value}</b>
      </p>
    </div>
  )
}

export default defineDemo({ title: "Tabs (IconTabBar)", order: 30, Demo: TabsDemo })
