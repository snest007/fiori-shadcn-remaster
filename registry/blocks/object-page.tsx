import * as React from "react"

import { Avatar } from "@/components/ui/avatar"
import { Bar } from "@/components/ui/bar"
import { Breadcrumbs, BreadcrumbsItem } from "@/components/ui/breadcrumbs"
import { Button } from "@/components/ui/button"
import { DynamicPageTitle } from "@/components/ui/dynamic-page"
import { Form, FormGroup, FormItem } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ObjectAttribute, ObjectIdentifier } from "@/components/ui/object-identifier"
import { ObjectNumber } from "@/components/ui/object-number"
import { ObjectPage, ObjectPageHeader, ObjectPageHeaderFacet, ObjectPageSection, ObjectPageSubSection } from "@/components/ui/object-page"
import { ObjectStatus } from "@/components/ui/object-status"
import { Table, TableCell, TableHeaderCell, TableHeaderRow, TableRow } from "@/components/ui/table"
import { Text } from "@/components/ui/text"
import { TextArea } from "@/components/ui/textarea"
import { Title } from "@/components/ui/title"
import { Toolbar, ToolbarButton, ToolbarSpacer } from "@/components/ui/toolbar"
import { machine } from "@/lib/fiori-icons"

// SAP Fiori "Object Page" floorplan (guideline: object-page): title with the object name and actions, header with
// avatar and facets (attributes, status, KPI), anchor navigation bar, sections "General Information" (form),
// "Items" (table) and "Notes". "Edit" switches the page to edit mode: fields become inputs and a floating footer
// with Save / Cancel appears; Save keeps the changes, Cancel discards them.
// Replace the sample data and handlers with your own.

type Details = { orderId: string; customer: string; contact: string; deliveryDate: string; paymentTerms: string; currency: string; notes: string }

const INITIAL: Details = {
  orderId: "589946637",
  customer: "Robotech",
  contact: "Denise Smith",
  deliveryDate: "January 25, 2023",
  paymentTerms: "30 days net",
  currency: "USD",
  notes: "Deliver to the Orlando factory, gate 3. Assembly team on site from 8 AM.",
}

const ITEMS = [
  { id: "10", product: "Robot Arm Series 9", quantity: 2, price: 12897.0, status: { text: "Confirmed", state: "positive" as const } },
  { id: "20", product: "Gripper Set G-4", quantity: 4, price: 1250.5, status: { text: "Partially Delivered", state: "critical" as const } },
  { id: "30", product: "Socket Adapter 10", quantity: 8, price: 89.9, status: { text: "Open", state: "none" as const } },
  { id: "40", product: "Calibration Kit", quantity: 1, price: 640.0, status: { text: "Blocked", state: "negative" as const } },
]

const FIELDS: { key: keyof Details; label: string; group: "order" | "terms" }[] = [
  { key: "orderId", label: "Order ID", group: "order" },
  { key: "customer", label: "Customer", group: "order" },
  { key: "contact", label: "Contact Person", group: "order" },
  { key: "deliveryDate", label: "Expected Delivery Date", group: "terms" },
  { key: "paymentTerms", label: "Payment Terms", group: "terms" },
  { key: "currency", label: "Currency", group: "terms" },
]

export default function ObjectPageBlock() {
  const [saved, setSaved] = React.useState(INITIAL)
  const [draft, setDraft] = React.useState(INITIAL)
  const [editing, setEditing] = React.useState(false)
  const data = editing ? draft : saved
  const total = ITEMS.reduce((sum, i) => sum + i.quantity * i.price, 0)

  const field = (f: (typeof FIELDS)[number]) => {
    const id = `object-page-block-${f.key}`
    return (
      <FormItem key={f.key} label={<Label showColon htmlFor={editing ? id : undefined}>{f.label}</Label>}>
        {editing ? (
          <Input id={id} value={draft[f.key]} onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))} readOnly={f.key === "orderId"} />
        ) : (
          <Text>{data[f.key]}</Text>
        )}
      </FormItem>
    )
  }

  return (
    <div className="h-screen">
      <ObjectPage
        id="object-page-block"
        accessibilityAttributes={{ root: { role: "main", name: "Sales Order" } }}
        showFooter={editing}
        title={
          <DynamicPageTitle
            breadcrumbs={
              <Breadcrumbs aria-label="Navigation trail">
                <BreadcrumbsItem href="#">Manage Sales Orders</BreadcrumbsItem>
                <BreadcrumbsItem>Sales Order</BreadcrumbsItem>
              </Breadcrumbs>
            }
            heading={<Title level="H1">{`Sales Order ${saved.orderId}`}</Title>}
            snappedHeading={<Title level="H1">{`Sales Order ${saved.orderId}`}</Title>}
            subheading={<Label>{saved.customer}</Label>}
            snappedSubheading={<Label>{`${saved.customer} · Confirmed`}</Label>}
            actions={
              <Toolbar aria-label="Object actions" design="transparent">
                {!editing && (
                  <ToolbarButton variant="emphasized" onClick={() => (setDraft(saved), setEditing(true))}>
                    Edit
                  </ToolbarButton>
                )}
                <ToolbarButton variant="transparent" disabled={editing}>
                  Delete
                </ToolbarButton>
                <ToolbarButton variant="transparent" disabled={editing}>
                  Copy
                </ToolbarButton>
              </Toolbar>
            }
          />
        }
        header={
          <ObjectPageHeader accessibleName="Sales order summary" avatar={<Avatar size="L" shape="square" icon={machine} accessibleName="Product image" />}>
            <ObjectPageHeaderFacet>
              <ObjectAttribute title="Customer" text={saved.customer} />
              <ObjectAttribute title="Contact" text={saved.contact} active href="#contact" />
              <ObjectAttribute title="Payment Terms" text={saved.paymentTerms} />
            </ObjectPageHeaderFacet>
            <ObjectPageHeaderFacet title="Status">
              <ObjectStatus large state="positive" text="Confirmed" />
            </ObjectPageHeaderFacet>
            <ObjectPageHeaderFacet title="Net Value">
              <ObjectNumber large emphasized={false} number={total.toLocaleString("en-US", { minimumFractionDigits: 2 })} unit={saved.currency} />
            </ObjectPageHeaderFacet>
          </ObjectPageHeader>
        }
        footer={
          <Bar
            design="floating-footer"
            endContent={
              <>
                <Button variant="emphasized" onClick={() => (setSaved(draft), setEditing(false))}>
                  Save
                </Button>
                <Button variant="transparent" onClick={() => (setDraft(saved), setEditing(false))}>
                  Cancel
                </Button>
              </>
            }
          />
        }
      >
        <ObjectPageSection id="general" titleText="General Information">
          <ObjectPageSubSection>
            <Form layout="S1 M2 L2 XL2" labelSpan="S12 M12 L12 XL12" accessibleMode={editing ? "edit" : "display"} accessibleName="General Information">
              <FormGroup headerText="Order Details">{FIELDS.filter((f) => f.group === "order").map(field)}</FormGroup>
              <FormGroup headerText="Terms">{FIELDS.filter((f) => f.group === "terms").map(field)}</FormGroup>
            </Form>
          </ObjectPageSubSection>
        </ObjectPageSection>
        <ObjectPageSection id="items" titleText="Items">
          <ObjectPageSubSection transparent>
            <div className="overflow-hidden rounded-(--sapElement_BorderCornerRadius) bg-(--sapGroup_ContentBackground)">
              <Toolbar aria-label="Items toolbar" className="ps-4 pe-2">
                <Title id="object-page-block-items-title" level="H3" size="H5" wrappingType="None">
                  {`Items (${ITEMS.length})`}
                </Title>
                <ToolbarSpacer />
                <ToolbarButton variant="transparent" disabled={!editing}>
                  Add
                </ToolbarButton>
              </Toolbar>
              <Table aria-labelledby="object-page-block-items-title" overflowMode="popin">
                <TableHeaderRow>
                  <TableHeaderCell width="6rem">Item</TableHeaderCell>
                  <TableHeaderCell minWidth="12rem" importance={10}>Product</TableHeaderCell>
                  <TableHeaderCell horizontalAlign="End" minWidth="6rem">Quantity</TableHeaderCell>
                  <TableHeaderCell minWidth="10rem">Status</TableHeaderCell>
                  <TableHeaderCell horizontalAlign="End" minWidth="8rem">Net Price</TableHeaderCell>
                </TableHeaderRow>
                {ITEMS.map((i) => (
                  <TableRow key={i.id} rowKey={i.id}>
                    <TableCell>{i.id}</TableCell>
                    <TableCell>
                      <ObjectIdentifier title={i.product} />
                    </TableCell>
                    <TableCell>{i.quantity}</TableCell>
                    <TableCell>
                      <ObjectStatus text={i.status.text} state={i.status.state} />
                    </TableCell>
                    <TableCell>
                      <ObjectNumber number={i.price.toLocaleString("en-US", { minimumFractionDigits: 2 })} unit={saved.currency} />
                    </TableCell>
                  </TableRow>
                ))}
              </Table>
            </div>
          </ObjectPageSubSection>
        </ObjectPageSection>
        <ObjectPageSection id="notes" titleText="Notes">
          <ObjectPageSubSection>
            <div className="min-h-40 px-4 py-2">
              {editing ? (
                <TextArea aria-label="Notes" value={draft.notes} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} />
              ) : (
                <Text data-slot="object-page-block-notes">{saved.notes}</Text>
              )}
            </div>
          </ObjectPageSubSection>
        </ObjectPageSection>
      </ObjectPage>
    </div>
  )
}
