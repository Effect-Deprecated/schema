// ets_tracing: off

import type { Annotation } from "../_schema/index.js"
import * as MO from "../_schema/index.js"
import { named } from "../_schema/index.js"
import * as Arbitrary from "../Arbitrary/index.js"
import * as Constructor from "../Constructor/index.js"
import * as Encoder from "../Encoder/index.js"
import * as Guard from "../Guard/index.js"
import * as Parser from "../Parser/index.js"
import * as S from "./schemed.js"

export type SchemaForModel<M, Self extends MO.SchemaAny> = MO.Schema<
  MO.ParserInputOf<Self>,
  MO.ParserErrorOf<Self>,
  M,
  MO.ConstructorInputOf<Self>,
  MO.ConstructorErrorOf<Self>,
  MO.EncodedOf<Self>,
  MO.ApiOf<Self> & MO.ApiSelfType<M>
>

export type ParserFor<Self extends MO.SchemaAny> = Parser.Parser<
  MO.ParserInputOf<Self>,
  MO.ParserErrorOf<Self>,
  MO.ParsedShapeOf<Self>
>

export type ConstructorFor<Self extends MO.SchemaAny> = Constructor.Constructor<
  MO.ConstructorInputOf<Self>,
  MO.ParsedShapeOf<Self>,
  MO.ConstructorErrorOf<Self>
>

export type EncoderFor<Self extends MO.SchemaAny> = Encoder.Encoder<
  MO.ParsedShapeOf<Self>,
  MO.EncodedOf<Self>
>

export type GuardFor<Self extends MO.SchemaAny> = Guard.Guard<MO.ParsedShapeOf<Self>>

export type ArbitraryFor<Self extends MO.SchemaAny> = Arbitrary.Gen<
  MO.ParsedShapeOf<Self>
>

export type ModelFor<M, Self extends MO.SchemaAny> = M extends MO.ParsedShapeOf<Self>
  ? SchemaForModel<M, Self>
  : SchemaForModel<MO.ParsedShapeOf<Self>, Self>

export interface Model<M, Self extends MO.SchemaAny>
  extends S.Schemed<Self>,
    MO.Schema<
      MO.ParserInputOf<Self>,
      MO.NamedE<string, MO.ParserErrorOf<Self>>,
      M,
      MO.ConstructorInputOf<Self>,
      MO.NamedE<string, MO.ConstructorErrorOf<Self>>,
      MO.EncodedOf<Self>,
      MO.ApiOf<Self>
    > {
  [S.schemaField]: Self

  readonly Parser: ParserFor<SchemaForModel<M, Self>>

  readonly Constructor: ConstructorFor<SchemaForModel<M, Self>>

  readonly Encoder: EncoderFor<SchemaForModel<M, Self>>

  readonly Guard: GuardFor<SchemaForModel<M, Self>>

  readonly Arbitrary: ArbitraryFor<SchemaForModel<M, Self>>
}

export const NameSym = Symbol()

/**
 * @inject genericName
 */
export function Model<M>(__name?: string) {
  return <Self extends MO.SchemaAny>(self: Self): Model<M, Self> => {
    const schemed = S.Schemed(named(__name ?? "Model(Anonymous)")(self))
    const schema = S.schema(schemed)

    Object.defineProperty(schemed, NameSym, { value: __name })

    Object.defineProperty(schemed, MO.SchemaContinuationSymbol, {
      value: schema
    })

    Object.defineProperty(schemed, "Api", {
      get() {
        return self.Api
      }
    })

    Object.defineProperty(schemed, ">>>", {
      value: self[">>>"]
    })

    Object.defineProperty(schemed, "Parser", {
      value: Parser.for(schema)
    })

    Object.defineProperty(schemed, "Constructor", {
      value: Constructor.for(schema)
    })

    Object.defineProperty(schemed, "Encoder", {
      value: Encoder.for(schema)
    })

    Object.defineProperty(schemed, "Guard", {
      value: Guard.for(schema)
    })

    Object.defineProperty(schemed, "Arbitrary", {
      value: Arbitrary.for(schema)
    })

    Object.defineProperty(schemed, "annotate", {
      value: <Meta>(identifier: Annotation<Meta>, meta: Meta) =>
        new MO.SchemaAnnotated(schema, identifier, meta)
    })

    // @ts-expect-error the following is correct
    return schemed
  }
}

export function stable<T, A extends MO.SchemaAny>(constructor: Model<T, A>) {
  const schema = named(constructor[NameSym] ?? "Model(Anonymous)")(
    S.schema(constructor)
  )

  Object.defineProperty(constructor, MO.SchemaContinuationSymbol, {
    value: schema
  })

  Object.defineProperty(constructor, "Api", {
    get() {
      return schema.Api
    }
  })

  Object.defineProperty(constructor, ">>>", {
    value: schema[">>>"]
  })

  Object.defineProperty(constructor, "Parser", {
    value: Parser.for(schema)
  })

  Object.defineProperty(constructor, "Constructor", {
    value: Constructor.for(schema)
  })

  Object.defineProperty(constructor, "Encoder", {
    value: Encoder.for(schema)
  })

  Object.defineProperty(constructor, "Guard", {
    value: Guard.for(schema)
  })

  Object.defineProperty(constructor, "Arbitrary", {
    value: Arbitrary.for(schema)
  })

  Object.defineProperty(constructor, "annotate", {
    value: <Meta>(identifier: MO.Annotation<Meta>, meta: Meta) =>
      new MO.SchemaAnnotated(schema, identifier, meta)
  })
}
