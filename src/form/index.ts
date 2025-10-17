/**
 * @module @form
 * 
 * Core form management module providing reactive form handling for React applications.
 * 
 * This module exports:
 * - FormControl: Individual form field with validation and state management
 * - Form: Group of controls for complex form structures
 * - Validators: Common validation functions
 * - Functional helpers: formGroup, formControl for functional programming style
 * 
 * @example
 * ```typescript
 * import { Form, FormControl, Validators } from '@form';
 * 
 * interface User {
 *   name: string;
 *   email: string;
 * }
 * 
 * const userForm = new Form<User>({
 *   name: ['', Validators.required],
 *   email: ['', [Validators.required]]
 * }, setState);
 * ```
 */

export * from './formcontrol'
export * from './form'
export * from './validators'
