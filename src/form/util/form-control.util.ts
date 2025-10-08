import { FormControlMap, FormControlNonArrayPrimitive, FormControlNonArrayPrimitiveMap, FormControlPrimitiveMap } from "../../types/form.types";
import { ValidatorFn } from "../../types/validator.types";
import { BaseForm } from "../base-form";
import { Form } from "../form";
import { FormControl } from "../formcontrol";

export function createFormControls<T>(
  form: FormControlPrimitiveMap<T> | FormControlMap<T> | FormControlNonArrayPrimitiveMap<T>,
  setState: React.Dispatch<React.SetStateAction<any>>
): FormControlMap<T> {
  if (typeof form !== 'object' || form === null) {
    throw new Error("Form must be a non-null object");
  }
  const controls = {} as FormControlMap<T>;

  for (const key in form) {
    const control = form[key];
    if (Array.isArray(control) && control.length > 0 && (
      control.length === 1 ||
      (control.length === 2 && isValidatorArray<T>(control[1]))
    )) {
      const [initialValue, validators = []] = control as [any, Array<ValidatorFn<T>>];
      controls[key] = createFormControl(key, initialValue, validators, setState);
    } else if (BaseForm.isFormLike(control)) {
      // handle nested forms
      if (Form.isForm(control) && Form.needsHook(control)) {
        const primitiveControls = (control as any).__primitiveControls as FormControlPrimitiveMap<any> | FormControlNonArrayPrimitiveMap<any>;
        // this isn't so elegant, but we need to recreate the nested form AFTER the parent control has been created so we can hook into its .value setter. 
        controls[key] = createFormControl<T>(key,
          () => new Form(primitiveControls), [], setState
        );
        (controls[key] as FormControl<any, any>).value = new Form(primitiveControls, (oldState) => {
          const oldFormCached = (controls[key] as FormControl<any, any>).value;
          const value: Form<any> = typeof oldState === 'function' ? oldState(oldFormCached) : oldState;
          (controls[key] as FormControl<any, any>).value = value;
        });
      } else {
        controls[key] = control as any as FormControl<any, T>;
      }
    } else {
      const initialValue = control as any;
      controls[key] = createFormControl(key, initialValue, [], setState);
    }
  }
  return controls;
}

export function createFormControl<T>(
  key: keyof T,
  initialValue: FormControlNonArrayPrimitive<T> | ((setState?: React.Dispatch<React.SetStateAction<any>>) => void),
  validators?: Array<ValidatorFn<T>>,
  setState?: React.Dispatch<React.SetStateAction<any>>
): FormControl<any, T> {

  let initialVal: any = initialValue;
  return new FormControl(key, initialVal as any, validators || [], (control) => {
    if (setState) {
      setState((oldForm: any) => {
        const controls = Object.assign((oldForm._controls ?? {}), {
          [key]: control
        })
        const obj = Object.assign(Object.create(
          Object.getPrototypeOf(oldForm),
        ),
          oldForm,
          { _controls: controls }
        );
        return obj;
      }
      );
    }
  }) as FormControl<any, T>;
}

export function isValidatorArray<T>(arr: any): arr is Array<ValidatorFn<T>> {
  return Array.isArray(arr) && arr.every(item => typeof item === 'function');
}
