import { FormControlMap, FormControlPrimitiveMap } from "../../types/form.types";
import { ValidatorFn } from "../../types/validator.types";
import { FormControl } from "../formcontrol";

export function createFormControls<T>(
  form: FormControlPrimitiveMap<T> | FormControlMap<T>,
  setState: React.Dispatch<React.SetStateAction<any>>
): FormControlMap<T> {
  if (typeof form !== 'object' || form === null) {
    throw new Error("Form must be a non-null object");
  }
  const controls = {} as FormControlMap<T>;
  for (const key in form) {
    const control = form[key];
    if (Array.isArray(control)) {
      const [initialValue, validators = []] = control as [any, Array<ValidatorFn<T>>];
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
    } else if (control instanceof FormControl) {
      controls[key] = control as FormControl<any, T>;
    }
  }
  return controls;
}
