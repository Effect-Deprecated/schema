import { pipe } from "@effect-ts/core/Function"

import * as S from "../src"
import * as Encoder from "../src/Encoder"
import * as Constructor from "../src/Parser"
import * as Parser from "../src/Parser"

export class UserProfile extends S.Model<UserProfile>()(
  S.required({ id: S.nonEmptyString, email: S.nonEmptyString })
) {}
export type AnyRecordSchema = S.Schema<
  unknown,
  any,
  AnyRecord,
  any,
  any,
  AnyRecord,
  any
>

export type TODO = any
export type AnyRecord = Record<string, any>

type Rename<T, K extends keyof T, N extends string> = Pick<T, Exclude<keyof T, K>> &
  { [P in N]: T[K] }

function mapping<
  ParserInput,
  ParserError,
  ParsedShape extends AnyRecord,
  ConstructorInput,
  ConstructorError,
  Encoded extends AnyRecord,
  Api,
  DestKey extends string,
  Key extends string
>(
  self: S.Schema<
    ParserInput,
    ParserError,
    ParsedShape,
    ConstructorInput,
    ConstructorError,
    Encoded,
    Api
  >,
  mappingFrom: Key,
  mappingTo: DestKey
): S.Schema<
  unknown,
  ParserError, // TODO
  ParsedShape,
  ConstructorInput,
  ConstructorError,
  Rename<Encoded, Key, DestKey>,
  Api
> {
  const enc = Encoder.for(self)
  const parse = Parser.for(self)
  return pipe(
    S.identity((_): _ is Record<any, any> => typeof _ === "object" && _ !== null),
    S.encoder((_) => {
      const e = enc(_)
      const no: any = {}
      for (const key in e) {
        no[(key as any) === mappingFrom ? mappingTo : key] = _[key]
      }
      return no
    }),
    S.parser((_: Record<any, any>) => {
      const no: any = {}
      for (const key in _) {
        no[key === mappingTo ? mappingFrom : key] = _[key]
      }
      // TODO: decode no
      return parse(no)
    })
  ) as any
}

const test = mapping(UserProfile[S.schemaField], "id", "sub")
// type P = S.ParsedShapeOf<typeof test>
// type E = S.EncodedOf<typeof test>
const parse = Parser.for(test)
const enc = Encoder.for(test)
const cons = Constructor.for(test)

it("Parse should map", () => {
  expect(parse["|>"](S.unsafe)({ sub: "some string", email: "some email" })).toEqual({
    id: "some string",
    email: "some email"
  })
})

it("Construct should work", () => {
  expect(cons["|>"](S.unsafe)({ id: "some string", email: "some email" })).toEqual({
    id: "some string",
    email: "some email"
  })
})

it("Encode should reverse map", () => {
  expect(
    enc({
      id: "some string" as S.NonEmptyString,
      email: "some email" as S.NonEmptyString
    })
  ).toEqual({
    sub: "some string",
    email: "some email"
  })
})
