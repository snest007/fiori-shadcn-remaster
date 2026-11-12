import * as React from "react"

// UI5 2.28 Device.js/internals._isPhone: touch and not a tablet. Its generic
// tablet fallback uses a 600px short screen edge. matchMedia tracks the browser
// viewport instead; iPads and Windows touch devices remain tablets as in UI5.
const SMALL_VIEWPORT = "(max-width: 599px), (max-height: 599px)"
function getIsPhone() {
  if (typeof window === "undefined") return false
  const override = document.documentElement.dataset.fioriDevice
  if (override) return override === "phone"
  const touch = "ontouchstart" in window || navigator.maxTouchPoints > 0
  const ua = navigator.userAgent
  const windowsVersion = Number(ua.match(/Windows NT (\d+\.\d+)/)?.[1] ?? 0)
  if (!touch || /iPad/.test(ua) || windowsVersion >= 8 || (/Macintosh/.test(ua) && "ontouchend" in document)) return false
  if (/Android/.test(ua) && /Chrome/.test(ua)) return /Mobile Safari/.test(ua)
  return window.matchMedia(SMALL_VIEWPORT).matches
}
function subscribe(listener: () => void) {
  const media = window.matchMedia(SMALL_VIEWPORT)
  media.addEventListener("change", listener)
  const observer = new MutationObserver(listener)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-fiori-device"] })
  return () => { media.removeEventListener("change", listener); observer.disconnect() }
}
/** UI5-style phone detection; html[data-fiori-device] can force phone/tablet/desktop. */
function useIsPhone() {
  return React.useSyncExternalStore(subscribe, getIsPhone, () => false)
}
export { useIsPhone }
