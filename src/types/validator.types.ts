/**
 * @name VALUE_SYNTAX
 * @description A constant string used to denote a special syntax for values.
 * This gets replaced during processing with the actual value.
 */
export const VALUE_SYNTAX = "#!#";

export type AdvancedValidatorReturn = {
  message?: string;
  valid: boolean;
};

export type ValidatorFn<T> = (
  value: T,
  opts?: unknown
) =>
  | boolean
  | Promise<boolean>
  | AdvancedValidatorReturn
  | Promise<AdvancedValidatorReturn>;
