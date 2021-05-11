import { pipe } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"

import * as S from "../_schema"
import * as Arbitrary from "../Arbitrary"
import * as Constructor from "../Constructor"
import * as Encoder from "../Encoder"
import * as Guard from "../Guard"
import * as Parser from "../Parser"
import * as Th from "../These"

export const nullableIdentifier = Symbol.for("@effect-ts/schema/ids/nullable")

export function nullable<Self extends S.SchemaAny>(
  self: Self
): S.Schema<
  S.ParserInputOf<Self> | null,
  S.LeafE<ReturnType<Self["_ConstructorError"]>>,
  O.Option<ReturnType<Self["_ParsedShape"]>>,
  O.Option<S.ConstructorInputOf<Self>>,
  S.LeafE<ReturnType<Self["_ConstructorError"]>>,
  S.EncodedOf<Self> | null,
  S.ApiOf<Self>
> {
  const guard = Guard.for(self)
  const arb = Arbitrary.for(self)
  const create = Constructor.for(self)
  const parse = Parser.for(self)
  const refinement = (u: unknown): u is O.Option<S.ParsedShapeOf<Self>> =>
    typeof u === "object" &&
    u !== null &&
    ["None", "Some"].indexOf(u["_tag"]) !== -1 &&
    ((u["_tag"] === "Some" && guard(u["value"])) || u["_tag"] === "None")
  const encode = Encoder.for(self)

  return pipe(
    S.identity(refinement),
    S.arbitrary((_) => _.option(arb(_)).map(O.fromNullable)),
    S.parser((i: S.ParserInputOf<Self> | null) =>
      i === null ? Th.succeed(O.none) : Th.map_(parse(i), O.some)
    ),
    S.constructor(
      O.fold(
        () => Th.succeed(O.none),
        (v) => Th.map_(create(v), O.some)
      )
    ),
    S.encoder((_) => O.map_(_, encode)["|>"](O.toNullable) as S.EncodedOf<Self> | null),
    S.mapApi(() => self.Api as S.ApiOf<Self>),
    S.identified(nullableIdentifier, { self })
  )
}
