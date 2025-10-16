/**
 * Common Test Utilities for React Integration Tests
 * 
 * Provides shared components, helpers, and utilities for testing
 * radioactive-forms React integration across multiple test files.
 */

import { ReactElement, ReactNode, useEffect } from "react";
import { render } from "@testing-library/react";
import { useForm } from "../react/use-form-hook";
import { FormGroupProvider } from "../react/context/FormGroup";
import { Form, Validators } from "../form";

// ============================================================================
// Test Schemas
// ============================================================================

/**
 * Base schema used across multiple tests for consistency
 */
export const BASE_SCHEMA = {
  field1: "value1",
  field2: 42,
  field3: [1, 2, 3],
  field4: [1, 2],
  field5: ["a"],
};

// ============================================================================
// Test Components
// ============================================================================

/**
 * Helper component that wraps tests with FormGroupProvider
 * Provides a consistent way to test forms in React context
 */
export type BaseFormComponentProps<T = typeof BASE_SCHEMA> = {
  schema?: T;
  children?: ReactNode;
  formRef?: (form: Form<T> | undefined) => void;
};

export const BaseFormComponent = <T = typeof BASE_SCHEMA,>({
  schema = BASE_SCHEMA as unknown as T,
  children,
  formRef,
}: BaseFormComponentProps<T>) => {
  const { form } = useForm({ ...schema }, {}, []);

  useEffect(() => {
    if (formRef) {
      formRef(form as Form<T>);
    }
  });

  return (
    <FormGroupProvider form={form}>
      <div>Form Initialized: {form?.formInitialized ? "Yes" : "No"}</div>
      {children}
    </FormGroupProvider>
  );
};

/**
 * Helper function to create a reactive form with a test component
 * Automatically adds Validators.required to field5 for validation testing
 */
export const ReactiveForm = (
  TestComponent: () => ReactElement<any, any>,
  setForm: (form: Form<any>) => void
) =>
  render(
    <BaseFormComponent
      schema={{
        ...BASE_SCHEMA,
        field5: ["a", [Validators.required]],
      }}
      formRef={(form) => {
        setForm(form as Form<any>);
      }}
    >
      <TestComponent />
    </BaseFormComponent>
  );

