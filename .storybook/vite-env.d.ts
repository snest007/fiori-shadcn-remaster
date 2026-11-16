declare module "virtual:fiori-demo-metadata" {
  const data: {
    categories: string[]
    metadata: Record<string, { category: string; title: string; props: { name: string; type: string; description: string; defaultValue?: string }[] }>
  }
  export default data
}
