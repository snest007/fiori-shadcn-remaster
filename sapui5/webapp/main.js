sap.ui.define([
  "sap/ui/core/Core", "sap/ui/core/Theming", "sap/ui/core/AnimationMode",
  "sap/ui/core/ControlBehavior", "sap/ui/core/Rendering", "ref/fixtures",
], (Core, Theming, AnimationMode, ControlBehavior, Rendering, fixtureSets) => {
  const frame = () => new Promise((resolve) => requestAnimationFrame(resolve))
  const run = async () => {
    await Core.ready()
    ControlBehavior.setAnimationMode(AnimationMode.none)
    const query = new URLSearchParams(location.search)
    const theme = query.get("theme") ?? "sap_horizon"
    const density = query.get("density") === "compact" ? "compact" : "cozy"
    if (!["sap_horizon", "sap_horizon_dark", "sap_horizon_hcb", "sap_horizon_hcw"].includes(theme)) {
      throw new Error(`Unsupported reference theme: ${theme}`)
    }
    document.documentElement.dataset.theme = theme
    document.documentElement.dataset.density = density
    document.body.classList.toggle("sapUiSizeCompact", density === "compact")
    Theming.setTheme(theme)
    await new Promise((resolve) => {
      const applied = () => { Theming.detachApplied(applied); resolve() }
      Theming.attachApplied(applied)
    })
    document.body.style.cssText = "margin:0;padding:1rem;background:var(--sapBackgroundColor);font-family:var(--sapFontFamily)"
    const root = document.getElementById("root")
    root.style.cssText = "display:flex;flex-wrap:wrap;gap:1rem;align-items:flex-start"
    if (query.has("demo")) {
      const demo = await new Promise((resolve, reject) => sap.ui.require(["ref/demo"], resolve, reject))
      await demo.render(root)
    } else {
      const only = query.get("only")
      window.__fixtures = fixtureSets.flatMap((set) => set.cases
        .filter((c) => (!only || c.id.startsWith(only)) && !set.skipCompare?.includes(c.id))
        .map((c) => ({ id: c.id, tolerance: set.tolerance ?? 0.02 })))
      const renders = []
      for (const set of fixtureSets) {
        for (const c of set.cases) {
          if ((only && !c.id.startsWith(only)) || set.skipCompare?.includes(c.id)) continue
          const slot = document.createElement("div")
          slot.dataset.fixtureSlot = ""
          slot.style.display = "flex"
          const cell = document.createElement("div")
          cell.id = `${c.id}-cell`
          cell.dataset.fixture = c.id
          cell.style.cssText = "display:inline-flex;padding:0.25rem;line-height:normal"
          slot.append(cell)
          root.append(slot)
          renders.push(set.render(c.props, cell))
        }
      }
      Rendering.renderPendingUIUpdates("sapui5-reference")
      await Promise.all(renders)
      // core/Popup.js open() hands out z-indexes in the order popups finish opening. Fixtures
      // render concurrently, so that order (and which surface's shadow paints over a
      // neighbouring cell) depended on machine load: under CI load the Reset warning dialog
      // out-stacked the variant-management-list-search popover below it and its glow covered
      // that popover's header. Restack the in-place surfaces in document order, which is what
      // an idle page produces and what the React page's stacking matches.
      let zIndex = 10
      for (const surface of root.querySelectorAll("[data-fixture] [style*='z-index']")) {
        if (surface.style.zIndex) surface.style.zIndex = String(zIndex += 10)
      }
    }
    Rendering.renderPendingUIUpdates("sapui5-reference")
    await document.fonts.ready
    await frame()
    const slots = [...root.querySelectorAll("[data-fixture-slot]")]
    const sizes = slots.map((slot) => slot.firstElementChild.getBoundingClientRect())
    slots.forEach((slot, i) => {
      slot.style.width = `${Math.ceil(sizes[i].width)}px`
      slot.style.height = `${Math.ceil(sizes[i].height)}px`
    })
    await frame()
    await frame()
    document.documentElement.dataset.ready = "true"
  }
  run().catch((error) => {
    document.documentElement.dataset.error = error.message
    console.error(error)
  })
})
