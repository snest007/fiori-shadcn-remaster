import * as React from "react"

import NoData from "@/lib/fiori-illustrations/NoData"
import NoFilterResults from "@/lib/fiori-illustrations/NoFilterResults"
import NoSearchResults from "@/lib/fiori-illustrations/NoSearchResults"
import PageNotFound from "@/lib/fiori-illustrations/PageNotFound"
import SuccessScreen from "@/lib/fiori-illustrations/SuccessScreen"
import UnableToLoad from "@/lib/fiori-illustrations/UnableToLoad"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { IllustratedMessage, type IllustratedMessageDesign } from "@/components/ui/illustrated-message"
import { Label } from "@/components/ui/label"
import { SegmentedButton, SegmentedButtonItem } from "@/components/ui/segmented-button"
import { Title } from "@/components/ui/title"

// Gallery of the standard Fiori empty and error states, each with the action SAP's guidelines pair it
// with. Sample texts come from the illustrations; pass titleText / subtitleText for your own.

type Size = "As designed" | IllustratedMessageDesign

const SIZES: Size[] = ["As designed", "Scene", "Dialog", "Spot", "Dot"]

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <Title level="H2" size="H4" className="mb-3">
      {children}
    </Title>
  )
}

function State({ id, className, children }: { id: string; className?: string; children: React.ReactNode }) {
  return (
    <Card id={`empty-states-${id}`} className={className} accessibleName={id.replaceAll("-", " ")}>
      {children}
    </Card>
  )
}

export default function EmptyStates() {
  const [size, setSize] = React.useState<Size>("As designed")
  const [retries, setRetries] = React.useState(0)
  const [cleared, setCleared] = React.useState(false)
  const design = (own: IllustratedMessageDesign) => (size === "As designed" ? own : size)
  const shared = { titleLevel: "H3" as const }

  return (
    <main className="mx-auto grid max-w-7xl gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Title level="H1" size="H2">Empty and error states</Title>
        <div className="flex items-center gap-2">
          <Label id="empty-states-size">Size</Label>
          <SegmentedButton aria-labelledby="empty-states-size" value={size} onValueChange={(v) => setSize(v as Size)}>
            {SIZES.map((s) => (
              <SegmentedButtonItem key={s} value={s}>{s}</SegmentedButtonItem>
            ))}
          </SegmentedButton>
        </div>
      </header>

      <section>
        <Heading>Full page</Heading>
        <State id="no-data">
          <IllustratedMessage {...shared} illustration={NoData} design={design("Scene")}>
            <Button variant="emphasized">Create Item</Button>
          </IllustratedMessage>
        </State>
      </section>

      <section>
        <Heading>Search and filter</Heading>
        <div className="grid gap-6 lg:grid-cols-2">
          <State id="no-search-results">
            <IllustratedMessage {...shared} illustration={NoSearchResults} design={design("Dialog")}>
              <Button>Clear Search</Button>
            </IllustratedMessage>
          </State>
          <State id="no-filter-results">
            <IllustratedMessage {...shared} illustration={NoFilterResults} design={design("Dialog")}>
              <Button onClick={() => setCleared(true)}>Clear Filters</Button>
              <p role="status" className="mt-2 text-center text-(--sapContent_LabelColor)">{cleared ? "Filters cleared" : ""}</p>
            </IllustratedMessage>
          </State>
        </div>
      </section>

      <section>
        <Heading>Errors</Heading>
        <div className="grid gap-6 lg:grid-cols-2">
          <State id="unable-to-load">
            <IllustratedMessage {...shared} illustration={UnableToLoad} design={design("Dialog")}>
              <Button variant="emphasized" onClick={() => setRetries((n) => n + 1)}>Retry</Button>
              <p role="status" className="mt-2 text-center text-(--sapContent_LabelColor)">
                {retries ? `Retried ${retries} ${retries === 1 ? "time" : "times"}` : ""}
              </p>
            </IllustratedMessage>
          </State>
          <State id="page-not-found">
            <IllustratedMessage {...shared} illustration={PageNotFound} design={design("Dialog")}>
              <Button>Go to Home</Button>
            </IllustratedMessage>
          </State>
        </div>
      </section>

      <section>
        <Heading>Small containers</Heading>
        <div className="flex flex-wrap items-start gap-6">
          <State id="success" className="w-96">
            <IllustratedMessage {...shared} illustration={SuccessScreen} design={design("Spot")} subtitleText="All your tasks are complete.">
              <Button>View Tasks</Button>
            </IllustratedMessage>
          </State>
          <State id="inline" className="w-80">
            <IllustratedMessage {...shared} illustration={NoData} design={design("Dot")} titleText="No items" subtitleText="Add one to get started." />
          </State>
        </div>
      </section>
    </main>
  )
}
