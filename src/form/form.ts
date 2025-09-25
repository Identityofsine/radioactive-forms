import { RequiresHook } from "../state/requires-hook";
import type { FormControlMap, FormControlPrimitive, FormControlPrimitiveMap, TopLevelFormState } from "../types/form.types";
import { FormControl } from "./formcontrol";
import { createFormControls } from "./util/form-control.util";

export class Form<T> extends RequiresHook<Form<T>> implements TopLevelFormState<T> {

  private readonly __form = true;
  private _controls: FormControlMap<T>;
  private _flattenedControls: FormControl<any, T>[];
  private _dirty: boolean;
  private _touched: boolean
  private _valid: boolean;

  constructor(controls: FormControlPrimitiveMap<T>, setState: React.Dispatch<React.SetStateAction<Form<T>>>);
  constructor(controls: FormControlMap<T>, setState: React.Dispatch<React.SetStateAction<Form<T>>>);
  constructor(controls: FormControlMap<T> | FormControlPrimitiveMap<T>, setState: React.Dispatch<React.SetStateAction<Form<T>>>) {
    super(setState);
    this._controls = createFormControls(controls, setState);
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

  public reset(): void {
    this._flattenedControls.forEach(control => control.reset());
  }

} 
