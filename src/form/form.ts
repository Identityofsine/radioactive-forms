import { } from '../util';
import { RequiresHook } from "../state/requires-hook";
import type { FormControlMap, FormControlPrimitive, FormControlPrimitiveMap, TopLevelFormState } from "../types/form.types";
import { FormControl } from "./formcontrol";
import { createFormControls } from "./util/form-control.util";
import { Pooler } from '../state/pooler';

export class Form<T> extends RequiresHook<Form<T>> implements TopLevelFormState<T> {

  private readonly __form = true;
  private _controls: FormControlMap<T>;
  private _flattenedControls: FormControl<any, T>[];
  private _dirty: boolean;
  private _touched: boolean
  private _valid: boolean;
  private _invalids: FormControl<any, T>[] = [];

  constructor(controls: FormControlPrimitiveMap<T>, setState: React.Dispatch<React.SetStateAction<Form<T>>>);
  constructor(controls: FormControlMap<T>, setState: React.Dispatch<React.SetStateAction<Form<T>>>);
  constructor(controls: FormControlMap<T> | FormControlPrimitiveMap<T>, setState: React.Dispatch<React.SetStateAction<Form<T>>>) {
    super(setState);
    this._controls = createFormControls(controls, (form) => {
      this.evaluateState();
      setState(form);
    });
    this._flattenedControls = Object.values(this._controls);
    this._dirty = false;
    this._touched = false;
    this._valid = true;
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

  get invalids(): FormControl<any, T>[] {
    return this._invalids;
  }

  public reset(): void {
    this._flattenedControls.forEach(control => control.reset());
    console.dLog(`Form with controls:`, this._controls, `has been reset.`);
  }

  public patchValue(values: Partial<{ [K in keyof T]: T[K] }>): void {
    for (const key in values) {
      const controlKey = this._controls?.[key];
      if (controlKey) {
        console.dLog(`Patching value for key: ${key} with value: ${values[key]}`);
        controlKey.value = values[key] as T[Extract<keyof T, string>];
      } else {
        console.dError(`Form with controls:`, this._controls, `. No control found for key: ${key}`);
      }
    }
  }

  // TODO: improve this significantly
  private evaluateState(): void {
    this._dirty = this._flattenedControls.some(control => control.dirty);
    this._touched = this._flattenedControls.some(control => control.touched);
    const invalidControls = this._flattenedControls.collect(control => !control.valid);
    this._valid = invalidControls.length === 0;
    this._invalids = invalidControls;
    this.propagate(this);
  }

} 
