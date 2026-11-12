import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { accept, decline, edit } from "@/lib/fiori-icons"

import { defineDemo } from "./types"

export default defineDemo({
  category: "Actions",
  docs: [
    {
      name: "button",
      description: "Fiori actions with semantic designs, text and icons.",
      props: [
        { name: "Button.variant", type: "default | emphasized | transparent | positive | negative | attention", description: "Semantic appearance of the action.", defaultValue: "default" },
        { name: "Button.size", type: "default | icon", description: "Use icon for a square icon-only action.", defaultValue: "default" },
        { name: "Button.disabled", type: "boolean", description: "Disable activation." },
        { name: "Button.asChild", type: "boolean", description: "Apply button styles and behavior to a single child element.", defaultValue: "false" },
      ],
    },
  ],

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
