import { Bar } from "@/components/ui/bar"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Label } from "@/components/ui/label"
import { navBack, settings } from "@/lib/fiori-icons"

import { defineDemo } from "./types"

export default defineDemo({
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
