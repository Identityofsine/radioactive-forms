import {
  FormControlMap,
  FormControlNonArrayPrimitive,
  FormControlNonArrayPrimitiveMap,
  FormControlPrimitiveMap,
} from "../../types/form.types";
import { ValidatorFn } from "../../types/validator.types";
import { BaseForm } from "../base-form";
import { Form } from "../form";
import { FormControl } from "../formcontrol";
import {} from "../../util";
import { formControl } from "../functional/formControl";

/**
 * Creates a FormControlMap from various control configuration formats.
 * Handles primitive values, arrays, nested forms, and form arrays.
 *
 * @template T - The type of the form data structure
 * @param form - Control configuration in various supported formats
 * @param setState - React state setter function for propagating updates
 * @returns A map of FormControl instances keyed by property name
 * @throws {Error} If form is not a non-null object
 *
 * @remarks
 * This function intelligently handles different control configurations:
 * - Simple values: Creates FormControl with no validators
 * - [value, validator]: Creates FormControl with single validator
 * - [value, [validators]]: Creates FormControl with multiple validators
 * - Nested Forms: Sets up proper state hooks and parent-child relationships
 * - Arrays of Forms: Sets up array reactivity and state propagation
 *
 * @example
 * ```typescript
 * const controls = createFormControls({
 *   name: ['John', Validators.required],
 *   age: [30],
 *   address: new Form({ street: [''], city: [''] })
 * }, setState);
 * ```
 */
export function createFormControls<T>(
  form:
    | FormControlPrimitiveMap<T>
    | FormControlMap<T>
    | FormControlNonArrayPrimitiveMap<T>,
  setState: React.Dispatch<React.SetStateAction<any>>
): FormControlMap<T> {
  if (typeof form !== "object" || form === null) {
    throw new Error("Form must be a non-null object");
  }
  const controls = {} as FormControlMap<T>;

  for (const key in form) {
    const control = form[key];
    if (
      Array.isArray(control) &&
      control.length > 0 &&
      (control.length === 1 ||
        (control.length === 2 &&
          (typeof (control as any)[1] === "function" ||
            isValidatorArray<T>((control as any)[1])))) &&
      !control.some((item) => BaseForm.isFormLike(item))
    ) {
      const [initialValue, validatorsMaybe] = control as [
        any,
        Array<ValidatorFn<T>> | ValidatorFn<T> | undefined
      ];
      const validators: Array<ValidatorFn<T>> =
        typeof validatorsMaybe === "function"
          ? [validatorsMaybe]
          : validatorsMaybe ?? [];
      console.dLog?.(
        `Creating FormControl for key: ${String(key)} with initialValue:`,
        initialValue,
        "and validators:",
        validators
      );
      controls[key] = formControl(key, initialValue, validators, setState);
      if (
        Array.isArray(initialValue) &&
        initialValue.length > 0 &&
        initialValue[0] instanceof Form
      ) {
        assignHooklessFormArray(initialValue, {
          current: controls[key] as FormControl<any, any>,
        });
      }
    } else if (
      Array.isArray(control) &&
      control.length >= 1 &&
      control.some((item) => BaseForm.isFormLike(item))
    ) {
      // handle array of forms
      const formsArray = control as Array<Form<any>>;
      controls[key] = formControl<T>(key, control as any, [], setState);
      assignHooklessFormArray(formsArray, {
        current: controls[key] as FormControl<any, any>,
      });
    } else if (Array.isArray(control)) {
      // assuming that this is just an array of objectsl go on as normal
      controls[key] = formControl<T>(key, control as any, [], setState);
    } else if (BaseForm.isFormLike(control)) {
      // handle nested forms
      if (Form.isForm(control) && Form.needsHook(control)) {
        const primitiveControls = (control as any).__primitiveControls as
          | FormControlPrimitiveMap<any>
          | FormControlNonArrayPrimitiveMap<any>;
        // this isn't so elegant, but we need to recreate the nested form AFTER the parent control has been created so we can hook into its .value setter.
        const newForm = formControl<T>(
          key,
          () =>
            new Form(
              primitiveControls,
              undefined,
              controls[key] as FormControl<any, any>
            ),
          [],
          setState
        );
        Object.assign(newForm, { _formId: control.formId });
        controls[key] = newForm as any as FormControl<any, T>;
        (controls[key] as FormControl<any, any>).value = new Form(
          primitiveControls,
          (oldState) => {
            const oldFormCached = (controls[key] as FormControl<any, any>)
              .value;
            const value: Form<any> =
              typeof oldState === "function"
                ? oldState(oldFormCached)
                : oldState;
            (controls[key] as FormControl<any, any>).value = value;
          },
          controls[key] as FormControl<any, any>
        );
      } else {
        controls[key] = control as any as FormControl<any, T>;
      }
    } else {
      const initialValue = control as any;
      controls[key] = formControl(key, initialValue, [], setState);
    }
  }
  return controls;
}

// Re-export from functional for backwards compatibility
export { formControl as createFormControl } from "../functional/formControl";

/**
 * A reference object containing a current value
 * @template T - The type of the referenced value
 */
export type Ref<T> = { current: T };

/**
 * Either a reference object or a factory function that returns the value
 * @template T - The type of the value
 */
export type RefOrFactory<T> = { current: T } | (() => T);

/**
 * Resolves a RefOrFactory to its actual value
 * @template T - The type of the value
 * @param refOrFactory - Either a ref object or factory function
 * @returns The resolved value or undefined if resolution fails
 *
 * @internal
 */
function resolveRefOrFactory<T>(refOrFactory: RefOrFactory<T>): T | undefined {
  if (typeof refOrFactory === "function") {
    try {
      return (refOrFactory as () => T)();
    } catch {
      return undefined;
    }
  }
  return (refOrFactory as { current: T })?.current;
}

/**
 * Assigns state hooks to an array of Forms that were created without hooks (hookless forms).
 * This enables reactive state management for forms created outside of React components.
 *
 * @template T - The type of data each Form in the array manages
 * @param arr - Array of Form instances to assign hooks to
 * @param controlFactory - Reference or factory for the parent FormControl that contains this array
 *
 * @remarks
 * This function is crucial for enabling reactivity in form arrays. It:
 * 1. Sets up state hooks for each form in the array
 * 2. Ensures changes to individual forms propagate to the parent control
 * 3. Maintains proper array reactivity when forms are added/removed
 * 4. Preserves form instances while enabling state updates
 *
 * @example
 * ```typescript
 * const formsArray = [
 *   new Form({ name: ['John'] }),
 *   new Form({ name: ['Jane'] })
 * ];
 *
 * assignHooklessFormArray(formsArray, { current: parentControl });
 * ```
 *
 * @internal
 */
export function assignHooklessFormArray<T>(
  arr: Array<Form<T>>,
  controlFactory: RefOrFactory<FormControl<Form<T>[], any>>
): void {
  const rControl = resolveRefOrFactory(controlFactory);
  if (!rControl) {
    return;
  }
  rControl.patchValue(
    (arr as Array<Form<any>>).map((formInstance) => {
      const setState = (oldState: any) => {
        // get the newest control reference
        const control =
          ((rControl as any)?._versionRef?.current?.current as FormControl<
            Array<Form<any>>,
            any
          >) ?? rControl;

        if (!Array.isArray(control.value)) {
          return;
        }
        const index = (control.value as Array<Form<T>>)?.findIndex(
          (f) => f?.formId === formInstance.formId
        );

        const oldFormCached = () => (control.value as Array<Form<T>>)[index];
        const value: Form<T> =
          typeof oldState === "function" ? oldState(oldFormCached()) : oldState;

        const currentArray = control.value as Array<Form<any>>;
        const nextArray = currentArray.slice();
        if (index === -1) {
          // this is pretty much impossible.
        } else {
          nextArray[index] = value; // preserve instance; only replace changed slot
        }
        control.patchValue(nextArray);
      };

      if (BaseForm.needsHook(formInstance)) {
        const newForm = new Form<any>(
          (formInstance as any).__primitiveControls,
          setState,
          rControl as FormControl<any, any>
        );
        Object.assign(newForm, { _formId: formInstance.formId });
        for (const key in formInstance.controls) {
          if (newForm.controls?.[key] === undefined) {
            continue;
          }
          Object.assign(newForm.controls?.[key], {
            _value: (formInstance?.controls?.[key] as any)?._value,
          })
        }
        return newForm;
      } else {
        Object.assign(formInstance, {
          _setState: setState,
          _formId: formInstance.formId,
        });
        return formInstance;
      }
    }),
    {
      stateless: true,
    }
  );
}

/**
 * Type guard to check if a value is an array of validator functions
 * @template T - The type being validated
 * @param arr - Value to check
 * @returns True if the value is an array of validator functions
 *
 * @example
 * ```typescript
 * const validators = [Validators.required, Validators.email];
 * if (isValidatorArray(validators)) {
 *   // TypeScript knows validators is Array<ValidatorFn<T>>
 * }
 * ```
 */
export function isValidatorArray<T>(arr: any): arr is Array<ValidatorFn<T>> {
  return Array.isArray(arr) && arr.every((item) => typeof item === "function");
}
