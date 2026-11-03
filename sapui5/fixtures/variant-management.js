// Dev-only OpenUI5 1.154 oracle. Keep IDs and item properties aligned with the React fixture set.
sap.ui.define(["sap/m/VariantManagement", "sap/m/VariantItem", "sap/m/VBox", "sap/m/CheckBox", "ref/popup-in-place"], (VariantManagement, VariantItem, VBox, CheckBox, { showPopupInPlace }) => {
  const baseItems = [
    { key: "standard", title: "Standard", rename: false, remove: false, favorite: true, author: "SAP" },
    { key: "personal", title: "My View", rename: true, remove: true, changeable: true, favorite: true, author: "Me" },
    { key: "public", title: "Shared View", sharing: "Public", rename: true, remove: true, changeable: true, favorite: true, executeOnSelect: true, author: "Alex" },
    { key: "other", title: "Other View", rename: true, remove: true, favorite: false, author: "Me" },
  ]
  const listItems = [baseItems[0], ...Array.from({ length: 10 }, (_, i) => ({ key: `view-${i + 1}`, title: `View ${String(i + 1).padStart(2, "0")}`, favorite: true, rename: true, remove: true, changeable: true, author: "Me" }))]
  const roles = [{ key: "sales-role", title: "Sales Team" }, { key: "admin-role", title: "Administrators" }]
  const contextItems = baseItems.map((item) => ({ ...item, contexts: { role: item.key === "public" ? ["sales-role"] : [] } }))
  // VariantManagement accepts an application-owned ComponentContainer for roles.
  // Supply its actual getSelectedContexts/setSelectedContexts protocol using local
  // host candidates and real sap.m.CheckBox controls; no flexibility backend is used.
  const RolesFieldset = VBox.extend("ref.fixtures.VariantManagementRolesFieldset", {
    renderer: { apiVersion: 2, render: (rm, control) => {
      // This is the same host adapter's semantic fieldset on both sides. Reset
      // its browser defaults just as the consumer's Tailwind preflight does.
      rm.openStart("fieldset", control).style("margin", "0").style("padding", "0").style("border", "0")
        .style("font-size", "var(--sapFontSize)").style("line-height", "normal").openEnd()
      rm.openStart("legend").style("padding", "0").openEnd().text("Select Roles").close("legend")
      rm.openStart("div").style("display", "flex").style("flex-direction", "column").openEnd()
      control.getItems().forEach((item) => rm.renderControl(item))
      rm.close("div").close("fieldset")
    } },
  })
  const createRolesContainer = (fieldset = false) => {
    const choices = roles.map((role) => new CheckBox({ text: role.title }))
    const container = new (fieldset ? RolesFieldset : VBox)({ items: choices })
    container.getComponentInstance = () => ({
      getSelectedContexts: () => ({ role: roles.filter((_, index) => choices[index].getSelected()).map((role) => role.key) }),
      setSelectedContexts: (contexts) => choices.forEach((choice, index) => choice.setSelected(contexts.role?.includes(roles[index].key) ?? false)),
      hasErrorsAndShowErrorMessage: () => false,
    })
    return container
  }
  const place = async (popup, frame, open) => {
    await new Promise((resolve) => {
      if (popup.isOpen() && popup.oPopup?.getOpenState() === "OPEN") return resolve()
      popup.attachEventOnce("afterOpen", resolve)
      if (!popup.isOpen()) open?.()
    })
    // Freeze the naturally resolved viewport width before moving percentage-sized dialogs.
    const width = popup.getDomRef().getBoundingClientRect().width
    popup.oPopup.setAutoClose(false)
    if (!popup.isA("sap.m.Popover")) popup.setContentWidth(`${width}px`)
    sap.ui.getCore().applyChanges()
    return showPopupInPlace(popup, frame)
  }
  const cases = [
    { id: "variant-management-trigger", props: { state: "trigger" } },
    { id: "variant-management-modified", props: { state: "trigger", modified: true } },
    { id: "variant-management-error", props: { state: "trigger", error: true } },
    { id: "variant-management-list-search", props: { state: "list" } },
    { id: "variant-management-list-no-results", props: { state: "list-empty" } },
    { id: "variant-management-save-options", props: { state: "save" } },
    { id: "variant-management-save-duplicate", props: { state: "save-error" } },
    { id: "variant-management-manage", props: { state: "manage" } },
    { id: "variant-management-manage-rename-error", props: { state: "manage-error" } },
    { id: "variant-management-save-contexts", props: { state: "save-contexts" } },
    { id: "variant-management-manage-contexts", props: { state: "manage-contexts" } },
    { id: "variant-management-roles-open", props: { state: "roles" } },
    { id: "variant-management-error-open", props: { state: "error-open" } },
  ]
  let previous = Promise.resolve()
  return [{
    name: "variant-management", cases,
    render: async ({ state, modified, error }, cell) => {
      const before = previous
      let done
      previous = new Promise((resolve) => { done = resolve })
      await before
      try {
      const id = cell.dataset.fixture
      const contexts = state.endsWith("contexts") || state === "roles"
      const vm = new VariantManagement(`${id}-control`, {
        items: (state.startsWith("list") ? listItems : contexts ? contextItems : baseItems).map((item) => new VariantItem(item)),
        selectedKey: state.startsWith("list") ? "standard" : "personal",
        defaultKey: "standard", supportDefault: true, supportFavorites: true,
        supportApplyAutomatically: true, supportPublic: true,
        modified: !!modified, inErrorState: !!error || state === "error-open",
      })
      // VariantManagement assumes the app chooses its Standard key. Keep it explicit on both oracles.
      vm.setStandardVariantKey("standard")
      vm.placeAt(cell)
      sap.ui.getCore().applyChanges()
      if (state === "trigger") return
      // Keep popup shadows inside their own cells. This frame is identical on the React side.
      cell.style.overflow = "hidden"
      const frame = document.createElement("div")
      frame.style.cssText = "display:inline-flex;padding:0.75rem;overflow:hidden"
      cell.append(frame)
      let popup
      if (state === "error-open") {
        vm._openVariantList()
        popup = vm.oErrorVariantPopOver._oControl
        popup.oPopup.setAutoClose(false)
        await place(popup, frame)
      } else if (state.startsWith("list")) {
        vm._createVariantList()
        vm._openVariantList()
        popup = vm.oVariantPopOver._oControl
        popup.oPopup.setAutoClose(false)
        await place(popup, frame)
        if (state === "list-empty") {
          vm._oSearchField.setValue("unmatched")
          vm._oSearchField.fireLiveChange({ newValue: "unmatched" })
          sap.ui.getCore().applyChanges()
          // Illustration.js:_loadAsset delegates to IllustrationPool's asynchronous
          // SVG request. A rendered <use> can precede its symbol; wait for that
          // actual asset before declaring the visual oracle ready.
          while ([...frame.querySelectorAll("svg.sapMIllustration use")].some((use) => {
            const href = use.getAttribute("href")
            return href && !document.getElementById(href.slice(1))
          })) await new Promise(requestAnimationFrame)
        }
      } else if (state.startsWith("save")) {
        vm._createSaveAsDialog()
        vm.oSaveAsDialog.setContentWidth("20rem")
        if (contexts) {
          vm.openSaveAsDialog("variant-management-context-adapter", createRolesContainer(true))
          await Promise.resolve()
        } else vm._openSaveAsDialog()
        popup = vm.oSaveAsDialog
        await place(popup, frame)
        if (state === "save-error") {
          vm.oInputName.setValue("Shared View")
          vm._checkVariantNameConstraints(vm.oInputName)
          sap.ui.getCore().applyChanges()
        }
      } else {
        if (contexts) {
          vm.openManagementDialog(false, "variant-management-context-adapter", createRolesContainer())
          // The injected container is resolved by Promise.all before the real
          // management dialog is created. Await that rendering state, not a delay.
          while (!vm.oManagementDialog) await new Promise(requestAnimationFrame)
        } else vm._openManagementDialog()
        popup = vm.oManagementDialog
        if (state === "roles") {
          // Open through the original control's role action before comparing the
          // roles surface alone, as the React fixture clicks its matching edit action.
          const parentSurface = await place(popup, document.createElement("div"))
          const row = vm._getRowForKey("public")
          vm._openRolesDialog(vm.getItemByKey("public"), row.getCells()[5].getItems()[0])
          popup = vm._oRolesDialog
          // The hidden parent remains a functioning SAPUI5 dialog; comparing
          // only the nested roles surface must not paint it into sibling cells.
          parentSurface.style.setProperty("display", "none", "important")
          // Opening the nested dialog may re-render its parent into the static
          // area. Preserve that parent-only framing across its subsequent renders.
          if (!document.getElementById("variant-management-parent-framing")) {
            const style = document.createElement("style")
            style.id = "variant-management-parent-framing"
            style.textContent = ".sapMDialog.variant-management-fixture-parent-hidden { display: none !important }"
            document.head.append(style)
          }
          vm.oManagementDialog.addStyleClass("variant-management-fixture-parent-hidden")
        }
        await place(popup, frame)
        if (state === "manage-error") {
          const row = vm._getRowForKey("personal")
          row.getCells()[1].setValue("Shared View")
          vm._handleManageTitleChange(row.getCells()[1], vm.getItemByKey("personal"))
          sap.ui.getCore().applyChanges()
        }
      }
      await showPopupInPlace(popup, frame)
      // Compare the actual popup; the opener is exercised separately by the trigger fixtures.
      vm.getDomRef().style.cssText = "position:absolute;opacity:0;pointer-events:none"
      document.activeElement?.blur()
      await document.fonts.ready
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      document.activeElement?.blur()
      } finally { done() }
    },
  }]
})
