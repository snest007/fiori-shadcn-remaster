import * as React from "react"

import { Avatar, AvatarGroup, type AvatarProps, type AvatarGroupClickDetail, type AvatarColorScheme } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverAnchor, PopoverContent, PopoverHeader, PopoverTitle, PopoverBody } from "@/components/ui/popover"
import { favorite } from "@/lib/fiori-icons"

import { defineDemo } from "./types"

function AvatarDemo() {
  const [pressed, setPressed] = React.useState(0)
  const [narrow, setNarrow] = React.useState(true)
  const [hidden, setHidden] = React.useState<React.ReactElement<AvatarProps>[]>([])
  const [open, setOpen] = React.useState(false)
  const [events, setEvents] = React.useState(0)
  const [detail, setDetail] = React.useState("None")
  const [groupEvents, setGroupEvents] = React.useState(0)
  const [customEvents, setCustomEvents] = React.useState(0)
  const [customClick, setCustomClick] = React.useState(0)
  const anchor = React.useRef<HTMLElement | null>(null)
  const record = ({ targetRef, overflowButtonClicked }: AvatarGroupClickDetail) => {
    anchor.current = targetRef
    setGroupEvents((value) => value + 1)
    setDetail(`${overflowButtonClicked ? "Overflow" : "Avatar"}: ${targetRef.dataset.slot ?? targetRef.tagName.toLowerCase()}`)
  }
  const names = ["John Doe", "Anna Bauer", "Chen Kai", "Dora Evans", "Ethan Ford", "Fiona Gray"]
  return (
    <div id="avatar-demo" className="grid gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <Avatar size="XS" initials="XS" />
        <Avatar size="S" initials="S" colorScheme="accent1" />
        <Avatar size="M" initials="M" colorScheme="accent3" />
        <Avatar size="L" icon={favorite} colorScheme="accent5" />
        <Avatar size="XL" shape="square" initials="XL" colorScheme="accent8" />
        <Avatar size="M" colorScheme="placeholder" />
      </div>
      <div className="flex items-center gap-3">
        <Avatar id="avatar-interactive" interactive initials="JD" accessibleName="John Doe" onClick={() => setPressed((n) => n + 1)} />
        <span id="avatar-pressed" className="text-(--sapContent_LabelColor)">{`Pressed ${pressed} times`}</span>
      </div>
      <AvatarGroup type="group" aria-label="Project team" onClick={() => setPressed((n) => n + 1)}>
        <Avatar initials="JD" />
        <Avatar initials="AB" />
        <Avatar initials="CK" />
        <Avatar icon={favorite} />
      </AvatarGroup>
      <AvatarGroup id="avatar-individual" type="individual" size="XS">
        <Avatar initials="JD" accessibleName="John Doe" />
        <Avatar initials="AB" accessibleName="Anna Bauer" />
        <Avatar initials="CK" accessibleName="Chen Kai" />
      </AvatarGroup>
      <div className="flex items-center gap-3">
        <Button id="avatar-resize" onClick={() => setNarrow((value) => !value)}>{narrow ? "Widen group" : "Narrow group"}</Button>
        <span id="avatar-overflow-events" aria-live="polite">{`Overflow activated ${events} times`}</span>
        <span id="avatar-overflow-detail">{detail}</span>
        <span id="avatar-group-events">{`Group activated ${groupEvents} times`}</span>
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor virtualRef={anchor} />
        <AvatarGroup
          id="avatar-overflow-individual"
          type="individual"
          style={{ width: narrow ? "9rem" : "24rem" }}
          onGroupClick={record}
          onOverflowClick={(items) => {
            setHidden(items)
            setEvents((value) => value + 1)
            setOpen(true)
          }}
        >
          {names.map((name, index) => <Avatar key={name} initials={name.split(" ").map((part) => part[0]).join("")} accessibleName={name} colorScheme={index === 3 ? "accent9" : undefined} />)}
        </AvatarGroup>
        <PopoverContent id="avatar-overflow-popover" side="bottom" align="start" portal={false} onCloseAutoFocus={(event) => { event.preventDefault(); anchor.current?.focus() }}>
          <PopoverHeader><PopoverTitle>Hidden team members</PopoverTitle></PopoverHeader>
          <PopoverBody>
            <ul className="flex flex-col gap-2">
              {hidden.map((item) => <li key={item.key} className="flex items-center gap-2">{React.cloneElement(item, { size: "XS", interactive: false, colorScheme: item.props.colorScheme ?? `accent${names.indexOf(item.props.accessibleName ?? "") + 1}` as AvatarColorScheme })}<span>{item.props.accessibleName}</span></li>)}
            </ul>
          </PopoverBody>
        </PopoverContent>
      </Popover>
      <AvatarGroup id="avatar-overflow-group" type="group" style={{ width: "9rem" }} onGroupClick={record}>
        {names.map((name) => <Avatar key={name} initials={name.split(" ").map((part) => part[0]).join("")} accessibleName={name} />)}
      </AvatarGroup>
      <AvatarGroup
        id="avatar-overflow-custom" type="individual" style={{ width: "9rem" }}
        overflowButton={<Button id="avatar-custom-control" onClick={() => setCustomClick((value) => value + 1)}>All</Button>}
        texts={{ groupLabel: "Team.", individualLabel: "Team members.", displayedHiddenLabel: (shown, hidden) => `${shown} visible and ${hidden} remaining.`, moveLabel: "Use direction keys." }}
        onOverflowClick={(items) => { setHidden(items); setCustomEvents((value) => value + 1) }}
      >
        {names.map((name) => <Avatar key={name} initials={name.split(" ").map((part) => part[0]).join("")} accessibleName={name} />)}
      </AvatarGroup>
      <AvatarGroup id="avatar-custom-group" accessibleName="All team members" type="group" style={{ width: "12rem" }} overflowButton={<Button onClick={() => setCustomClick((value) => value + 1)}>All</Button>} onGroupClick={record}>
        <Avatar initials="JD" />
        <Avatar initials="AB" />
      </AvatarGroup>
      <span id="avatar-custom-events">{`Custom ${customClick}; overflow ${customEvents}; hidden ${hidden.map((item) => item.props.accessibleName).join(", ")}`}</span>
    </div>
  )
}

export default defineDemo({ title: "Avatar", order: 32, Demo: AvatarDemo })
