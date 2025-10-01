import { RequiresHook } from "../state/requires-hook";

/**
 * Abstract base class containing only the literally shared elements between Form and FormControl
 */
export abstract class AbstractFormControl<S> extends RequiresHook<S> {
  protected _dirty: boolean;
  protected _touched: boolean;
  protected _valid: boolean;
  protected _readonly: boolean;

  constructor(setState: React.Dispatch<React.SetStateAction<S>>) {
    super(setState);
  }

  public get dirty(): boolean {
    return this._dirty;
  }

  public get touched(): boolean {
    return this._touched;
  }

  public get valid(): boolean {
    return this._valid;
  }

  public get readonly(): boolean {
    return this._readonly;
  }

  public abstract reset(): void;
  public abstract patchValue(values: any, opts?: any): void;
}
