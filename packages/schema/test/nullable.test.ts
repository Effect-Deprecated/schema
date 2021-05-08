import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as T from "@effect-ts/core/Effect"
import * as O from "@effect-ts/core/Option"

import * as S from "../src"
import * as Encoder from "../src/Encoder"
import * as Parser from "../src/Parser"

it("encodes", () => {
  const d = "2020-01-01T00:00:00.000Z"
  const dO = new Date(d)
  const enc0 = Encoder.for(S.nullable(S.date))
  const enc1 = Encoder.for(S.array(S.date))
  const enc2 = Encoder.for(S.array(S.array(S.date)))
  const enc3 = Encoder.for(S.array(S.nullable(S.date)))

  const p0 = enc0(O.some(dO))
  const p1 = enc1(A.single(dO))
  const p2 = enc2(A.single(A.single(dO)))
  const p3 = enc3(A.single(O.some(dO)))

  expect(p0).toEqual(d)
  expect(p1[0]).not.toBe(dO)
  expect(p1[0]).toEqual(d)
  expect(p2[0][0]).toEqual(d)
  expect(p2[0][0]).not.toBe(dO)
  expect(p3[0]).toEqual(d)
  expect(p3[0]).not.toBe(dO)
})

it("decodes", async () => {
  const d = "2020-01-01T00:00:00.000Z"
  const dO = new Date(d)
  const dec0 = Parser.for(S.nullable(S.date))["|>"](S.condemn)
  const dec1 = Parser.for(S.array(S.date))["|>"](S.condemn)
  const dec2 = Parser.for(S.array(S.array(S.date)))["|>"](S.condemn)
  const dec3 = Parser.for(S.array(S.nullable(S.date)))["|>"](S.condemn)

  const p0 = await dec0(d)["|>"](T.runPromise)
  const pnull = await dec0(null)["|>"](T.runPromise)
  const pfail = await dec0({})["|>"](T.result)["|>"](T.runPromise)
  const p1 = await dec1(A.single(d))["|>"](T.runPromise)
  const p2 = await dec2(A.single(A.single(d)))["|>"](T.runPromise)
  const p3 = await dec3(A.single(d))["|>"](T.runPromise)

  expect(p0).toEqual(O.some(dO))
  expect(pnull).toEqual(O.none)
  console.log(pfail)
  expect(pfail._tag).toEqual("Failure")
  expect(p1[0]).not.toBe(d)
  expect(p1[0]).toEqual(dO)
  expect(p2[0][0]).toEqual(dO)
  expect(p2[0][0]).not.toBe(d)
  expect(p3[0]).toEqual(O.some(dO))
  expect(p3[0]).not.toBe(O.some(d))
})
