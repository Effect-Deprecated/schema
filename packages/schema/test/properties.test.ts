import * as T from "@effect-ts/core/Effect"
import * as Ex from "@effect-ts/core/Effect/Exit"

import * as S from "../src"
import * as Encoder from "../src/Encoder"
import * as Parser from "../src/Parser"

const Identified = S.properties(
  S.property("id").schema(S.string).as("sub"),
  S.property("name").schema(S.string).optional()
)

const Person = S.properties(
  ...Identified.props,
  S.property("age").schema(S.number).optional(),
  S.property("birthDate").schema(S.date).optional().as("bd")
)

const parsePerson = Parser.for(Person)["|>"](S.condemnFail)
const encodePerson = Encoder.for(Person)

describe("Props", () => {
  it("parse succeed", async () => {
    const dt = new Date().toISOString()
    const res = await T.runPromiseExit(parsePerson({ sub: "ok", bd: dt }))

    expect(res).toEqual(Ex.succeed({ id: "ok", birthDate: new Date(Date.parse(dt)) }))
    if (res._tag === "Success") {
      expect(encodePerson(res.value)).toEqual({ sub: "ok", bd: dt })
    }
  })
})
