import type { Effect } from "@effect-ts/core/Effect"
import type { Managed } from "@effect-ts/core/Effect/Managed"
import type { Stream } from "@effect-ts/core/Effect/Stream"
import type { Sync } from "@effect-ts/core/Sync"

export interface Compactable<X> {
  Sync: [X] extends [Sync<infer R, infer E, infer A>] ? Sync<R, E, A> : never

  Effect: [X] extends [Effect<infer R, infer E, infer A>]
    ? [X] extends [Sync<infer R, infer E, infer A>]
      ? never
      : Effect<R, E, A>
    : never

  Managed: [X] extends [Managed<infer R, infer E, infer A>] ? Managed<R, E, A> : never

  Stream: [X] extends [Stream<infer R, infer E, infer A>] ? Stream<R, E, A> : never
}

export type Compact<X> = Compactable<X>[keyof Compactable<any>] extends never
  ? X
  : Compactable<X>[keyof Compactable<any>]
