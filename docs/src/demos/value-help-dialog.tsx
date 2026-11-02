import * as React from "react"

import { valueHelp } from "@/lib/fiori-icons"
import { Button } from "@/components/ui/button"
import { DialogTrigger } from "@/components/ui/dialog"
import { Icon } from "@/components/ui/icon"
import { Input, InputIcon } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCondition, ValueHelpDialog, type ValueHelpResult } from "@/components/ui/value-help-dialog"

import { productColumns, products } from "../fixtures/vhd-data"
import { defineDemo } from "./types"

function ValueHelpDialogDemo() {
  const [multi, setMulti] = React.useState<ValueHelpResult | null>(null)
  const [single, setSingle] = React.useState("")
  const multiText = multi ? [...multi.keys, ...multi.conditions.map(formatCondition)].join(", ") : ""
  return (
    <div className="grid max-w-xl grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2">
      <Label showColon htmlFor="value-help-dialog-demo-multi">Products</Label>
      <ValueHelpDialog
        title="Product"
        columns={productColumns}
        items={products}
        keyField="id"
        descriptionField="name"
        filters={productColumns}
        defaultValue={multi ?? undefined}
        onConfirm={setMulti}
      >
        <Input
          id="value-help-dialog-demo-multi"
          readOnly
          value={multiText}
          icon={
            <InputIcon>
              <DialogTrigger asChild>
                <Button variant="transparent" size="icon" id="value-help-dialog-demo-open" aria-label="Open value help">
                  <Icon icon={valueHelp} />
                </Button>
              </DialogTrigger>
            </InputIcon>
          }
        />
      </ValueHelpDialog>
      <Label showColon htmlFor="value-help-dialog-demo-single">Product</Label>
      <ValueHelpDialog
        title="Select: Product"
        selectionMode="single"
        columns={productColumns}
        items={products}
        keyField="id"
        descriptionField="name"
        onConfirm={(r) => setSingle(r.keys[0] ?? "")}
      >
        <Input
          id="value-help-dialog-demo-single"
          readOnly
          value={single}
          icon={
            <InputIcon>
              <DialogTrigger asChild>
                <Button variant="transparent" size="icon" id="value-help-dialog-demo-open-single" aria-label="Open single value help">
                  <Icon icon={valueHelp} />
                </Button>
              </DialogTrigger>
            </InputIcon>
          }
        />
      </ValueHelpDialog>
    </div>
  )
}

export default defineDemo({ title: "ValueHelpDialog", order: 67, Demo: ValueHelpDialogDemo })
