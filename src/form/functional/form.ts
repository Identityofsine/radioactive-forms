import {
  FormControlNonArrayPrimitiveMap,
  FormControlPrimitiveMap,
} from "../../types/form.types";
import { Form } from "../form";
import type { FormOptions } from "../form";

/**
 * Functional helper to create a Form instance from a primitive control map.
 * This provides a more functional programming style alternative to using `new Form()`.
 * 
 * @template T - The type of the data structure the form manages
 * @param props - Primitive control configuration map
 * @returns A new Form instance
 * 
 * @example
 * ```typescript
 * interface User {
 *   name: string;
 *   email: string;
 * }
 * 
 * const userForm = formGroup<User>({
 *   name: ['', Validators.required],
 *   email: ['', [Validators.required, Validators.email]]
 * });
 * ```
 */
export function formGroup<T>(props: FormControlPrimitiveMap<T>): Form<T>;

/**
 * Functional helper to create a Form instance from a non-array primitive control map.
 * 
 * @template T - The type of the data structure the form manages
 * @param props - Non-array primitive control configuration map
 * @returns A new Form instance
 */
export function formGroup<T>(props: FormControlNonArrayPrimitiveMap<T>): Form<T>;

export function formGroup<T>(
  props: FormControlPrimitiveMap<T> | FormControlNonArrayPrimitiveMap<T>,
  options?: FormOptions,
): Form<T> {
  return new Form<T>(props, undefined, undefined, options);
}
