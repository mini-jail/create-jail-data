import { readZip, xmlParse } from "./deps.ts"
import type { Asset, ColorPalette, Data, OraImage, Source } from "./types.d.ts"
import { fromHex } from "./color.ts"
import {
  getColorDb,
  getImageDimensions,
  getLayerCompositeOp,
  getLayerNames,
  getLayerOpacity,
  getLayerPositions,
  getLayers,
  getLayerSource,
  getLayerVisibility,
  sortAssets,
  writeColorDb,
} from "./helpers.ts"

export async function createData(
  fiePath: string,
  colorDbPath: string,
  ...colors: string[]
): Promise<Data> {
  const colorDb = await getColorDb(colorDbPath)
  const zipFile = await readZip(fiePath)
  const oraXml = await zipFile.file("stack.xml").async("string")
  const image: OraImage = structuredClone(xmlParse(oraXml)).image
  const sources: Source[] = []
  const identifiers = new Set<string>()
  const colorSet = new Set<string>()
  const colorPalette: ColorPalette = {}
  const assets: Asset[] = []
  const layers = getLayers(image)
  let zIndex = layers.length

  for (const layer of layers) {
    const layerSource = await getLayerSource(zipFile, layer)
    if (layerSource === null) continue
    const [labelName, assetName, color] = getLayerNames(layer)
    const source: Source = {
      name: assetName,
      label: labelName,
      position: getLayerPositions(layer),
      zIndex: --zIndex,
      source: layerSource,
      colorable: color !== undefined,
      color,
      compositeOp: getLayerCompositeOp(layer),
      opacity: getLayerOpacity(layer),
      visible: getLayerVisibility(layer),
    }
    sources.push(source)
    identifiers.add(labelName + "@@@" + assetName)
    if (color) {
      colorSet.add(color)
    }
  }

  for (const color of colors) colorSet.add(color)
  for (const color of colorSet) {
    const calculated = fromHex(color)
    if (colorDb[color] && calculated) {
      if (colorDb[color].loss <= calculated.loss) {
        colorPalette[color] = calculated.filter
      } else {
        colorPalette[color] = colorDb[color].filter
        colorDb[color] = {
          filter: calculated.filter,
          loss: calculated.loss,
        }
      }
    } else if (calculated) {
      colorPalette[color] = calculated.filter
      colorDb[color] = {
        filter: calculated.filter,
        loss: calculated.loss,
      }
    }
  }
  for (const identifier of identifiers) {
    const [labelName, assetName] = identifier.split("@@@")
    const assetSources = sources.filter((source) =>
      source.label === labelName && source.name === assetName
    )
    const color = assetSources.find((source) => source.color !== undefined)
      ?.color
    assets.push({
      label: labelName,
      name: `${labelName}_${assetName}`,
      sources: assetSources,
      color,
      default: assetSources.every((source) => source.visible),
    })
  }

  await writeColorDb(colorDbPath, colorDb)

  return {
    assets: sortAssets(assets),
    colorPalette,
    dimensions: getImageDimensions(image),
  }
}
