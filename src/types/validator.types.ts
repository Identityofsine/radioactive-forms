export type ValidatorFn<T> = (value: T, opts?: unknown) => boolean | Promise<boolean>;
