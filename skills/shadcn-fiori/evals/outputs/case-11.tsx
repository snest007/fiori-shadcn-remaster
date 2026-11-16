import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Toast } from "@/components/ui/toast"
import { Title } from "@/components/ui/title"

export default function SaveFeedbackPage() {
  const [name, setName] = React.useState("Alex Morgan")
  const [savedName, setSavedName] = React.useState("Alex Morgan")
  const [toastOpen, setToastOpen] = React.useState(false)
  const [saveCount, setSaveCount] = React.useState(0)
  const save = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSavedName(name.trim())
    setSaveCount((count) => count + 1)
    setToastOpen(true)
  }

  return (
    <main data-case="case-11" style={{ padding: "var(--sapContent_Space_M)", display: "grid", gap: "var(--sapContent_Space_S)", alignContent: "start" }}>
      <Title level="H1" size="H3">Profile</Title>
      <form onSubmit={save} style={{ display: "grid", gap: "var(--sapContent_Space_S)", justifyItems: "start" }}>
        <div style={{ display: "grid", gap: "var(--fiori-table-cell-vertical-padding)" }}>
          <Label htmlFor="profile-display-name" required>Display name</Label>
          <Input id="profile-display-name" required value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <Button type="submit" variant="emphasized" disabled={!name.trim()}>Save</Button>
      </form>
      <p>Saved display name: {savedName}</p>
      {/* Remount for each successful save so repeated saves restart the installed Toast's duration. */}
      <Toast key={saveCount} open={toastOpen} onOpenChange={setToastOpen} duration={3000}>Saved successfully.</Toast>
    </main>
  )
}
