import * as React from "react"
import { Button } from "@/components/ui/button"
import { Menu, MenuContent, MenuGroup, MenuItem, MenuSeparator, MenuSub, MenuSubContent, MenuSubTrigger, MenuTrigger } from "@/components/ui/menu"
import { copy } from "@/lib/fiori-icons"
import { defineDemo } from "./types"

export default defineDemo({ title: "Checkable menu", order: 43, Demo: () => {
  const [changes, setChanges] = React.useState<string[]>([])
  const [controlled, setControlled] = React.useState(false)
  const [controlledChoice, setControlledChoice] = React.useState<string | undefined>("A")
  const [selectedTarget, setSelectedTarget] = React.useState("No selection")
  const [retainOpen, setRetainOpen] = React.useState(false)
  const change = (name: string) => (checked: boolean) => setChanges((events) => [...events, `${name}:${checked}`])
  return <div id="menu-check-mode-demo" className="flex flex-col gap-3">
    <div className="flex gap-3">
      <Menu onOpenChange={(open) => { if (!open) setRetainOpen(false) }}>
        <MenuTrigger asChild><Button id="menu-check-mode-trigger">Preferences</Button></MenuTrigger>
        <MenuContent aria-label="Check mode preferences" className="w-64">
          <MenuGroup checkMode="single">
            <MenuItem defaultChecked onCheckedChange={change("First")}>First</MenuItem>
            <MenuItem defaultChecked onCheckedChange={change("Last")}>Last</MenuItem>
            <MenuItem onCheckedChange={change("Third")}>Third</MenuItem>
          </MenuGroup>
          <MenuGroup checkMode="single" aria-label="Separate choices">
            <MenuItem defaultChecked onCheckedChange={change("Separate")}>Separate</MenuItem>
          </MenuGroup>
          <MenuGroup checkMode="single" aria-label="Controlled choices">
            {["A", "B"].map((name) => <MenuItem key={name} checked={controlledChoice === name} onCheckedChange={(checked) => { setControlledChoice(checked ? name : undefined); change(`Choice ${name}`)(checked) }}>Choice {name}</MenuItem>)}
          </MenuGroup>
          <MenuGroup checkMode="single" aria-label="Disabled owner choice">
            <MenuItem defaultChecked>Single owner peer</MenuItem>
            <MenuSub defaultOpen><MenuSubTrigger disabled defaultChecked onCheckedChange={change("Disabled single owner")}>Disabled single owner</MenuSubTrigger>
              <MenuSubContent><MenuItem>Unavailable single child</MenuItem></MenuSubContent></MenuSub>
          </MenuGroup>
          <MenuSeparator />
          <MenuGroup checkMode="multiple">
            <MenuItem defaultChecked icon={copy} additionalText="Ctrl+C" onCheckedChange={change("Copy preference")}>Copy preference</MenuItem>
            <MenuItem onCheckedChange={change("Grid")}>Grid</MenuItem>
            <MenuItem disabled defaultChecked onSelect={() => change("Disabled selection")(true)} onCheckedChange={change("Disabled")}>Disabled preference</MenuItem>
            <MenuItem id="menu-check-mode-canceled" onSelect={(e) => { setSelectedTarget((e.target as HTMLElement)?.id ?? "Missing target"); e.preventDefault() }} onCheckedChange={change("Canceled")}>Canceled</MenuItem>
            <MenuItem checked={controlled} onCheckedChange={(checked) => { setControlled(checked); change("Controlled")(checked) }}>Controlled</MenuItem>
            <MenuSub>
              <MenuSubTrigger defaultChecked onCheckedChange={change("Nested")}>Nested</MenuSubTrigger>
              <MenuSubContent aria-label="Nested preferences" aria-labelledby={undefined}>
                <MenuItem defaultChecked onCheckedChange={change("Ordinary child")}>Ordinary child</MenuItem>
                <MenuGroup checkMode="multiple"><MenuItem onCheckedChange={change("Nested grid")}>Nested grid</MenuItem></MenuGroup>
                <MenuSub><MenuSubTrigger>Deeper</MenuSubTrigger><MenuSubContent aria-label="Deeper preferences" aria-labelledby={undefined}><MenuItem>Deep child</MenuItem></MenuSubContent></MenuSub>
              </MenuSubContent>
            </MenuSub>
            <MenuSub open><MenuSubTrigger disabled checked onCheckedChange={change("Disabled multiple owner")}>Disabled multiple owner</MenuSubTrigger>
              <MenuSubContent><MenuItem>Unavailable multiple child</MenuItem></MenuSubContent></MenuSub>
          </MenuGroup>
          <MenuGroup><MenuItem defaultChecked onCheckedChange={change("Ordinary")}>Ordinary</MenuItem></MenuGroup>
        </MenuContent>
      </Menu>
      <Menu open={retainOpen} onOpenChange={(open) => { if (open) setRetainOpen(true) }}>
        <MenuTrigger asChild><Button id="menu-check-mode-retain-trigger">Retain open</Button></MenuTrigger>
        <MenuContent aria-label="Retain preferences"><MenuGroup checkMode="multiple"><MenuItem onCheckedChange={change("Retained")}>Retained</MenuItem></MenuGroup></MenuContent>
      </Menu>
      <Menu><MenuTrigger asChild><Button id="menu-check-mode-pages-trigger">Page navigation</Button></MenuTrigger>
        <MenuContent aria-label="Page preferences" style={{ maxHeight: "12rem" }}><MenuGroup checkMode="multiple">
          {Array.from({ length: 15 }, (_, index) => <MenuItem key={index}>Page {index + 1}</MenuItem>)}
        </MenuGroup></MenuContent>
      </Menu>
    </div>
    <output id="menu-check-mode-result">{changes.join(",") || "No checks"}</output>
    <output id="menu-check-mode-selected-target">{selectedTarget}</output>
  </div>
} })
