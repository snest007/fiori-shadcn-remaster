import { Form, FormGroup, FormItem } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Text } from "@/components/ui/text"

import { defineFixtures } from "../fixture-types"

/** 40rem = 640px: the M range (600–1024px). 30rem = S range. */
export const FORM_WIDTH_M = "40rem"
export const FORM_WIDTH_S = "30rem"

type Props = {
  width: string
  layout?: string
  labelSpan?: string
  groups?: boolean
  edit?: boolean
  header?: boolean
  itemSpacing?: "normal" | "large"
}

export const formData: { group: string; items: [string, string][] }[] = [
  { group: "Address", items: [["Name", "Red Point Stores"], ["Street", "Main St 1618"], ["City", "Walldorf"]] },
  { group: "Contact", items: [["Phone", "+49 6227 747474"], ["Email", "john@sap.com"]] },
]

export default defineFixtures<Props>({
  name: "form",
  cases: ([
    { id: "form-one-column", props: { width: FORM_WIDTH_M, header: true } },
    { id: "form-two-columns", props: { width: FORM_WIDTH_M, layout: "S1 M2 L2 XL3", groups: true, header: true } },
    { id: "form-label-span-top", props: { width: FORM_WIDTH_M, labelSpan: "S12 M12 L12 XL12", groups: true } },
    { id: "form-small", props: { width: FORM_WIDTH_S, groups: true } },
    { id: "form-edit", props: { width: FORM_WIDTH_M, layout: "S1 M2 L2 XL3", groups: true, edit: true, header: true } },
    { id: "form-label-span-6", props: { width: FORM_WIDTH_M, labelSpan: "S12 M6 L6 XL6", itemSpacing: "large" } },
  ] satisfies import("../fixture-types").FixtureCase<Props>[]).flatMap((fixture, index) => index === 0 ? [fixture, { ...fixture, id: "form-rtl" }] : [fixture]),
  react: ({ width, layout, labelSpan, groups, edit, header, itemSpacing }) => {
    const item = ([label, value]: [string, string], key: string) => (
      <FormItem key={key} label={<Label showColon htmlFor={edit ? key : undefined}>{label}</Label>}>
        {edit ? <Input id={key} defaultValue={value} /> : <Text>{value}</Text>}
      </FormItem>
    )
    return (
      <Form
        // 1rem: the font size the UI5 form inherits from its <body> (sets the line boxes around the texts).
        style={{ width, fontSize: "1rem" }}
        layout={layout}
        labelSpan={labelSpan}
        itemSpacing={itemSpacing}
        accessibleMode={edit ? "edit" : "display"}
        headerText={header ? "Supplier" : undefined}
      >
        {groups
          ? formData.map((g) => (
              <FormGroup key={g.group} headerText={g.group}>
                {g.items.map((it) => item(it, `form-fx-${width}-${g.group}-${it[0]}`))}
              </FormGroup>
            ))
          : formData.flatMap((g) => g.items).map((it) => item(it, `form-fx-${it[0]}`))}
      </Form>
    )
  },
})
