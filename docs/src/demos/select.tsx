import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { defineDemo } from "./types"

export default defineDemo({
  category: "Forms", title: "Select accessibility texts", order: 34,
  docs: [{ name: "select", description: "Override the role, grouped-choice and selection-position descriptions.", props: [{ name: "Select.texts", type: "Partial<SelectTexts>", description: "Override screen-reader role, group counts and selected option positions." }] }],
  Demo: () => <div id="select-a11y-demo"><Select defaultValue="Germany" texts={{ roleDescription: "Country selector", optionsInGroups: (count, groups) => `${count} choices in ${groups} sections`, itemPosition: (position, count) => `Choice ${position} from ${count}` }}><SelectTrigger aria-label="Country"><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="Germany">Germany</SelectItem><SelectItem value="France">France</SelectItem></SelectGroup><SelectGroup><SelectItem value="China">China</SelectItem></SelectGroup></SelectContent></Select></div>,
})
