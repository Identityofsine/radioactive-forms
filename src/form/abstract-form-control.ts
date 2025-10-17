import { RequiresHook } from "../state/requires-hook";

/**
 * Abstract base class containing only the literally shared elements between Form and FormControl.
 * Provides common state management properties and methods for form controls.
 * 
 * @template S - The state type for the form control
 */
export abstract class AbstractFormControl<S> extends RequiresHook<S> {
  /**
   * Indicates whether the control's value has been changed from its initial value
   * @protected
   */
  protected _dirty: boolean;
  
  /**
   * Indicates whether the control has been interacted with by the user
   * @protected
   */
  protected _touched: boolean;
  
  /**
   * Indicates whether the control passes all validation rules
   * @protected
   */
  protected _valid: boolean;
  
  /**
   * Indicates whether the control is in read-only mode
   * @protected
   */
  protected _readonly: boolean;

  /**
   * Creates a new AbstractFormControl instance
   * @param setState - React state setter function for propagating updates
   */
  constructor(setState: React.Dispatch<React.SetStateAction<S>>) {
    super(setState);
  }

  /**
   * Gets whether the control's value has been changed from its initial value
   * @returns True if the control value has been modified
   */
  public get dirty(): boolean {
    return this._dirty;
  }

  /**
   * Gets whether the control has been interacted with by the user
   * @returns True if the control has been touched
   */
  public get touched(): boolean {
    return this._touched;
  }

  /**
   * Gets whether the control passes all validation rules
   * @returns True if the control is valid
   */
  public get valid(): boolean {
    return this._valid;
  }

  /**
   * Gets whether the control is in read-only mode
   * @returns True if the control is read-only
   */
  public get readonly(): boolean {
    return this._readonly;
  }

  /**
   * Resets the control to its initial state
   * @abstract
   */
  public abstract reset(): void;
  
  /**
   * Partially updates the control's value
   * @abstract
   * @param values - Partial values to patch
   * @param opts - Optional configuration for the patch operation
   */
  public abstract patchValue(values: any, opts?: any): void;
}
