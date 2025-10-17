import { RequiresHook } from "../state/requires-hook";
import { Cloneable, TopLevelFormState } from "../types/form.types";

/**
 * Abstract base class for all form-related classes (Form and FormControl).
 * Provides core functionality for form state management, validation, and React integration.
 * 
 * @template T - The type of the value/data structure the form handles
 * @template Z - The type of the form instance (defaults to BaseForm<T>)
 */
export abstract class BaseForm<T, Z extends BaseForm<T> = any>
  extends RequiresHook<Z>
  implements TopLevelFormState<T>, Cloneable
{
  /**
   * Internal marker used to identify BaseForm instances
   * @private
   * @readonly
   */
  private readonly __base_form = true;
  
  /**
   * Internal marker indicating the form has been initialized
   * @private
   * @readonly
   */
  private readonly __initialized = true;
  
  /**
   * Indicates whether this form instance needs a React state hook to be attached
   * @private
   * @readonly
   */
  private readonly __needs_hook: boolean;
  
  /**
   * Static set to track all used form IDs to ensure uniqueness
   * @private
   * @static
   */
  private static usedIds: Set<string> = new Set();
  
  /**
   * Unique identifier for this form instance
   * @private
   * @readonly
   */
  private readonly _formId: string;

  /**
   * Indicates whether the form's value has been changed from its initial value
   * @protected
   */
  protected _dirty: boolean = false;
  
  /**
   * Indicates whether the form has been interacted with by the user
   * @protected
   */
  protected _touched: boolean = false;
  
  /**
   * Indicates whether the form passes all validation rules
   * @protected
   */
  protected _valid: boolean = true;
  
  /**
   * Indicates whether the form is in read-only mode
   * @protected
   */
  protected _readonly: boolean = false;
  
  /**
   * Indicates whether the form is disabled
   * @protected
   */
  protected _disabled: boolean = false;

  /**
   * Creates a new BaseForm instance
   * @param setState - Optional React state setter function for propagating updates
   */
  public constructor(setState?: React.Dispatch<React.SetStateAction<Z>>) {
    super(setState);
    this.__needs_hook = !setState;
    this._formId = BaseForm.generateFormId();
  }

  /**
   * Type guard to check if an object is a BaseForm instance
   * @param obj - Object to check
   * @returns True if the object is a BaseForm instance
   */
  public static isFormLike(obj: any): obj is BaseForm<any> {
    return obj && obj.__base_form === true;
  }

  /**
   * Checks if a form instance needs a React state hook to be attached
   * @param obj - Object to check
   * @returns True if the object needs a hook
   */
  public static needsHook(obj: any): boolean {
    return obj && obj.__needs_hook === true;
  }

  /**
   * Gets the unique identifier for this form instance
   * @returns The form's unique ID
   */
  public get formId(): string {
    return this._formId;
  }

  /**
   * Gets whether the form's value has been changed from its initial value
   * @returns True if the form has been modified
   */
  get dirty(): boolean {
    return this._dirty;
  }

  /**
   * Gets whether the form is disabled
   * @returns True if the form is disabled
   */
  get disabled(): boolean {
    return this._disabled;
  }

  /**
   * Gets whether the form has been interacted with by the user
   * @returns True if the form has been touched
   */
  get touched(): boolean {
    return this._touched;
  }

  /**
   * Gets whether the form passes all validation rules
   * @returns True if the form is valid
   */
  get valid(): boolean {
    return this._valid;
  }

  /**
   * Gets whether the form is in read-only mode
   * @returns True if the form is read-only
   */
  get readonly(): boolean {
    return this._readonly;
  }

  /**
   * Gets whether the form has been initialized
   * @returns True if the form is initialized
   */
  get formInitialized(): boolean {
    return this.__initialized;
  }

  /**
   * Sets the read-only state of the form
   * @param value - True to make the form read-only, false otherwise
   */
  set readonly(value: boolean) {
    if (this._readonly === value) {
      return;
    }
    this._readonly = value;
    // Use clone to ensure React detects the change
    this.propagate(this.clone());
  }

  /**
   * Sets the disabled state of the form
   * @param value - True to disable the form, false to enable it
   */
  set disabled(value: boolean) {
    if (this._disabled === value) {
      return;
    }
    this._disabled = value;
    // Use clone to ensure React detects the change
    this.propagate(this.clone());
  }

  /**
   * Sets the dirty state of the form
   * @param value - True to mark the form as dirty, false otherwise
   */
  set dirty(value: boolean) {
    this._dirty = value;
    this.propagate(this.clone());
  }

  /**
   * Resets the form to its initial state
   * @abstract
   */
  public abstract reset(): void;

  /**
   * Creates a shallow clone of the form instance for React state updates
   * @returns A cloned instance of the form
   */
  public clone(): this {
    // Create a new Form instance
    const newObj = Object.create(Object.getPrototypeOf(this)) as this;

    Object.assign(newObj, this);

    return newObj;
  }

  /**
   * Internal method to update form state without triggering React updates
   * @abstract
   * @protected
   * @param value - Optional value to update to
   */
  protected abstract internalUpdate(value?: T): void;

  /**
   * Generates a unique form ID
   * @private
   * @static
   * @returns A unique form identifier
   */
  private static generateFormId(): string {
    let id = `form-`;
    while (BaseForm.usedIds.has(id)) {
      id = `form-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    }
    BaseForm.usedIds.add(id);
    return id;
  }

}
