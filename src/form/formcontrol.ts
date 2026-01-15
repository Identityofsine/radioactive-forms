import { PatchValueProps } from "../types/control.types";
import { AdvancedValidatorReturn, ValidatorFn } from "../types/validator.types";
import { BaseForm } from "./base-form";
import { Form } from "./form";
import {
  assignHooklessFormArray,
  Ref,
  RefOrFactory,
} from "./util/form-control.util";
import { } from "../util";

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
   * A list of validation results from the last validation run
   * @private
   */
  private _invalids: Array<{
    fn: ValidatorFn<T>;
    result: AdvancedValidatorReturn;
  }> = [];

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
      this._valid = this.checkValidity();
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
    // Check if current value contains forms
    const currentValueContainsForms =
      BaseForm.isFormLike(this._value) ||
      (Array.isArray(this._value) &&
        this._value.some((item) => BaseForm.isFormLike(item)));

    // Check if initial value contains forms
    const initialValueContainsForms =
      BaseForm.isFormLike(this._initialValue) ||
      (Array.isArray(this._initialValue) &&
        this._initialValue.some((item) => BaseForm.isFormLike(item)));

    if (currentValueContainsForms) {
      // Current value contains forms - reset the forms in place
      if (Array.isArray(this._value)) {
        // For arrays containing forms, reset each form in the current array
        this._value.forEach((item) => {
          if (Form.isFormLike(item)) {
            item.reset();
          }
        });
        // Clean up any null/undefined forms from the array
        this._value = this._value?.filter((item) => item && Form.isFormLike(item)) as T;
      } else if (Form.isFormLike(this._value)) {
        // Single nested form - call reset on the existing form instance
        (this._value as unknown as Form<any>).reset();
      }
    } else if (initialValueContainsForms) {
      // Initial value contains forms but current doesn't - restore initial value
      // This handles the case where forms were removed/replaced
      if (Array.isArray(this._initialValue)) {
        // Restore initial array and reset forms in it
        this._value = this._initialValue;
        (this._value as unknown as any[]).forEach((item: unknown) => {
          if (Form.isFormLike(item)) {
            (item as unknown as Form<any>).reset();
          }
        });
        this._value = (this._value as unknown as any[])?.filter((item: unknown) => item && Form.isFormLike(item as unknown as Form<any>)) as T;
      } else if (Form.isFormLike(this._initialValue)) {
        // Restore initial form - handle factory function case
        const initialValue = typeof this._initialValue === "function" 
          ? (this._initialValue as () => Form<any>)() 
          : this._initialValue;
        this._value = initialValue as T;
        if (Form.isFormLike(this._value)) {
          (this._value as unknown as Form<any>).reset();
        }
      }
    } else {
      // Normal value (not containing forms) - reset to initial value
      this._value = this._initialValue;
    }
    this._dirty = false;
    this._touched = false;
    this._valid = this.checkValidity();
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

    this._readonly = isReadonly;

    // Then propagate to nested forms
    if (Array.isArray(this._value)) {
      this._value
        .filter((item) => Form.isFormLike(item))
        .forEach((item) => {
          (item as Form<any>).readonly = isReadonly;
        });
    } else if (BaseForm.isFormLike(this._value)) {
      (this._value as unknown as Form<any>).readonly = isReadonly;
    }

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
   * Checks if a specific validator function is applied to the form-control
   * * @param validator - The validator function to check
   * * @returns True if the validator is applied, false otherwise
   */
  public hasValidator(validator: ValidatorFn<T>): boolean {
    return this._validators.includes(validator);
  }

  /**
    * Adds a validator function to the form-control and recalculates validity
  * @param validator - The validator function to add
  */
  public addValidator(validator: ValidatorFn<T>): void {
    this._validators.push(validator);
    this.recalculateValidity();
  }

  /**
    * Removes a validator function from the form-control and recalculates validity
  * @param validator - The validator function to remove
  */
  public removeValidator(validator: ValidatorFn<T>): void {
    this._validators = this._validators.filter(
      (v) => v !== validator && v.toString() !== validator.toString()
    );
    this.recalculateValidity();
  }

  /**
    * Recalculates the validity of the control based on its validators and propagates the change
  */
  private recalculateValidity(): void {
    if (this._validators.length === 0 || !this._validators) {
      this._valid = true; // No validators means always validators
    } else {
      this._valid = this.checkValidity();
    }
    this.propagate(this.clone());
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
   * @param opts.markAsDirty - If false, does not mark the control as dirty (default: true)
   */
  public override patchValue(
    newValue: Partial<T>,
    opts: PatchValueProps = {
      stateless: false,
      markAsDirty: true,
    }
  ): void {
    if (
      typeof this._value === "object" &&
      this._value !== null &&
      this._value instanceof Date === false &&
      this._value instanceof File === false &&
      this._value instanceof Blob === false &&
      this._value !== null &&
      !Array.isArray(this._value)
    ) {
      const updatedValue = { ...this._value, ...newValue };
      this.updateValueInternal(updatedValue as T, opts);
    } else {
      this.updateValueInternal(newValue as T, opts);
    }
    if (!opts?.stateless) {
      this.propagate(this.clone());
    }
  }

  private updateValueInternal(newValue: T, {
    markAsDirty = true,
  }: { stateless?: boolean; markAsDirty?: boolean }): void {
    this.internalUpdate(newValue, {
      markAsDirty,
    });
  }

  /**
   * @name checkValidity
   *  * @description Validates the control's current value against its validators.
   *  * @returns True if the value is valid, false otherwise
   *  *  @remarks
   *  This method runs all validators associated with the control and updates, but this also mutates this control's _invalids property to reflect the latest validation results.
   *  * @example
   *  ```typescript
   *  const control = new FormControl<string, any>(
   *    'name',
   *    '',
   *    [Validators.required]
   *  );
   *
   *  control.checkValidity(); // false
   *
   *  control.value = 'John';
   *
   *  control.checkValidity(); // true
   *  ```
   */
  private checkValidity(): boolean {
    const validatorsValid = this.runValidators();

    // If the control wraps nested form(s), include their validity
    const hasNestedForms =
      BaseForm.isFormLike(this._value) ||
      (Array.isArray(this._value) &&
        this._value.some((item) => BaseForm.isFormLike(item)));

    // Always update _contains_a_form based on current value state
    this._contains_a_form = hasNestedForms;

    return validatorsValid;
  }

  /**
   * Runs validators and normalizes the results into the invalids array.
   */
  private runValidators(): boolean {
    if (!this._validators || this._validators.length === 0) {
      this._invalids = [];
      return true;
    }

    this._invalids = this._validators.map((validator) => {
      const result = validator(this.value);
      const mutatedResult =
        typeof result === "boolean"
          ? { valid: result }
          : "then" in result
            ? result.then((res) =>
              typeof res === "boolean" ? { valid: res } : res
            )
            : (result as AdvancedValidatorReturn);
      return {
        fn: validator,
        result: mutatedResult as AdvancedValidatorReturn,
      };
    });

    return this._invalids.every(({ result }) => {
      if (typeof result === "boolean") {
        return result;
      }
      if (typeof result === "object" && "valid" in result) {
        return result.valid;
      }
      return false;
    });
  }

  public get invalids() {
    return this._invalids;
  }

  /**
   * Internal method to update the control's value and run validation
   * @protected
   * @param value - The new value to set
   */
  protected override internalUpdate(value: T, args?: {
    markAsDirty: boolean,
  }): void {
    const markAsDirty = args?.markAsDirty ?? true;
    this._value = value;
    this.handleNewFormObject();
    this.handleNewArrayObject();
    // TODO pass in reevaluater for nested forms
    if (markAsDirty) {
      this._dirty = true;
    }
    this._touched = true;
    this._valid = this.checkValidity();
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
      const nForm = new Form(primitiveControls, (oldState) => {
        const oldFormCached = this.value as unknown as Form<any>;
        const val: Form<any> =
          typeof oldState === "function" ? oldState(oldFormCached) : oldState;
        this.value = val as unknown as T;
      }) as unknown as T;
      (nForm as Form<any>).setStateWithoutPropagation(this._readonly, this._disabled);
      this._value = nForm;
    }
  }

  /**
   * Converts the control's value to JSON, this avoids circular references
   * @returns The control's value in JSON format
   */
  public toJSON() {
    return this.value;
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
