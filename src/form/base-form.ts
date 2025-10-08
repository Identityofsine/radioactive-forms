import { RequiresHook } from "../state/requires-hook";
import { Cloneable, TopLevelFormState } from "../types/form.types";

export abstract class BaseForm<T, Z extends BaseForm<T> = any>
  extends RequiresHook<Z>
  implements TopLevelFormState<T>, Cloneable
{
  /**
   * used internally to identify a Form instance
   */
  private readonly __base_form = true;
  private readonly __initialized = true;
  private readonly __needs_hook: boolean;

  protected _dirty: boolean = false;
  protected _touched: boolean = false;
  protected _valid: boolean = true;
  protected _readonly: boolean = false;

  public constructor(setState?: React.Dispatch<React.SetStateAction<Z>>) {
    super(setState);
    this.__needs_hook = !setState;
  }

  public static isFormLike(obj: any): obj is BaseForm<any> {
    return obj && obj.__base_form === true;
  }

  public static needsHook(obj: any): boolean {
    return obj && obj.__needs_hook === true;
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

  get formInitialized(): boolean {
    return this.__initialized;
  }

  set readonly(value: boolean) {
    if (this._readonly === value) {
      return;
    }
    this._readonly = value;
    // Use clone to ensure React detects the change
    this.propagate(this.clone());
  }

  set dirty(value: boolean) {
    this._dirty = value;
    this.propagate(this.clone());
  }

  public abstract reset(): void;

  public clone(): this {
    // Create a new Form instance
    const newObj = Object.create(Object.getPrototypeOf(this)) as this;

    Object.assign(newObj, this);

    return newObj;
  }

  protected abstract internalUpdate(value?: T): void;
}
