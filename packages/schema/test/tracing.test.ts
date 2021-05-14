import "@effect-ts/core/Tracing/Enable"

import * as T from "@effect-ts/core/Effect"
import { assertsFailure } from "@effect-ts/core/Effect/Exit"
import { pretty } from "@effect-ts/system/Cause"

import * as S from "../src"
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

const Sex_ = S.literal("male", "female", "else")
type Sex = S.ParsedShapeOf<typeof Sex_> & SexBrand
const Sex = Sex_["|>"](S.brand<Sex>())

const Person_ = S.props({
  Id: S.prop(Id),
  Name: S.prop(Name),
  Age: S.prop(Age),
  Sex: S.prop(Sex),
  Addresses: S.prop(S.chunk(Address)).opt()
})["|>"](S.named("Person"))

interface Person extends S.ParsedShapeOf<typeof Person_> {}

const Person = Person_["|>"](S.brand<Person>())

const parsePerson = Parser.for(Person)["|>"](S.condemnFail)

describe("Tracing", () => {
  it("should trace error", async () => {
    const result = await T.runPromiseExit(
      parsePerson({
        Id: 0,
        Name: "Mike",
        Addresses: []
      })
    )
    assertsFailure(result)
    const prettyCause = pretty(result.cause)
    expect(prettyCause).toContain(
      "(@effect-ts/schema/test): test/tracing.test.ts:63:18"
    )
    expect(prettyCause).toContain("processing Person")
  })
})
