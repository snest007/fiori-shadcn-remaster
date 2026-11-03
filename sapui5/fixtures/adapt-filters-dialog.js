// Dev-only OpenUI5 1.154 oracle. Keep case IDs and editors aligned with the React fixtures.
sap.ui.define([
  "sap/ui/mdc/p13n/panels/AdaptFiltersPanel",
  "sap/ui/mdc/filterbar/p13n/FilterGroupLayout",
  "sap/m/p13n/Popup", "sap/m/Input", "sap/ui/core/Element", "sap/ui/core/Lib",
  "ref/popup-in-place",
], (AdaptFiltersPanel, FilterGroupLayout, Popup, Input, Element, Library, popupHelper) => {
  "use strict"

  const cases = [
    { id: "adapt-filters-dialog-list-edit", props: { view: "list", mode: "edit" } },
    { id: "adapt-filters-dialog-list-sort", props: { view: "list", mode: "sort" } },
    { id: "adapt-filters-dialog-group-two-groups", props: { view: "group", mode: "edit" } },
    { id: "adapt-filters-dialog-no-results", props: { view: "list", mode: "edit", search: "Unknown filter" } },
    { id: "adapt-filters-dialog-reset-confirmation", props: { view: "list", mode: "edit", reset: true } },
  ]
  const fields = [
    { name: "name", label: "Name", group: "person", groupLabel: "Person", required: true, value: "Ada", visible: true },
    { name: "country", label: "Country", group: "location", groupLabel: "Location", value: "Germany", visible: true },
    { name: "city", label: "City", group: "location", groupLabel: "Location", value: "", visible: false },
  ]

  async function render({ view, mode, search, reset }, cell) {
    const prefix = cell.dataset.fixture
    const wrappers = new Map()
    const panel = new AdaptFiltersPanel(`${prefix}-panel`, {
      itemFactory: (context) => {
        const item = context.getObject()
        if (!wrappers.has(item.name)) {
          const field = new Input(`${prefix}-field-${item.name}`, { value: fields.find((f) => f.name === item.name).value })
          field._bHasConditions = Boolean(field.getValue())
          // GroupContainer.js:addFilterField uses FilterGroupLayout to reuse the live editor
          // across cloned List/Group row layouts; the public factory also accepts custom fields.
          const wrapper = new FilterGroupLayout(`${prefix}-layout-${item.name}`)
          wrapper.setFilterField(field)
          wrappers.set(item.name, wrapper)
        }
        return wrappers.get(item.name)
      },
    })
    const data = { items: fields.map((field, index) => ({
      name: field.name, label: field.label, tooltip: field.label,
      group: field.group, groupLabel: field.groupLabel, required: Boolean(field.required),
      visible: field.visible, visibleInDialog: true, position: field.visible ? index : -1,
      isFiltered: Boolean(field.value), active: Boolean(field.value),
    })) }
    panel.setP13nData(data)
    panel.switchView(view)
    const content = panel.getCurrentViewContent()
    if (mode === "sort") {
      const modeButton = content._getModeButton()
      const sortItem = modeButton.getItems().find((item) => item.getKey() === "sort")
      modeButton.setSelectedKey("sort")
      content._onModeChange({ getParameter: () => sortItem })
    }
    if (search) {
      content._getSearchField().setValue(search)
      content._filterByModeAndSearch()
    }
    const popup = new Popup(`${prefix}-popup`, {
      title: "Adapt Filters", mode: "Dialog",
      warningText: Library.getResourceBundleFor("sap.ui.mdc").getText("filterbar.ADAPT_RESET_WARNING"),
      reset: () => panel.restoreDefaults(),
    })
    popup.addPanel(panel)
    // Public Popup.open sizing applies identically to the React fixture; leave all of
    // sap.m.Dialog's painted header, content, footer, border, and resize handle intact.
    popup.open(undefined, { contentWidth: "60rem", contentHeight: "35rem", enableReset: Boolean(reset) })
    const surface = await popupHelper.showPopupInPlace(popup._oPopup, cell)
    window.__adaptFiltersOracle ??= {}
    window.__adaptFiltersOracle[prefix] = { panel, popup }
    if (reset) {
      const originalIds = new Set([...document.querySelectorAll(".sapMDialog")].map((dialog) => dialog.id))
      popup.getResetButton().firePress()
      // MessageBox.warning constructs its real sap.m.Dialog synchronously. Wait for its
      // afterOpen boundary through the same helper used for the personalization dialog.
      const warning = Object.values(Element.registry.all())
        .find((control) => control.isA?.("sap.m.Dialog") && !originalIds.has(control.getId()) && control.getTitle() === "Warning")
      if (!warning) throw new Error("Adapt Filters Reset did not create its warning dialog")
      cell.removeChild(surface)
      // Opening the warning re-renders the personalization dialog into the static area, where it
      // would float over neighbouring fixture cells (variant-management-*). Keep that parent hidden
      // across later renders; only the warning surface is compared in this case.
      popup._oPopup.addStyleClass("adapt-filters-fixture-parent-hidden")
      if (!document.getElementById("adapt-filters-parent-framing")) {
        const style = document.createElement("style")
        style.id = "adapt-filters-parent-framing"
        style.textContent = ".sapMDialog.adapt-filters-fixture-parent-hidden { display: none !important }"
        document.head.append(style)
      }
      await popupHelper.showPopupInPlace(warning, cell)
    }
  }

  return { name: "adapt-filters-dialog", cases, render }
})
