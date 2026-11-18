// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"

import { cn } from "@/lib/utils"
import { Title, type TitleLevel } from "@/components/ui/title"

// Mirrors ui5-form / ui5-form-group / ui5-form-item (Horizon, @ui5/webcomponents 2.28).
// Responsive layout driven by the form's own width (container queries, S < 600px ≤ M < 1024px ≤ L < 1440px ≤ XL):
// - `layout` ("S1 M1 L2 XL3"): number of columns per range. Groups are spread over the columns (UI5's algorithm:
//   groups with more items get the extra columns); ungrouped items flow through all columns.
// - `labelSpan` ("S12 M4 L4 XL4"): label cells out of 12; 12 puts the label above the field (left aligned),
//   anything else puts it beside the field, right aligned. `emptySpan` leaves cells empty after the field.
// - Display mode (default) renders items as a definition list (dt/dd); `accessibleMode="edit"` renders plain
//   containers and gives each group role="form".
// The root is role="form" (role="region" with groups), named by the header text or "Form".

type Breakpoint = "S" | "M" | "L" | "XL"
const BREAKPOINTS: Breakpoint[] = ["S", "M", "L", "XL"]
const MAX_CELLS = 12

function parseSpans(value: string, defaults: Record<Breakpoint, number>) {
  const out = { ...defaults }
  for (const part of value.split(" ")) {
    if (part.startsWith("XL")) out.XL = parseInt(part.slice(2))
    else if (part.startsWith("S")) out.S = parseInt(part.slice(1))
    else if (part.startsWith("M")) out.M = parseInt(part.slice(1))
    else if (part.startsWith("L")) out.L = parseInt(part.slice(1))
  }
  return out
}

/** UI5 getFormItemLayoutValue: grid-template-columns for label / field / empty cells. */
function itemLayout(bp: Breakpoint, labelSpan: number, emptySpan: number) {
  const valid = emptySpan === 0 ? labelSpan <= MAX_CELLS : labelSpan + emptySpan <= MAX_CELLS - 1
  if (!valid) return bp === "S" ? "1fr" : "4fr 8fr 0fr"
  return labelSpan === MAX_CELLS ? "1fr" : `${labelSpan}fr ${MAX_CELLS - (labelSpan + emptySpan)}fr ${emptySpan}fr`
}

/** UI5 getGroupsColSpan: how many columns a group takes in one range. */
function groupColSpan(cols: number, groups: number, index: number, group: { columnSpan?: number; colSpan?: string }, bp: Breakpoint) {
  if (group.columnSpan) return group.columnSpan
  const own = group.colSpan?.split(" ").find((p) => p.startsWith(bp) && (bp !== "L" || !p.startsWith("XL")))
  if (own) return parseInt(own.slice(bp.length))
  if (cols === 1 || cols <= groups) return 1
  if (cols % groups === 0) return cols / groups
  const delta = cols - groups
  if (delta <= groups) return index < delta ? 2 : 1
  return index === 0 ? 1 + (delta - groups) + 1 : 2
}

type FormContextValue = { mode: "display" | "edit"; itemSpacing: "normal" | "large" }
const FormContext = React.createContext<FormContextValue>({ mode: "display", itemSpacing: "normal" })

/**
 * @accessibility accessibleName or native aria-label/aria-labelledby names the form root when headerText is absent. Headers name their own form or region; FormGroup accessibleName names groups.
 * @accessibility Form does not add keyboard stops. Each edit FormItem keeps a Label htmlFor association or an explicitly named control; display mode uses definition-list semantics.
 */
type FormProps = Omit<React.ComponentProps<"div">, "title"> & {
  /** Columns per range, e.g. "S1 M1 L2 XL3" (default). */
  layout?: string
  /** Label cells (of 12) per range, e.g. "S12 M4 L4 XL4" (default). 12 = label above the field. */
  labelSpan?: string
  /** Empty cells after the field per range, e.g. "S0 M0 L0 XL0" (default). */
  emptySpan?: string
  headerText?: string
  /** Heading level of the header text (default H2). */
  headerLevel?: TitleLevel
  /** Custom header content (replaces headerText). */
  header?: React.ReactNode
  /** "large" adds vertical padding and a minimum height to each item (for display-only forms). */
  itemSpacing?: "normal" | "large"
  /** "display" (default): items are a definition list. "edit": items are plain containers in role="form" groups. */
  accessibleMode?: "display" | "edit"
  /** Default accessible name when there is no header. */
  accessibleName?: string
}

function isGroup(child: React.ReactNode): child is React.ReactElement<FormGroupProps> {
  return React.isValidElement(child) && (child.type as unknown) === FormGroup
}

function Form({
  layout = "S1 M1 L2 XL3",
  labelSpan = "S12 M4 L4 XL4",
  emptySpan = "S0 M0 L0 XL0",
  headerText,
  headerLevel = "H2",
  header,
  itemSpacing = "normal",
  accessibleMode = "display",
  accessibleName,
  className,
  style,
  children,
  ...props
}: FormProps) {
  const id = React.useId()
  const columns = parseSpans(layout, { S: 1, M: 1, L: 2, XL: 3 })
  const labels = parseSpans(labelSpan, { S: 12, M: 4, L: 4, XL: 4 })
  const empties = parseSpans(emptySpan, { S: 0, M: 0, L: 0, XL: 0 })
  const items = React.Children.toArray(children).filter(React.isValidElement)
  const groups = items.filter(isGroup)
  const hasGroups = groups.length > 0
  const hasHeader = !!header || !!headerText
  const ctx = React.useMemo(() => ({ mode: accessibleMode, itemSpacing }), [accessibleMode, itemSpacing])

  const vars: Record<string, string | number> = {}
  for (const bp of BREAKPOINTS) {
    vars[`--fiori-x-form-columns-${bp.toLowerCase()}`] = columns[bp]
    vars[`--fiori-x-form-item-layout-${bp.toLowerCase()}`] = itemLayout(bp, labels[bp], empties[bp])
  }
  // Ranges where the label sits above its field (label span 12).
  const labelTop = BREAKPOINTS.filter((bp) => labels[bp] === MAX_CELLS).join(" ")

  // Groups with more items get the extra columns (UI5 sorts by item count, stable).
  const sorted = [...groups].sort((a, b) => React.Children.count(b.props.children) - React.Children.count(a.props.children))
  const spanOf = (g: React.ReactElement<FormGroupProps>) => {
    const i = sorted.indexOf(g)
    return Object.fromEntries(BREAKPOINTS.map((bp) => [bp, groupColSpan(columns[bp], groups.length, i, g.props, bp)])) as Record<Breakpoint, number>
  }
  const spanVars = (s: Record<Breakpoint, number>) =>
    Object.fromEntries(BREAKPOINTS.map((bp) => [`--fiori-x-form-column-span-${bp.toLowerCase()}`, s[bp]])) as React.CSSProperties

  const ListTag = accessibleMode === "edit" ? "div" : "dl"

  return (
    <FormContext.Provider value={ctx}>
      <div
        data-slot="form"
        data-label-top={labelTop || undefined}
        data-item-spacing={itemSpacing}
        className={cn("fiori-form", className)}
        style={{ ...vars, ...style } as React.CSSProperties}
        {...props}
        // UI5 Form.js/setFastNavGroup: FormGroups own navigation; only an ungrouped Form marks its root.
        data-sap-ui-fastnavgroup={hasGroups ? undefined : "true"}
      >
        <div
          className="fiori-form__root"
          role={hasGroups ? "region" : "form"}
          aria-label={hasHeader && !accessibleName ? undefined : (accessibleName ?? "Form")}
          aria-labelledby={!accessibleName && headerText && !header ? `${id}-header` : undefined}
        >
          {hasHeader && (
            <div className="fiori-form__header">
              {header ?? (
                <Title id={`${id}-header`} wrappingType="None" level={headerLevel}>
                  {headerText}
                </Title>
              )}
            </div>
          )}
          <div className="fiori-form__layout">
            {hasGroups ? (
              groups.map((g, index) => {
                const { headerText: groupHeader, headerLevel: groupLevel = "H3", accessibleName: groupName, children: groupItems, className: groupClass, columnSpan: _c, colSpan: _s, ...groupProps } = g.props
                const headerId = `${id}-group-${index}`
                const name = groupName ?? (groupHeader ? undefined : `Group ${index + 1}`)
                const labelledBy = !groupName && groupHeader ? headerId : undefined
                const edit = accessibleMode === "edit"
                return (
                  <div key={g.key ?? index} className="fiori-form__column" style={spanVars(spanOf(g))}>
                    <div
                      data-slot="form-group" data-sap-ui-fastnavgroup="true"
                      className={cn("fiori-form__group", groupClass)}
                      role={edit ? "form" : undefined}
                      aria-label={edit ? name : undefined}
                      aria-labelledby={edit ? labelledBy : undefined}
                      {...groupProps}
                    >
                      {groupHeader && (
                        <div className="fiori-form__group-heading">
                          <Title id={headerId} wrappingType="None" level={groupLevel} size="H6">
                            {groupHeader}
                          </Title>
                        </div>
                      )}
                      <ListTag className="fiori-form__group-layout" aria-label={edit ? undefined : name} aria-labelledby={edit ? undefined : labelledBy}>
                        {groupItems}
                      </ListTag>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="fiori-form__column" data-standalone="" style={spanVars(columns)}>
                <ListTag className="fiori-form__group-layout">{items}</ListTag>
              </div>
            )}
          </div>
        </div>
      </div>
    </FormContext.Provider>
  )
}

type FormGroupProps = React.ComponentProps<"div"> & {
  headerText?: string
  /** Heading level of the group title (default H3). */
  headerLevel?: TitleLevel
  /** Columns this group takes in every range (overrides the automatic spread). */
  columnSpan?: number
  /** Columns per range, e.g. "S1 M2 L3 XL4". */
  colSpan?: string
  /** Accessible name; defaults to the header text or "Group <n>". */
  accessibleName?: string
}

/** A titled group of form items. Rendered by <Form>; place it directly inside one. */
function FormGroup(_props: FormGroupProps): React.ReactNode {
  return null
}

type FormItemProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** The label (usually a <Label>), placed per the form's labelSpan. */
  label?: React.ReactNode
  /** One or more fields / texts. */
  children?: React.ReactNode
}

function FormItem({ label, className, children, ...props }: FormItemProps) {
  const { mode } = React.useContext(FormContext)
  const LabelTag = mode === "edit" ? "div" : "dt"
  const ContentTag = mode === "edit" ? "div" : "dd"
  return (
    <div data-slot="form-item" className={cn("fiori-form__item", className)} {...props}>
      <LabelTag className="fiori-form__item-label">{label}</LabelTag>
      <ContentTag className="fiori-form__item-content">
        {React.Children.toArray(children).map((child, i) => (
          <div key={i} className="fiori-form__item-content-child">
            {child}
          </div>
        ))}
      </ContentTag>
    </div>
  )
}

export { Form, FormGroup, FormItem, type FormProps, type FormGroupProps, type FormItemProps }
