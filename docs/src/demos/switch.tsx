import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

import { defineDemo } from "./types"

export default defineDemo({
  category: "Forms",
  docs: [
    {
      name: "switch",
      description: "A binary setting with textual or semantic graphical presentation.",
      props: [
        { name: "Switch.checked", type: "boolean", description: "Controlled on/off state." },
        { name: "Switch.onCheckedChange", type: "(checked: boolean) => void", description: "Receive on/off changes." },
        { name: "Switch.design", type: "textual | graphical", description: "Textual track or positive/negative icons.", defaultValue: "textual" },
        { name: "Switch.textOn / Switch.textOff", type: "string", description: "Short track text for each state." },
        { name: "Switch.readOnly", type: "boolean", description: "Keep focus and prevent toggling." },
      ],
    },
  ],

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
