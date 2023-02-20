import { createData } from "./mod.ts"

const params = (() => {
  const params: Record<string, string | undefined> = {}
  Deno.args.join(" ").replace(
    /(--(\w+)=([^\ ]+))?/g,
    (_match, _group1, key, value) => {
      params[key] = value
      return ""
    },
  )
  return params
})()


const {
  input = null,
  colors = null,
  colorDb = "./color.db.json",
  output = null,
} = params

const colorValues = colors === null ? [] : colors.split(",")

if (input === null) {
  Deno.exit(1)
}

const data = await createData(input, colorDb, ...colorValues)
const json = JSON.stringify(data, null, 2)

if (output === null) {
  console.log(json)
} else {
  await Deno.writeTextFile(output, json)
}
