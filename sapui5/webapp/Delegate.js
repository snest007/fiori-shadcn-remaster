// Dev-time metadata for the real OpenUI5 FilterBar; no backend or persistence is involved.
sap.ui.define(["sap/ui/mdc/FilterBarDelegate", "sap/ui/mdc/FilterField"], (Base, FilterField) => {
  "use strict"

  const properties = [
    { key: "name", label: "Name", dataType: "sap.ui.model.type.String", group: "person", groupLabel: "Person" },
    { key: "country", label: "Country", dataType: "sap.ui.model.type.String", group: "location", groupLabel: "Location" },
    { key: "city", label: "City", dataType: "sap.ui.model.type.String", group: "location", groupLabel: "Location" },
  ]
  const Delegate = Object.assign({}, Base)

  // sap/ui/mdc/FilterBarDelegate.fetchProperties requires metadata to stay stable for the
  // control's lifetime, including the items created later by Adapt Filters.
  Delegate.fetchProperties = () => Promise.resolve(properties)
  Delegate.addItem = (filterBar, key) => {
    const property = properties.find((item) => item.key === key)
    if (!property) return Promise.reject(new Error(`Unknown reference filter: ${key}`))
    // FilterField.js: conditions are managed by the FilterBar's $filters condition model.
    return Promise.resolve(new FilterField({
      label: property.label,
      dataType: property.dataType,
      propertyKey: key,
      conditions: `{$filters>/conditions/${key}}`,
    }))
  }
  // FilterBarDelegate.removeItem: true permits the standard personalization cleanup.
  Delegate.removeItem = () => Promise.resolve(true)
  Delegate.properties = properties

  return Delegate
})
