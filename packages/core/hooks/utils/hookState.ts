export type IHookStateInitialSetter<S> = () => S;
export type IHookStateInitAction<S> = S | IHookStateInitialSetter<S>;
