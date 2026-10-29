import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

import { defineDemo } from "./types"

export default defineDemo({
  title: "Switch",
  order: 32,
  Demo: () => (
    <div className="grid max-w-md grid-cols-[auto_1fr] items-center gap-x-4">
      <Label htmlFor="wifi" showColon>Wi-Fi</Label>
      <Switch id="wifi" defaultChecked />
      <Label htmlFor="sync" showColon>Sync</Label>
      <Switch id="sync" textOn="On" textOff="Off" />
      <Label htmlFor="approve" showColon>Approve</Label>
      <Switch id="approve" design="graphical" defaultChecked />
      <Label htmlFor="locked" showColon>Locked</Label>
      <Switch id="locked" readOnly defaultChecked />
      <Label htmlFor="off" showColon>Disabled</Label>
      <Switch id="off" disabled />
    </div>
  ),
})
