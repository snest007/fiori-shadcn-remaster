import * as React from "react"

import { Button } from "@/components/ui/button"
import { ProductSwitch, ProductSwitchItem } from "@/components/ui/product-switch"
import { Popover, PopoverBody, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { actionSettings, customer, grid, home, product, settings, sysHelp, travelExpense } from "@/lib/fiori-icons"

import { defineDemo } from "./types"

const products = [
  { icon: home, title: "Home", subtitle: "Central Home" },
  { icon: customer, title: "Customers", subtitle: "CRM" },
  { icon: product, title: "Products", subtitle: "Catalog" },
  { icon: travelExpense, title: "Travel & Expenses", subtitle: "Concur" },
  { icon: settings, title: "Settings" },
  { icon: sysHelp, title: "Support", subtitle: "Help Portal" },
  { icon: actionSettings, title: "Administration" },
  { icon: grid, title: "All Applications" },
]

function ProductSwitchDemo() {
  const [last, setLast] = React.useState("none")
  return (
    <div className="grid justify-items-start gap-3">
      <Popover>
        <PopoverTrigger asChild>
          <Button id="product-switch-demo-open">Open products</Button>
        </PopoverTrigger>
        <PopoverContent side="bottom" hideArrow aria-label="Products" className="max-w-none">
          <PopoverBody className="p-0">
            <ProductSwitch id="product-switch-demo">
              {products.map((p) => (
                <ProductSwitchItem key={p.title} icon={p.icon} titleText={p.title} subtitleText={p.subtitle} onClick={() => setLast(p.title)} />
              ))}
            </ProductSwitch>
          </PopoverBody>
        </PopoverContent>
      </Popover>
      <span id="product-switch-demo-last" className="text-(--sapContent_LabelColor)">{`Last product: ${last}`}</span>
    </div>
  )
}

export default defineDemo({
  category: "Navigation",
  docs: [
    {
      name: "product-switch",
      description: "Keyboard-navigable product tiles with links and activation callbacks.",
      props: [
        { name: "ProductSwitch.accessibleName", type: "string", description: "Accessible name of the product list.", defaultValue: "Products" },
        { name: "ProductSwitchItem.titleText", type: "string", description: "Product title." },
        { name: "ProductSwitchItem.subtitleText", type: "string", description: "Secondary product text." },
        { name: "ProductSwitchItem.icon", type: "FioriIconData", description: "Product icon." },
        { name: "ProductSwitchItem.targetSrc", type: "string", description: "Destination that makes the tile a link." },
        { name: "ProductSwitchItem.onClick", type: "(event: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => void", description: "Receive product activation by pointer or keyboard." },
      ],
    },
  ], title: "Product Switch", order: 61, Demo: ProductSwitchDemo })
