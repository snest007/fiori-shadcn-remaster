import * as React from "react"

import { Bar } from "@/components/ui/bar"
import { Button } from "@/components/ui/button"
import { FlexibleColumnLayout, useFlexibleColumnLayout, type FCLColumnActions } from "@/components/ui/flexible-column-layout"
import { Icon } from "@/components/ui/icon"
import { Input, InputIcon } from "@/components/ui/input"
import { List, ListItemStandard } from "@/components/ui/list"
import { Tag } from "@/components/ui/tag"
import { decline, exitFullScreen, fullScreen, product as productIcon, search } from "@/lib/fiori-icons"

// Fiori "Flexible Column Layout" app: products (begin column) -> product object view (mid column)
// -> sales order line item (end column). Navigation follows the Fiori rules via useFlexibleColumnLayout.

type LineItem = { id: string; customer: string; quantity: number; date: string; status: "Delivered" | "In Process" | "Cancelled" }
type Product = {
  id: string
  name: string
  category: string
  supplier: string
  price: number
  stock: number
  weight: string
  dimensions: string
  description: string
  orders: LineItem[]
}

const products: Product[] = [
  {
    id: "HT-1000",
    name: "Notebook Basic 15",
    category: "Laptops",
    supplier: "Very Best Screens",
    price: 956,
    stock: 25,
    weight: "4.2 KG",
    dimensions: "30 x 18 x 3 cm",
    description: "Notebook Basic 15 with 2.80 GHz quad core, 15\" LCD, 4 GB DDR3 RAM, 500 GB hard disc, Windows 8 Pro.",
    orders: [
      { id: "SO-0500000001", customer: "SAP", quantity: 2, date: "Jan 12, 2026", status: "Delivered" },
      { id: "SO-0500000014", customer: "Becker Berlin", quantity: 1, date: "Feb 3, 2026", status: "In Process" },
    ],
  },
  {
    id: "HT-1001",
    name: "Notebook Basic 17",
    category: "Laptops",
    supplier: "Very Best Screens",
    price: 1249,
    stock: 4,
    weight: "4.5 KG",
    dimensions: "29 x 17 x 3.1 cm",
    description: "Notebook Basic 17 with 2.80 GHz quad core, 17\" LCD, 4 GB DDR3 RAM, 500 GB hard disc, Windows 8 Pro.",
    orders: [{ id: "SO-0500000022", customer: "Talpa", quantity: 3, date: "Mar 9, 2026", status: "Cancelled" }],
  },
  {
    id: "HT-1010",
    name: "Notebook Professional 15",
    category: "Laptops",
    supplier: "Ultrasonic United",
    price: 1999,
    stock: 0,
    weight: "4.3 KG",
    dimensions: "33 x 20 x 3 cm",
    description: "Notebook Professional 15 with 2.80 GHz quad core, 15\" Multitouch LCD, 8 GB DDR3 RAM, 500 GB SSD.",
    orders: [
      { id: "SO-0500000031", customer: "Asia High tech", quantity: 5, date: "Apr 2, 2026", status: "In Process" },
      { id: "SO-0500000037", customer: "Laptops Ltd", quantity: 1, date: "Apr 20, 2026", status: "Delivered" },
    ],
  },
  {
    id: "HT-1030",
    name: "Flat Future",
    category: "Flat Screen Monitors",
    supplier: "Very Best Screens",
    price: 799,
    stock: 120,
    weight: "4.2 KG",
    dimensions: "39 x 4 x 31 cm",
    description: "Optimum Hi-Resolution max. 1920 x 1080 @ 85Hz, Dot Pitch: 0.27 mm.",
    orders: [{ id: "SO-0500000045", customer: "Panorama Studios", quantity: 10, date: "May 15, 2026", status: "Delivered" }],
  },
  {
    id: "HT-1063",
    name: "Ergonomic Keyboard",
    category: "Keyboards",
    supplier: "Technocom",
    price: 49,
    stock: 340,
    weight: "0.9 KG",
    dimensions: "52 x 19 x 4 cm",
    description: "Ergonomic USB keyboard for desktop, plug and play.",
    orders: [{ id: "SO-0500000052", customer: "SAP", quantity: 40, date: "Jun 1, 2026", status: "In Process" }],
  },
  {
    id: "HT-1072",
    name: "Wireless Mouse",
    category: "Mice",
    supplier: "Technocom",
    price: 29,
    stock: 512,
    weight: "0.1 KG",
    dimensions: "10 x 6 x 3 cm",
    description: "Wireless optical mouse with 5 buttons and scroll wheel.",
    orders: [],
  },
]

const currency = (n: number) => `${n.toLocaleString("en-US")} EUR`
const statusDesign = { Delivered: "positive", "In Process": "information", Cancelled: "negative" } as const

function ColumnHeader({ title, actions }: { title: string; actions?: FCLColumnActions }) {
  const tool = (label: string, icon: typeof decline, onClick?: () => void) =>
    onClick && (
      <Button variant="transparent" size="icon" aria-label={label} title={label} onClick={onClick}>
        <Icon icon={icon} />
      </Button>
    )
  return (
    <Bar
      endContent={
        actions && (
          <>
            {tool("Enter Full Screen Mode", fullScreen, actions.fullScreen)}
            {tool("Exit Full Screen Mode", exitFullScreen, actions.exitFullScreen)}
            {tool("Close", decline, actions.closeColumn)}
          </>
        )
      }
    >
      <h2 className="m-0 truncate font-(family-name:--sapFontHeaderFamily) text-(length:--sapFontHeader5Size) font-normal text-(--sapGroup_TitleTextColor)">
        {title}
      </h2>
    </Bar>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <dt className="text-(length:--sapFontSize) text-(--sapContent_LabelColor)">{label}:</dt>
      <dd className="m-0 text-(length:--sapFontSize) text-(--sapTextColor)">{children}</dd>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 px-8 py-4">
      <h3 className="m-0 font-(family-name:--sapFontHeaderFamily) text-(length:--sapFontHeader5Size) font-normal text-(--sapGroup_TitleTextColor)">{title}</h3>
      {children}
    </section>
  )
}

export default function MasterDetail() {
  const fcl = useFlexibleColumnLayout()
  const [query, setQuery] = React.useState("")
  const [productId, setProductId] = React.useState<string>()
  const [orderId, setOrderId] = React.useState<string>()
  const product = products.find((p) => p.id === productId)
  const order = product?.orders.find((o) => o.id === orderId)
  const q = query.trim().toLowerCase()
  const shown = products.filter((p) => !q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))

  // Closing a column also forgets what it showed.
  const midActions: FCLColumnActions = {
    ...fcl.actions.midColumn,
    closeColumn: fcl.actions.midColumn.closeColumn && (() => (fcl.actions.midColumn.closeColumn!(), setProductId(undefined), setOrderId(undefined))),
  }
  const endActions: FCLColumnActions = {
    ...fcl.actions.endColumn,
    closeColumn: fcl.actions.endColumn.closeColumn && (() => (fcl.actions.endColumn.closeColumn!(), setOrderId(undefined))),
  }

  return (
    <div className="flex h-svh flex-col bg-(--sapBackgroundColor) font-(family-name:--sapFontFamily)">
      <header className="flex h-(--fiori-bar-base-height) shrink-0 items-center bg-(--sapShell_Background) px-4 shadow-(--sapShell_Shadow)">
        <span className="font-(family-name:--sapFontBoldFamily) text-(length:--sapFontLargeSize) text-(--sapShell_TextColor)">Manage Products</span>
      </header>
      <FlexibleColumnLayout
        id="master-detail"
        className="min-h-0 flex-1"
        {...fcl.layoutProps}
        accessibilityAttributes={{ startColumn: { name: "Products" }, midColumn: { name: "Product" }, endColumn: { name: "Sales order item" } }}
        startColumn={
          <div className="flex h-full flex-col">
            <ColumnHeader title={`Products (${shown.length})`} />
            <div className="px-4 py-2">
              <Input
                type="search"
                aria-label="Search products"
                placeholder="Search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                wrapperClassName="w-full"
                icon={<InputIcon><Icon icon={search} /></InputIcon>}
              />
            </div>
            <List
              aria-label="Products"
              className="min-h-0 flex-1 overflow-auto"
              selectionMode="single"
              value={productId ? [productId] : []}
              noDataText="No products found"
              onItemClick={(id) => {
                setProductId(id)
                setOrderId(undefined)
                fcl.navigate(1)
              }}
            >
              {shown.map((p) => (
                <ListItemStandard
                  key={p.id}
                  value={p.id}
                  text={p.name}
                  description={p.id}
                  icon={productIcon}
                  additionalText={currency(p.price)}
                  type="navigation"
                  navigated={p.id === productId}
                />
              ))}
            </List>
          </div>
        }
        midColumn={
          product && (
            <div className="flex h-full flex-col">
              <ColumnHeader title={product.name} actions={midActions} />
              <div className="min-h-0 flex-1 overflow-auto bg-(--sapObjectHeader_Background)">
                <div className="flex flex-wrap items-center gap-4 px-8 pt-4 pb-2">
                  <span className="text-(--sapContent_LabelColor)">{product.id}</span>
                  <Tag design={product.stock === 0 ? "negative" : product.stock < 10 ? "critical" : "positive"}>
                    {product.stock === 0 ? "Out of stock" : product.stock < 10 ? "Low stock" : "In stock"}
                  </Tag>
                </div>
                <Section title="General Information">
                  <dl className="m-0 grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-4">
                    <Field label="Category">{product.category}</Field>
                    <Field label="Supplier">{product.supplier}</Field>
                    <Field label="Price">{currency(product.price)}</Field>
                    <Field label="Stock">{product.stock}</Field>
                    <Field label="Weight">{product.weight}</Field>
                    <Field label="Dimensions">{product.dimensions}</Field>
                  </dl>
                  <Field label="Description">{product.description}</Field>
                </Section>
                <Section title={`Sales Orders (${product.orders.length})`}>
                  <List
                    aria-label="Sales orders"
                    noDataText="No sales orders"
                    selectionMode="single"
                    value={orderId ? [orderId] : []}
                    onItemClick={(id) => {
                      setOrderId(id)
                      fcl.navigate(2)
                    }}
                  >
                    {product.orders.map((o) => (
                      <ListItemStandard
                        key={o.id}
                        value={o.id}
                        text={o.id}
                        description={o.customer}
                        additionalText={o.status}
                        additionalTextState={statusDesign[o.status]}
                        type="navigation"
                        navigated={o.id === orderId}
                      />
                    ))}
                  </List>
                </Section>
              </div>
            </div>
          )
        }
        endColumn={
          product &&
          order && (
            <div className="flex h-full flex-col">
              <ColumnHeader title={order.id} actions={endActions} />
              <div className="min-h-0 flex-1 overflow-auto bg-(--sapObjectHeader_Background)">
                <Section title="Line Item">
                  <dl className="m-0 grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-4">
                    <Field label="Product">{product.name}</Field>
                    <Field label="Customer">{order.customer}</Field>
                    <Field label="Quantity">{order.quantity} EA</Field>
                    <Field label="Net amount">{currency(order.quantity * product.price)}</Field>
                    <Field label="Delivery date">{order.date}</Field>
                    <Field label="Status">
                      <Tag design={statusDesign[order.status]}>{order.status}</Tag>
                    </Field>
                  </dl>
                </Section>
              </div>
            </div>
          )
        }
      />
    </div>
  )
}
