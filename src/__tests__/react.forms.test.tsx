/**
 * React Forms Test Suite
 * 
 * Tests basic form initialization, type safety, state reactivity,
 * and React rendering behavior.
 */

import { useContext, useEffect } from "react";
import { describe, expect, expectTypeOf, it } from "vitest";
import { render, waitFor, act } from "@testing-library/react";
import { useForm } from "../react/use-form-hook";
import { FormGroupContext } from "../react/context/FormGroup";
import { Form } from "../form";
import { formGroup } from "../form/functional";
import { BASE_SCHEMA, BaseFormComponent, ReactiveForm } from "../test/react-test-utils";

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

  it("initializes useForm with readOnly and does not override nested explicit readOnly", async () => {
    const schema = {
      primitive1: 0,
      // Explicit nested: should not be overridden by parent
      nestedExplicit: formGroup({ a: 1 }, { readOnly: false }),
    };

    let formRef: Form<typeof schema> | undefined;

    const Component = () => {
      const { form } = useForm(schema, { readOnly: true }, []);
      formRef = form as any;
      return <></>;
    };

    render(<Component />);

    await waitFor(() => expect(formRef).toBeDefined());
    await waitFor(() => expect(formRef?.readonly).toBe(true));

    // Parent readOnly true should not override nested explicit readOnly: false
    await waitFor(() =>
      expect((formRef as any)!.controls.nestedExplicit.value.readonly).toBe(false)
    );
  });

  it("runtime parent readonly setter overrides nested explicit readOnly (including arrays)", async () => {
    const schema = {
      primitive1: 0,
      nestedExplicitTrue: formGroup({ a: 1 }, { readOnly: true }),
      nestedExplicitFalse: formGroup({ b: 2 }, { readOnly: false }),
      mixedArray: [
        formGroup({ c: 3 }, { readOnly: true }),
        formGroup({ d: 4 }, { readOnly: false }),
      ],
    };

    let formRef: Form<typeof schema> | undefined;

    const Component = () => {
      const { form } = useForm(schema, { readOnly: false }, []);
      formRef = form as any;
      return <></>;
    };

    render(<Component />);

    await waitFor(() => expect(formRef).toBeDefined());
    await waitFor(() => expect(formRef?.readonly).toBe(false));

    // Ensure initial explicit values are present
    await waitFor(() =>
      expect((formRef as any)!.controls.nestedExplicitTrue.value.readonly).toBe(true)
    );
    await waitFor(() =>
      expect((formRef as any)!.controls.nestedExplicitFalse.value.readonly).toBe(false)
    );
    await waitFor(() =>
      expect((formRef as any)!.controls.mixedArray.value[0].readonly).toBe(true)
    );
    await waitFor(() =>
      expect((formRef as any)!.controls.mixedArray.value[1].readonly).toBe(false)
    );

    // Runtime override: parent wins everywhere
    await act(async () => {
      (formRef as any)!.readonly = true;
    });

    await waitFor(() => expect(formRef?.readonly).toBe(true));
    await waitFor(() =>
      expect((formRef as any)!.controls.nestedExplicitTrue.value.readonly).toBe(true)
    );
    await waitFor(() =>
      expect((formRef as any)!.controls.nestedExplicitFalse.value.readonly).toBe(true)
    );
    await waitFor(() =>
      expect((formRef as any)!.controls.mixedArray.value[0].readonly).toBe(true)
    );
    await waitFor(() =>
      expect((formRef as any)!.controls.mixedArray.value[1].readonly).toBe(true)
    );

    await act(async () => {
      (formRef as any)!.readonly = false;
    });

    await waitFor(() => expect(formRef?.readonly).toBe(false));
    await waitFor(() =>
      expect((formRef as any)!.controls.nestedExplicitTrue.value.readonly).toBe(false)
    );
    await waitFor(() =>
      expect((formRef as any)!.controls.nestedExplicitFalse.value.readonly).toBe(false)
    );
    await waitFor(() =>
      expect((formRef as any)!.controls.mixedArray.value[0].readonly).toBe(false)
    );
    await waitFor(() =>
      expect((formRef as any)!.controls.mixedArray.value[1].readonly).toBe(false)
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

