import { ProductSwitch, ProductSwitchItem } from "@/components/ui/product-switch"
import { home, customer, product, settings, travelExpense, sysHelp, actionSettings, grid } from "@/lib/fiori-icons"

import { defineFixtures } from "../fixture-types"

export const PRODUCTS = [
  { icon: "home", title: "Home", subtitle: "Central Home" },
  { icon: "customer", title: "Customers", subtitle: "CRM" },
  { icon: "product", title: "Products", subtitle: "Catalog" },
  { icon: "travel-expense", title: "Travel & Expenses", subtitle: "Concur" },
  { icon: "settings", title: "Settings" },
  { icon: "sys-help", title: "Support", subtitle: "Help Portal" },
  { icon: "action-settings", title: "Administration", subtitle: "Cloud Identity Services" },
  { icon: "grid", title: "All Applications" },
] as const

export const productIcons = {
  home,
  customer,
  product,
  "travel-expense": travelExpense,
  settings,
  "sys-help": sysHelp,
  "action-settings": actionSettings,
  grid,
}

type Props = { count: number; selected?: number }

export default defineFixtures<Props>({
  name: "product-switch",
  cases: ([
    { id: "product-switch-2", props: { count: 2 } },
    { id: "product-switch-3col", props: { count: 5, selected: 1 } },
    { id: "product-switch-4col", props: { count: 8 } },
  ] satisfies import("../fixture-types").FixtureCase<Props>[]).flatMap((fixture, index) => index === 0 ? [fixture, { ...fixture, id: "product-switch-rtl" }] : [fixture]),
  react: ({ count, selected }) => (
    <ProductSwitch>
      {PRODUCTS.slice(0, count).map((p, i) => (
        <ProductSwitchItem
          key={p.title}
          icon={productIcons[p.icon]}
          titleText={p.title}
          subtitleText={"subtitle" in p ? p.subtitle : undefined}
          selected={i === selected}
        />
      ))}
    </ProductSwitch>
  ),
})
