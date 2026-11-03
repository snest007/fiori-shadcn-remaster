// Visual fixtures only. Real opening, focus, Escape and placement remain SAPUI5 behaviour.
sap.ui.define(["sap/ui/core/library"], (coreLibrary) => {
  "use strict"
  const { OpenState } = coreLibrary

  /**
   * Open a Dialog/Popover, wait for its afterOpen event, then move the actual painted DOM
   * into a fixture cell. For a Popover, pass () => popup.openBy(opener) as `open`.
   * Also accepts an already-open popup (for controls that own an internal dialog).
   */
  async function showPopupInPlace(popup, cell, open = () => popup.open()) {
    // core/Popup.js:isOpen includes opening/closing transitions; afterOpen is the actual
    // rendering boundary, even when the owning control has already started opening it.
    const state = popup.oPopup?.getOpenState()
    if (state === OpenState.CLOSING) throw new Error(`Reference popup ${popup.getId()} is closing`)
    if (state !== OpenState.OPEN) {
      await new Promise((resolve, reject) => {
        const afterOpen = () => {
          popup.detachAfterOpen(afterOpen)
          resolve()
        }
        popup.attachAfterOpen(afterOpen)
        try {
          if (!popup.isOpen()) open()
        } catch (error) {
          popup.detachAfterOpen(afterOpen)
          reject(error)
        }
      })
    }
    sap.ui.getCore().applyChanges()
    const surface = popup.getDomRef()
    if (!surface) throw new Error(`Reference popup ${popup.getId()} did not render`)

    // sap/m/Dialog.js and sap/m/Popover.js use sap/ui/core/Popup to position their DOM in
    // the static area. Override only viewport placement; preserve dimensions, padding,
    // radius, border, shadow, header/footer and content from the original theme CSS.
    // sap/m/PopoverRenderer.js:renderResizeHandle renders a direct child whose
    // themes/base/Popover.less rule is position:absolute. Keep its containing block
    // while placing the Popover in normal flow; Dialog fixtures retain static placement.
    const position = popup.isA("sap.m.Popover") ? "relative" : "static"
    surface.style.setProperty("position", position, "important")
    surface.style.setProperty("inset", "auto", "important")
    surface.style.setProperty("transform", "none", "important")
    surface.style.setProperty("max-width", "none", "important")
    surface.style.setProperty("max-height", "none", "important")
    // core/Popup.js keeps repositioning an open popup (resize/scroll/"followOf" handlers write
    // position/top/left inline). Pin the in-place placement against those later writes.
    surface.style.setProperty("position", position, "important")
    surface.style.setProperty("top", "auto", "important")
    surface.style.setProperty("left", "auto", "important")
    popup.oPopup?.setFollowOf?.(false)
    // sap/m/Popover.js overrides oPopup._applyPosition and re-runs it from resize/orientation
    // listeners (ResizeHandler on its scroll area); later page layout (more fixtures rendering)
    // would write top/left/position back. In a fixture the popup must stay where we put it.
    // Let it run (it also sizes content and toggles the resize handle) and re-pin afterwards: it may
    // rewrite the whole style attribute, dropping our !important placement.
    const pin = () => {
      for (const [k, v] of [["position", position], ["inset", "auto"], ["top", "auto"], ["left", "auto"], ["transform", "none"], ["max-width", "none"], ["max-height", "none"]])
        surface.style.setProperty(k, v, "important")
    }
    if (popup.oPopup && !popup.oPopup.__fixturePinned) {
      const original = popup.oPopup._applyPosition
      popup.oPopup._applyPosition = function (...args) {
        const result = original.apply(this, args)
        pin()
        return result
      }
      popup.oPopup.__fixturePinned = true
    }
    cell.append(surface)

    // Modal block layers cover sibling fixtures after the popup is moved from the static
    // area. Removing their visual interception is fixture framing, not dialog styling.
    for (const blocker of document.querySelectorAll(".sapUiBLy")) blocker.style.display = "none"
    document.activeElement?.blur()
    await document.fonts.ready
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    return surface
  }

  return { showPopupInPlace }
})
