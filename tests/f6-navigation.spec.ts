import { expect, test, type Page, type TestInfo } from "@playwright/test"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { resolve } from "node:path"
import { build } from "vite"

type Snapshot = { active: string; prevented: boolean; focusCalls: string[] }
type KeyInit = Pick<KeyboardEventInit, "key" | "keyCode" | "ctrlKey" | "metaKey" | "altKey" | "shiftKey">
type Harness = {
  mode: (mode: "ours" | "native" | "off") => void
  mount: (html: string) => void
  install: (id?: string) => number
  cleanup: (index: number) => void
  hook: (id?: string | null, copies?: number) => void
  unmount: () => void
  shadow: (html: string) => void
  ui5: (negative?: boolean) => void
  surface: (name: string, options?: { handlers?: boolean; cancel?: boolean; asChild?: boolean }) => void
  deep: () => HTMLElement
  groups: () => string[]
  ready: number
  focusCalls: string[]
  events: Snapshot[]
  helps: number
  calls: string[]
  refs: Record<string, HTMLElement | null>
  scheduled: number
}
declare global { interface Window { f6Harness: Harness } }

async function bundle(source: string, name: string, server = false): Promise<string> {
  const virtual = resolve(`${name}.js`)
  const resolved = `\0${name}`
  const result = await build({
    configFile: false, publicDir: false, logLevel: "silent",
    define: { "process.env.NODE_ENV": JSON.stringify("development") },
    resolve: { alias: [
      { find: /^@\/components\/ui\//, replacement: resolve("registry/ui/") + "/" },
      { find: /^@\/lib\//, replacement: resolve("registry/lib/") + "/" },
    ] },
    plugins: [{ name, resolveId: (id) => id === virtual ? resolved : undefined, load: (id) => id === resolved ? source : undefined }],
    build: {
      write: false, minify: false, ssr: server,
      lib: { entry: virtual, formats: [server ? "cjs" : "iife"], name: "F6Test" },
      rollupOptions: { external: server ? ["react", "react-dom/server"] : [] },
    },
  })
  const output = Array.isArray(result) ? result[0] : result
  if (!("output" in output)) throw new Error("Expected an in-memory Vite build")
  const chunk = output.output.find((file) => file.type === "chunk")
  if (!chunk || chunk.type !== "chunk") throw new Error("Missing F6 harness bundle")
  return chunk.code
}

let harnessCode: string
let ssrCode: string
let stylesheet: string
test.beforeAll(async () => {
  const source = `
    import * as React from "react";
    import { createRoot } from "react-dom/client";
    import { flushSync } from "react-dom";
    import { installF6Navigation, useF6Navigation } from ${JSON.stringify(resolve("registry/lib/fiori-f6.ts"))};
    import NativeF6 from ${JSON.stringify(resolve("node_modules/@ui5/webcomponents-base/dist/features/F6Navigation.js"))};
    import nativeGroups from ${JSON.stringify(resolve("node_modules/@ui5/webcomponents-base/dist/util/getFastNavigationGroups.js"))};
    import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
    import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
    import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
    import { Menu, MenuTrigger, MenuContent, MenuItem, MenuSub, MenuSubTrigger, MenuSubContent } from "@/components/ui/menu";
    import { Input } from "@/components/ui/input";
    import { ComboBox, ComboBoxItem } from "@/components/ui/combobox";
    import { MultiComboBox, MultiComboBoxItem } from "@/components/ui/multi-combobox";
    import { MultiInput } from "@/components/ui/multi-input";
    import { Token } from "@/components/ui/token";
    import { DatePicker } from "@/components/ui/date-picker";
    import { Search, SearchItem } from "@/components/ui/search";
    import { Bar } from "@/components/ui/bar";
    import { Form, FormGroup, FormItem } from "@/components/ui/form";
    import { List, ListItemStandard } from "@/components/ui/list";
    import { Tree, TreeItem } from "@/components/ui/tree";
    import { SideNavigation, SideNavigationItem } from "@/components/ui/side-navigation";
    const native = new NativeF6(); native.removeEventListeners();
    let stop; const cleanups = []; let reactRoot; let hooksRoot;
    const h = window.f6Harness = { ready: 0, events: [], focusCalls: [], helps: 0, calls: [], refs: {}, scheduled: 0 };
    let aliasEvent = false; const originalTimeout = window.setTimeout;
    window.setTimeout = function(...args) { if(aliasEvent) h.scheduled++; return originalTimeout.apply(this,args); };
    document.addEventListener("keydown",event=>{aliasEvent=event.key==="F6"||((event.ctrlKey||event.metaKey)&&event.altKey&&["ArrowDown","ArrowUp"].includes(event.key));},true);
    h.deep = () => { let a=document.activeElement; while(a?.shadowRoot?.activeElement) a=a.shadowRoot.activeElement; return a; };
    const originalFocus=HTMLElement.prototype.focus;
    HTMLElement.prototype.focus=function(...args){ h.focusCalls.push(this.id || this.getAttribute("data-slot") || this.tagName); return originalFocus.apply(this,args); };
    const nativeListener=async e=>{ await native._keydownHandler(e); record(e); };
    const record=e=>{ aliasEvent=false; if(!["Shift","Control","Meta","Alt"].includes(e.key)) h.events.push({active:h.deep()?.id, prevented:e.defaultPrevented, focusCalls:[...h.focusCalls]}); };
    h.mode=mode=>{
      stop?.(); document.removeEventListener("keydown",nativeListener); document.removeEventListener("keydown",record);
      if(mode==="ours") { stop=installF6Navigation(); document.addEventListener("keydown",record); }
      else { stop=undefined; document.addEventListener("keydown",mode==="native" ? nativeListener : record); }
    };
    h.mode("off");
    h.mount=html=>{ document.getElementById("f6-test").innerHTML=html; h.events=[]; h.focusCalls=[]; };
    h.install=id=>{ const root=id==="shadow" ? document.getElementById("host").shadowRoot : id ? document.getElementById(id) : document;
      const index=cleanups.push(installF6Navigation(root))-1;
      document.removeEventListener("keydown",record); document.addEventListener("keydown",record); return index; };
    h.cleanup=index=>cleanups[index]();
    h.shadow=html=>document.getElementById("host").attachShadow({mode:"open"}).innerHTML=html;
    h.ui5=negative=>{
      const host=document.getElementById("fake-ui5"); host.isUI5Element=true;
      host._waitForDomRef=async()=>{};
      host.getDomRef=()=>host.shadowRoot.firstElementChild;
      if(negative) host.setAttribute("tabindex","-1");
      host.attachShadow({mode:"open"}).innerHTML='<div><button id="ui5-inner">UI5 inner</button></div>';
    };
    h.groups=()=>nativeGroups(document.getElementById("f6-test")).map(g=>g.id);
    function Hook({id}) { useF6Navigation(id===undefined ? undefined : id===null ? null : document.getElementById(id)); React.useEffect(()=>{document.removeEventListener("keydown",record);document.addEventListener("keydown",record);h.ready++}); return null; }
    h.hook=(id,copies=1)=>{
      hooksRoot ||= createRoot(document.getElementById("f6-hooks"));
      flushSync(()=>hooksRoot.render(React.createElement(React.StrictMode,null,...Array.from({length:copies},(_,key)=>React.createElement(Hook,{key,id})))));
    };
    h.unmount=()=>{ flushSync(()=>hooksRoot.unmount()); hooksRoot=undefined; };
    const e=React.createElement;
    h.surface=(name,options={})=>{
      reactRoot ||= createRoot(document.getElementById("f6-react"));
      let surface;
      h.calls=[]; h.refs={}; h.scheduled=0;
      const handler=label=>event=>{if(["Shift","Control","Meta","Alt"].includes(event.key))return;h.calls.push(label);if(options.cancel)event.preventDefault();};
      const controlProps=label=>({id:label,ref:node=>h.refs[label]=node,...(options.handlers?{onKeyDown:handler(label)}:{})});
      if(name==="dialog") surface=e(Dialog,{open:true},e(DialogContent,{"data-sap-ui-fastnavgroup-container":"false"},e(DialogTitle,null,"F6 dialog"),
        e("section",{"data-sap-ui-fastnavgroup":"true"},e("button",{id:"d1"},"One")),e("section",{"data-sap-ui-fastnavgroup":"true"},e("button",{id:"d2"},"Two"))));
      if(name==="popover") surface=e(Popover,{open:true},e(PopoverAnchor,{asChild:true},e("button",{id:"anchor"},"Anchor")),e(PopoverContent,{"aria-label":"F6 popover","data-sap-ui-fastnavgroup-container":"false"},e("button",{id:"plain"},"Plain")));
      if(name==="select") surface=e(Select,{defaultValue:"one",open:true},e(SelectTrigger,null,e(SelectValue)),e(SelectContent,null,e(SelectItem,{value:"one"},"One"),e(SelectItem,{value:"two"},"Two")));
      if(name==="menu") surface=e(Menu,{open:true},e(MenuTrigger,{asChild:true},e("button",null,"Open menu")),e(MenuContent,null,
        e(MenuItem,{id:"menu-first"},"First"),e(MenuSub,{open:true},e(MenuSubTrigger,null,"Sub"),e(MenuSubContent,null,e(MenuItem,{id:"menu-sub-first"},"Nested")))));
      if(name==="message") surface=e(Input,{id:"message-input",valueState:"negative",valueStateMessage:e("a",{id:"message-link",href:"#"},"Help")});
      const fieldProps={id:"field",defaultValue:"One"};
      if(name==="closed-select") surface=e(Select,{defaultValue:"one"},e(SelectTrigger,{id:"field"},e(SelectValue)),e(SelectContent,null,e(SelectItem,{value:"one"},"One"),e(SelectItem,{value:"two"},"Two")));
      if(name==="closed-combo") surface=e(ComboBox,fieldProps,e(ComboBoxItem,{text:"One"}),e(ComboBoxItem,{text:"Two"}));
      if(name==="closed-multi") surface=e(MultiComboBox,{id:"field",defaultValue:""},e(MultiComboBoxItem,{text:"One"}),e(MultiComboBoxItem,{text:"Two"}));
      if(name==="closed-picker") surface=e(DatePicker,{id:"field",defaultValue:"2026-01-01",formatPattern:"yyyy-MM-dd"});
      if(name==="tokens") surface=e(MultiInput,{id:"field",showValueHelpIcon:true,onValueHelpTrigger:()=>h.helps++,tokens:e(Token,{id:"last-token",text:"One"})});
      if(name==="search") surface=e(Search,{id:"search-root"},e(SearchItem,{id:"s1",text:"One"}),e(SearchItem,{id:"s2",text:"Other"}));
      if(name==="list") surface=e(React.Fragment,null,e(List,{selectionMode:"single",accessibleRole:"listbox",defaultValue:["one"]},e(ListItemStandard,{id:"nav-first",value:"one"},"One"),e(ListItemStandard,{value:"two"},"Two")),e("section",{"data-sap-ui-fastnavgroup":"true"},e("button",{id:"tail"},"Tail")));
      if(name==="tree") surface=e(React.Fragment,null,e(Tree,{selectionMode:"single",defaultValue:["one"]},e(TreeItem,{id:"nav-first",value:"one",text:"One"}),e(TreeItem,{value:"two",text:"Two"})),e("section",{"data-sap-ui-fastnavgroup":"true"},e("button",{id:"tail"},"Tail")));
      if(name==="leaf-select"||name==="leaf-open-select") surface=e(Select,{defaultValue:"one",...(name==="leaf-open-select"?{open:true}:{})},
        e(SelectTrigger,controlProps("leaf-trigger"),e(SelectValue)),e(SelectContent,controlProps("leaf-content"),e(SelectItem,{id:"leaf-first",value:"one"},"One"),e(SelectItem,{id:"leaf-second",value:"two"},"Two")));
      if(name==="leaf-menu"||name==="leaf-open-menu"||name==="leaf-open-submenu") surface=e(Menu,{...(name!=="leaf-menu"?{open:true}:{})},
        e(MenuTrigger,{...controlProps("leaf-trigger"),asChild:options.asChild},options.asChild?e("button",{id:"leaf-child",ref:node=>h.refs.child=node,onKeyDown:handler("child")},"Open menu"):"Open menu"),
        e(MenuContent,{...controlProps("leaf-content"),asChild:options.asChild},options.asChild?e("div",{id:"leaf-content-child",ref:node=>h.refs.contentChild=node,onKeyDown:handler("content-child")},e(MenuItem,{id:"leaf-first"},"One"),e(MenuItem,{id:"leaf-second"},"Two")):
          [e(MenuItem,{id:"leaf-first",key:"one"},"One"),e(MenuItem,{id:"leaf-second",key:"two"},"Two"),name==="leaf-open-submenu"?e(MenuSub,{open:true,key:"sub"},e(MenuSubTrigger,{id:"leaf-sub-trigger"},"Sub"),e(MenuSubContent,controlProps("leaf-sub-content"),e(MenuItem,{id:"leaf-sub-first"},"Nested"))):null]));
      if(name==="leaf-navigation") surface=e(SideNavigation,{collapsed:true,style:{height:"140px"}},...Array.from({length:12},(_,i)=>e(SideNavigationItem,{key:i,value:String(i),text:"Item "+i})));
      if(name.startsWith("closed-")||name==="tokens"||name==="search") {
        surface=e(React.Fragment,null,e("section",{"data-sap-ui-fastnavgroup":"true"},surface),e("section",{"data-sap-ui-fastnavgroup":"true"},e("button",{id:"tail"},"Tail")));
      }
      if(name==="groups") surface=e(React.Fragment,null,
        e(Bar,{id:"bar-false","data-sap-ui-fastnavgroup":"false"},e("button",{id:"bar-button"},"Bar")),
        e(Form,{id:"form-plain","data-sap-ui-fastnavgroup":"false"},e(FormItem,{label:"Plain"},e("button",{id:"form-first"},"Plain"))),
        e(Form,{id:"form-grouped","data-sap-ui-fastnavgroup":"true"},
          e(FormGroup,{id:"group-false","data-sap-ui-fastnavgroup":"false"},e(FormItem,{label:"Hidden group"},e("button",{id:"group-false-button"},"False"))),
          e(FormGroup,{id:"group-true"},e(FormItem,{label:"Active group"},e("button",{id:"group-first"},"True")))));
      flushSync(()=>reactRoot.render(surface));
    };
  `
  ;[harnessCode, ssrCode] = await Promise.all([
    bundle(source, "f6-test"),
    bundle(`import * as React from "react"; import { renderToString } from "react-dom/server";
      import { useF6Navigation } from ${JSON.stringify(resolve("registry/lib/fiori-f6.ts"))};
      function Consumer(){useF6Navigation();return React.createElement("span",null,"Server");}
      export const render=()=>renderToString(React.createElement(Consumer));`, "f6-ssr-test", true),
  ])
  stylesheet = readFileSync("dist/block.html", "utf8").match(/href="([^"]+\.css)"/)![1]
})

async function mount(page: Page, html: string) {
  await page.route("**/f6-test.html", (route) => route.fulfill({ contentType: "text/html", body: `<!doctype html><html><head><link rel="stylesheet" href="${stylesheet}"></head><body><main id="f6-test"></main><div id="f6-hooks"></div><div id="f6-react"></div><script>${harnessCode.replaceAll("</script", "<\\/script")}</script></body></html>` }))
  await page.goto("/f6-test.html")
  await expect.poll(() => page.evaluate(() => typeof window.f6Harness?.install)).toBe("function")
  await page.evaluate((html) => window.f6Harness.mount(html), html)
}
async function focus(page: Page, id: string) {
  await page.evaluate((id) => {
    const h = window.f6Harness
    const target = document.getElementById(id) ?? document.getElementById("host")?.shadowRoot?.getElementById(id) ?? document.getElementById("fake-ui5")?.shadowRoot?.getElementById(id)
    ;(target as HTMLElement).focus()
    if (h.deep().id !== id) throw new Error(`Failed to focus ${id}`)
    h.focusCalls = []
  }, id)
}
async function key(page: Page, name: string | KeyInit, active: string, prevented = true, focusCalls?: string[], target?: string): Promise<Snapshot> {
  await page.evaluate(() => { window.f6Harness.events = []; window.f6Harness.focusCalls = [] })
  if (typeof name === "string") await page.keyboard.press(name)
  else await page.evaluate(({ init, target }) => (target ? document.getElementById(target)! : window.f6Harness.deep()).dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, composed: true, cancelable: true, ...init })), { init: name, target })
  await expect.poll(() => page.evaluate(() => window.f6Harness.events.length)).toBe(1)
  await expect.poll(() => page.evaluate(() => window.f6Harness.deep()?.id)).toBe(active)
  expect(await page.evaluate(() => window.f6Harness.events[0].prevented)).toBe(prevented)
  if (focusCalls) await expect.poll(() => page.evaluate(() => window.f6Harness.focusCalls)).toEqual(focusCalls)
  return page.evaluate(() => ({ active: window.f6Harness.deep()?.id, prevented: window.f6Harness.events[0].prevented, focusCalls: window.f6Harness.focusCalls }))
}
const group = (id: string, body: string, attributes = "") => `<section id="${id}" data-sap-ui-fastnavgroup="true" ${attributes}>${body}</section>`
const button = (id: string) => `<button id="${id}">${id}</button>`
const basic = group("a", button("a1") + button("a2")) + group("b", button("b1")) + group("c", button("c1"))

async function differential(page: Page, info: TestInfo, html: string, vector: (page: Page) => Promise<Snapshot[]>, setup?: (page: Page) => Promise<void>) {
  await mount(page, html)
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  const runs: Snapshot[][] = []
  for (const mode of ["native", "ours"] as const) {
    await page.evaluate(({ html, mode }) => { window.f6Harness.mount(html); window.f6Harness.mode(mode) }, { html, mode })
    await setup?.(page)
    runs.push(await vector(page))
  }
  expect(runs[1]).toEqual(runs[0])
  expect(errors).toEqual([])
  await info.attach("native-differential", { body: JSON.stringify({ oracle: "UI5 2.28.1", native: runs[0], ours: runs[1], errors }, null, 2), contentType: "application/json" })
}

test("f6: registry library and five blocks distribute the opt-in dependency", () => {
  const item = JSON.parse(readFileSync("public/r/f6-navigation.json", "utf8"))
  expect(item.type).toBe("registry:lib")
  expect(item.files.map(({ path, type }: { path: string; type: string }) => ({ path, type }))).toEqual([{ path: "registry/lib/fiori-f6.ts", type: "registry:lib" }])
  expect(item.dependencies).toEqual([])
  expect(item.files[0].content).not.toMatch(/(?:import|require).*@ui5/)
  for (const name of ["app-shell", "launchpad", "list-report", "object-page-floorplan", "master-detail"]) {
    expect(JSON.parse(readFileSync(`public/r/${name}.json`, "utf8")).registryDependencies).toContain("@petalo/f6-navigation")
  }
})

test("f6: library import and hook server rendering do not read document", () => {
  const module = { exports: {} as { render: () => string } }
  new Function("require", "module", "exports", ssrCode)(createRequire(import.meta.url), module, module.exports)
  expect(module.exports.render()).toBe("<span>Server</span>")
})

test("f6: importing is inert; duplicate installs reference count and cleanup is idempotent", async ({ page }) => {
  await mount(page, basic)
  await focus(page, "a1")
  await key(page, "F6", "a1", false, [])
  const installs = await page.evaluate(() => [window.f6Harness.install(), window.f6Harness.install()])
  await key(page, "F6", "b1", true, ["b1"])
  await page.evaluate((index) => { window.f6Harness.cleanup(index); window.f6Harness.cleanup(index) }, installs[0])
  await key(page, "F6", "c1", true, ["c1"])
  await page.evaluate((index) => window.f6Harness.cleanup(index), installs[1])
  await key(page, "Shift+F6", "c1", false, [])
  await page.evaluate(() => window.f6Harness.install())
  await key(page, "F6", "a1", true, ["a1"])
})

test("f6: StrictMode hooks share installs, switch roots, disable and clean up", async ({ page }) => {
  await mount(page, `<div id="scope">${group("a", button("a1")) + group("b", button("b1"))}</div>${group("c", button("c1"))}`)
  await page.evaluate(() => window.f6Harness.hook(undefined, 2))
  await expect.poll(() => page.evaluate(() => window.f6Harness.ready)).toBe(4)
  await focus(page, "a1")
  await key(page, "F6", "b1", true, ["b1"])
  await page.evaluate(() => window.f6Harness.hook("scope"))
  await expect.poll(() => page.evaluate(() => window.f6Harness.ready)).toBe(5)
  await key(page, "F6", "a1", true, ["a1"])
  await focus(page, "c1")
  await key(page, "F6", "c1", false, [])
  await page.evaluate(() => window.f6Harness.hook(null))
  await expect.poll(() => page.evaluate(() => window.f6Harness.ready)).toBe(6)
  await focus(page, "a1")
  await key(page, "F6", "a1", false, [])
  await page.evaluate(() => window.f6Harness.unmount())
  await key(page, "F6", "a1", false, [])
})

test("f6: overlapping document/element/shadow installations stay inside the innermost root", async ({ page }) => {
  await mount(page, `${group("outside", button("outside1"))}<div id="scope">${group("a", button("a1"))}<div id="host"></div></div>`)
  await page.evaluate(() => { window.f6Harness.shadow('<section data-sap-ui-fastnavgroup="true"><button id="s1">s1</button></section><section data-sap-ui-fastnavgroup="true"><button id="s2">s2</button></section>'); window.f6Harness.install(); window.f6Harness.install("scope"); window.f6Harness.install("shadow") })
  await focus(page, "s1")
  await key(page, "F6", "s2", true, ["s2"])
  await key(page, "F6", "s1", true, ["s1"])
  await focus(page, "a1")
  await key(page, "Shift+F6", "s2", true, ["s2"])
  await focus(page, "outside1")
  await key(page, "F6", "a1", true, ["a1"])
})

test("f6: an installed scope with no groups does not fall back to an overlapping document", async ({ page }) => {
  await mount(page, group("outside", button("outside1")) + '<div id="scope"><button id="plain">Plain</button></div>')
  await page.evaluate(() => { window.f6Harness.install(); window.f6Harness.install("scope") })
  await focus(page, "plain")
  await key(page, "F6", "plain", false, [])
})

test("f6: native forward/reverse wrap skips empty groups and enters their first focus target", async ({ page }, info) => {
  await differential(page, info, button("outside") + group("a", button("a1") + button("a2")) + group("empty", "Empty") + group("b", button("b1")) + group("c", button("c1")), async (page) => {
    const result: Snapshot[] = []
    await focus(page, "outside")
    for (const active of ["a1", "b1", "c1", "a1"]) result.push(await key(page, "F6", active))
    await focus(page, "a2")
    for (const active of ["c1", "b1", "a1"]) result.push(await key(page, "Shift+F6", active))
    await focus(page, "outside")
    result.push(await key(page, "Shift+F6", "c1"))
    return result
  })
})

test("f6: native visibility pruning covers display, visibility, opacity and either zero dimension", async ({ page }, info) => {
  const hidden = ["display:none", "visibility:hidden", "opacity:0", "width:0px", "height:0px"].map((style, i) => group(`hidden${i}`, button(`h${i}`), `style="${style}"`)).join("")
  await differential(page, info, group("a", button("a1")) + hidden + group("b", button("b1")), async (page) => {
    expect(await page.evaluate(() => window.f6Harness.groups())).toEqual(["a", "b"])
    await focus(page, "a1")
    return [await key(page, "F6", "b1"), await key(page, "Shift+F6", "a1")]
  })
})

test("f6: native nested groups avoid duplicate backward targets", async ({ page }, info) => {
  await differential(page, info, group("outer", group("inner", button("x"))) + group("z", button("z1")), async (page) => {
    await focus(page, "x")
    return [await key(page, "F6", "z1"), await key(page, "Shift+F6", "x"), await key(page, "Shift+F6", "z1")]
  })
})

for (const slotted of [false, true]) test(`f6: native open shadows${slotted ? " and assigned slots" : ""} preserve preorder and parent selection`, async ({ page }, info) => {
  await differential(page, info, `<div id="host">${slotted ? group("assigned", button("x")) : ""}</div>${group("z", button("z1"))}`, async (page) => {
    await focus(page, "x")
    return [await key(page, "F6", "z1"), await key(page, "Shift+F6", "x"), await key(page, "Shift+F6", "z1")]
  }, async (page) => { await page.evaluate((html) => window.f6Harness.shadow(html), group("shadow", slotted ? "<slot></slot>" : button("x"))) })
})

for (const modal of [false, true]) test(`f6: native ${modal ? "modal" : "nonmodal"} Popup container without groups is a no-op`, async ({ page }, info) => {
  await differential(page, info, group("outside", button("outside1")) + `<section role="dialog" aria-modal="${modal}" data-sap-ui-fastnavgroup-container="true">${button("plain")}</section>`, async (page) => {
    await focus(page, "plain")
    return [await key(page, "F6", "plain", false, []), await key(page, "Shift+F6", "plain", false, [])]
  })
})

test("f6: native Popup containers with groups cycle internally, with the nearest nested container winning", async ({ page }, info) => {
  const inner = `<section data-sap-ui-fastnavgroup-container="true">${group("n1", button("n1b")) + group("n2", button("n2b"))}</section>`
  const html = group("outside", button("outside1")) + `<section role="dialog" aria-modal="true" data-sap-ui-fastnavgroup-container="true">${group("m1", button("m1b")) + inner + group("m2", button("m2b"))}</section>`
  await differential(page, info, html, async (page) => {
    await focus(page, "m2b")
    const result = [await key(page, "F6", "m1b"), await key(page, "Shift+F6", "m2b")]
    await focus(page, "n1b")
    return [...result, await key(page, "F6", "n2b"), await key(page, "F6", "n1b")]
  })
})

test("f6: native Ctrl/Meta aliases and legacy keyCode fallbacks enforce exact modifier guards", async ({ page }, info) => {
  await differential(page, info, basic, async (page) => {
    await focus(page, "a1")
    const result: Snapshot[] = []
    for (const [name, active] of [["Control+Alt+ArrowDown", "b1"], ["Meta+Alt+ArrowDown", "c1"], ["Control+Alt+ArrowUp", "b1"], ["Meta+Alt+ArrowUp", "a1"]]) result.push(await key(page, name, active))
    for (const name of ["Control+Alt+F6", "Meta+F6", "Alt+F6", "Control+Alt+Shift+ArrowDown", "Shift+ArrowDown", "Control+ArrowDown"]) result.push(await key(page, name, "a1", false, []))
    for (const [init, active] of [
      [{ key: "Down", ctrlKey: true, altKey: true }, "b1"], [{ key: "Up", metaKey: true, altKey: true }, "a1"],
      [{ keyCode: 117 }, "b1"], [{ keyCode: 117, shiftKey: true }, "a1"],
      [{ keyCode: 40, metaKey: true, altKey: true }, "b1"], [{ keyCode: 38, ctrlKey: true, altKey: true }, "a1"],
    ] as [KeyInit, string][]) result.push(await key(page, init, active))
    return result
  })
})

test("f6: native focus traversal honors disabled, explicit tabindex, href, focus traps and display contents", async ({ page }, info) => {
  const html = group("a", button("a1")) + group("b", '<button disabled>Disabled</button><button tabindex="-1">Negative</button><div role="button">Role only</div><div data-ui5-focus-trap tabindex="0">Trap</div><div style="display:contents"><a id="link" href="#">Link</a></div>') + '<button id="group-button" data-sap-ui-fastnavgroup="true">Group itself</button>'
  await differential(page, info, html, async (page) => {
    await focus(page, "a1")
    return [await key(page, "F6", "link"), await key(page, "F6", "group-button"), await key(page, "F6", "a1")]
  })
})

for (const negative of [false, true]) test(`f6: native UI5 getDomRef traversal${negative ? " excludes a negative-tabindex host" : " enters its inner DOM"}`, async ({ page }, info) => {
  await differential(page, info, group("a", button("a1")) + group("b", '<div id="fake-ui5"></div>' + button("fallback")), async (page) => {
    await focus(page, "a1")
    return [await key(page, "F6", negative ? "fallback" : "ui5-inner"), await key(page, "F6", "a1")]
  }, async (page) => { await page.evaluate((negative) => window.f6Harness.ui5(negative), negative) })
})

test("f6: native first-focus fallback enters a keyboard-focusable scroll container", async ({ page }, info) => {
  await differential(page, info, group("a", button("a1")) + group("b", '<div id="scroll" style="overflow:auto;height:20px;width:20px"><div style="height:100px">Text</div></div>'), async (page) => {
    await focus(page, "a1")
    return [await key(page, "F6", "scroll"), await key(page, "F6", "a1")]
  })
})

test("f6: native rediscovery follows group insertion, reordering, hiding and attribute changes", async ({ page }, info) => {
  await differential(page, info, basic, async (page) => {
    await focus(page, "a1")
    await page.evaluate(() => { document.getElementById("b")!.setAttribute("data-sap-ui-fastnavgroup", "false"); document.getElementById("a")!.after(document.getElementById("c")!) })
    const result = [await key(page, "F6", "c1")]
    await page.evaluate(() => { document.getElementById("b")!.setAttribute("data-sap-ui-fastnavgroup", "true"); document.getElementById("a")!.style.opacity = "0" })
    result.push(await key(page, "F6", "b1"), await key(page, "F6", "c1"))
    await page.evaluate(() => document.getElementById("b")!.remove())
    result.push(await key(page, "F6", "c1"))
    return result
  })
})

test("f6: native behavior preserves propagation and handles an already-prevented key", async ({ page }, info) => {
  await differential(page, info, basic, async (page) => {
    await page.evaluate(() => document.getElementById("f6-test")!.addEventListener("keydown", (event) => event.preventDefault(), { once: true }))
    await focus(page, "a1")
    return [await key(page, "F6", "b1")]
  })
})

test("f6: D2 inert extension skips inert groups and inert descendants that native cannot focus", async ({ page }, info) => {
  await mount(page, group("a", button("a1")) + group("inert", button("i1"), "inert") + group("b", '<div inert><button>Inert descendant</button></div>' + button("b1")))
  await page.evaluate(() => window.f6Harness.mode("native"))
  await focus(page, "a1")
  const native = await key(page, "F6", "a1", true, ["i1"])
  await page.evaluate(() => window.f6Harness.mode("ours"))
  const ours = await key(page, "F6", "b1", true, ["b1"])
  await key(page, "Shift+F6", "a1", true, ["a1"])
  await info.attach("documented-inert-extension", { body: JSON.stringify({ native, ours }), contentType: "application/json" })
})

test("f6: real Dialog and Popover preserve their unconditional native Popup scopes", async ({ page }) => {
  await mount(page, group("outside", button("outside1")))
  await page.evaluate(() => { window.f6Harness.mode("ours"); window.f6Harness.surface("dialog") })
  const dialog = page.getByRole("dialog", { name: "F6 dialog" })
  await expect(dialog).toHaveAttribute("data-sap-ui-fastnavgroup-container", "true")
  await page.locator("#d1").focus()
  await key(page, "F6", "d2")
  await key(page, "F6", "d1")
  await page.evaluate(() => window.f6Harness.surface("popover"))
  await expect(dialog).toHaveCount(0)
  await expect(page.getByRole("dialog", { name: "F6 popover" })).toHaveAttribute("data-sap-ui-fastnavgroup-container", "true")
  await page.locator("#plain").focus()
  await key(page, "F6", "plain", false, [])
})

test("f6: direct Select and nested Menu surfaces retain native Popup/List groups", async ({ page }) => {
  await mount(page, group("outside", button("outside1")))
  await page.evaluate(() => { window.f6Harness.mode("ours"); window.f6Harness.surface("select") })
  const select = page.locator("[data-slot=select-content]")
  await expect(select).toHaveAttribute("data-sap-ui-fastnavgroup-container", "true")
  await expect(select.locator("[data-radix-select-viewport]")).toHaveAttribute("data-sap-ui-fastnavgroup", "true")
  await page.evaluate(() => window.f6Harness.surface("menu"))
  const menu = page.locator("[data-slot=menu-content]")
  const sub = page.locator("[data-slot=menu-sub-content]")
  await expect(menu).toHaveAttribute("data-sap-ui-fastnavgroup-container", "true")
  await expect(menu).toHaveAttribute("data-sap-ui-fastnavgroup", "true")
  await expect(sub).toHaveAttribute("data-sap-ui-fastnavgroup-container", "true")
  await expect(sub).toHaveAttribute("data-sap-ui-fastnavgroup", "true")
  await page.locator("#menu-sub-first").focus()
  await key(page, "F6", "menu-sub-first")
})

test("f6: a focusable standalone value-state message stays inside its Popup scope", async ({ page }) => {
  await mount(page, group("outside", button("outside1")))
  await page.evaluate(() => { window.f6Harness.mode("ours"); window.f6Harness.surface("message") })
  await page.locator("#message-input").focus()
  await expect(page.locator("#message-link")).toBeVisible()
  await page.locator("#message-link").focus()
  await key(page, "F6", "message-link", false, [])
})

test("f6: native metadata overrides remain explicit and Form follows its ungrouped-root rule", async ({ page }) => {
  await mount(page, group("outside", button("outside1")))
  await page.evaluate(() => { window.f6Harness.mode("ours"); window.f6Harness.surface("groups") })
  await expect(page.locator("#bar-false")).toHaveAttribute("data-sap-ui-fastnavgroup", "false")
  await expect(page.locator("#form-plain")).toHaveAttribute("data-sap-ui-fastnavgroup", "true")
  await expect(page.locator("#form-grouped")).not.toHaveAttribute("data-sap-ui-fastnavgroup")
  await expect(page.locator("#group-false")).toHaveAttribute("data-sap-ui-fastnavgroup", "false")
  await expect(page.locator("#group-true")).toHaveAttribute("data-sap-ui-fastnavgroup", "true")
  await focus(page, "outside1")
  await key(page, "F6", "form-first")
  await key(page, "F6", "group-first")
  await key(page, "F6", "outside1")
})

for (const widget of ["select", "combo", "multi", "picker"]) test(`f6: closed ${widget} leaves F6 arrow aliases to page groups without opening or changing value`, async ({ page }) => {
  await mount(page, group("outside", button("outside1")))
  await page.evaluate((name) => { window.f6Harness.mode("ours"); window.f6Harness.surface(name) }, `closed-${widget}`)
  const field = page.locator("#field")
  const before = widget === "select" ? await field.textContent() : await field.inputValue()
  for (const name of ["Control+Alt+ArrowDown", "Meta+Alt+ArrowDown", "Control+Alt+ArrowUp", "Meta+Alt+ArrowUp"]) {
    await field.focus()
    await key(page, name, name.endsWith("Down") ? "tail" : "outside1")
    expect(widget === "select" ? await field.textContent() : await field.inputValue()).toBe(before)
    await expect(page.locator("[data-sap-ui-fastnavgroup-container=true]")).toHaveCount(0)
  }
})

test("f6: Search input and suggestions use F6 aliases without ordinary arrow state changes", async ({ page }) => {
  await mount(page, group("outside", button("outside1")))
  await page.evaluate(() => { window.f6Harness.mode("ours"); window.f6Harness.surface("search") })
  const field = page.locator("#search-root").getByRole("searchbox")
  await field.fill("O")
  await expect(page.locator("#s1")).toBeVisible()
  await key(page, "Control+Alt+ArrowDown", "tail")
  await field.fill("O")
  await expect(page.locator("#s1")).toBeVisible()
  await page.locator("#s1").focus()
  const value = await field.inputValue()
  await key(page, "Meta+Alt+ArrowUp", "s1")
  await key(page, "Meta+Alt+ArrowDown", "s1")
  await expect(field).toHaveValue(value)
  await page.locator("#s2").focus()
  // The list's only nonnegative tabindex follows its roving item; F6 uses that first focusable target.
  await key(page, "Control+Alt+ArrowUp", "s2")
})

test("f6: open Select and Menu suppress raw primitive arrow actions while preserving F6 bubble", async ({ page }) => {
  await mount(page, group("outside", button("outside1")))
  await page.evaluate(() => { window.f6Harness.mode("ours"); window.f6Harness.surface("select") })
  const second = page.getByRole("option", { name: "Two", exact: true })
  await second.focus()
  for (const name of ["Control+Alt+ArrowDown", "Meta+Alt+ArrowUp"]) {
    const current = await second.evaluate((node) => { node.id = "select-second"; return node.id })
    await key(page, name, current)
    await expect(second).toBeFocused()
  }
  await page.evaluate(() => window.f6Harness.surface("menu"))
  await page.locator("#menu-sub-first").focus()
  await key(page, "Control+Alt+ArrowDown", "menu-sub-first")
  await key(page, "Meta+Alt+ArrowUp", "menu-sub-first")
  await expect(page.locator("[data-slot=menu-sub-content]")).toBeVisible()
})

const leafAliases = ["F6", "Shift+F6", "Control+Alt+ArrowDown", "Meta+Alt+ArrowDown", "Control+Alt+ArrowUp", "Meta+Alt+ArrowUp"]
for (const widget of ["select", "menu", "open-select", "open-menu", "open-submenu"]) test(`f6: ${widget} keeps native alias events uncancelled without an installer or groups`, async ({ page }) => {
  for (const mode of ["off", "empty"] as const) {
    await mount(page, "")
    await page.evaluate(({ widget, mode }) => {
      const h = window.f6Harness
      h.surface(`leaf-${widget}`)
      if (mode === "empty") {
        document.querySelectorAll("[data-sap-ui-fastnavgroup]").forEach((node) => node.removeAttribute("data-sap-ui-fastnavgroup"))
        h.mode("ours")
      }
    }, { widget, mode })
    const id = widget === "open-submenu" ? "leaf-sub-first" : widget.startsWith("open-") ? "leaf-second" : "leaf-trigger"
    await expect(page.locator(`#${id}`)).toBeVisible()
    const value = await page.locator("#leaf-trigger").textContent()
    for (const alias of leafAliases) {
      await focus(page, id)
      await page.evaluate(() => { window.f6Harness.scheduled = 0 })
      await key(page, alias, id, false, [])
      expect(await page.evaluate(() => window.f6Harness.scheduled)).toBe(0)
      await expect(page.locator("#leaf-trigger")).toHaveText(value!)
      await expect(page.locator("#leaf-trigger")).toHaveAttribute("aria-expanded", widget.startsWith("open-") ? "true" : "false")
    }
    // Direct surface focus exercises Menu's separate raw arrow callback as well as Select's.
    if (widget.startsWith("open-")) {
      const surface = widget === "open-submenu" ? "leaf-sub-content" : "leaf-content"
      // Menu's roving entry hook redirects actual surface focus into an item; dispatch on
      // the surface to exercise that raw callback while keeping the real focused item.
      for (const arrow of ["ArrowDown", "ArrowUp"]) for (const modifier of ["ctrlKey", "metaKey"]) {
        await key(page, { key: arrow, altKey: true, [modifier]: true }, id, false, [], surface)
      }
    }
  }
})

for (const widget of ["select", "menu", "open-select", "open-menu"]) test(`f6: ${widget} forwards caller cancellation and ref without cancelling on its own`, async ({ page }) => {
  for (const cancel of [false, true]) {
    await mount(page, "")
    await page.evaluate(({ widget, cancel }) => window.f6Harness.surface(`leaf-${widget}`, { handlers: true, cancel }), { widget, cancel })
    const id = widget.startsWith("open-") ? "leaf-second" : "leaf-trigger"
    const handler = widget.startsWith("open-") ? "leaf-content" : "leaf-trigger"
    await expect(page.locator(`#${id}`)).toBeVisible()
    expect(await page.evaluate((handler) => window.f6Harness.refs[handler] === document.getElementById(handler), handler)).toBe(true)
    await focus(page, id)
    for (const alias of leafAliases) {
      await page.evaluate(() => { window.f6Harness.calls = [] })
      await key(page, alias, id, cancel, [])
      expect(await page.evaluate(() => window.f6Harness.calls)).toEqual([handler])
    }
  }
})

test("f6: Menu public asChild retains child/caller handler order, composed refs and ordinary arrows", async ({ page }) => {
  await mount(page, "")
  await page.evaluate(() => window.f6Harness.surface("leaf-menu", { handlers: true, asChild: true }))
  await expect(page.locator("#leaf-child")).toBeVisible()
  expect(await page.evaluate(() => window.f6Harness.refs.child === window.f6Harness.refs["leaf-trigger"] && window.f6Harness.refs.child === document.getElementById("leaf-child"))).toBe(true)
  await focus(page, "leaf-child")
  await key(page, "Control+Alt+ArrowDown", "leaf-child", false, [])
  expect(await page.evaluate(() => window.f6Harness.calls)).toEqual(["child", "leaf-trigger"])
  await page.locator("#leaf-child").click()
  await expect(page.locator("#leaf-first")).toBeFocused()
  expect(await page.evaluate(() => window.f6Harness.refs.contentChild === window.f6Harness.refs["leaf-content"] && window.f6Harness.refs.contentChild === document.getElementById("leaf-content-child"))).toBe(true)
  await page.evaluate(() => { window.f6Harness.calls = [] })
  await key(page, "Meta+Alt+ArrowUp", "leaf-first", false, [])
  expect(await page.evaluate(() => window.f6Harness.calls)).toEqual(["content-child", "leaf-content"])
  await page.keyboard.press("ArrowDown")
  await expect(page.locator("#leaf-second")).toBeFocused()
})

test("f6: SideNavigation More and overflow keep uncancelled aliases without an installer or groups", async ({ page }) => {
  for (const mode of ["off", "empty"] as const) {
    await mount(page, "")
    await page.evaluate((mode) => {
      window.f6Harness.surface("leaf-navigation")
      if (mode === "empty") {
        document.querySelectorAll("[data-sap-ui-fastnavgroup]").forEach((node) => node.removeAttribute("data-sap-ui-fastnavgroup"))
        window.f6Harness.mode("ours")
      }
    }, mode)
    const more = page.getByRole("menuitem", { name: "More Items", exact: true })
    await expect(more).toBeVisible()
    const id = await more.evaluate((node) => { node.id = "leaf-more"; return node.id })
    await more.focus()
    for (const alias of leafAliases) {
      await key(page, alias, id, false, [])
      await expect(page.locator("[data-sn-overflow-menu]")).toHaveCount(0)
    }
    await more.click()
    const menu = page.locator("[data-sn-overflow-menu]")
    await expect(menu).toBeVisible()
    if (mode === "empty") await menu.evaluate((node) => node.removeAttribute("data-sap-ui-fastnavgroup"))
    const item = menu.getByRole("menuitem").first()
    const itemId = await item.evaluate((node) => { node.id = "leaf-overflow-first"; return node.id })
    await item.focus()
    for (const alias of leafAliases) {
      await key(page, alias, itemId, false, [])
      await expect(menu).toBeVisible()
    }
  }
})

test("f6: last token aliases do not schedule an input focus or open value help", async ({ page }) => {
  await mount(page, group("outside", button("outside1")))
  await page.evaluate(() => { window.f6Harness.mode("ours"); window.f6Harness.surface("tokens") })
  for (const name of ["Control+Alt+ArrowDown", "Meta+Alt+ArrowDown", "Control+Alt+ArrowUp", "Meta+Alt+ArrowUp"]) {
    await page.locator("#last-token").focus()
    await key(page, name, name.endsWith("Down") ? "tail" : "outside1")
    expect(await page.evaluate(() => window.f6Harness.helps)).toBe(0)
  }
})

for (const widget of ["list", "tree"]) test(`f6: ${widget} arrow handlers preserve selection while F6 aliases navigate groups`, async ({ page }) => {
  await mount(page, group("outside", button("outside1")))
  await page.evaluate((name) => { window.f6Harness.mode("ours"); window.f6Harness.surface(name) }, widget)
  const item = page.locator("#nav-first")
  await expect(item).toHaveAttribute("aria-selected", "true")
  for (const name of ["Control+Alt+ArrowDown", "Meta+Alt+ArrowDown", "Control+Alt+ArrowUp", "Meta+Alt+ArrowUp"]) {
    await item.focus()
    await key(page, name, name.endsWith("Down") ? "tail" : "outside1")
    await expect(item).toHaveAttribute("aria-selected", "true")
  }
})

test("f6: SideNavigation normal and overflow handlers let aliases reach the page and Popup groups", async ({ page }) => {
  await page.goto("/block.html?name=launchpad")
  await page.waitForSelector("html[data-ready=true]")
  const shell = page.locator("[data-slot=shell-bar]")
  const toggle = shell.getByRole("button", { name: "Collapse navigation", exact: true })
  const nav = page.locator("[data-slot=launchpad-navigation]")
  const home = nav.getByRole("treeitem", { name: "Home", exact: true })
  for (const name of ["Control+Alt+ArrowDown", "Meta+Alt+ArrowUp"]) {
    await home.focus()
    await page.keyboard.press(name)
    await expect(toggle).toBeFocused()
    await expect(home).toHaveAttribute("aria-current", "page")
  }
  await page.setViewportSize({ width: 1280, height: 280 })
  await toggle.click()
  const more = nav.getByRole("menuitem", { name: "More Items", exact: true })
  await expect(more).toBeVisible()
  await more.focus()
  await page.keyboard.press("Control+Alt+ArrowDown")
  await expect(shell.getByRole("button", { name: "Expand navigation", exact: true })).toBeFocused()
  await expect(page.getByRole("menu", { name: "Additional Navigation Items", exact: true })).toHaveCount(0)
  await more.click()
  const menu = page.getByRole("menu", { name: "Additional Navigation Items", exact: true })
  const orders = menu.getByRole("menuitem", { name: "Sales orders", exact: true })
  await orders.focus()
  for (const name of ["Control+Alt+ArrowDown", "Meta+Alt+ArrowUp"]) {
    await page.keyboard.press(name)
    await expect(orders).toBeFocused()
    await expect(menu).toBeVisible()
  }
})

test("f6: scoped documentation installs only inside its application groups", async ({ page }) => {
  await page.goto("/index.html#/f6-navigation")
  await page.waitForSelector("html[data-ready=true]")
  const demo = page.locator("#f6-navigation-demo")
  await demo.locator("#f6-navigation-0-second").focus()
  await page.keyboard.press("F6")
  await expect(demo.locator("#f6-navigation-1-first")).toBeFocused()
  await page.keyboard.press("Meta+Alt+ArrowUp")
  await expect(demo.locator("#f6-navigation-0-first")).toBeFocused()
  await demo.getByRole("button", { name: "Disable navigation", exact: true }).click()
  await demo.locator("#f6-navigation-0-first").focus()
  await page.keyboard.press("F6")
  await expect(demo.locator("#f6-navigation-0-first")).toBeFocused()
})

test("f6: Launchpad cycles its real shell/navigation groups and skips its static Home page", async ({ page }) => {
  await page.goto("/block.html?name=launchpad")
  await page.waitForSelector("html[data-ready=true]")
  const shell = page.locator("[data-slot=shell-bar]")
  const start = shell.getByRole("button", { name: "Collapse navigation", exact: true })
  const home = page.locator("[data-slot=launchpad-navigation]").getByRole("treeitem", { name: "Home", exact: true })
  await start.focus()
  await page.keyboard.press("F6")
  await expect(home).toBeFocused()
  await page.keyboard.press("F6")
  await expect(start).toBeFocused()
  await page.keyboard.press("Shift+F6")
  await expect(home).toBeFocused()
  await page.keyboard.press("Shift+F6")
  await expect(start).toBeFocused()
  await expect(page.locator("[data-slot=launchpad-page] h2")).toHaveText("Home")
  await shell.getByRole("button", { name: "User Menu", exact: true }).click()
  const menu = page.getByRole("dialog", { name: "User menu for John Doe", exact: true })
  await expect(menu).toHaveAttribute("data-sap-ui-fastnavgroup-container", "true")
  await menu.getByRole("menuitem", { name: "Settings", exact: true }).focus()
  await page.keyboard.press("F6")
  await expect(menu.getByRole("menuitem", { name: "Settings", exact: true })).toBeFocused()
})

test("f6: standalone List Report cycles title/filter/table/visible footer and reverses after sentinels settle", async ({ page }) => {
  await page.goto("/block.html?name=list-report")
  await page.waitForSelector("html[data-ready=true]")
  const report = page.locator("#list-report")
  await expect(page.locator("[data-variants-ready]")).toBeVisible()
  const title = report.locator("[data-dp-focus-area]")
  const search = report.getByRole("searchbox", { name: "Search", exact: true })
  // Table's first focusable sentinel redirects to its remembered row (initially the first data row).
  const tableRow = report.locator("[data-slot=table-row]").first()
  await title.focus()
  await page.keyboard.press("F6")
  await expect(search).toBeFocused()
  await page.keyboard.press("F6")
  await expect(tableRow).toBeFocused()
  await page.keyboard.press("F6")
  await expect(title).toBeFocused()
  await page.keyboard.press("Shift+F6")
  await expect(tableRow).toBeFocused()
  await page.keyboard.press("Meta+Alt+ArrowUp")
  await expect(search).toBeFocused()
  await page.keyboard.press("Control+Alt+ArrowDown")
  await expect(tableRow).toBeFocused()
  await report.getByRole("row", { name: /Premium Scissors/ }).getByRole("checkbox").click()
  const approve = report.getByRole("button", { name: "Approve (1)", exact: true })
  await expect(approve).toBeVisible()
  // UI5 DynamicPage's footer fades in: group discovery prunes an opacity-zero parent while it animates.
  await expect(report.locator("[data-slot=dynamic-page-footer]")).toHaveCSS("opacity", "1")
  await report.locator("[data-table-sentinel]").first().focus()
  await expect(tableRow).toBeFocused()
  await page.keyboard.press("F6")
  await expect(approve).toBeFocused()
  await page.keyboard.press("Control+Alt+ArrowUp")
  await expect(tableRow).toBeFocused()
  await page.keyboard.press("Meta+Alt+ArrowDown")
  await expect(approve).toBeFocused()
  await expect(report.getByRole("row", { name: /Premium Scissors/ })).toHaveAttribute("aria-selected", "true")
  await page.keyboard.press("F6")
  await expect(title).toBeFocused()
  await page.keyboard.press("Shift+F6")
  await expect(approve).toBeFocused()
  await page.keyboard.press("Shift+F6")
  await expect(tableRow).toBeFocused()
  await page.keyboard.press("Shift+F6")
  await expect(search).toBeFocused()
  await page.keyboard.press("Shift+F6")
  await expect(title).toBeFocused()
  // Collapsed filter/footer groups are excluded through inert, rather than cached as old destinations.
  await report.getByRole("button", { name: "Cancel", exact: true }).click()
  await report.getByRole("button", { name: "Collapse Header", exact: true }).click()
  await expect(report).toHaveAttribute("data-header-snapped", "")
  await title.focus()
  await page.keyboard.press("F6")
  await expect(tableRow).toBeFocused()
})
