import { RequiresHook } from "../state/requires-hook";
import { PatchValueProps } from "../types/control.types";
import type { Cloneable, FormState } from "../types/form.types";
import { ValidatorFn } from "../types/validator.types";
import { Form } from "./form";

/**
 * @param T - The type of the value that the FormControl will hold.
 * @param O - The type this FormControl belongs to.
 */
export class FormControl<T, O>
  extends RequiresHook<Form<O>>
  implements FormState<T>, Cloneable {
  private readonly __form_control = true;
  private _key: keyof T;
  private _initialValue: T;
  private _value: T;
  private _dirty: boolean;
  private _touched: boolean;
  private _valid: boolean;
  private _validators: Array<ValidatorFn<T>>;
  private _readonly: boolean = false;

  constructor(
    key: keyof T,
    initialValue: T,
    validators: Array<ValidatorFn<T>> = [],
    setState: React.Dispatch<React.SetStateAction<Form<O>>>,
  ) {
    super(setState);
    this._key = key;
    this._initialValue = initialValue;
    this._value = initialValue;
    this._dirty = false;
    this._touched = false;
    this._validators = validators ?? [];
    if (validators.length === 0 || !validators) {
      this._valid = true; // No validators means always validator
    } else {
      this._valid = validators?.every((validator) => validator(this.value)); // Assume valid initially
    }
  }

  public get key(): keyof T {
    return this._key;
  }

  public get value(): T {
    return this._value;
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

  public set value(newValue: T) {
    if (this._value !== newValue) {
      this.internalUpdate(newValue);
      this.propagate(this.clone());
    }
  }

  public set dirty(isDirty: boolean) {
    this._dirty = isDirty;
    this.propagate(this);
  }

  public reset(): void {
    this._value = this._initialValue;
    this._dirty = false;
    this._touched = false;
    this._valid = this._validators.every((validator) => validator(this.value));
    this.propagate(this);
  }

  public set readonly(isReadonly: boolean) {
    this._readonly = isReadonly;
    this.propagate(this);
  }

  public clone(): this {
    const obj = Object.create(Object.getPrototypeOf(this));
    return Object.assign(obj, this);
  }

  public patchValue(
    newValue: Partial<T>,
    opts: PatchValueProps = {
      stateless: false,
    },
  ): void {
    if (
      typeof this._value === "object" &&
      this._value !== null &&
      !Array.isArray(this._value)
    ) {
      const updatedValue = { ...this._value, ...newValue };
      this.value = updatedValue as T; // Use the setter to ensure dirty and valid are updated
    } else {
      this.value = newValue as T; // For non-object types, just set the value directly
    }
    if (!opts.stateless) {
      this.propagate(this);
    }
  }

  private internalUpdate(value: T): void {
    this._value = value;
    this._dirty = true;
    this._touched = true;
    this._valid = this._validators.every((validator) => validator(this.value));
  }
}
