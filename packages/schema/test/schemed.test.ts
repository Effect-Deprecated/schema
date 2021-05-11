import * as T from "@effect-ts/core/Effect"
import * as Ex from "@effect-ts/core/Effect/Exit"
import { pipe } from "@effect-ts/core/Function"
import * as FC from "fast-check"

import * as MO from "../src"
import { Model } from "../src/_api/model"
import * as Parser from "../src/Parser"

export class Person extends Model<Person>()(
  pipe(
    MO.required({
      firstName: MO.string,
      lastName: MO.string
    }),
    MO.tag("Person"),
    MO.withDefaultConstructorField("firstName", () => "Mike")
  )
) {}

export class Animal extends Model<Animal>()(
  pipe(
    MO.required({
      size: MO.literal("small", "mid")
    }),
    MO.tag("Animal")
  )
) {}

const PersonOrAnimal = MO.tagged(Person, Animal)

const parsePerson = Person.Parser["|>"](MO.condemnFail)
const parsePersonOrAnimal = Parser.for(PersonOrAnimal)["|>"](MO.condemnFail)

describe("Schemed", () => {
  it("parse fail", async () => {
    const res = await T.runPromiseExit(
      parsePerson({
        _tag: "Person",
        firstName: "Mike"
      })
    )
    expect(res).toEqual(
      Ex.fail(
        new MO.CondemnException({
          message:
            "1 error(s) found while processing Person\n" +
            "└─ 1 error(s) found while checking keys\n" +
            '   └─ missing required key "lastName"'
        })
      )
    )
  })
  it("construct objects", () => {
    const person = new Person({ lastName: "Arnaldi" })
    expect(person.firstName).toEqual("Mike")
    expect(person._tag).toEqual("Person")
    expect(Person.Guard(person)).toEqual(true)
    const newPerson = person.copy({ firstName: "Michael" })
    expect(newPerson).equals(new Person({ firstName: "Michael", lastName: "Arnaldi" }))
  })
  it("parse person", async () => {
    const person = await T.runPromise(
      parsePerson({
        _tag: "Person",
        firstName: "Mike",
        lastName: "Arnaldi"
      })
    )
    const person2 = new Person({ firstName: "Mike", lastName: "Arnaldi" })

    expect(Person.Guard(person)).toEqual(true)
    expect(person).equals(person2)
  })
  it("parse tagged", async () => {
    const person = await T.runPromise(
      parsePersonOrAnimal({
        _tag: "Person",
        firstName: "Mike",
        lastName: "Arnaldi"
      })
    )
    const person2 = new Person({ firstName: "Mike", lastName: "Arnaldi" })

    expect(Person.Guard(person)).toEqual(true)
    expect(person).equals(person2)
  })
  it("arbitrary", () => {
    FC.check(FC.property(Person.Arbitrary(FC), Person.Guard))
  })
})
