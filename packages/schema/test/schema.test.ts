import * as Chunk from "@effect-ts/core/Collections/Immutable/Chunk"
import * as T from "@effect-ts/core/Effect"
import * as E from "@effect-ts/core/Either"
import * as FC from "fast-check"

import * as S from "../src"
import * as Arbitrary from "../src/Arbitrary"
import * as Constructor from "../src/Constructor"
import * as Encoder from "../src/Encoder"
import * as Guard from "../src/Guard"
import * as Parser from "../src/Parser"

interface IdBrand {
  readonly IdBrand: unique symbol
}
type Id = S.Int & S.Positive & IdBrand

const Id = S.positiveInt["|>"](S.brand<Id>())

interface NameBrand {
  readonly NameBrand: unique symbol
}
type Name = S.NonEmptyString & NameBrand

const Name = S.nonEmptyString["|>"](S.brand<Name>())

interface AddressBrand {
  readonly AddressBrand: unique symbol
}
type Address = S.NonEmptyString & AddressBrand

const Address = S.nonEmptyString["|>"](S.brand<Address>())

interface AgeBrand {
  readonly AgeBrand: unique symbol
}
type Age = S.Int & S.Positive & AgeBrand

const Age = S.positiveInt["|>"](S.brand<Age>())

interface SexBrand {
  readonly SexBrand: unique symbol
}
type Sex = S.ParsedShapeOf<typeof Sex_> & SexBrand

const Sex_ = S.literal("male", "female", "else")
const Sex = Sex_["|>"](S.brand<Sex>())

interface Person extends S.ParsedShapeOf<typeof Person_> {}

const Person_ = S.props({
  Id: S.prop(Id),
  Name: S.prop(Name),
  Age: S.prop(Age),
  Sex: S.prop(Sex),
  Addresses: S.prop(S.chunk(Address)).opt()
})["|>"](S.named("Person"))

const Person = Person_["|>"](S.brand<Person>())

const parsePerson = Parser.for(Person)["|>"](S.condemnFail)
const guardPerson = Guard.for(Person)
const createPerson = Constructor.for(Person)["|>"](S.condemnFail)
const unsafeCreatePerson = Constructor.for(Person)["|>"](S.unsafe)
const arbitraryPerson = Arbitrary.for(Person)(FC)

const personArrayS = S.chunk(Person)

const parsePersonArray = Parser.for(personArrayS)["|>"](S.condemnFail)
const createPersonArray = Constructor.for(personArrayS)["|>"](S.condemnFail)
const guardPersonArray = Guard.for(personArrayS)

describe("Schema", () => {
  it("should parse person", async () => {
    const result = await T.runPromise(
      T.either(
        parsePerson({
          Id: 0,
          Name: "Mike",
          Addresses: []
        })
      )
    )
    expect(result._tag).equals("Left")
    if (result._tag === "Left") {
      expect(result.left).equals(
        new S.CondemnException({
          message:
            "1 error(s) found while processing Person\n" +
            "└─ 2 error(s) found while checking keys\n" +
            '   ├─ missing required key "Age"\n' +
            '   └─ missing required key "Sex"'
        })
      )
    }
    const result_ok = await T.runPromise(
      T.either(
        parsePerson({
          Id: 0,
          Name: "Mike",
          Age: 30,
          Sex: "male",
          Addresses: []
        })
      )
    )
    expect(result_ok._tag).equals("Right")
    if (result_ok._tag === "Right") {
      expect(guardPerson(result_ok.right)).equals(true)
    }
  })
  it("should create person", async () => {
    const result_ok = await T.runPromise(
      T.either(
        createPerson({
          Age: Age(30),
          Id: Id(0),
          Name: Name("Mike"),
          Sex: Sex("male"),
          Addresses: Chunk.empty<Address>()
        })
      )
    )
    expect(result_ok._tag).equals("Right")
  })
  it("should parse Person[]", async () => {
    const result = await T.runPromise(
      T.either(
        parsePersonArray([
          {
            Id: 0,
            Name: "Mike",
            Addresses: []
          }
        ])
      )
    )
    expect(result._tag).equals("Left")
    if (result._tag === "Left") {
      expect(result.left).toEqual(
        new S.CondemnException({
          message:
            "1 error(s) found while processing a collection\n" +
            "└─ 1 error(s) found while processing optional index 0\n" +
            "   └─ 1 error(s) found while processing Person\n" +
            "      └─ 2 error(s) found while checking keys\n" +
            '         ├─ missing required key "Age"\n' +
            '         └─ missing required key "Sex"'
        })
      )
    }

    const result_2 = await T.runPromise(T.either(parsePersonArray({})))

    expect(result_2._tag).equals("Left")

    if (result_2._tag === "Left") {
      expect(result_2.left).equals(
        new S.CondemnException({
          message:
            "1 error(s) found while processing a refinement\n" +
            "└─ cannot process {}, expected an array"
        })
      )
    }

    const result_ok = await T.runPromise(
      T.either(parsePersonArray([{ Age: 30, Id: 0, Name: "Mike", Sex: "male" }]))
    )

    if (result_ok._tag === "Right") {
      expect(guardPersonArray(result_ok.right)).equals(true)
    }

    const result_ok_2 = await T.runPromise(
      T.either(
        createPersonArray([
          unsafeCreatePerson({
            Age: Age(30),
            Id: Id(0),
            Name: Name("Mike"),
            Sex: Sex("male"),
            Addresses: Chunk.empty()
          })
        ])
      )
    )

    if (result_ok_2._tag === "Right") {
      expect(guardPersonArray(result_ok_2.right)).equals(true)
    }
  })

  it("arbitrary", () => {
    FC.assert(FC.property(arbitraryPerson, guardPerson))
  })

  it("matchW/matchS", () => {
    FC.assert(
      FC.property(arbitraryPerson, (p) => {
        expect(["E", "F", "M"]).toContain(
          Sex.matchW({
            else: () => "E" as const,
            female: () => "F" as const,
            male: () => "M" as const
          })(p.Sex)
        )
        expect(["E", "F", "M"]).toContain(
          Sex.matchS({
            else: () => "E",
            female: () => "F",
            male: () => "M"
          })(p.Sex)
        )
      })
    )
  })

  it("date", async () => {
    const date = new Date().toISOString()
    const parse = Parser.for(S.date)["|>"](S.condemnFail)
    const res_ok = await T.runPromise(T.either(parse(date)))
    expect(res_ok).toEqual(E.right(new Date(date)))
    const res_bad = await T.runPromise(T.either(parse("bad date")))
    expect(res_bad._tag).equals("Left")
    if (res_bad._tag === "Left") {
      expect(res_bad.left).toEqual(
        new S.CondemnException({
          message: 'cannot process "bad date", expected a date string'
        })
      )
    }
    const newDate = new Date()
    const encodeDate = Encoder.for(S.date)
    expect(encodeDate(newDate)).toEqual(newDate.toISOString())
  })
})

describe("Intersection", () => {
  const A = S.props({
    a: S.prop(S.string)
  })
  const B = S.props({
    b: S.prop(S.string)
  })
  const C = S.props({
    c: S.prop(S.string).opt()
  })
  const fields = A["|>"](S.intersect(B))["|>"](S.intersect(C))

  const parseFields = Parser.for(fields)["|>"](S.condemnFail)

  it("parse", async () => {
    const result = await T.runPromise(
      T.either(parseFields({ a: "(a)", b: "(b)", c: "(c)" }))
    )

    expect(result._tag).equals("Right")

    const result_not_ok = await T.runPromise(
      T.either(parseFields({ a: "(a)", c: "(c)" }))
    )

    expect(result_not_ok).equals(
      E.left(
        new S.CondemnException({
          message:
            "1 error(s) found while processing an intersection\n" +
            "└─ 1 error(s) found while processing member 0\n" +
            "   └─ 1 error(s) found while processing an intersection\n" +
            "      └─ 1 error(s) found while processing member 1\n" +
            "         └─ 1 error(s) found while checking keys\n" +
            '            └─ missing required key "b"'
        })
      )
    )
  })
})
