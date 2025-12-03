import { } from "../util";
import type {
  FormControlMap,
  FormControlNonArrayPrimitiveMap,
  FormControlPrimitiveMap,
} from "../types/form.types";
import { FormControl } from "./formcontrol";
import { createFormControls } from "./util/form-control.util";
import { BaseForm } from "./base-form";
import { PatchValueProps } from "../types/control.types";

/**
 * Internal type for accepted control configurations
 * @template T - The form data type
 */
type AcceptedControls<T> =
  | FormControlMap<T>
  | FormControlPrimitiveMap<T>
  | FormControlNonArrayPrimitiveMap<T>;

/**
 * Represents a group of FormControls that work together to manage complex form data.
 * Form provides validation, state management, and React integration for multiple controls.
 * 
 * @template T - The type of the data structure the form manages
 * 
 * @example
 * ```typescript
 * interface User {
 *   name: string;
 *   email: string;
 *   age: number;
 * }
 * 
 * const userForm = new Form<User>({
 *   name: ['', Validators.required],
 *   email: ['', [Validators.required, Validators.email]],
 *   age: [0]
 * }, setState);
 * ```
 */
export class Form<T> extends BaseForm<T, Form<T>> {
  /**
   * Internal marker used to identify Form instances
   * @private
   * @readonly
   */
  private readonly __form = true;

  /**
   * Stores the original primitive control configuration for recreating the form
   * @private
   * @readonly
   */
  private readonly __primitiveControls: AcceptedControls<T>;

  /**
   * Reference to the parent FormControl if this form is nested
   * @private
   */
  private __parentControl?: FormControl<unknown, unknown>;

  /**
   * Map of all controls in this form, keyed by property name
   * @private
   */
  private _controls: FormControlMap<T>;

  /**
   * Flattened array of all controls for easier iteration
   * @private
   */
  private _flattenedControls: FormControl<any, T>[];

  /**
   * Array of controls that are currently invalid
   * @private
   */
  private _invalids: FormControl<any, T>[] = [];

  /**
   * Creates a new Form instance with FormControlPrimitiveMap configuration
   * @param controls - Primitive control configuration
   * @param setState - React state setter function
   * @param parentControl - Optional parent control if this is a nested form
   */
  constructor(
    controls: FormControlPrimitiveMap<T>,
    setState?: React.Dispatch<React.SetStateAction<Form<T>>>,
    parentControl?: FormControl<unknown, unknown>
  );
  /**
   * Creates a new Form instance with FormControlNonArrayPrimitiveMap configuration
   * @param controls - Non-array primitive control configuration
   * @param setState - React state setter function
   */
  constructor(
    controls: FormControlNonArrayPrimitiveMap<T>,
    setState?: React.Dispatch<React.SetStateAction<Form<T>>>
  );
  /**
   * Creates a new Form instance with FormControlPrimitiveMap configuration
   * @param controls - Primitive control configuration
   * @param setState - React state setter function
   */
  constructor(
    controls: FormControlPrimitiveMap<T>,
    setState?: React.Dispatch<React.SetStateAction<Form<T>>>
  );
  /**
   * Creates a new Form instance with FormControlMap configuration
   * @param controls - Form control map configuration
   * @param setState - React state setter function
   */
  constructor(
    controls: FormControlMap<T>,
    setState?: React.Dispatch<React.SetStateAction<Form<T>>>
  );
  constructor(
    controls: AcceptedControls<T>,
    setState?: React.Dispatch<React.SetStateAction<Form<T>>>,
    parentControl?: FormControl<unknown, unknown>
  ) {
    super(setState);
    if (parentControl) {
      this.__parentControl = parentControl;
    }
    this.__primitiveControls = controls;
    this._controls = createFormControls(controls, (updateAction) => {
      if (typeof updateAction === "function") {
        if (this._setState) {
          this._setState((oldForm: any) => {
            const nextForm = updateAction(oldForm);
            if (nextForm && typeof nextForm.internalUpdate === "function") {
              nextForm.internalUpdate();
            }
            return nextForm;
          });
        } else {
          // Non-reactive path: evaluate updater against current instance and merge
          const nextForm = updateAction(this as unknown as Form<T>);
          Object.assign(this, nextForm);
          this.internalUpdate();
        }
      } else {
        if (this._setState) {
          const nextForm = updateAction;
          if (nextForm && typeof nextForm.internalUpdate === "function") {
            nextForm.internalUpdate();
          }
          this._setState(nextForm);
        } else {
          // Non-reactive direct assignment path
          Object.assign(this, updateAction);
          this.internalUpdate();
        }
      }
    });
    this._flattenedControls = Object.values(this._controls ?? {}) || [];
    this._dirty = false;
    this._touched = false;
    this._valid = true;
    this._readonly = false;
  }

  /**
   * Gets the map of all controls in this form
   * @returns The controls map
   */
  get controls(): FormControlMap<T> {
    return this._controls;
  }

  /**
   * Gets the array of controls that are currently invalid
   * @returns Array of invalid controls
   */
  get invalids(): FormControl<any, T>[] {
    return this._invalids;
  }

  /**
   * Gets a specific control by its key
   * @template K - The key type
   * @param key - The key of the control to retrieve
   * @returns The FormControl instance or undefined if not found
   */
  public getControl<K extends keyof T>(
    key: K
  ): FormControl<T[K], T> | undefined {
    return this._controls?.[key] as FormControl<T[K], T> | undefined;
  }

  /**
   * Dynamically adds new controls to the form
   * @template T - The type of controls being added
   * @param controlMap - Map of new controls to add
   * @throws {Error} If a control with the same key already exists
   */
  public addControls<T>(controlMap: AcceptedControls<T>): void {
    const foundKey = Object.keys(controlMap).find(
      (key) => key in this._controls
    );
    if (foundKey?.length > 0) {
      console.dError(
        `Form with controls:`,
        this._controls,
        `. Control with key: ${String(foundKey)} already exists.`
      );
      return;
    }
    const newControls = createFormControls(controlMap, (updateAction) => {
      if (typeof updateAction === "function") {
        if (this._setState) {
          this._setState((oldForm: any) => {
            const nextForm = updateAction(oldForm);
            if (nextForm && typeof nextForm.internalUpdate === "function") {
              nextForm.internalUpdate();
            }
            return nextForm;
          });
        } else {
          const nextForm = updateAction(this as unknown as Form<T>);
          Object.assign(this, nextForm);
          this.internalUpdate();
        }
      } else {
        if (this._setState) {
          const nextForm = updateAction;
          if (nextForm && typeof nextForm.internalUpdate === "function") {
            nextForm.internalUpdate();
          }
          this._setState(updateAction);
        } else {
          Object.assign(this, updateAction);
          this.internalUpdate();
        }
      }
    });
    this._controls = Object.assign(this._controls, newControls);
    this._flattenedControls = Object.values(this._controls ?? {}) || [];
  }

  /**
   * Gets the read-only state of the form
   * @returns True if the form is read-only
   */
  override get readonly(): boolean {
    return this._readonly;
  }

  /**
   * Sets the read-only state of the form and all its controls
   * @param value - True to make the form read-only, false otherwise
   */
  override set readonly(value: boolean) {
    this._readonly = value;
    this._flattenedControls.forEach((control) => (control.readonly = value));
    console.dLog(
      `Form with controls:`,
      this._controls,
      `set to readonly: ${value}`
    );
    // Use clone to ensure React detects the change
    this.propagate(this.clone());
  }

  /**
   * Gets the disabled state of the form
   * @returns True if the form is disabled
   */
  override get disabled(): boolean {
    return this._disabled;
  }

  /**
   * Sets the disabled state of the form and all its controls
   * @param value - True to disable the form, false to enable it
   */
  override set disabled(value: boolean) {
    this._disabled = value;
    this._flattenedControls.forEach((control) => (control.disabled = value));
    console.dLog(
      `Form with controls:`,
      this._controls,
      `set to disabled: ${value}`
    );
    // Use clone to ensure React detects the change
    this.propagate(this.clone());
  }

  /**
   * Resets all controls in the form to their initial state
   */
  public reset(): void {
    this._flattenedControls.forEach((control) => control.reset());
    console.dLog(`Form with controls:`, this._controls, `has been reset.`);
  }

  /**
   * Partially updates the form's values
   * @param values - Partial object with values to update
   * 
   * @example
   * ```typescript
   * userForm.patchValue({ name: 'John Doe' });
   * ```
   */
  public patchValue(values: Partial<{ [K in keyof T]: T[K] }>, opts?: PatchValueProps): void {
    for (const key in values) {
      const controlKey = this._controls?.[key];
      if (controlKey) {
        console.dLog(
          `Patching value for key: ${key} with value: ${values[key]}`
        );
        if (Form.isForm(controlKey.value)) {
          (controlKey.value as Form<any>).patchValue(
            values[key] as Partial<any>,
            opts
          );
          continue;
        }
        if (opts?.stateless === true) {
          Object.assign(
            (controlKey as FormControl<T[keyof T], T>), { value: values[key] as T[Extract<keyof T, string>] }
          )

        } else {
          (controlKey as FormControl<T[keyof T], T>).value = values[
            key
          ] as T[Extract<keyof T, string>];
        }
      } else {
        console.dError(
          `Form with controls:`,
          this._controls,
          `. No control found for key: ${key}`
        );
      }
    }
  }

  /**
   * Builds and returns the final form value, extracting data from all controls
   * Handles nested forms and arrays of forms recursively
   * @returns The complete form data object
   * 
   * @example
   * ```typescript
   * const userData = userForm.build();
   * // Returns: { name: 'John', email: 'john@example.com', age: 30 }
   * ```
   */
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
            (v) => (v as unknown as FormControl<any, any>).value
          ) as any;
        } else if (Form.isForm(value[0])) {
          // list of forms
          result[key] = value.map((v) =>
            (v as unknown as Form<any>).build()
          ) as any;
        } else {
          result[key] = value as any;
        }
      } else {
        result[key] = value as any;
      }
    }
    return result;
  }


  /**
  * Converts the form to JSON by building its value
  * This avoids circular references during serialization
  * @returns The JSON representation of the form's value
  */
  public toJSON() {
    return this.build();
  }

  /**
   * Type guard to check if an object is a Form instance
   * @param obj - Object to check
   * @returns True if the object is a Form instance
   */
  public static isForm(obj: any): obj is Form<any> {
    return obj && obj.__form === true;
  }

  /**
   * Internal method to update the form's state based on its controls
   * Updates dirty, touched, valid states and invalid controls array
   * @protected
   */
  protected override internalUpdate(): void {
    if (this._flattenedControls === undefined) {
      this._flattenedControls = Object.values(this._controls ?? {}) || [];
    }
    this._dirty = this._flattenedControls?.some((control) => control.dirty);
    this._touched = this._flattenedControls?.some((control) => control.touched);
    const invalidControls = this._flattenedControls?.collect(
      (control) => !control.valid
    );
    this._valid = invalidControls?.length === 0;
    this._invalids = invalidControls;

    // Do not propagate here; callers are responsible for state updates to
    // avoid conflicting React state transitions and preserve update ordering.
  }
}
