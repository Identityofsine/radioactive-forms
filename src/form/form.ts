import {} from "../util";
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
import { BaseForm } from "./base-form";

type AcceptedControls<T> =
  | FormControlMap<T>
  | FormControlPrimitiveMap<T>
  | FormControlNonArrayPrimitiveMap<T>;

export class Form<T> extends BaseForm<T, Form<T>> {
  private readonly __form = true;
  private readonly __primitiveControls: AcceptedControls<T>;
  private _controls: FormControlMap<T>;
  private _flattenedControls: FormControl<any, T>[];
  private _invalids: FormControl<any, T>[] = [];

  constructor(
    controls: FormControlNonArrayPrimitiveMap<T>,
    setState?: React.Dispatch<React.SetStateAction<Form<T>>>,
  );
  constructor(
    controls: FormControlPrimitiveMap<T>,
    setState?: React.Dispatch<React.SetStateAction<Form<T>>>,
  );
  constructor(
    controls: FormControlMap<T>,
    setState?: React.Dispatch<React.SetStateAction<Form<T>>>,
  );
  constructor(
    controls: AcceptedControls<T>,
    setState?: React.Dispatch<React.SetStateAction<Form<T>>>,
  ) {
    super(setState);
    this.__primitiveControls = controls;
    this._controls = createFormControls(controls, (updatedForm) => {
      this.internalUpdate();
      this._setState?.(updatedForm);
    });
    this._flattenedControls = Object.values(this._controls ?? {}) || [];
    this._dirty = false;
    this._touched = false;
    this._valid = true;
    this._readonly = false;
  }

  get controls(): FormControlMap<T> {
    return this._controls;
  }

  get invalids(): FormControl<any, T>[] {
    return this._invalids;
  }

  public getControl<K extends keyof T>(
    key: K,
  ): FormControl<T[K], T> | undefined {
    return this._controls?.[key] as FormControl<T[K], T> | undefined;
  }

  public addControls<T>(controlMap: AcceptedControls<T>): void {
    const foundKey = Object.keys(controlMap).find(
      (key) => key in this._controls,
    );
    if (foundKey?.length > 0) {
      console.dError(
        `Form with controls:`,
        this._controls,
        `. Control with key: ${String(foundKey)} already exists.`,
      );
      return;
    }
    const newControls = createFormControls(controlMap, (updatedForm) => {
      this.internalUpdate();
      this.propagate(updatedForm);
    });
    this._controls = Object.assign(this._controls, newControls);
  }

  override set readonly(value: boolean) {
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
        if (Form.isForm(controlKey.value)) {
          (controlKey.value as Form<any>).patchValue(
            values[key] as Partial<any>,
          );
          continue;
        }
        (controlKey as FormControl<T[keyof T], T>).value = values[
          key
        ] as T[Extract<keyof T, string>];
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
      if (
        value &&
        typeof value === "object" &&
        value !== null &&
        (value as any).__form
      ) {
        result[key] = (value as unknown as Form<any>).build();
      } else if (Array.isArray(value) && value.length > 0) {
        // check if form control array
        if (FormControl.isFormControl(value[0])) {
          result[key] = value.map(
            (v) => (v as unknown as FormControl<any, any>).value,
          ) as any;
        } else if (Form.isForm(value[0])) {
          // list of forms
          result[key] = value.map((v) =>
            (v as unknown as Form<any>).build(),
          ) as any;
        }
      } else {
        result[key] = value as any;
      }
    }
    return result;
  }

  public static isForm(obj: any): obj is Form<any> {
    return obj && obj.__form === true;
  }

  // TODO: improve this significantly
  protected override internalUpdate(): void {
    if (this._flattenedControls === undefined) {
      this._flattenedControls = Object.values(this._controls ?? {}) || [];
    }
    this._dirty = this._flattenedControls?.some((control) => control.dirty);
    this._touched = this._flattenedControls?.some((control) => control.touched);
    const invalidControls = this._flattenedControls?.collect(
      (control) => !control.valid,
    );
    this._valid = invalidControls?.length === 0;
    this._invalids = invalidControls;

    // Use clone to ensure React detects the change
    this.propagate(this);
  }
}
