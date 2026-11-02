sap.ui.define([
  "sap/m/VariantManagement",
  "sap/m/VariantItem",
  "sap/ui/mdc/FilterBar",
  "ref/Delegate",
], (VariantManagement, VariantItem, FilterBar, Delegate) => {
  "use strict"

  async function render(root) {
    const section = document.createElement("section")
    section.id = "sapui5-reference-demo"
    section.style.width = "100%"
    const variantHost = document.createElement("div")
    const filterHost = document.createElement("div")
    section.append(variantHost, filterHost)
    root.append(section)

    const variants = new VariantManagement("sapui5-variant-management", {
      selectedKey: "standard",
      defaultKey: "standard",
      items: [
        new VariantItem({ key: "standard", title: "Standard", favorite: true, changeable: false, remove: false, rename: false }),
        new VariantItem({ key: "personal", title: "My View", favorite: true, author: "Reference User" }),
        new VariantItem({ key: "shared", title: "Shared View", favorite: true, sharing: "Public", author: "Reference Team" }),
      ],
    })
    // VariantManagement.js:setStandardVariantKey marks the protected Standard item.
    variants.setStandardVariantKey("standard")
    variants.placeAt(variantHost)

    const filters = new FilterBar("sapui5-filter-bar", {
      delegate: { name: "ref/Delegate" },
      p13nMode: ["Item", "Value"],
      propertyInfo: Delegate.properties,
      // FilterBar.js:propertyKeys creates initial fields through the delegate. City remains
      // available in Adapt Filters, exercising metadata beyond the initially visible fields.
      propertyKeys: ["name", "country"],
    })
    filters.placeAt(filterHost)
    await filters.initializedWithMetadata()
    sap.ui.getCore().applyChanges()
    return { variants, filters }
  }

  return { render }
})
