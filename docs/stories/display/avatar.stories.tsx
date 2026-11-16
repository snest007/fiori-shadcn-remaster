import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useArgs } from "storybook/preview-api"
import { fn } from "storybook/test"
import { Avatar, AvatarGroup, type AvatarProps, type AvatarGroupProps } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { favorite } from "@/lib/fiori-icons"
import { DocsPage } from "../_lib/DocsPage"
import { fioriMeta } from "../_lib/meta"

const portrait = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><circle cx="48" cy="30" r="20" fill="currentColor"/><path d="M10 96v-16a38 38 0 0 1 76 0v16" fill="currentColor"/></svg>')
type Args = AvatarProps & { groupType: "none" | "group" | "individual"; count: number; narrow: boolean; customOverflow: boolean; groupTexts?: AvatarGroupProps["texts"]; onGroupClick?: AvatarGroupProps["onGroupClick"]; onOverflowClick?: AvatarGroupProps["onOverflowClick"] }

// Source-backed defaults from registry/ui/avatar.tsx and installed UI5 2.28 i18n defaults.
const textDefaults = [
  {
    "prop": "Avatar.accessibleName",
    "key": "Application text; no matching component UI5 default",
    "value": "Avatar {initials}"
  },
  {
    "prop": "AvatarGroup.texts.groupLabel",
    "key": "AVATAR_GROUP_ARIA_LABEL_GROUP",
    "value": "Conjoined avatars."
  },
  {
    "prop": "AvatarGroup.texts.individualLabel",
    "key": "AVATAR_GROUP_ARIA_LABEL_INDIVIDUAL",
    "value": "Individual avatars."
  },
  {
    "prop": "AvatarGroup.texts.displayedHiddenLabel",
    "key": "AVATAR_GROUP_DISPLAYED_HIDDEN_LABEL",
    "value": "{0} displayed, {1} hidden."
  },
  {
    "prop": "AvatarGroup.texts.showCompleteListLabel",
    "key": "AVATAR_GROUP_SHOW_COMPLETE_LIST_LABEL",
    "value": "Activate for complete list."
  },
  {
    "prop": "AvatarGroup.texts.moveLabel",
    "key": "AVATAR_GROUP_MOVE",
    "value": "Press ARROW keys to move."
  },
  {
    "prop": "AvatarGroup.texts.overflowButtonText",
    "key": "Application text; no matching component UI5 default",
    "value": "+{hidden}, capped at 99"
  }
]

const base = fioriMeta({ name: "avatar", component: Avatar })
const meta = {
  ...base,
  parameters: { ...base.parameters, docs: { page: () => <><DocsPage /><section aria-label="Component localization text keys"><h2>Localization text keys</h2><table><thead><tr><th>Text prop / key</th><th>UI5 key</th><th>English default</th></tr></thead><tbody>{textDefaults.map((entry) => <tr key={entry.prop}><td><code>{entry.prop}</code></td><td>{entry.key}</td><td>{entry.value}</td></tr>)}</tbody></table></section></> } },
  args: { size: "S", shape: "circle", colorScheme: "auto", initials: "JD", interactive: false, disabled: false, mode: "image", accessibleName: "John Doe", groupType: "none", count: 6, narrow: true, customOverflow: false, onClick: fn(), onGroupClick: fn(), onOverflowClick: fn() },
  argTypes: { ...base.argTypes, size: { control: "select", options: ["XS", "S", "M", "L", "XL"] }, shape: { control: "inline-radio", options: ["circle", "square"] }, colorScheme: { control: "select", options: ["auto", "accent1", "accent2", "accent3", "accent4", "accent5", "accent6", "accent7", "accent8", "accent9", "accent10", "placeholder", "transparent"] }, initials: { control: "text" }, src: { control: "text" }, alt: { control: "text" }, accessibleName: { control: "text" }, interactive: { control: "boolean" }, disabled: { control: "boolean" }, mode: { control: "inline-radio", options: ["image", "decorative"] }, groupType: { control: "select", options: ["none", "group", "individual"] }, count: { control: "number" }, narrow: { control: "boolean" }, customOverflow: { control: "boolean" }, groupTexts: { control: false }, icon: { control: false }, fallbackIcon: { control: false }, badge: { control: false }, onClick: { control: false }, onGroupClick: { control: false }, onOverflowClick: { control: false } },
  render: function TeamAvatar(args: Args) {
    const [last, setLast] = React.useState("No avatar activated")
    const { groupType, count, narrow, customOverflow, groupTexts, onGroupClick, onOverflowClick, ...props } = args
    const names = ["John Doe", "Anna Bauer", "Chen Kai", "Dora Evans", "Ethan Ford", "Fiona Gray"]
    return <div className="grid gap-3">
      {groupType === "none" ? <Avatar {...props} onClick={(event) => { args.onClick?.(event); setLast("John Doe") }} /> : (
        <AvatarGroup type={groupType} size={args.size} accessibleName={customOverflow && groupType === "group" ? "All project team" : "Project team"} className={narrow ? "w-36" : "w-full"}
          texts={groupTexts} overflowButton={customOverflow ? <Button onClick={fn()}>All</Button> : undefined}
          onGroupClick={(detail) => { onGroupClick?.(detail); setLast(detail.overflowButtonClicked ? "Overflow activated" : "Team activated") }}
          onOverflowClick={(items) => { onOverflowClick?.(items); setLast(`Hidden: ${items.map((item) => item.props.accessibleName).join(", ")}`) }}>
          {Array.from({ length: Math.max(0, count) }, (_, index) => <Avatar key={index}
            initials={names[index % names.length].split(" ").map((part) => part[0]).join("")}
            accessibleName={index < names.length ? names[index] : `Team member ${index + 1}`} />)}
        </AvatarGroup>
      )}
      <output>{last}</output>
    </div>
  },
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const InitialsXS: Story = { args: { size: "XS" } }
export const IconXS: Story = { args: { size: "XS", initials: undefined, icon: favorite } }
export const SquareXS: Story = { args: { size: "XS", shape: "square" } }
export const InitialsS: Story = { args: { size: "S" } }
export const IconS: Story = { args: { size: "S", initials: undefined, icon: favorite } }
export const SquareS: Story = { args: { size: "S", shape: "square" } }
export const InitialsM: Story = { args: { size: "M" } }
export const IconM: Story = { args: { size: "M", initials: undefined, icon: favorite } }
export const SquareM: Story = { args: { size: "M", shape: "square" } }
export const InitialsL: Story = { args: { size: "L" } }
export const IconL: Story = { args: { size: "L", initials: undefined, icon: favorite } }
export const SquareL: Story = { args: { size: "L", shape: "square" } }
export const InitialsXL: Story = { args: { size: "XL" } }
export const IconXL: Story = { args: { size: "XL", initials: undefined, icon: favorite } }
export const SquareXL: Story = { args: { size: "XL", shape: "square" } }
export const Accent1: Story = { args: { colorScheme: "accent1" } }
export const Accent2: Story = { args: { colorScheme: "accent2" } }
export const Accent3: Story = { args: { colorScheme: "accent3" } }
export const Accent4: Story = { args: { colorScheme: "accent4" } }
export const Accent5: Story = { args: { colorScheme: "accent5" } }
export const Accent6: Story = { args: { colorScheme: "accent6" } }
export const Accent7: Story = { args: { colorScheme: "accent7" } }
export const Accent8: Story = { args: { colorScheme: "accent8" } }
export const Accent9: Story = { args: { colorScheme: "accent9" } }
export const Accent10: Story = { args: { colorScheme: "accent10" } }
export const Placeholder: Story = { args: { colorScheme: "placeholder", initials: undefined } }
export const Transparent: Story = { args: { colorScheme: "transparent", initials: undefined, icon: favorite } }
export const Fallback: Story = { args: { initials: undefined } }
export const InitialsOverflow: Story = { args: { initials: "WWW", size: "XS" } }
export const Image: Story = { args: { src: portrait, initials: undefined, size: "M", alt: "John Doe portrait" } }
export const SquareImage: Story = { args: { src: portrait, initials: undefined, size: "M", shape: "square", alt: "John Doe portrait" } }
export const Interactive: Story = { args: { interactive: true } }
export const Disabled: Story = { args: { interactive: true, disabled: true } }
export const Decorative: Story = { args: { mode: "decorative" } }
export const Group: Story = { args: { groupType: "group", narrow: false, count: 4 } }
export const Individual: Story = { args: { groupType: "individual", size: "XS", narrow: false, count: 4 } }
export const GroupOverflow: Story = { args: { groupType: "group" } }
export const IndividualOverflow: Story = { args: { groupType: "individual" } }
export const LargeGroupOverflow: Story = { args: { groupType: "group", size: "L" } }
export const LargeIndividualOverflow: Story = { args: { groupType: "individual", size: "L" } }
export const OverflowCap: Story = { args: { groupType: "individual", count: 105 } }
export const CustomOverflow: Story = { args: { groupType: "individual", customOverflow: true } }
export const CustomGroupOverflow: Story = { args: { groupType: "group", customOverflow: true, count: 2 } }
export const CustomOverflowWhenItemsFit: Story = { args: { groupType: "individual", customOverflow: true, count: 2, narrow: false } }
export const CustomTexts: Story = { args: { groupType: "individual", groupTexts: { individualLabel: "Project members.", displayedHiddenLabel: (shown, hidden) => `${shown} visible, ${hidden} waiting.`, showCompleteListLabel: "Show all project members", moveLabel: "Move between team members with arrow keys." } } }
export const RTL: Story = { args: { groupType: "individual" }, globals: { dir: "rtl" } }
