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
  ? // Allow tuple config for array values as well: [initialArray, validators?]
    | [T | undefined | null]
    | [T | undefined | null, ValidatorFn<T> | ValidatorFn<T>[]]
  :
      | [T | undefined | null]
      | [T | undefined | null, ValidatorFn<T> | ValidatorFn<T>[]];

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

// Extract the actual control value type from the initializer type
type ExtractControlValue<T> =
  // Tuple syntax: [value] | [value, validators]
  T extends readonly [infer V]
    ? V
    : T extends readonly [infer V, any]
      ? V
      // Nested Form stays as Form<...>
      : T extends Form<infer U>
        ? Form<U>
        // Widen tuple-like arrays of Forms to Array<Form<...>>
        : T extends ReadonlyArray<infer I>
          ? I extends Form<any>
            ? Array<I>
            : T
        : T;

export type FormControlMap<T> = {
  [K in keyof T]: FormControl<ExtractControlValue<T[K]>, T>;
};
