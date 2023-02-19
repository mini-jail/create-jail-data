export type Source = {
  name: string
  label: string
  colorable: boolean
  zIndex: number
  position: [x: number, y: number]
  source: string
  visible: boolean
  compositeOp: GlobalCompositeOperation
  opacity: number
  color?: string
}

export type Asset = {
  name: string
  label: string
  color?: string
  sources: Source[]
  default: boolean
}

export type Data = {
  dimensions: [x: number, y: number]
  colorPalette: ColorPalette
  assets: Asset[]
}

export type ColorPalette = Record<string, string>

export type Preview = {
  url: string
  asset: Asset
}

export type OraImage = {
  "@version": string
  "@w": number
  "@h": number
  stack: OraStack
}

export type OraStack = {
  "@name": string
  "@opacity": number
  "@visibility": string
  "@composite-op": string
  "@isolation": string
  layer?: OraLayer | OraLayer[]
  stack?: OraStack
}

export type OraLayer = {
  "@src": string
  "@name": string
  "@x": number
  "@y": number
  "@visibility": "hidden" | "visible"
  "@opacity": number
  "@composite-op": string
  "#text": null | string
}
