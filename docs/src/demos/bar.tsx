import { Bar } from "@/components/ui/bar"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Label } from "@/components/ui/label"
import { navBack, settings } from "@/lib/fiori-icons"

import { defineDemo } from "./types"

export default defineDemo({
  category: "Navigation",
  docs: [
    {
      name: "bar",
      description: "Header, subheader and footer bars with start, center and end content.",
      props: [
        { name: "Bar.design", type: "header | subheader | footer | floating-footer", description: "Bar presentation.", defaultValue: "header" },
        { name: "Bar.startContent", type: "ReactNode", description: "Content at the start of the bar." },
        { name: "Bar.children", type: "ReactNode", description: "Centered bar content." },
        { name: "Bar.endContent", type: "ReactNode", description: "Content at the end of the bar." },
      ],
    },
  ],
  title: "Bar",
  order: 60,
  Demo: () => (
    <div className="grid gap-3">
      <Bar
        startContent={<Button variant="transparent" size="icon" aria-label="Back"><Icon icon={navBack} /></Button>}
        endContent={<Button variant="transparent" size="icon" aria-label="Settings"><Icon icon={settings} /></Button>}
      >
        <Label>Header</Label>
      </Bar>
      <Bar design="subheader"><Label>Subheader</Label></Bar>
      <Bar design="footer" endContent={<><Button variant="emphasized">Submit</Button><Button>Cancel</Button></>} />
      <Bar design="floating-footer" endContent={<><Button variant="emphasized">Submit</Button><Button>Cancel</Button></>} />
    </div>
  ),
})
