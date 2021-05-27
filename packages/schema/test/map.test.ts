import * as S from "../src"
import * as Encoder from "../src/Encoder"
import * as Parser from "../src/Parser"

const s = S.map(S.date, S.array(S.string))

const input = [
  [new Date(), ["a", "b", "c"]] as const,
  [new Date(), ["1", "2", "3"]] as const
]
const map = new Map(input as any)

const encoded = input.map((x) => [x[0].toISOString(), x[1]] as const)

it("encodes", () => {
  const enc = Encoder.for(s)

  const r = enc(new Map<Date, readonly string[]>(input))

  expect(r).toEqual(encoded)
})

it("decodes", async () => {
  const dec = Parser.for(s)["|>"](S.unsafe)

  const r = dec(encoded)

  expect(r).toEqual(map)
})
