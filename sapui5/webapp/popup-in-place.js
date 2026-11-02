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
    surface.style.setProperty("position", "static", "important")
    surface.style.setProperty("inset", "auto", "important")
    surface.style.setProperty("transform", "none", "important")
    surface.style.setProperty("max-width", "none", "important")
    surface.style.setProperty("max-height", "none", "important")
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
