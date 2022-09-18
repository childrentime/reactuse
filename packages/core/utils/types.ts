export type Fn = (this: any, ...args: any[]) => any;
export type Awaitable<T> = Promise<T> | T;

export type Stoppable = [boolean, Fn, Fn];
