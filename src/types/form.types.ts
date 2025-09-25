import { FormControl } from "../form/formcontrol";
import { ValidatorFn } from "./validator.types";

export interface FormState<T> {
  dirty: boolean;
  touched: boolean;
  valid: boolean;
}

export interface TopLevelFormState<T> extends FormState<T> {
}

export interface ControlFormState<T> extends FormState<T> {
}

export type FormControlPrimitive<T> = [T | undefined | null] | [T | undefined | null, ValidatorFn<T>[]];

export type FormControlPrimitiveMap<T> = {
  [K in keyof T]: FormControlPrimitive<T[K]>;
}

export type FormControlMap<T> = {
  [K in keyof T]: FormControl<T[K], T>;
}

