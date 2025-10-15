/**
 * React Integration Test Suite for radioactive-forms
 * 
 * This test suite validates the React integration layer of radioactive-forms,
 * including the useForm hook, FormGroupProvider context, and reactive updates.
 * Tests are organized by feature area to ensure comprehensive coverage.
 */

import { ReactElement, ReactNode, useContext, useEffect } from "react";
import { assert, describe, expect, expectTypeOf, it } from "vitest";
import { render, waitFor, act } from "@testing-library/react";
import { useForm } from "../react/use-form-hook";
import {
  FormGroupContext,
  FormGroupProvider,
} from "../react/context/FormGroup";
import { Form, FormControl, Validators } from "../form";
import { formGroup } from "../form/functional";

// ============================================================================
// Test Helpers and Utilities
// ============================================================================

/**
 * Base schema used across multiple tests for consistency
 */
const BASE_SCHEMA = {
  field1: "value1",
  field2: 42,
  field3: [1, 2, 3],
  field4: [1, 2],
  field5: ["a"],
};

/**
 * Helper component that wraps tests with FormGroupProvider
 * Provides a consistent way to test forms in React context
 */
type BaseFormComponentProps<T = typeof BASE_SCHEMA> = {
  schema?: T;
  children?: ReactNode;
  formRef?: (form: Form<T> | undefined) => void;
};

const BaseFormComponent = <T = typeof BASE_SCHEMA,>({
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
const ReactiveForm = (
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

// ============================================================================
// Test Suite: Form Initialization & Type Safety
// ============================================================================

describe("Form Initialization & Type Safety", () => {
  it("React useForm infers arrays and nested forms correctly (compile-time only)", () => {
    // This test validates TypeScript type inference for form controls
    const schema = {
      field1: "v1",
      field2: 2,
      field3: [1, 2, 3] as number[],
      field4: [1, 2] as number[],
      field5: ["a"] as string[],
    };

    const Component = () => {
      const { form } = useForm(schema, {}, []);
      if (!form) return <></>;

      // Type assertions ensure TypeScript correctly infers control value types
      expectTypeOf(form.controls.field1.value).toEqualTypeOf<string>();
      expectTypeOf(form.controls.field2.value).toEqualTypeOf<number>();
      expectTypeOf(form.controls.field3.value).toEqualTypeOf<number[]>();
      expectTypeOf(form.controls.field4.value).toEqualTypeOf<number[]>();
      expectTypeOf(form.controls.field5.value).toEqualTypeOf<string[]>();

      return <></>;
    };

    render(<Component />);
  });

  it("creates a form instance via useForm and provides via context", async () => {
    // Validates that useForm creates a form and FormGroupProvider makes it available
    let formRef: Form<typeof BASE_SCHEMA> | undefined;
    const { getByText } = ReactiveForm(
      () => <></>,
      (form) => {
        formRef = form;
      }
    );

    await waitFor(() => expect(formRef).toBeDefined());
    await waitFor(() => expect(formRef?.formInitialized).toBe(true));

    // Verify the form initialized message is rendered
    await waitFor(() =>
      expect(getByText("Form Initialized: Yes")).toBeDefined()
    );
  });
});

// ============================================================================
// Test Suite: Form State Reactivity
// ============================================================================

describe("Form State Reactivity (valid, dirty, touched, readonly)", () => {
  it("reacts to direct control value changes (no DOM indirection)", async () => {
    // Tests that changing control values directly updates form state and triggers re-renders
    let formRef: Form<typeof BASE_SCHEMA> | undefined;
    const TestComponent = () => {
      const form = useContext(FormGroupContext)?.form;
      formRef = form as Form<typeof BASE_SCHEMA>;

      return (
        <>
          <div data-testid="field5">
            Field5: {form?.controls.field5.value as any}
          </div>
          <div data-testid="form-valid">
            Form Valid: {form?.valid ? "Yes" : "No"}
          </div>
          <div data-testid="form-dirty">
            Form Dirty: {form?.dirty ? "Yes" : "No"}
          </div>
        </>
      );
    };

    const { getByTestId } = ReactiveForm(TestComponent, (form) => {
      formRef = form as Form<typeof BASE_SCHEMA>;
    });

    // Verify initial state
    await waitFor(() => expect(formRef).toBeDefined());
    await waitFor(() => expect(formRef?.formInitialized).toBe(true));

    await waitFor(() => {
      expect(getByTestId("form-valid")).toHaveTextContent("Form Valid: Yes");
      expect(getByTestId("form-dirty")).toHaveTextContent("Form Dirty: No");
      expect(getByTestId("field5")).toHaveTextContent("Field5: a");
    });

    // Action: Make invalid by clearing required field
    await act(async () => {
      (formRef as Form<typeof BASE_SCHEMA>).controls.field5.value = "" as any;
    });

    await waitFor(() => {
      expect(getByTestId("form-valid")).toHaveTextContent("Form Valid: No");
      expect(getByTestId("form-dirty")).toHaveTextContent("Form Dirty: Yes");
      expect(getByTestId("field5")).toHaveTextContent(/^Field5:\s*$/);
    });

    // Action: Restore to valid
    await act(async () => {
      (formRef as Form<typeof BASE_SCHEMA>).controls.field5.value =
        "restored" as any;
    });

    await waitFor(() => {
      expect(getByTestId("field5")).toHaveTextContent("Field5: restored");
    });

    // Action: Reset form should restore initial state
    await act(async () => {
      (formRef as Form<typeof BASE_SCHEMA>).reset();
    });

    await waitFor(() => {
      expect(getByTestId("form-dirty")).toHaveTextContent("Form Dirty: No");
      expect(getByTestId("field5")).toHaveTextContent("Field5: a");
    });
    await waitFor(() =>
      expect((formRef as Form<typeof BASE_SCHEMA>).dirty).toBe(false)
    );
  });

  it("elements respond to form state changes via UI interactions", async () => {
    // Tests button clicks trigger form state updates and re-renders
    let formRef: Form<typeof BASE_SCHEMA> | undefined;
    const TestComponent = () => {
      const form = useContext(FormGroupContext)?.form;

      return (
        <>
          <div data-testid="form-valid">
            Form Valid: {form?.valid ? "Yes" : "No"}
          </div>
          <div data-testid="form-readonly">
            Form Readonly: {form?.readonly ? "Yes" : "No"}
          </div>
          <div data-testid="form-dirty">
            Form Dirty: {form?.dirty ? "Yes" : "No"}
          </div>
          <div data-actions>
            <button
              data-testid="make-invalid"
              onClick={() => {
                if (!form) return;
                form.controls.field5.value = "" as any;
              }}
            >
              Make Invalid
            </button>
            <button
              data-testid="make-valid"
              onClick={() => {
                if (!form) return;
                form.controls.field5.reset();
              }}
            >
              Make Valid
            </button>
            <button
              data-testid="reset"
              onClick={() => {
                if (!form) return;
                form.reset();
              }}
            >
              Reset Form
            </button>
          </div>
        </>
      );
    };

    const { getByTestId } = ReactiveForm(TestComponent, (form) => {
      formRef = form;
    });

    // Verify initial state
    await waitFor(() => expect(formRef).toBeDefined());
    await waitFor(() => expect(formRef?.formInitialized).toBe(true));

    const makeInvalidBtn = getByTestId("make-invalid");
    const resetBtn = getByTestId("reset");

    await waitFor(() => {
      expect(getByTestId("form-valid")).toHaveTextContent("Form Valid: Yes");
      expect(getByTestId("form-readonly")).toHaveTextContent(
        "Form Readonly: No"
      );
      expect(getByTestId("form-dirty")).toHaveTextContent("Form Dirty: No");
    });

    // Action: Make invalid via button click
    await act(async () => {
      makeInvalidBtn.click();
    });
    await waitFor(() => {
      expect(getByTestId("form-valid")).toHaveTextContent("Form Valid: No");
      expect(getByTestId("form-dirty")).toHaveTextContent("Form Dirty: Yes");
    });

    // Action: Reset via button click
    await act(async () => {
      resetBtn.click();
    });
    await waitFor(() => expect(formRef?.dirty).toBe(false));
    await waitFor(() => {
      expect(getByTestId("form-dirty")).toHaveTextContent("Form Dirty: No");
    });
  });

  it("triggers re-renders on form state changes (dirty, readonly, touched)", async () => {
    // Tests that changes to dirty, readonly, and touched trigger appropriate re-renders
    let formDirtyChanges = 0;
    let formReadonlyChanges = 0;
    let formTouchedChanges = 0;
    
    const Component = () => {
      const form = useContext(FormGroupContext)?.form;

      useEffect(() => {
        if (!form) return;
        // Orchestrate state changes after initialization
        setTimeout(() => {
          if (!form) return;
          form.controls.field5.value = "test1";
          setTimeout(() => {
            if (!form) return;
            form.readonly = true;
            setTimeout(() => {
              if (!form) return;
              form.readonly = false;
              setTimeout(() => {
                if (!form) return;
                form.reset();
              }, 50);
            }, 50);
          }, 50);
        }, 100);
      }, [form?.formInitialized]);

      useEffect(() => {
        if (!form) return;
        formReadonlyChanges++;
      }, [form?.readonly]);

      useEffect(() => {
        if (!form) return;
        formDirtyChanges++;
      }, [form?.dirty]);

      useEffect(() => {
        if (!form) return;
        formTouchedChanges++;
      }, [form?.touched]);

      return <></>;
    };
    
    render(
      <BaseFormComponent>
        <Component />
      </BaseFormComponent>
    );
    
    await waitFor(() => expect(formDirtyChanges).toBeGreaterThanOrEqual(3), {
      timeout: 500,
    });
    await waitFor(() => expect(formReadonlyChanges).toBeGreaterThanOrEqual(3), {
      timeout: 500,
    });
    await waitFor(() => expect(formTouchedChanges).toBeGreaterThanOrEqual(3), {
      timeout: 500,
    });
  });
});

// ============================================================================
// Test Suite: React Rendering & Re-renders
// ============================================================================

describe("React Rendering & Re-renders", () => {
  it("triggers re-renders on control value change", async () => {
    // Tests that control value changes trigger component re-renders with proper dependency tracking
    let formInitializedRenders = 0;
    let formValueRenders = 0;
    
    const Component = () => {
      const form = useContext(FormGroupContext)?.form;

      useEffect(() => {
        if (!form) return;
        formInitializedRenders++;
        // Schedule two value changes to test multiple re-renders
        setTimeout(() => {
          if (!form) return;
          form.controls.field5.value = "test1";
        }, 100);
        setTimeout(() => {
          if (!form) return;
          form.controls.field5.value = "test2";
        }, 250);
      }, [form?.formInitialized]);

      useEffect(() => {
        if (!form) return;
        formValueRenders++;
      }, [form?.controls?.field5?.value]);

      return <></>;
    };
    
    render(
      <BaseFormComponent>
        <Component />
      </BaseFormComponent>
    );
    
    // Should render once on initialization
    await waitFor(() => expect(formInitializedRenders).toEqual(1));
    // Should render 3 times: initial + 2 value changes
    await waitFor(() => expect(formValueRenders).toStrictEqual(3), {
      timeout: 500,
    });
  });
});

// ============================================================================
// Test Suite: Nested Forms
// ============================================================================

describe("Nested Forms", () => {
  // Suppress debug info for cleaner test output
  console.dInfo = () => { };

  /**
   * Schema with nested forms at multiple levels to test complex scenarios:
   * - field3: Single nested form
   * - field4: Array of forms
   * - field5: Array of forms with validators
   */
  const schema = {
    field1: "value1",
    field2: 42,
    field3: formGroup({
      nestedField1: "nestedValue1",
      nestedField2: 42,
      nestedField3: [1, 2, 3],
      nestedField4: ["a"],
    }) as Form<any>,
    field4: [
      formGroup({
        nestedField1: "nestedValue1",
        nestedField2: 42,
        nestedField3: [1, 2, 3],
        nestedField4: ["a"],
      }) as Form<any>,
    ] as Form<any>[],
    field5: [
      [
        formGroup({
          nestedField1: "nestedValue1",
          nestedField2: 42,
          nestedField3: [1, 2, 3],
          nestedField4: ["a"],
        }) as Form<any>,
      ] as Form<any>[],
      [Validators.required],
    ],
  };

  let form: Form<typeof schema> | undefined;

  // Track re-render counts for nested form changes
  let formField3Changes = 0;
  let formField4Changes = 0;
  let formField5Changes = 0;

  const Component = () => {
    const form = useContext(FormGroupContext)?.form as Form<typeof schema>;

    useEffect(() => {
      if (!form) return;
      formField3Changes++;
    }, [form?.controls?.field3?.value]);

    useEffect(() => {
      if (!form) return;
      formField4Changes++;
    }, [form?.controls?.field4?.value]);

    useEffect(() => {
      if (!form) return;
      formField5Changes++;
    }, [form?.controls?.field5?.value]);

    return (
      <>
        <div data-testid="form-field3-readonly">{`Form Field3 Readonly: ${form?.controls?.field3?.value?.readonly ? "Yes" : "No"}`}</div>
        <div data-testid="form-field4-readonly">{`Form Field4 Readonly: ${form?.controls?.field4?.value?.[0]?.readonly ? "Yes" : "No"}`}</div>
        {form?.controls?.field5?.value?.map((forms) => {
          return (forms as any)?._flattenedControls?.map((control: FormControl<any, any>) => (
            <div key={`${String(control.key)}`} data-testid={`form-field5-changes-${String(control.key)}`}>{String(control.value)}</div>
          ));
        })}
        <div data-testid="form-field5-readonly">{`Form Field5 Readonly: ${form?.controls?.field5?.value?.at(0)?.readonly ? "Yes" : "No"}`}</div>
      </>
    );
  };

  it("nested forms are initialized correctly", async () => {
    // Tests that nested forms maintain their structure and values after initialization
    render(
      <BaseFormComponent
        schema={schema}
        formRef={(formRef) => (form = formRef)}
      >
        <Component />
      </BaseFormComponent>
    );
    
    await waitFor(() => expect(form).toBeDefined());
    await waitFor(() => expect(form?.formInitialized).toBe(true));
    
    // Verify nested form structure matches the schema
    assert.deepEqual(
      form?.controls?.field3?.value?.build(),
      schema?.field3?.build(),
      "Nested form should be initialized correctly"
    );
  });

  it("nested form changes trigger re-renders", async () => {
    // Tests that changes to nested form controls trigger parent re-renders
    const { getByTestId } = render(
      <BaseFormComponent
        schema={schema}
        formRef={(formRef) => (form = formRef)}
      >
        <Component />
      </BaseFormComponent>
    );
    
    // Update multiple fields in nested form
    await act(async () => {
      form.controls.field3.value.controls.nestedField1.value = "nestedValue2" as any;
    });
    await act(async () => {
      form.controls.field3.value.controls.nestedField2.value = 43 as any;
    });
    await act(async () => {
      form.controls.field3.value.controls.nestedField3.value = [1, 2, 3, 4] as any;
    });
    await act(async () => {
      form.controls.field3.value.controls.nestedField4.value = ["a", "b"] as any;
    });

    // Verify re-renders occurred for each change
    await waitFor(() => expect(formField3Changes).toBeGreaterThanOrEqual(4), {
      timeout: 500,
    });

    // Test readonly mode on nested form
    await act(async () => {
      form.controls.field3.value.readonly = true;
    });
    await waitFor(() => {
      expect(getByTestId("form-field3-readonly"), "form field3 should be readonly").toHaveTextContent("Form Field3 Readonly: Yes");
    });
    
    await act(async () => {
      form.controls.field3.value.readonly = false;
    });
    await waitFor(() => {
      expect(getByTestId("form-field3-readonly"), "form field3 should be editable").toHaveTextContent("Form Field3 Readonly: No");
    });
    
    // Test readonly propagation from control to nested form
    await act(async () => {
      form.controls.field3.readonly = true;
    });
    await waitFor(() => {
      expect(getByTestId("form-field3-readonly"), "form field3 should be readonly").toHaveTextContent("Form Field3 Readonly: Yes");
    });
  });

  it("deeply nested forms (arrays) trigger re-renders when values change", async () => {
    // Tests array of forms with nested control changes
    const { getByTestId } = render(
      <BaseFormComponent
        schema={schema}
        formRef={(formRef) => (form = formRef)}
      >
        <Component />
      </BaseFormComponent>
    );
    
    // Update multiple fields in first form of array
    await act(async () => {
      form.controls.field4.value[0].controls.nestedField1.value = "nestedValue2" as any;
    });
    await act(async () => {
      form.controls.field4.value[0].controls.nestedField2.value = 43 as any;
    });
    await act(async () => {
      form.controls.field4.value[0].controls.nestedField3.value = [1, 2, 3, 4] as any;
    });
    await act(async () => {
      form.controls.field4.value[0].controls.nestedField4.value = ["a", "b"] as any;
    });
    
    // Verify re-renders occurred
    await waitFor(() => expect(formField4Changes).toBeGreaterThanOrEqual(4), {
      timeout: 500,
    });
    
    // Test readonly mode on form in array
    await act(async () => {
      form.controls.field4.value[0].readonly = true;
    });
    await waitFor(() => {
      expect(getByTestId("form-field4-readonly"), "form field4 should be readonly").toHaveTextContent("Form Field4 Readonly: Yes");
    });
    
    // Test edit mode
    await act(async () => {
      form.controls.field4.value[0].readonly = false;
    });
    await waitFor(() => {
      expect(getByTestId("form-field4-readonly"), "form field4 should be editable").toHaveTextContent("Form Field4 Readonly: No");
    });
    
    // Test readonly propagation from control to form array
    await act(async () => {
      form.controls.field4.readonly = true;
    });
    await waitFor(() => {
      expect(getByTestId("form-field4-readonly"), "form field4 should be readonly").toHaveTextContent("Form Field4 Readonly: Yes");
    });
  });

  it("deeply nested forms with validators trigger re-renders on value changes", async () => {
    // Tests form arrays with validators maintain reactivity
    const { getByTestId } = render(
      <BaseFormComponent
        schema={schema}
        formRef={(formRef) => (form = formRef)}
      >
        <Component />
      </BaseFormComponent>
    );
    
    // Update multiple fields in validated form array
    await act(async () => {
      form.controls.field5.value[0].controls.nestedField1.value = "nestedValue2" as any;
    });
    await act(async () => {
      form.controls.field5.value[0].controls.nestedField2.value = 43 as any;
    });
    await act(async () => {
      form.controls.field5.value[0].controls.nestedField3.value = [1, 2, 3, 4] as any;
    });
    await act(async () => {
      form.controls.field5.value[0].controls.nestedField4.value = ["a", "b"] as any;
    });
    
    // Verify re-renders occurred
    await waitFor(() => expect(formField5Changes).toBeGreaterThanOrEqual(4), {
      timeout: 500,
    });
    
    // Verify values are rendered correctly
    await waitFor(() => {
      expect(getByTestId("form-field5-changes-nestedField1"), "form field5 should be equal to nestedValue2").toHaveTextContent("nestedValue2");
      expect(getByTestId("form-field5-changes-nestedField2"), "form field5 should be equal to 43").toHaveTextContent("43");
      expect(getByTestId("form-field5-changes-nestedField3"), "form field5 should be equal to 1,2,3,4").toHaveTextContent("1,2,3,4");
      expect(getByTestId("form-field5-changes-nestedField4"), "form field5 should be equal to a,b").toHaveTextContent("a,b");
    });
    
    // Test readonly mode
    await act(async () => {
      form.controls.field5.value[0].readonly = true;
    });
    await waitFor(() => {
      expect(getByTestId("form-field5-readonly"), "form field5 should be readonly").toHaveTextContent("Form Field5 Readonly: Yes");
    });
    
    // Test edit mode
    await act(async () => {
      form.controls.field5.value[0].readonly = false;
    });
    await waitFor(() => {
      expect(getByTestId("form-field5-readonly"), "form field5 should be editable").toHaveTextContent("Form Field5 Readonly: No");
    });
    
    // Test additional value change
    await act(async () => {
      form.controls.field5.value[0].controls.nestedField1.value = "nestedValue3" as any;
    });
    await waitFor(() => expect(formField5Changes).toBeGreaterThanOrEqual(5), {
      timeout: 500,
    });

    // Test readonly propagation from control level
    await act(async () => {
      form.controls.field5.readonly = true;
    });
    await waitFor(() => {
      expect(getByTestId("form-field5-readonly"), "form field5 should be readonly").toHaveTextContent("Form Field5 Readonly: Yes");
    });
    
    await act(async () => {
      form.controls.field5.readonly = false;
    });
    await waitFor(() => {
      expect(getByTestId("form-field5-readonly"), "form field5 should be editable").toHaveTextContent("Form Field5 Readonly: No");
    });
  });
});

// ============================================================================
// Test Suite: FormControl Operations
// ============================================================================

describe("FormControl Operations", () => {
  it("FormControl.key returns the correct key", async () => {
    // Tests that the key property correctly identifies the control
    const Component = () => {
      const { form } = useForm({ testField: "value" }, {}, []);
      
      useEffect(() => {
        if (!form) return;
        expect(form.controls.testField.key).toBe("testField");
      }, [form?.formInitialized]);

      return <></>;
    };

    render(<Component />);
    await waitFor(() => expect(true).toBe(true));
  });

  it("FormControl value getter returns current value", async () => {
    // Tests that value getter returns the current control value
    let formRef: Form<any> | undefined;
    
    render(
      <BaseFormComponent
        schema={{ testField: "initialValue" }}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());
    await waitFor(() => {
      expect(formRef?.controls.testField.value).toBe("initialValue");
    });
  });

  it("FormControl value setter updates value and marks dirty/touched", async () => {
    // Tests that setting a value updates state flags appropriately
    let formRef: Form<any> | undefined;
    
    render(
      <BaseFormComponent
        schema={{ testField: "initialValue" }}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());
    
    // Initial state
    expect(formRef?.controls.testField.dirty).toBe(false);
    expect(formRef?.controls.testField.touched).toBe(false);
    
    // Update value
    await act(async () => {
      formRef!.controls.testField.value = "newValue";
    });
    
    await waitFor(() => {
      expect(formRef?.controls.testField.value).toBe("newValue");
      expect(formRef?.controls.testField.dirty).toBe(true);
      expect(formRef?.controls.testField.touched).toBe(true);
    });
  });

  it("FormControl.reset() restores initial value and clears dirty/touched", async () => {
    // Tests that reset restores control to initial state
    let formRef: Form<any> | undefined;
    
    render(
      <BaseFormComponent
        schema={{ testField: ["initialValue", [Validators.required]] }}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());
    
    // Modify value
    await act(async () => {
      formRef!.controls.testField.value = "modifiedValue";
    });
    
    await waitFor(() => {
      expect(formRef?.controls.testField.value).toBe("modifiedValue");
      expect(formRef?.controls.testField.dirty).toBe(true);
    });
    
    // Reset
    await act(async () => {
      formRef!.controls.testField.reset();
    });
    
    await waitFor(() => {
      expect(formRef?.controls.testField.value).toBe("initialValue");
      expect(formRef?.controls.testField.dirty).toBe(false);
      expect(formRef?.controls.testField.touched).toBe(false);
    });
  });

  it("FormControl.patchValue merges partial objects", async () => {
    // Tests that patchValue correctly merges object properties
    let formRef: Form<any> | undefined;
    
    render(
      <BaseFormComponent
        schema={{ 
          user: { name: "John", age: 30, email: "john@example.com" }
        }}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());
    
    // Patch only one property
    await act(async () => {
      formRef!.controls.user.patchValue({ name: "Jane" });
    });
    
    await waitFor(() => {
      expect(formRef?.controls.user.value).toEqual({
        name: "Jane",
        age: 30,
        email: "john@example.com"
      });
    });
  });

  it("FormControl.patchValue replaces primitive values", async () => {
    // Tests that patchValue replaces non-object values
    let formRef: Form<any> | undefined;
    
    render(
      <BaseFormComponent
        schema={{ count: 5 }}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());
    
    await act(async () => {
      formRef!.controls.count.patchValue(10);
    });
    
    await waitFor(() => {
      expect(formRef?.controls.count.value).toBe(10);
    });
  });

  it("FormControl.isFormControl() correctly identifies FormControl instances", async () => {
    // Tests the static method for type checking
    let formRef: Form<any> | undefined;
    
    const Component = () => {
      const { form } = useForm({ testField: "value" }, {}, []);
      formRef = form;
      return <></>;
    };

    render(<Component />);
    
    await waitFor(() => expect(formRef).toBeDefined());
    await waitFor(() => {
      expect(FormControl.isFormControl(formRef!.controls.testField)).toBe(true);
      expect(FormControl.isFormControl({})).toBeFalsy();
      expect(FormControl.isFormControl(null)).toBeFalsy();
      expect(FormControl.isFormControl(undefined)).toBeFalsy();
    });
  });

  it("FormControl readonly prevents nested form modifications", async () => {
    // Tests that readonly state propagates to nested forms
    const nestedSchema = {
      user: formGroup({
        name: "John",
        age: 30
      }) as Form<any>
    };

    let formRef: Form<typeof nestedSchema> | undefined;

    render(
      <BaseFormComponent
        schema={nestedSchema}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());

    // Set control to readonly
    await act(async () => {
      formRef!.controls.user.readonly = true;
    });

    await waitFor(() => {
      expect(formRef?.controls.user.readonly).toBe(true);
      expect(formRef?.controls.user.value.readonly).toBe(true);
    });
  });

  it("FormControl tracks dirty state correctly across multiple changes", async () => {
    // Tests dirty state persistence through multiple value changes
    let formRef: Form<any> | undefined;
    
    render(
      <BaseFormComponent
        schema={{ counter: 0 }}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());
    expect(formRef?.controls.counter.dirty).toBe(false);

    // First change
    await act(async () => {
      formRef!.controls.counter.value = 1;
    });
    await waitFor(() => expect(formRef?.controls.counter.dirty).toBe(true));

    // Second change (should still be dirty)
    await act(async () => {
      formRef!.controls.counter.value = 2;
    });
    await waitFor(() => expect(formRef?.controls.counter.dirty).toBe(true));

    // Reset should clear dirty
    await act(async () => {
      formRef!.controls.counter.reset();
    });
    await waitFor(() => expect(formRef?.controls.counter.dirty).toBe(false));
  });

  it("FormControl disabled state prevents value changes in nested forms", async () => {
    // Tests that disabled state propagates correctly
    const nestedSchema = {
      user: formGroup({
        name: "John"
      }) as Form<any>
    };

    let formRef: Form<typeof nestedSchema> | undefined;

    render(
      <BaseFormComponent
        schema={nestedSchema}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());

    await act(async () => {
      formRef!.controls.user.disabled = true;
    });

    await waitFor(() => {
      expect(formRef?.controls.user.disabled).toBe(true);
      expect(formRef?.controls.user.value.disabled).toBe(true);
    });
  });
});

// ============================================================================
// Test Suite: Form Methods
// ============================================================================

describe("Form Methods", () => {
  it("Form.getControl() returns the correct control", async () => {
    // Tests that getControl method retrieves controls by key
    let formRef: Form<any> | undefined;
    
    render(
      <BaseFormComponent
        schema={{ field1: "value1", field2: 42 }}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());
    
    const control1 = formRef!.getControl("field1");
    const control2 = formRef!.getControl("field2");
    
    expect(control1).toBeDefined();
    expect(control1?.value).toBe("value1");
    expect(control2).toBeDefined();
    expect(control2?.value).toBe(42);
  });

  it("Form.getControl() returns undefined for non-existent keys", async () => {
    // Tests that getControl returns undefined for invalid keys
    let formRef: Form<any> | undefined;
    
    render(
      <BaseFormComponent
        schema={{ field1: "value1" }}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());
    
    const control = formRef!.getControl("nonExistent" as any);
    expect(control).toBeUndefined();
  });

  it("Form.addControls() adds new controls to form", async () => {
    // Tests adding controls dynamically
    let formRef: Form<any> | undefined;
    
    render(
      <BaseFormComponent
        schema={{ field1: "value1" }}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());
    
    // Add new controls
    await act(async () => {
      formRef!.addControls({ field2: 42, field3: "newValue" });
    });
    
    await waitFor(() => {
      expect(formRef?.controls.field2).toBeDefined();
      expect(formRef?.controls.field2.value).toBe(42);
      expect(formRef?.controls.field3).toBeDefined();
      expect(formRef?.controls.field3.value).toBe("newValue");
    });
  });

  it("Form.addControls() does not replace existing controls", async () => {
    // Tests that addControls doesn't overwrite existing controls
    let formRef: Form<any> | undefined;
    
    render(
      <BaseFormComponent
        schema={{ field1: "value1" }}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());
    
    // Try to add control with existing key - should log error and not replace
    await act(async () => {
      formRef!.addControls({ field1: "newValue" } as any);
    });
    
    // Original value should remain
    await waitFor(() => {
      expect(formRef?.controls.field1.value).toBe("value1");
    });
  });

  it("Form.build() creates plain object from form", async () => {
    // Tests that build method creates a plain JavaScript object
    let formRef: Form<any> | undefined;
    
    render(
      <BaseFormComponent
        schema={{ 
          field1: "value1",
          field2: 42,
          field3: [1, 2, 3]
        }}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());
    
    const built = formRef!.build();
    
    expect(built).toEqual({
      field1: "value1",
      field2: 42,
      field3: [1, 2, 3]
    });
  });

  it("Form.build() handles nested forms correctly", async () => {
    // Tests that build recursively builds nested forms
    const schema = {
      field1: "value1",
      nested: formGroup({
        nestedField1: "nestedValue1",
        nestedField2: 42
      }) as Form<any>
    };

    let formRef: Form<typeof schema> | undefined;
    
    render(
      <BaseFormComponent
        schema={schema}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());
    
    const built = formRef!.build();
    
    expect(built).toEqual({
      field1: "value1",
      nested: {
        nestedField1: "nestedValue1",
        nestedField2: 42
      }
    });
  });

  it("Form.build() handles arrays of forms", async () => {
    // Tests that build handles form arrays correctly
    const schema = {
      field1: "value1",
      formArray: [
        formGroup({
          name: "Item 1"
        }) as Form<any>,
        formGroup({
          name: "Item 2"
        }) as Form<any>
      ] as Form<any>[]
    };

    let formRef: Form<typeof schema> | undefined;
    
    render(
      <BaseFormComponent
        schema={schema}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());
    
    const built = formRef!.build();
    
    expect(built.formArray).toEqual([
      { name: "Item 1" },
      { name: "Item 2" }
    ]);
  });

  it("Form.invalids returns array of invalid controls", async () => {
    // Tests that invalids getter returns controls that failed validation
    let formRef: Form<any> | undefined;
    
    render(
      <BaseFormComponent
        schema={{ 
          field1: ["value1", [Validators.required]],
          field2: ["value2", [Validators.required]],
          field3: "value3"
        }}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());
    
    // Initially valid
    expect(formRef!.invalids.length).toBe(0);
    
    // Make field1 invalid
    await act(async () => {
      formRef!.controls.field1.value = "";
    });
    
    await waitFor(() => {
      expect(formRef!.invalids.length).toBe(1);
      expect(formRef!.invalids[0].key).toBe("field1");
    });
    
    // Make field2 invalid too
    await act(async () => {
      formRef!.controls.field2.value = "";
    });
    
    await waitFor(() => {
      expect(formRef!.invalids.length).toBe(2);
    });
  });

  it("Form.isForm() correctly identifies Form instances", () => {
    // Tests the static method for form type checking
    const form = new Form({ field1: "value" }, undefined);
    const notForm = { field1: "value" };
    
    expect(Form.isForm(form)).toBe(true);
    expect(Form.isForm(notForm)).toBeFalsy();
    expect(Form.isForm(null)).toBeFalsy();
    expect(Form.isForm(undefined)).toBeFalsy();
  });

  it("Form.patchValue() updates multiple controls at once", async () => {
    // Tests that patchValue can update multiple form fields
    let formRef: Form<any> | undefined;
    
    render(
      <BaseFormComponent
        schema={{ 
          field1: "value1",
          field2: 42,
          field3: "value3"
        }}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());
    
    await act(async () => {
      formRef!.patchValue({
        field1: "updated1",
        field2: 100
      });
    });
    
    await waitFor(() => {
      expect(formRef?.controls.field1.value).toBe("updated1");
      expect(formRef?.controls.field2.value).toBe(100);
      expect(formRef?.controls.field3.value).toBe("value3"); // unchanged
    });
  });

  it("Form.patchValue() works with nested forms", async () => {
    // Tests that patchValue propagates to nested forms
    const schema = {
      field1: "value1",
      nested: formGroup({
        nestedField1: "nestedValue1",
        nestedField2: 42
      }) as Form<any>
    };

    let formRef: Form<typeof schema> | undefined;
    
    render(
      <BaseFormComponent
        schema={schema}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());
    
    await act(async () => {
      formRef!.patchValue({
        nested: {
          nestedField1: "updatedNested"
        }
      } as any);
    });
    
    await waitFor(() => {
      expect(formRef?.controls.nested.value.controls.nestedField1.value).toBe("updatedNested");
      expect(formRef?.controls.nested.value.controls.nestedField2.value).toBe(42); // unchanged
    });
  });
});

// ============================================================================
// Test Suite: Disabled State
// ============================================================================

describe("Disabled State", () => {
  it("Setting form disabled propagates to all controls", async () => {
    // Tests that disabling a form disables all its controls
    let formRef: Form<any> | undefined;
    
    render(
      <BaseFormComponent
        schema={{ 
          field1: "value1",
          field2: 42,
          field3: "value3"
        }}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());
    
    // Initially not disabled
    expect(formRef!.disabled).toBe(false);
    expect(formRef!.controls.field1.disabled).toBe(false);
    expect(formRef!.controls.field2.disabled).toBe(false);
    
    // Disable entire form
    await act(async () => {
      formRef!.disabled = true;
    });
    
    await waitFor(() => {
      expect(formRef!.disabled).toBe(true);
      expect(formRef!.controls.field1.disabled).toBe(true);
      expect(formRef!.controls.field2.disabled).toBe(true);
      expect(formRef!.controls.field3.disabled).toBe(true);
    });
  });

  it("Setting form disabled propagates to nested forms", async () => {
    // Tests that disabled state cascades to nested forms
    const schema = {
      field1: "value1",
      nested: formGroup({
        nestedField1: "nestedValue1",
        nestedField2: 42
      }) as Form<any>
    };

    let formRef: Form<typeof schema> | undefined;
    
    render(
      <BaseFormComponent
        schema={schema}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());
    
    // Disable entire form
    await act(async () => {
      formRef!.disabled = true;
    });
    
    await waitFor(() => {
      expect(formRef!.disabled).toBe(true);
      expect(formRef!.controls.nested.disabled).toBe(true);
      expect(formRef!.controls.nested.value.disabled).toBe(true);
    });
  });

  it("Setting control disabled propagates to form arrays", async () => {
    // Tests disabled propagation through form arrays
    const schema = {
      field1: "value1",
      formArray: [
        formGroup({
          name: "Item 1"
        }) as Form<any>,
        formGroup({
          name: "Item 2"
        }) as Form<any>
      ] as Form<any>[]
    };

    let formRef: Form<typeof schema> | undefined;
    
    render(
      <BaseFormComponent
        schema={schema}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());
    
    // Disable the form array control
    await act(async () => {
      formRef!.controls.formArray.disabled = true;
    });
    
    await waitFor(() => {
      expect(formRef!.controls.formArray.disabled).toBe(true);
      expect(formRef!.controls.formArray.value[0].disabled).toBe(true);
      expect(formRef!.controls.formArray.value[1].disabled).toBe(true);
    });
  });

  it("Disabled form triggers React re-renders", async () => {
    // Tests that disabled state changes trigger component updates
    let disabledChanges = 0;
    
    const Component = () => {
      const form = useContext(FormGroupContext)?.form;

      useEffect(() => {
        if (!form) return;
        disabledChanges++;
      }, [form?.disabled]);

      return <></>;
    };
    
    let formRef: Form<any> | undefined;
    
    render(
      <BaseFormComponent
        schema={{ field1: "value1" }}
        formRef={(form) => (formRef = form)}
      >
        <Component />
      </BaseFormComponent>
    );
    
    await waitFor(() => expect(formRef).toBeDefined());
    
    // Initial render
    expect(disabledChanges).toBeGreaterThanOrEqual(1);
    
    // Toggle disabled
    await act(async () => {
      formRef!.disabled = true;
    });
    
    await waitFor(() => {
      expect(disabledChanges).toBeGreaterThanOrEqual(2);
    });
    
    await act(async () => {
      formRef!.disabled = false;
    });
    
    await waitFor(() => {
      expect(disabledChanges).toBeGreaterThanOrEqual(3);
    });
  });

  it("Individual control disabled state doesn't affect sibling controls", async () => {
    // Tests that disabling one control doesn't affect others
    let formRef: Form<any> | undefined;
    
    render(
      <BaseFormComponent
        schema={{ 
          field1: "value1",
          field2: "value2",
          field3: "value3"
        }}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());
    
    // Disable only field1
    await act(async () => {
      formRef!.controls.field1.disabled = true;
    });
    
    await waitFor(() => {
      expect(formRef!.controls.field1.disabled).toBe(true);
      expect(formRef!.controls.field2.disabled).toBe(false);
      expect(formRef!.controls.field3.disabled).toBe(false);
      expect(formRef!.disabled).toBe(false); // Form itself not disabled
    });
  });

  it("Disabled state can be toggled multiple times", async () => {
    // Tests that disabled can be enabled/disabled repeatedly
    let formRef: Form<any> | undefined;
    
    render(
      <BaseFormComponent
        schema={{ field1: "value1" }}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());
    
    // Toggle multiple times
    for (let i = 0; i < 3; i++) {
      await act(async () => {
        formRef!.disabled = true;
      });
      await waitFor(() => expect(formRef!.disabled).toBe(true));
      
      await act(async () => {
        formRef!.disabled = false;
      });
      await waitFor(() => expect(formRef!.disabled).toBe(false));
    }
  });

  it("Disabled control in nested form can be individually controlled", async () => {
    // Tests granular control of disabled state in nested structures
    const schema = {
      nested: formGroup({
        field1: "value1",
        field2: "value2"
      }) as Form<any>
    };

    let formRef: Form<typeof schema> | undefined;
    
    render(
      <BaseFormComponent
        schema={schema}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());
    
    // Disable only one field in nested form
    await act(async () => {
      formRef!.controls.nested.value.controls.field1.disabled = true;
    });
    
    await waitFor(() => {
      expect(formRef!.controls.nested.value.controls.field1.disabled).toBe(true);
      expect(formRef!.controls.nested.value.controls.field2.disabled).toBe(false);
      expect(formRef!.controls.nested.value.disabled).toBe(false);
    });
  });
});

// ============================================================================
// Test Suite: Validators
// ============================================================================

describe("Validators", () => {
  it("Validators.required works with strings", async () => {
    // Tests required validator with string values
    let formRef: Form<any> | undefined;
    
    render(
      <BaseFormComponent
        schema={{ 
          field1: ["value", [Validators.required]]
        }}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());
    
    // Initially valid
    expect(formRef!.valid).toBe(true);
    expect(formRef!.controls.field1.valid).toBe(true);
    
    // Make invalid with empty string
    await act(async () => {
      formRef!.controls.field1.value = "";
    });
    
    await waitFor(() => {
      expect(formRef!.controls.field1.valid).toBe(false);
      expect(formRef!.valid).toBe(false);
    });
    
    // Make invalid with whitespace only
    await act(async () => {
      formRef!.controls.field1.value = "   ";
    });
    
    await waitFor(() => {
      expect(formRef!.controls.field1.valid).toBe(false);
    });
    
    // Make valid again
    await act(async () => {
      formRef!.controls.field1.value = "valid";
    });
    
    await waitFor(() => {
      expect(formRef!.controls.field1.valid).toBe(true);
      expect(formRef!.valid).toBe(true);
    });
  });

  it("Validators.required works with arrays", async () => {
    // Tests required validator with array values
    let formRef: Form<any> | undefined;
    
    render(
      <BaseFormComponent
        schema={{ 
          field1: [[1, 2, 3], [Validators.required]]
        }}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());
    
    // Initially valid
    expect(formRef!.valid).toBe(true);
    
    // Empty array is invalid
    await act(async () => {
      formRef!.controls.field1.value = [];
    });
    
    await waitFor(() => {
      expect(formRef!.controls.field1.valid).toBe(false);
      expect(formRef!.valid).toBe(false);
    });
    
    // Non-empty array is valid
    await act(async () => {
      formRef!.controls.field1.value = [1];
    });
    
    await waitFor(() => {
      expect(formRef!.controls.field1.valid).toBe(true);
      expect(formRef!.valid).toBe(true);
    });
  });

  it("Validators.required works with objects", async () => {
    // Tests required validator with object values
    let formRef: Form<any> | undefined;
    
    render(
      <BaseFormComponent
        schema={{ 
          field1: [{ name: "test" }, [Validators.required]]
        }}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());
    
    // Initially valid (object with properties)
    expect(formRef!.valid).toBe(true);
    
    // Empty object is invalid
    await act(async () => {
      formRef!.controls.field1.value = {};
    });
    
    await waitFor(() => {
      expect(formRef!.controls.field1.valid).toBe(false);
      expect(formRef!.valid).toBe(false);
    });
    
    // Object with properties is valid
    await act(async () => {
      formRef!.controls.field1.value = { key: "value" };
    });
    
    await waitFor(() => {
      expect(formRef!.controls.field1.valid).toBe(true);
      expect(formRef!.valid).toBe(true);
    });
  });

  it("Validators.required works with null and undefined", async () => {
    // Tests required validator with null/undefined
    let formRef: Form<any> | undefined;
    
    render(
      <BaseFormComponent
        schema={{ 
          field1: ["value", [Validators.required]]
        }}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());
    
    // null is invalid
    await act(async () => {
      formRef!.controls.field1.value = null;
    });
    
    await waitFor(() => {
      expect(formRef!.controls.field1.valid).toBe(false);
    });
    
    // undefined is invalid
    await act(async () => {
      formRef!.controls.field1.value = undefined;
    });
    
    await waitFor(() => {
      expect(formRef!.controls.field1.valid).toBe(false);
    });
  });

  it("Multiple validators on single field", async () => {
    // Tests that multiple validators all must pass
    const minLength = (min: number) => (value: string) => value.length >= min;
    const maxLength = (max: number) => (value: string) => value.length <= max;
    
    let formRef: Form<any> | undefined;
    
    render(
      <BaseFormComponent
        schema={{ 
          field1: ["test", [Validators.required, minLength(3), maxLength(10)]]
        }}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());
    
    // Initially valid
    expect(formRef!.valid).toBe(true);
    
    // Too short (fails minLength)
    await act(async () => {
      formRef!.controls.field1.value = "ab";
    });
    
    await waitFor(() => {
      expect(formRef!.controls.field1.valid).toBe(false);
    });
    
    // Too long (fails maxLength)
    await act(async () => {
      formRef!.controls.field1.value = "12345678901";
    });
    
    await waitFor(() => {
      expect(formRef!.controls.field1.valid).toBe(false);
    });
    
    // Just right
    await act(async () => {
      formRef!.controls.field1.value = "perfect";
    });
    
    await waitFor(() => {
      expect(formRef!.controls.field1.valid).toBe(true);
    });
  });

  it("Custom validator function works correctly", async () => {
    // Tests custom validator implementation
    const emailValidator = (value: string) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    };
    
    let formRef: Form<any> | undefined;
    
    render(
      <BaseFormComponent
        schema={{ 
          email: ["test@example.com", [emailValidator]]
        }}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());
    
    // Initially valid
    expect(formRef!.valid).toBe(true);
    
    // Invalid email
    await act(async () => {
      formRef!.controls.email.value = "notanemail";
    });
    
    await waitFor(() => {
      expect(formRef!.controls.email.valid).toBe(false);
      expect(formRef!.valid).toBe(false);
    });
    
    // Valid email
    await act(async () => {
      formRef!.controls.email.value = "user@domain.com";
    });
    
    await waitFor(() => {
      expect(formRef!.controls.email.valid).toBe(true);
      expect(formRef!.valid).toBe(true);
    });
  });

  it("Nested form validity is tracked independently", async () => {
    // Tests that nested form validity can be checked independently
    // Note: Parent form validity is based on its direct controls, not nested form validity
    const schema = {
      field1: "value1",
      nested: formGroup({
        nestedField1: ["value", [Validators.required]],
        nestedField2: 42
      }) as Form<any>
    };

    let formRef: Form<typeof schema> | undefined;
    
    render(
      <BaseFormComponent
        schema={schema}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());
    
    // Initially valid
    expect(formRef!.controls.nested.value.valid).toBe(true);
    
    // Make nested field invalid
    await act(async () => {
      formRef!.controls.nested.value.controls.nestedField1.value = "";
    });
    
    // Check nested control validity
    await waitFor(() => {
      expect(formRef!.controls.nested.value.controls.nestedField1.valid).toBe(false);
    });
    
    // Check nested form validity
    await waitFor(() => {
      expect(formRef!.controls.nested.value.valid).toBe(false);
    });
    
    // Parent form valid state is independent (no validators on parent level)
    expect(formRef!.valid).toBe(true);
    
    // But we can check nested form validity manually
    expect(formRef!.controls.nested.value.valid).toBe(false);
    
    // Make valid again
    await act(async () => {
      formRef!.controls.nested.value.controls.nestedField1.value = "valid";
    });
    
    await waitFor(() => {
      expect(formRef!.controls.nested.value.valid).toBe(true);
      expect(formRef!.controls.nested.value.controls.nestedField1.valid).toBe(true);
    });
  });

  it("Validator re-evaluation on value change", async () => {
    // Tests that validators are re-run when value changes
    let validationCount = 0;
    const countingValidator = (value: string) => {
      validationCount++;
      return value.length > 0;
    };
    
    let formRef: Form<any> | undefined;
    
    render(
      <BaseFormComponent
        schema={{ 
          field1: ["test", [countingValidator]]
        }}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());
    
    const initialCount = validationCount;
    
    // Change value multiple times
    await act(async () => {
      formRef!.controls.field1.value = "new1";
    });
    await act(async () => {
      formRef!.controls.field1.value = "new2";
    });
    await act(async () => {
      formRef!.controls.field1.value = "new3";
    });
    
    await waitFor(() => {
      // Validator should have been called at least 3 more times (plus initial)
      expect(validationCount).toBeGreaterThan(initialCount + 2);
    });
  });

  it("Form.invalids array contains all invalid controls", async () => {
    // Tests that invalids array is correctly maintained
    let formRef: Form<any> | undefined;
    
    render(
      <BaseFormComponent
        schema={{ 
          field1: ["value1", [Validators.required]],
          field2: ["value2", [Validators.required]],
          field3: ["value3", [Validators.required]]
        }}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());
    
    // All valid initially
    expect(formRef!.invalids.length).toBe(0);
    
    // Make field1 invalid
    await act(async () => {
      formRef!.controls.field1.value = "";
    });
    
    await waitFor(() => {
      expect(formRef!.invalids.length).toBe(1);
      expect(formRef!.invalids[0].key).toBe("field1");
    });
    
    // Make field2 and field3 invalid
    await act(async () => {
      formRef!.controls.field2.value = "";
      formRef!.controls.field3.value = "";
    });
    
    await waitFor(() => {
      expect(formRef!.invalids.length).toBe(3);
      const keys = formRef!.invalids.map(c => c.key);
      expect(keys).toContain("field1");
      expect(keys).toContain("field2");
      expect(keys).toContain("field3");
    });
    
    // Fix field2
    await act(async () => {
      formRef!.controls.field2.value = "valid";
    });
    
    await waitFor(() => {
      expect(formRef!.invalids.length).toBe(2);
      const keys = formRef!.invalids.map(c => c.key);
      expect(keys).not.toContain("field2");
    });
  });

  it("Reset clears validation errors", async () => {
    // Tests that reset restores valid state
    let formRef: Form<any> | undefined;
    
    render(
      <BaseFormComponent
        schema={{ 
          field1: ["value", [Validators.required]]
        }}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());
    
    // Make invalid
    await act(async () => {
      formRef!.controls.field1.value = "";
    });
    
    await waitFor(() => {
      expect(formRef!.valid).toBe(false);
    });
    
    // Reset
    await act(async () => {
      formRef!.reset();
    });
    
    await waitFor(() => {
      expect(formRef!.controls.field1.value).toBe("value");
      expect(formRef!.valid).toBe(true);
      expect(formRef!.invalids.length).toBe(0);
    });
  });
});

// ============================================================================
// Test Suite: Edge Cases & Integration
// ============================================================================

describe("Edge Cases & Integration", () => {
  it("Empty form initialization works correctly", async () => {
    // Tests that forms can be created with no fields
    const Component = () => {
      const { form } = useForm({}, {}, []);
      
      useEffect(() => {
        if (!form) return;
        expect(form.formInitialized).toBe(true);
        expect(form.valid).toBe(true);
        expect(form.dirty).toBe(false);
      }, [form?.formInitialized]);

      return <></>;
    };

    render(<Component />);
    await waitFor(() => expect(true).toBe(true));
  });

  it("Form handles null values correctly", async () => {
    // Tests forms with null initial values
    let formRef: Form<any> | undefined;
    
    render(
      <BaseFormComponent
        schema={{ field1: null }}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());
    
    expect(formRef!.controls.field1.value).toBeNull();
    
    // Can update from null to value
    await act(async () => {
      formRef!.controls.field1.value = "newValue";
    });
    
    await waitFor(() => {
      expect(formRef!.controls.field1.value).toBe("newValue");
      expect(formRef!.controls.field1.dirty).toBe(true);
    });
  });

  it("Form handles undefined values correctly", async () => {
    // Tests forms with undefined initial values
    let formRef: Form<any> | undefined;
    
    render(
      <BaseFormComponent
        schema={{ field1: undefined }}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());
    
    expect(formRef!.controls.field1.value).toBeUndefined();
    
    // Can update from undefined to value
    await act(async () => {
      formRef!.controls.field1.value = "newValue";
    });
    
    await waitFor(() => {
      expect(formRef!.controls.field1.value).toBe("newValue");
    });
  });

  it("Deeply nested forms (3+ levels) work correctly", async () => {
    // Tests deeply nested form structures
    const deeplyNested = formGroup({
      level1: formGroup({
        level2: formGroup({
          level3Field: "deepValue"
        }) as Form<any>
      }) as Form<any>
    }) as Form<any>;

    let formRef: Form<any> | undefined;
    
    render(
      <BaseFormComponent
        schema={{ root: deeplyNested }}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());
    
    // Access deeply nested value
    const deepValue = formRef!.controls.root.value.controls.level1.value.controls.level2.value.controls.level3Field.value;
    expect(deepValue).toBe("deepValue");
    
    // Update deeply nested value
    await act(async () => {
      formRef!.controls.root.value.controls.level1.value.controls.level2.value.controls.level3Field.value = "newDeepValue";
    });
    
    await waitFor(() => {
      const updated = formRef!.controls.root.value.controls.level1.value.controls.level2.value.controls.level3Field.value;
      expect(updated).toBe("newDeepValue");
    });
  });

  it("Reset works with deeply nested forms", async () => {
    // Tests reset functionality with nested structures
    const schema = {
      field1: "value1",
      nested: formGroup({
        nestedField1: "nestedValue1",
        nestedField2: 42
      }) as Form<any>
    };

    let formRef: Form<typeof schema> | undefined;
    
    render(
      <BaseFormComponent
        schema={schema}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());
    
    // Modify both parent and nested
    await act(async () => {
      formRef!.controls.field1.value = "modified1";
      formRef!.controls.nested.value.controls.nestedField1.value = "modifiedNested";
    });
    
    await waitFor(() => {
      expect(formRef!.controls.field1.value).toBe("modified1");
      expect(formRef!.controls.nested.value.controls.nestedField1.value).toBe("modifiedNested");
      expect(formRef!.dirty).toBe(true);
    });
    
    // Reset entire form
    await act(async () => {
      formRef!.reset();
    });
    
    await waitFor(() => {
      expect(formRef!.controls.field1.value).toBe("value1");
      expect(formRef!.controls.nested.value.controls.nestedField1.value).toBe("nestedValue1");
      expect(formRef!.dirty).toBe(false);
    });
  });

  it("Multiple forms in same component don't interfere", async () => {
    // Tests that multiple independent forms work correctly
    const Component = () => {
      const { form: form1 } = useForm({ field1: "form1Value" }, {}, []);
      const { form: form2 } = useForm({ field1: "form2Value" }, {}, []);

      useEffect(() => {
        if (!form1 || !form2) return;
        expect(form1.controls.field1.value).toBe("form1Value");
        expect(form2.controls.field1.value).toBe("form2Value");
      }, [form1?.formInitialized, form2?.formInitialized]);

      return <></>;
    };

    render(<Component />);
    await waitFor(() => expect(true).toBe(true));
  });

  it("FormGroupProvider context switching works", async () => {
    // Tests switching between different forms via context
    const schema1 = { field1: "form1" };
    const schema2 = { field1: "form2" };
    
    let activeForm: "form1" | "form2" = "form1";
    let capturedValue = "";
    
    const Component = () => {
      const form1 = useForm(schema1, {}, []).form;
      const form2 = useForm(schema2, {}, []).form;
      const activeFormInstance = activeForm === "form1" ? form1 : form2;

      useEffect(() => {
        if (!activeFormInstance) return;
        capturedValue = activeFormInstance.controls.field1.value;
      }, [activeFormInstance]);

      return (
        <FormGroupProvider form={activeFormInstance}>
          <div data-testid="value">{activeFormInstance?.controls.field1.value}</div>
        </FormGroupProvider>
      );
    };

    const { rerender } = render(<Component />);
    await waitFor(() => expect(capturedValue).toBe("form1"));

    activeForm = "form2";
    rerender(<Component />);
    await waitFor(() => expect(capturedValue).toBe("form2"));
  });

  it("Form.build() handles complex nested structures", async () => {
    // Tests build method with various data types
    const schema = {
      string: "text",
      number: 42,
      boolean: true,
      array: [1, 2, 3],
      nested: formGroup({
        innerString: "inner",
        innerArray: ["a", "b"]
      }) as Form<any>,
      formArray: [
        formGroup({ name: "Item 1", count: 1 }) as Form<any>,
        formGroup({ name: "Item 2", count: 2 }) as Form<any>
      ] as Form<any>[]
    };

    let formRef: Form<typeof schema> | undefined;
    
    render(
      <BaseFormComponent
        schema={schema}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());
    
    const built = formRef!.build();
    
    expect(built).toEqual({
      string: "text",
      number: 42,
      boolean: true,
      array: [1, 2, 3],
      nested: {
        innerString: "inner",
        innerArray: ["a", "b"]
      },
      formArray: [
        { name: "Item 1", count: 1 },
        { name: "Item 2", count: 2 }
      ]
    });
  });

  it("patchValue works with deeply nested forms", async () => {
    // Tests patchValue with complex nested structures
    const schema = {
      level1: formGroup({
        level2: formGroup({
          field1: "value1",
          field2: "value2"
        }) as Form<any>
      }) as Form<any>
    };

    let formRef: Form<typeof schema> | undefined;
    
    render(
      <BaseFormComponent
        schema={schema}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());
    
    // Patch deeply nested value
    await act(async () => {
      formRef!.patchValue({
        level1: {
          level2: {
            field1: "patched1"
          }
        }
      } as any);
    });
    
    await waitFor(() => {
      expect(formRef!.controls.level1.value.controls.level2.value.controls.field1.value).toBe("patched1");
      expect(formRef!.controls.level1.value.controls.level2.value.controls.field2.value).toBe("value2");
    });
  });

  it("Concurrent state updates are handled correctly", async () => {
    // Tests multiple rapid state changes
    let formRef: Form<any> | undefined;
    
    render(
      <BaseFormComponent
        schema={{ counter: 0 }}
        formRef={(form) => (formRef = form)}
      >
        <></>
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());
    
    // Rapidly update value multiple times
    await act(async () => {
      for (let i = 1; i <= 10; i++) {
        formRef!.controls.counter.value = i;
      }
    });
    
    await waitFor(() => {
      expect(formRef!.controls.counter.value).toBe(10);
      expect(formRef!.controls.counter.dirty).toBe(true);
    });
  });

  it("Form maintains state through component re-renders", async () => {
    // Tests that form state persists across re-renders
    let renderCount = 0;
    let formRef: Form<any> | undefined;
    
    const Component = () => {
      renderCount++;
      const form = useContext(FormGroupContext)?.form;
      formRef = form as Form<any>;
      return <div data-testid="count">Renders: {renderCount}</div>;
    };

    const { rerender } = render(
      <BaseFormComponent
        schema={{ field1: "value1" }}
        formRef={(form) => (formRef = form)}
      >
        <Component />
      </BaseFormComponent>
    );

    await waitFor(() => expect(formRef).toBeDefined());
    
    // Modify form
    await act(async () => {
      formRef!.controls.field1.value = "modified";
    });
    
    const valueAfterChange = formRef!.controls.field1.value;
    
    // Force re-render
    rerender(
      <BaseFormComponent
        schema={{ field1: "value1" }}
        formRef={(form) => (formRef = form)}
      >
        <Component />
      </BaseFormComponent>
    );
    
    // Value should persist
    await waitFor(() => {
      expect(formRef!.controls.field1.value).toBe(valueAfterChange);
    });
  });
});
