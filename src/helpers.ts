import { JSZip } from "./deps.ts"
import { Asset, OraImage, OraLayer, OraStack } from "./types.d.ts"
import compositionMap from "./composition-map.ts"
import { Filter, Loss } from "./color.ts"

const allowedExtensions = ["jpg", "jpeg", "gif", "png", "bmp"]

export async function getColorDb(colorDbPath: string): Promise<
  Record<string, Loss & Filter>
> {
  try {
    return JSON.parse(await Deno.readTextFile(colorDbPath))
  } catch {
    return {}
  }
}

export async function writeColorDb(
  colorDbPath: string,
  colorDb: Record<string, Loss & Filter>,
): Promise<void> {
  try {
    await Deno.writeTextFile(
      colorDbPath,
      JSON.stringify(colorDb, null, 2),
    )
  } catch {
    // nothing
  }
}

export function getLayers(image: OraImage): OraLayer[] {
  const layers: OraLayer[] = []
  let stack: OraStack | undefined = image.stack
  while (stack) {
    if (stack.stack?.layer) {
      if (Array.isArray(stack.stack.layer)) {
        layers.push(...stack.stack.layer)
      } else if (typeof stack.stack.layer === "object") {
        layers.push(stack.stack.layer)
      }
      stack.stack.layer = undefined
    }
    stack = stack.stack
  }
  stack = image.stack
  while (stack) {
    if (stack.layer) {
      if (Array.isArray(stack.layer)) {
        layers.push(...stack.layer)
      } else if (typeof stack.layer === "object") {
        layers.push(stack.layer)
      }
    }
    stack = stack.stack
  }
  return layers
}

export function getLayerOpacity(layer: OraLayer): number {
  return layer["@opacity"] === undefined ? 1 : layer["@opacity"]
}

export function getLayerCompositeOp(layer: OraLayer): GlobalCompositeOperation {
  const op = layer["@composite-op"] === undefined
    ? "svg:src-over"
    : layer["@composite-op"]
  return op in compositionMap
    ? compositionMap[op]
    : (op.indexOf(":") > -1 ? op.split(":")[1] : op) as GlobalCompositeOperation
}

export function getLayerPositions(layer: OraLayer): [x: number, y: number] {
  return [layer["@x"] || 0, layer["@y"] || 0]
}

export function getLayerVisibility(layer: OraLayer): boolean {
  return layer["@visibility"] === "visible" || false
}

export function getImageDimensions(image: OraImage): [x: number, y: number] {
  return [image["@w"] || 0, image["@h"] || 0]
}

export async function getLayerSource(
  jsZip: JSZip,
  layer: OraLayer,
): Promise<string | null> {
  const extension = layer["@src"].split(".").pop()?.toLowerCase() || ""
  if (!allowedExtensions.includes(extension)) return null
  const base64 = await jsZip.file(layer["@src"]).async("base64")
  return `data:image/${extension};base64,${base64}`
}

export function getLayerNames(
  layer: OraLayer,
): [labelName: string, assetName: string, color: string | undefined] {
  const [labelName, assetName = "1", color = null] = layer["@name"].split(
    "-",
  )
  return [labelName, assetName, color !== null ? "#" + color : undefined]
}

export function sortAssets(assets: Asset[]): Asset[] {
  return assets.reverse().sort((a, b) => {
    if (a.label.toLowerCase() <= b.label.toLowerCase()) return 1
    if (a.label.toLowerCase() >= b.label.toLowerCase()) return -1
    return 0
  })
}
