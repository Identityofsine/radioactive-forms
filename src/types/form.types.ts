import { Form } from "../form";
import { FormControl } from "../form/formcontrol";
import { ValidatorFn } from "./validator.types";

export interface FormState<T> {
  dirty: boolean;
  touched: boolean;
  valid: boolean;
  readonly: boolean;
}

export interface TopLevelFormState<T> extends FormState<T> {}

export interface ControlFormState<T> extends FormState<T> {}

export interface Cloneable {
  clone(): this;
}

type TupleControlForNonArray<T> = T extends any[]
  ? never
  :
      | [T | undefined | null]
      | [T | undefined | null, ValidatorFn<T> | ValidatorFn<T>[] | T]
      | [T | undefined | null][];

export type FormControlPrimitive<T> = T | TupleControlForNonArray<T>;

export type FormControlNonArrayPrimitive<T> =
  | T
  | undefined
  | null
  | Form<FormControlPrimitive<T>>
  | FormControlPrimitive<T>;

export type FormControlNonArrayPrimitiveMap<T> = {
  [K in keyof T]: FormControlNonArrayPrimitive<T[K]>;
};

export type FormControlPrimitiveMap<T> = {
  [K in keyof T]: FormControlPrimitive<T[K]>;
};

export type FormControlMap<T> = {
  [K in keyof T]: FormControl<T[K] extends Form<infer U> ? Form<U> : T[K], T>;
};
