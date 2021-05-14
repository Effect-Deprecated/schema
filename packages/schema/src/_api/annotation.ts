export class Annotation<A> {
  constructor(readonly initial: A, readonly merge: (a: A, b: A) => A) {}
}

export function makeAnnotation<A>(initial: A, merge: (a: A, b: A) => A): Annotation<A> {
  return new Annotation(initial, merge)
}
