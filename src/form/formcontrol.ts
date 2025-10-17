import { PatchValueProps } from "../types/control.types";
import { ValidatorFn } from "../types/validator.types";
import { BaseForm } from "./base-form";
import { Form } from "./form";
import {
  assignHooklessFormArray,
  Ref,
  RefOrFactory,
} from "./util/form-control.util";
import {} from "../util";

/**
 * Internal type representing version tracking for FormControl instances
 * @template T - The type of the value that the FormControl holds
 * @template O - The type this FormControl belongs to
 */
type FormControlVersion<T, O> = {
  current: FormControl<T, O>;
  old: FormControl<T, O>;
};

/**
 * Represents a single form control that manages a value, validation, and state.
 * FormControl is the building block of reactive forms, handling individual field values.
 * 
 * @template T - The type of the value that the FormControl will hold
 * @template O - The type this FormControl belongs to (parent form type)
 * 
 * @example
 * ```typescript
 * const nameControl = new FormControl<string, User>(
 *   'name',
 *   '',
 *   [Validators.required],
 *   setState
 * );
 * ```
 */
export class FormControl<T, O> extends BaseForm<T, Form<O>> {
  /**
   * Internal marker used to identify FormControl instances
   * @private
   * @readonly
   */
  private readonly __form_control = true;
  
  /**
   * Indicates whether this control contains a nested Form or array of Forms
   * @private
   */
  private _contains_a_form: boolean = false;
  
  /**
   * The key/property name this control represents in the parent form
   * @private
   */
  private _key: keyof T;
  
  /**
   * The initial value of the control (used for reset operations)
   * @private
   */
  private _initialValue: T;
  
  /**
   * The current value of the control
   * @private
   */
  private _value: T;
  
  /**
   * Array of validation functions to apply to the control's value
   * @private
   */
  private _validators: Array<ValidatorFn<T>>;
  
  /**
   * Reference to track control versions for proper React state updates
   * @private
   */
  private _versionRef: Ref<FormControlVersion<T, O>> = {
    current: {
      current: this,
      old: undefined,
    },
  };

  /**
   * Creates a new FormControl instance
   * @param key - The key/property name this control represents
   * @param initialValue - The initial value of the control
   * @param validators - Array of validation functions (default: empty array)
   * @param setState - React state setter function for propagating updates
   */
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

  /**
   * Gets the key/property name this control represents
   * @returns The control's key
   */
  public get key(): keyof T {
    return this._key;
  }

  /**
   * Gets the current value of the control
   * @returns The control's current value
   */
  public get value(): T {
    return this._value;
  }

  /**
   * Sets the value of the control and triggers validation and propagation
   * @param newValue - The new value to set
   */
  public set value(newValue: T) {
    if (this._value !== newValue) {
      this.internalUpdate(newValue);
      this.propagate(this.clone());
    }
  }

  /**
   * Resets the control to its initial state, including nested forms if present
   */
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

  /**
   * Gets the read-only state of the control
   * @returns True if the control is read-only
   */
  public override get readonly(): boolean {
    return this._readonly;
  }

  /**
   * Sets the read-only state of the control and propagates to nested forms
   * @param isReadonly - True to make the control read-only, false otherwise
   */
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

  /**
   * Gets the disabled state of the control
   * @returns True if the control is disabled
   */
  public override get disabled(): boolean {
    return this._disabled;
  }

  /**
   * Sets the disabled state of the control and propagates to nested forms
   * @param disabled - True to disable the control, false to enable it
   */
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

  /**
   * Partially updates the control's value
   * @param newValue - Partial value to merge with current value
   * @param opts - Options for the patch operation
   * @param opts.stateless - If true, skips React state propagation (default: false)
   */
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

  /**
   * Internal method to update the control's value and run validation
   * @protected
   * @param value - The new value to set
   */
  protected override internalUpdate(value: T): void {
    this._value = value;
    this.handleNewFormObject();
    this.handleNewArrayObject();
    // TODO pass in reevaluater for nested forms
    this._dirty = true;
    this._touched = true;
    this._valid = this._validators.every((validator) => validator(this.value));
  }

  /**
   * Handles array values containing Forms by wrapping them in a Proxy for reactivity
   * @private
   */
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
        if (property === "length") {
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

  /**
   * Handles nested Form objects by setting up proper state hooks
   * @private
   */
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
        assignHooklessFormArray(
          arr,
          this._versionRef?.current as RefOrFactory<FormControl<any, O>>
        );
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

  /**
   * Creates a clone of the control for React state updates, maintaining version history
   * @returns A cloned instance of the control
   */
  public override clone() {
    const superClone = super.clone();
    this._versionRef.current = {
      current: superClone,
      old: this._versionRef.current.current,
    };
    (superClone as FormControl<T, O>)._versionRef = this._versionRef;

    return superClone;
  }

  /**
   * Type guard to check if an object is a FormControl instance
   * @param obj - Object to check
   * @returns True if the object is a FormControl instance
   */
  public static isFormControl(obj: any): obj is FormControl<any, any> {
    return obj && obj.__form_control === true;
  }
}
