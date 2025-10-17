import { FormControlNonArrayPrimitive } from "../../types/form.types";
import { ValidatorFn } from "../../types/validator.types";
import { FormControl } from "../formcontrol";

/**
 * Functional helper to create a FormControl instance.
 * This provides a more functional programming style alternative to using `new FormControl()`.
 *
 * @template T - The type this FormControl belongs to (parent form type)
 * @param key - The key/property name this control represents
 * @param initialValue - The initial value of the control, or a factory function to create it
 * @param validators - Optional array of validation functions
 * @param setState - Optional React state setter function for propagating updates
 * @returns A new FormControl instance
 *
 * @example
 * ```typescript
 * interface User {
 *   name: string;
 *   email: string;
 * }
 *
 * const nameControl = formControl<User>(
 *   'name',
 *   '',
 *   [Validators.required],
 *   setState
 * );
 * ```
 *
 * @remarks
 * This function is used internally by the form creation utilities but can also be used
 * directly when you need fine-grained control over individual form controls.
 */
export function formControl<T>(
  key: keyof T,
  initialValue:
    | FormControlNonArrayPrimitive<T>
    | ((setState?: React.Dispatch<React.SetStateAction<any>>) => void),
  validators?: Array<ValidatorFn<T>>,
  setState?: React.Dispatch<React.SetStateAction<any>>
): FormControl<any, T> {
  let initialVal: any = initialValue;
  return new FormControl(
    key,
    initialVal as any,
    validators || [],
    (control) => {
      if (setState) {
        setState((oldForm: any) => {
          if (!oldForm) return;
          const controls = Object.assign(oldForm?._controls ?? {}, {
            [key]: control,
          });
          const obj = Object.assign(
            Object.create(Object.getPrototypeOf(oldForm)),
            oldForm,
            {
              _formId: oldForm.formId,
              _controls: controls,
              _flattenedControls: Object.values(controls),
            }
          );
          return obj;
        });
      }
    }
  ) as FormControl<any, T>;
}
