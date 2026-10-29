import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { accept, decline, edit } from "@/lib/fiori-icons"

import { defineDemo } from "./types"

export default defineDemo({
  title: "Button",
  order: 10,
  Demo: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="emphasized">Save</Button>
      <Button>Cancel</Button>
      <Button variant="transparent">Transparent</Button>
      <Button variant="positive"><Icon icon={accept} />Approve</Button>
      <Button variant="negative"><Icon icon={decline} />Reject</Button>
      <Button variant="attention">Attention</Button>
      <Button size="icon" variant="transparent" aria-label="Edit"><Icon icon={edit} /></Button>
      <Button disabled>Disabled</Button>
    </div>
  ),
})
