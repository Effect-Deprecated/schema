import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"
import * as T from "@effect-ts/core/Effect"
import * as E from "@effect-ts/core/Either"

import * as S from "../src"
import * as Encoder from "../src/Encoder"
import * as Parser from "../src/Parser"

export class Person extends S.Model<Person>()(
  S.props({
    id: S.prop(S.string),
    friends: S.prop(S.chunk(S.lazy((): S.Standard<Person> => Person)))
  })
) {}

const parsePerson = Parser.for(Person)["|>"](S.condemnFail)
const encodePerson = Encoder.for(Person)

describe("Recursive", () => {
  it("parse/encode", async () => {
    const result = await T.runPromise(
      T.either(
        parsePerson({
          id: "a",
          friends: [
            { id: "b", friends: [{ id: "d", friends: [] }] },
            { id: "c", friends: [] }
          ]
        })
      )
    )

    expect(result._tag).toEqual("Right")
    expect(E.map_(result, encodePerson)).toEqual(
      E.right({
        id: "a",
        friends: [
          { id: "b", friends: [{ id: "d", friends: [] }] },
          { id: "c", friends: [] }
        ]
      })
    )

    expect(
      encodePerson(new Person({ friends: Chunk.empty(), id: "ok" }).copy({ id: "ok1" }))
    ).toEqual({
      id: "ok1",
      friends: []
    })
  })
})
