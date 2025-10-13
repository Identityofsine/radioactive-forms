import {
  ReactElement,
  ReactNode,
  useContext,
  useEffect,
} from "react";
import { describe, expect, expectTypeOf, it } from "vitest";
import { render, waitFor, act } from "@testing-library/react";
import { useForm } from "../react/use-form-hook";
import {
  FormGroupContext,
  FormGroupProvider,
} from "../react/context/FormGroup";
import { Form, Validators } from "../form";

const BASE_SCHEMA = {
  field1: "value1",
  field2: 42,
  field3: [1, 2, 3],
  field4: [1, 2],
  field5: ["a"],
};

const ReactiveForm = (
  TestComponent: () => ReactElement<any, any>,
  setForm: (form: Form<any>) => void,
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
    </BaseFormComponent>,
  );

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

it("React useForm infers arrays and nested forms correctly (compile-time only)", () => {
  const schema = {
    field1: "v1",
    field2: 2,
    field3: [1, 2, 3] as number[],
    field4: [1, 2] as number[],
    field5: ["a"] as string[],
  };

  const Component = () => {
    const { form } = useForm(schema, {}, []);
    if (!form) return <></>; // runtime guard not relevant for types; keeps TS happy for value access

    expectTypeOf(form.controls.field1.value).toEqualTypeOf<string>();
    expectTypeOf(form.controls.field2.value).toEqualTypeOf<number>();
    expectTypeOf(form.controls.field3.value).toEqualTypeOf<number[]>();
    expectTypeOf(form.controls.field4.value).toEqualTypeOf<number[]>();
    expectTypeOf(form.controls.field5.value).toEqualTypeOf<string[]>();

    return (<></>)
  }

  render(<Component />);

});

// Boilerplate test cases for React usage (hook + context)
describe("React integration - useForm and FormGroupProvider", () => {
  it("reacts to direct control value changes (no DOM indirection)", async () => {
    let formRef: Form<typeof BASE_SCHEMA> | undefined;
    const TestComponent = () => {
      const form = useContext(FormGroupContext)?.form;
      // capture the form instance for test access
      formRef = form as Form<typeof BASE_SCHEMA>;

      return (
        <>
          <div data-testid="field5">Field5: {form?.controls.field5.value as any}</div>
          <div data-testid="form-valid">Form Valid: {form?.valid ? "Yes" : "No"}</div>
          <div data-testid="form-dirty">Form Dirty: {form?.dirty ? "Yes" : "No"}</div>
        </>
      );
    };

    const { getByTestId } = ReactiveForm(TestComponent, (form) => {
      formRef = form as Form<typeof BASE_SCHEMA>;
    });

    // initialized
    await waitFor(() => expect(formRef).toBeDefined());
    await waitFor(() => expect(formRef?.formInitialized).toBe(true));

    await waitFor(() => {
      expect(getByTestId("form-valid")).toHaveTextContent("Form Valid: Yes");
      expect(getByTestId("form-dirty")).toHaveTextContent("Form Dirty: No");
      expect(getByTestId("field5")).toHaveTextContent("Field5: a");
    });

    // Make invalid by clearing required field directly via control
    await act(async () => {
      (formRef as Form<typeof BASE_SCHEMA>).controls.field5.value = "" as any;
    });

    await waitFor(() => {
      expect(getByTestId("form-valid")).toHaveTextContent("Form Valid: No");
      expect(getByTestId("form-dirty")).toHaveTextContent("Form Dirty: Yes");
      expect(getByTestId("field5")).toHaveTextContent(/^Field5:\s*$/);
    });

    // Restore to valid directly via control
    await act(async () => {
      (formRef as Form<typeof BASE_SCHEMA>).controls.field5.value = "restored" as any;
    });

    await waitFor(() => {
      expect(getByTestId("field5")).toHaveTextContent("Field5: restored");
    });

    // Reset form
    await act(async () => {
      (formRef as Form<typeof BASE_SCHEMA>).reset();
    });

    await waitFor(() => {
      expect(getByTestId("form-dirty")).toHaveTextContent("Form Dirty: No");
      expect(getByTestId("field5")).toHaveTextContent("Field5: a");
    });
    await waitFor(() => expect((formRef as Form<typeof BASE_SCHEMA>).dirty).toBe(false));
  });
  it("creates a form instance via useForm and provides via context", async () => {
    let formRef: Form<typeof BASE_SCHEMA> | undefined;
    const { getByText } = ReactiveForm(
      () => <></>,
      (form) => {
        formRef = form;
      },
    );

    await waitFor(() => expect(formRef).toBeDefined());
    await waitFor(() => expect(formRef?.formInitialized).toBe(true));

    // see if the text is rendered
    await waitFor(() =>
      expect(getByText("Form Initialized: Yes")).toBeDefined(),
    );
  });

  it("elements respond to form state changes", async () => {
    let formRef: Form<typeof BASE_SCHEMA> | undefined;
    const TestComponent = () => {
      const form = useContext(FormGroupContext)?.form;

      return (
        <>
          <div data-testid="form-valid">Form Valid: {form?.valid ? "Yes" : "No"}</div>
          <div data-testid="form-readonly">Form Readonly: {form?.readonly ? "Yes" : "No"}</div>
          <div data-testid="form-dirty">Form Dirty: {form?.dirty ? "Yes" : "No"}</div>
          <div data-actions>
            <button data-testid="make-invalid" onClick={() => {
              if (!form) return;
              form.controls.field5.value = "" as any; // make invalid
            }}>Make Invalid</button>
            <button data-testid="make-valid" onClick={() => {
              if (!form) return;
              form.controls.field5.reset(); // make valid
            }}>Make Valid</button>
            <button data-testid="reset" onClick={() => {
              if (!form) return;
              form.reset();
            }}>Reset Form</button>
          </div>
        </>
      );
    };

    const { getByTestId } = ReactiveForm(TestComponent, (form) => {
      formRef = form;
    });

    // Initial state - form should be valid
    await waitFor(() => expect(formRef).toBeDefined());
    await waitFor(() => expect(formRef?.formInitialized).toBe(true));

    // actions
    const makeInvalidBtn = getByTestId("make-invalid");
    const makeValidBtn = getByTestId("make-valid");
    const resetBtn = getByTestId("reset");
    expect(makeInvalidBtn).toBeDefined();
    expect(makeValidBtn).toBeDefined();
    expect(resetBtn).toBeDefined();


    await waitFor(() => {
      expect(getByTestId("form-valid")).toHaveTextContent("Form Valid: Yes");
      expect(getByTestId("form-readonly")).toHaveTextContent("Form Readonly: No");
      expect(getByTestId("form-dirty")).toHaveTextContent("Form Dirty: No");
    });

    // Make the form invalid by clearing required field
    await act(async () => {
      makeInvalidBtn.click();
    });
    await waitFor(() => {
      expect(getByTestId("form-valid")).toHaveTextContent("Form Valid: No");
    });
    await waitFor(() => {
      expect(getByTestId("form-dirty")).toHaveTextContent("Form Dirty: Yes");
    });

    // Reset the form
    await act(async () => {
      resetBtn.click();
    });
    await waitFor(() => expect(formRef?.dirty).toBe(false));
    await waitFor(() => {
      expect(getByTestId("form-dirty")).toHaveTextContent("Form Dirty: No");
    });
  });

  describe("react rendering and paradigm", () => {
    it("triggers re-renders on control value change", async () => {
      let formInitializedRenders = 0;
      let formValueRenders = 0;
      const Component = () => {
        const form = useContext(FormGroupContext)?.form;

        useEffect(() => {
          if (!form) return;
          formInitializedRenders++;
          setTimeout(() => {
            if (!form) return;
            form.controls.field5.value = 'test1'; // access to create dependency
          }, 100);
          setTimeout(() => {
            if (!form) return;
            form.controls.field5.value = 'test2'; // access to create dependency
          }, 250);
        }, [form?.formInitialized])

        useEffect(() => {
          if (!form) return;
          formValueRenders++;
        }, [form?.controls?.field5?.value])

        return (
          <>
          </>
        );
      }
      render(<BaseFormComponent><Component /></BaseFormComponent>)
      await waitFor(() => expect(formInitializedRenders).toEqual(1));
      await waitFor(() => expect(formValueRenders).toStrictEqual(3), { timeout: 500 });
    });
  });

  it("triggers re-renders on form state change", async () => {
    let formDirtyChanges = 0;
    let formReadonlyChanges = 0;
    let formTouchedChanges = 0;
    const Component = () => {
      const form = useContext(FormGroupContext)?.form;

      useEffect(() => {
        if (!form) return;
        setTimeout(() => {
          if (!form) return;
          // form should be both touched and dirty after these changes
          form.controls.field5.value = 'test1'; // access to create dependency
          setTimeout(() => {
            if (!form) return;
            form.readonly = true; // access to create dependency
            setTimeout(() => {
              if (!form) return;
              form.readonly = false; // access to create dependency
              setTimeout(() => {
                if (!form) return;
                form.reset();
              }, 50);
            }, 50);
          }, 50);
        }, 100);

      }, [form?.formInitialized])

      useEffect(() => {
        if (!form) return;
        formReadonlyChanges++;
      }, [form?.readonly])

      useEffect(() => {
        if (!form) return;
        formDirtyChanges++;
      }, [form?.dirty])

      useEffect(() => {
        if (!form) return;
        formTouchedChanges++;
      }, [form?.touched])

      return (
        <>
        </>
      );
    }
    render(<BaseFormComponent><Component /></BaseFormComponent>)
    await waitFor(() => expect(formDirtyChanges).toBeGreaterThanOrEqual(3), { timeout: 500 });
    await waitFor(() => expect(formReadonlyChanges).toBeGreaterThanOrEqual(3), { timeout: 500 });
    await waitFor(() => expect(formTouchedChanges).toBeGreaterThanOrEqual(3), { timeout: 500 });
  });

});
