declare module "virtual:fiori-demo-metadata" {
  const data: {
    categories: string[]
    metadata: Record<string, { category: string; title: string; props: { name: string; type: string; description: string; defaultValue?: string }[] }>
    documentation: Record<string, { accessibility: string[]; audit?: string; textKeys: { prop: string; key: string; defaultText: string; ui5Keys: string[] }[] }>
  }
  export default data
}
