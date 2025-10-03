import { FormControlMap, FormControlNonArrayPrimitive, FormControlNonArrayPrimitiveMap, FormControlPrimitiveMap } from "../../types/form.types";
import { ValidatorFn } from "../../types/validator.types";
import { FormControl } from "../formcontrol";

export function createFormControls<T>(
  form: FormControlPrimitiveMap<T> | FormControlMap<T> | FormControlNonArrayPrimitiveMap<T>,
  setState: React.Dispatch<React.SetStateAction<any>>
): FormControlMap<T> {
  if (typeof form !== 'object' || form === null) {
    throw new Error("Form must be a non-null object");
  }
  const controls = {} as FormControlMap<T>;

  const newFormControl = (key: keyof T, initialValue: any, validators: Array<ValidatorFn<T>> = []) => {
    controls[key] = new FormControl(key, initialValue, validators, (control) => {
      setState((oldForm: any) => {
        const controls = Object.assign(oldForm._controls, {
          [key]: control
        })
        const obj = Object.assign(Object.create(
          Object.getPrototypeOf(oldForm),
        ),
          oldForm,
          controls
        );
        return obj;
      });
    }) as FormControl<any, T>;
  }

  for (const key in form) {
    const control = form[key];
    if (Array.isArray(control) && control.length > 0 && (
      control.length === 1 ||
      (control.length === 2 && isValidatorArray<T>(control[1]))
    )) {
      const [initialValue, validators = []] = control as [any, Array<ValidatorFn<T>>];

      newFormControl(key, initialValue, validators);

    } else if (control instanceof FormControl) {
      controls[key] = control as FormControl<any, T>;
    } else {
      const initialValue = control as any;
      controls[key] = new FormControl(key, initialValue, [], (control) => {
        setState((oldForm: any) => {
          const controls = Object.assign(oldForm._controls, {
            [key]: control
          })
          const obj = Object.assign(Object.create(
            Object.getPrototypeOf(oldForm),
          ),
            oldForm,
            controls
          );
          return obj;
        });
      });
    }
  }
  return controls;
}

export function isValidatorArray<T>(arr: any): arr is Array<ValidatorFn<T>> {
  return Array.isArray(arr) && arr.every(item => typeof item === 'function');
}
