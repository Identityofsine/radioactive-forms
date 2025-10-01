import { } from "../util";
import { RequiresHook } from "../state/requires-hook";
import type {
  Cloneable,
  FormControlMap,
  FormControlNonArrayPrimitive,
  FormControlNonArrayPrimitiveMap,
  FormControlPrimitive,
  FormControlPrimitiveMap,
  TopLevelFormState,
} from "../types/form.types";
import { FormControl } from "./formcontrol";
import { createFormControls } from "./util/form-control.util";

export class Form<T>
  extends RequiresHook<Form<T>>
  implements TopLevelFormState<T>, Cloneable {

  private readonly __form = true;
  private _controls: FormControlMap<T>;
  private _flattenedControls: FormControl<any, T>[];
  private _dirty: boolean;
  private _touched: boolean;
  private _valid: boolean;
  private _invalids: FormControl<any, T>[] = [];
  private _readonly: boolean;

  constructor(
    controls: FormControlNonArrayPrimitiveMap<T>,
    setState: React.Dispatch<React.SetStateAction<Form<T>>>,
  );
  constructor(
    controls: FormControlPrimitiveMap<T>,
    setState: React.Dispatch<React.SetStateAction<Form<T>>>,
  );
  constructor(
    controls: FormControlMap<T>,
    setState: React.Dispatch<React.SetStateAction<Form<T>>>,
  );
  constructor(
    controls: FormControlMap<T> | FormControlPrimitiveMap<T> | FormControlNonArrayPrimitiveMap<T>,
    setState: React.Dispatch<React.SetStateAction<Form<T>>>,
  ) {
    super(setState);
    this._controls = createFormControls(controls, (updatedForm) => {
      this.evaluateState();
      setState(updatedForm);
    });
    this._flattenedControls = Object.values(this._controls);
    this._dirty = false;
    this._touched = false;
    this._valid = true;
    this._readonly = false;
  }

  get controls(): FormControlMap<T> {
    return this._controls;
  }

  get dirty(): boolean {
    return this._dirty;
  }

  get touched(): boolean {
    return this._touched;
  }

  get valid(): boolean {
    return this._valid;
  }

  get readonly(): boolean {
    return this._readonly;
  }

  get invalids(): FormControl<any, T>[] {
    return this._invalids;
  }

  get formInitialized(): boolean {
    return this.__form;
  }

  public getControl<K extends keyof T>(
    key: K,
  ): FormControl<T[K], T> | undefined {
    return this._controls?.[key] as FormControl<T[K], T> | undefined;
  }

  set readonly(value: boolean) {
    this._readonly = value;
    this._flattenedControls.forEach((control) => (control.readonly = value));
    console.dLog(
      `Form with controls:`,
      this._controls,
      `set to readonly: ${value}`,
    );
    // Use clone to ensure React detects the change
    this.propagate(this.clone());
  }

  public reset(): void {
    this._flattenedControls.forEach((control) => control.reset());
    console.dLog(`Form with controls:`, this._controls, `has been reset.`);
  }

  public patchValue(values: Partial<{ [K in keyof T]: T[K] }>): void {
    for (const key in values) {
      const controlKey = this._controls?.[key];
      if (controlKey) {
        console.dLog(
          `Patching value for key: ${key} with value: ${values[key]}`,
        );
        controlKey.value = values[key] as T[Extract<keyof T, string>];
      } else {
        console.dError(
          `Form with controls:`,
          this._controls,
          `. No control found for key: ${key}`,
        );
      }
    }
  }

  public build(): T {
    const result = {} as T;
    for (const key in this._controls) {
      const value = this._controls[key].value;
      if (value && typeof value === 'object' && value !== null && (value as any).__form) {
        (result[key]) = (value as unknown as Form<any>).build();
      } else if (Array.isArray(value) && value.length > 0 && (value[0] as any).__form_control) {
        // if it's an array of FormControls
        result[key] = value.map((vc) => (vc as unknown as FormControl<any, any>).value) as any;
      }
      else {
        result[key] = value;
      }
    }
    return result;
  }

  public clone(): this {
    // Create a new Form instance
    const newObj = Object.create(Object.getPrototypeOf(this)) as this;

    Object.assign(newObj, this);

    return newObj;
  }

  // TODO: improve this significantly
  private evaluateState(): void {
    this._dirty = this._flattenedControls.some((control) => control.dirty);
    this._touched = this._flattenedControls.some((control) => control.touched);
    const invalidControls = this._flattenedControls.collect(
      (control) => !control.valid,
    );
    this._valid = invalidControls.length === 0;
    this._invalids = invalidControls;

    // Use clone to ensure React detects the change
    this.propagate(this);
  }
}
