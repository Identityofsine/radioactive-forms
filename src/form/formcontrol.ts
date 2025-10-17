import { PatchValueProps } from "../types/control.types";
import { ValidatorFn } from "../types/validator.types";
import { BaseForm } from "./base-form";
import { Form } from "./form";
import { assignHooklessFormArray } from "./util/form-control.util";
import {} from "../util";

/**
 * @param T - The type of the value that the FormControl will hold.
 * @param O - The type this FormControl belongs to.
 */
export class FormControl<T, O> extends BaseForm<T, Form<O>> {
  private readonly __form_control = true;
  private _contains_a_form: boolean = false;
  private _key: keyof T;
  private _initialValue: T;
  private _value: T;
  private _validators: Array<ValidatorFn<T>>;

  constructor(
    key: keyof T,
    initialValue: T,
    validators: Array<ValidatorFn<T>> = [],
    setState: React.Dispatch<React.SetStateAction<Form<O>>>
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

  public set value(newValue: T) {
    if (this._value !== newValue) {
      this.internalUpdate(newValue);
      this.propagate(this.clone());
    }
  }

  public reset(): void {
    if (this._contains_a_form) {
      if (Array.isArray(this._value)) {
        this._value.forEach((item) => {
          item.reset();
        });
      } else {
        (this._value as Form<any>).reset();
      }
    } else {
      this._value = this._initialValue;
    }
    this._dirty = false;
    this._touched = false;
    this._valid = this._validators.every((validator) => validator(this.value));
    this.propagate(this.clone());
  }

  public override get readonly(): boolean {
    return this._readonly;
  }

  public set readonly(isReadonly: boolean) {
    if (this._readonly === isReadonly) {
      return;
    }
    if (this._contains_a_form) {
      if (Array.isArray(this._value)) {
        this._value.forEach((item) => {
          if (Form.isForm(item)) {
            item.readonly = isReadonly;
          }
        });
      } else {
        (this._value as Form<any>).readonly = isReadonly;
      }
    }
    this._readonly = isReadonly;
    this.propagate(this.clone());
  }

  public override get disabled(): boolean {
    return this._disabled;
  }

  public override set disabled(disabled: boolean) {
    if (this.disabled === disabled) {
      return;
    }
    if (this._contains_a_form) {
      if (Array.isArray(this._value)) {
        this._value.forEach((item) => {
          if (Form.isForm(item)) {
            item.disabled = disabled;
          }
        });
      } else {
        (this._value as Form<any>).disabled = disabled;
      }
    }
    this._disabled = disabled;
    this.propagate(this.clone());
  }

  public patchValue(
    newValue: Partial<T>,
    opts: PatchValueProps = {
      stateless: false,
    }
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
      this.propagate(this.clone());
    }
  }

  protected override internalUpdate(value: T): void {
    this._value = value;
    this.handleNewFormObject();
    this.handleNewArrayObject();
    // TODO pass in reevaluater for nested forms
    this._dirty = true;
    this._touched = true;
    this._valid = this._validators.every((validator) => validator(this.value));
  }

  private handleNewArrayObject(): void {
    if (
      !Array.isArray(this._value) ||
      (!this._contains_a_form && !this._value.some((item) => Form.isForm(item)))
    ) {
      return;
    }

    this._value = new Proxy(this._value, {
      set: (target, property, newValue) => {
        const index = Number(property);
        if (!isNaN(index)) {
          const oldValue = target[index];
          if (oldValue !== newValue) {
            target[index] = newValue;
            this.internalUpdate(this._value);
            this.propagate(this.clone());
          }
          return true;
        }
        // Handle other properties like 'length'
        if (property === 'length') {
          if (target.length !== (newValue as number)) {
            (target as any)[property] = newValue;
            this.internalUpdate(this._value);
            this.propagate(this.clone());
            return true;
          }
          (target as any)[property] = newValue;
          return true;
        }
        (target as any)[property] = newValue;
        return true;
      },
    });
  }

  private handleNewFormObject(): void {
    const currentValue = this._value;
    if (!(Array.isArray(currentValue) || BaseForm.isFormLike(currentValue))) {
      return;
    }
    this._contains_a_form = true;
    // Array of forms: only rehook if any child needs a hook
    if (Array.isArray(currentValue)) {
      const arr = (currentValue as Array<unknown>).filter(
        (item): item is Form<any> => Form.isForm(item)
      );
      const needsAnyHook = arr.some((f) => BaseForm.needsHook(f));
      if (needsAnyHook) {
        assignHooklessFormArray(arr, {
          current: this as any,
        });
      }
      return;
    }
    // Single nested form
    if (Form.isForm(currentValue) && BaseForm.needsHook(currentValue)) {
      const primitiveControls = (currentValue as any).__primitiveControls;
      this.value = new Form(primitiveControls, (oldState) => {
        const oldFormCached = this.value as unknown as Form<any>;
        const val: Form<any> =
          typeof oldState === "function" ? oldState(oldFormCached) : oldState;
        this.value = val as unknown as T;
      }) as unknown as T;
    }
  }

  public static isFormControl(obj: any): obj is FormControl<any, any> {
    return obj && obj.__form_control === true;
  }
}
