/**
 * React Nested Forms Test Suite
 *
 * Tests nested form functionality including form groups,
 * arrays of forms, and deeply nested structures.
 */

import { useContext, useEffect } from "react";
import { assert, describe, expect, it } from "vitest";
import { render, waitFor, act } from "@testing-library/react";
import { FormGroupContext } from "../react/context/FormGroup";
import { Form, FormControl, Validators } from "../form";
import { formGroup } from "../form/functional";
import { BaseFormComponent } from "../test/react-test-utils";

// Suppress debug info for cleaner test output
console.dInfo = () => {};

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
  field6: [
    formGroup({
      nestedField1: "nestedValue1",
      nestedField2: 42,
      nestedField3: [1, 2, 3],
      nestedField4: ["a"],
    }) as Form<any>,
    formGroup({
      nestedField1: "nestedValue2",
      nestedField2: 43,
      nestedField3: [4, 5, 6],
      nestedField4: ["b"],
    }) as Form<any>,
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
      <div data-testid="form-field3-readonly">{`Form Field3 Readonly: ${
        form?.controls?.field3?.value?.readonly ? "Yes" : "No"
      }`}</div>
      <div data-testid="form-field4-readonly">{`Form Field4 Readonly: ${
        form?.controls?.field4?.value?.[0]?.readonly ? "Yes" : "No"
      }`}</div>
      {form?.controls?.field4?.value?.map((forms) => {
        return (forms as any)?._flattenedControls?.map(
          (control: FormControl<any, any>, idx: number) => (
            <div
              key={`${String(control.key)}`}
              data-testid={`form-field4-${String(idx)}`}
            >
              {String(control.value)}
              <div data-testid={`form-field4-changes-${String(control.key)}`}>
                {String(control.value)}
              </div>
            </div>
          )
        );
      })}
      {form?.controls?.field5?.value?.map((forms) => {
        return (forms as any)?._flattenedControls?.map(
          (control: FormControl<any, any>, idx: number) => (
            <div
              key={`${String(control.key)}`}
              data-testid={`form-field5-${String(idx)}`}
            >
              {String(control.value)}
              <div data-testid={`form-field5-changes-${String(control.key)}`}>
                {String(control.value)}
              </div>
            </div>
          )
        );
      })}
      {form?.controls?.field6?.value?.map((forms, tIdx) => {
        return (
          <div key={`form6-${tIdx}`}>
            )
            {Object.values((forms as Form<any>)?.controls)?.map(
              (control: FormControl<any, any>, idx: number) => (
                <div
                  key={`${String(control.key)}`}
                  data-testid={`form-field6-${tIdx}`}
                >
                  {String(control.value)}
                  <div
                    data-testid={`form-field6-changes-${String(control.key)}`}
                  >
                    {String(control.value)}
                  </div>
                </div>
              )
            )}
          </div>
        );
      })}
      <div data-testid="form-field5-readonly">{`Form Field5 Readonly: ${
        form?.controls?.field5?.value?.at(0)?.readonly ? "Yes" : "No"
      }`}</div>
    </>
  );
};

describe("Nested Forms", () => {
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
      form.controls.field3.value.controls.nestedField1.value =
        "nestedValue2" as any;
    });
    await act(async () => {
      form.controls.field3.value.controls.nestedField2.value = 43 as any;
    });
    await act(async () => {
      form.controls.field3.value.controls.nestedField3.value = [
        1, 2, 3, 4,
      ] as any;
    });
    await act(async () => {
      form.controls.field3.value.controls.nestedField4.value = [
        "a",
        "b",
      ] as any;
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
      expect(
        getByTestId("form-field3-readonly"),
        "form field3 should be readonly"
      ).toHaveTextContent("Form Field3 Readonly: Yes");
    });

    await act(async () => {
      form.controls.field3.value.readonly = false;
    });
    await waitFor(() => {
      expect(
        getByTestId("form-field3-readonly"),
        "form field3 should be editable"
      ).toHaveTextContent("Form Field3 Readonly: No");
    });

    // Test readonly propagation from control to nested form
    await act(async () => {
      form.controls.field3.readonly = true;
    });
    await waitFor(() => {
      expect(
        getByTestId("form-field3-readonly"),
        "form field3 should be readonly"
      ).toHaveTextContent("Form Field3 Readonly: Yes");
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
      form.controls.field4.value[0].controls.nestedField1.value =
        "nestedValue2" as any;
    });
    await act(async () => {
      form.controls.field4.value[0].controls.nestedField2.value = 43 as any;
    });
    await act(async () => {
      form.controls.field4.value[0].controls.nestedField3.value = [
        1, 2, 3, 4,
      ] as any;
    });
    await act(async () => {
      form.controls.field4.value[0].controls.nestedField4.value = [
        "a",
        "b",
      ] as any;
    });

    // Verify re-renders occurred
    await waitFor(() => expect(formField4Changes).toBeGreaterThanOrEqual(3), {
      timeout: 500,
    });

    // Test readonly mode on form in array
    await act(async () => {
      form.controls.field4.value[0].readonly = true;
    });
    await waitFor(() => {
      expect(
        getByTestId("form-field4-readonly"),
        "form field4 should be readonly"
      ).toHaveTextContent("Form Field4 Readonly: Yes");
    });

    // Test edit mode
    await act(async () => {
      form.controls.field4.value[0].readonly = false;
    });
    await waitFor(() => {
      expect(
        getByTestId("form-field4-readonly"),
        "form field4 should be editable"
      ).toHaveTextContent("Form Field4 Readonly: No");
    });

    // Test readonly propagation from control to form array
    await act(async () => {
      form.controls.field4.readonly = true;
    });
    await waitFor(() => {
      expect(
        getByTestId("form-field4-readonly"),
        "form field4 should be readonly"
      ).toHaveTextContent("Form Field4 Readonly: Yes");
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
      form.controls.field5.value[0].controls.nestedField1.value =
        "nestedValue2" as any;
    });
    await act(async () => {
      form.controls.field5.value[0].controls.nestedField2.value = 43 as any;
    });
    await act(async () => {
      form.controls.field5.value[0].controls.nestedField3.value = [
        1, 2, 3, 4,
      ] as any;
    });
    await act(async () => {
      form.controls.field5.value[0].controls.nestedField4.value = [
        "a",
        "b",
      ] as any;
    });

    // Verify re-renders occurred
    await waitFor(() => expect(formField5Changes).toBeGreaterThanOrEqual(4), {
      timeout: 500,
    });

    // Verify values are rendered correctly
    await waitFor(() => {
      expect(
        getByTestId("form-field5-changes-nestedField1"),
        "form field5 should be equal to nestedValue2"
      ).toHaveTextContent("nestedValue2");
      expect(
        getByTestId("form-field5-changes-nestedField2"),
        "form field5 should be equal to 43"
      ).toHaveTextContent("43");
      expect(
        getByTestId("form-field5-changes-nestedField3"),
        "form field5 should be equal to 1,2,3,4"
      ).toHaveTextContent("1,2,3,4");
      expect(
        getByTestId("form-field5-changes-nestedField4"),
        "form field5 should be equal to a,b"
      ).toHaveTextContent("a,b");
    });

    // Test readonly mode
    await act(async () => {
      form.controls.field5.value[0].readonly = true;
    });
    await waitFor(() => {
      expect(
        getByTestId("form-field5-readonly"),
        "form field5 should be readonly"
      ).toHaveTextContent("Form Field5 Readonly: Yes");
    });

    // Test edit mode
    await act(async () => {
      form.controls.field5.value[0].readonly = false;
    });
    await waitFor(() => {
      expect(
        getByTestId("form-field5-readonly"),
        "form field5 should be editable"
      ).toHaveTextContent("Form Field5 Readonly: No");
    });

    // Test additional value change
    await act(async () => {
      form.controls.field5.value[0].controls.nestedField1.value =
        "nestedValue3" as any;
    });
    await waitFor(() => expect(formField5Changes).toBeGreaterThanOrEqual(4), {
      timeout: 500,
    });

    // Test readonly propagation from control level
    await act(async () => {
      form.controls.field5.readonly = true;
    });
    await waitFor(() => {
      expect(
        getByTestId("form-field5-readonly"),
        "form field5 should be readonly"
      ).toHaveTextContent("Form Field5 Readonly: Yes");
    });

    await act(async () => {
      form.controls.field5.readonly = false;
    });
    await waitFor(() => {
      expect(
        getByTestId("form-field5-readonly"),
        "form field5 should be editable"
      ).toHaveTextContent("Form Field5 Readonly: No");
    });
  });

  it("multi-level nested forms should be initialized correctly", async () => {
    const { getByTestId } = render(
      <BaseFormComponent
        schema={schema}
        formRef={(formRef) => (form = formRef)}
      >
        <Component />
      </BaseFormComponent>
    );

    await waitFor(() =>
      expect(form, "CRITICAL: Form should be initialized").toBeDefined()
    );
    await waitFor(() =>
      expect(
        form?.formInitialized,
        "CRITICAL: Form should be initialized"
      ).toBe(true)
    );
  });

  it("deeply nested forms should delete correctly", async () => {
    const { getByTestId, queryByTestId } = render(
      <BaseFormComponent
        schema={schema}
        formRef={(formRef) => (form = formRef)}
      >
        <Component />
      </BaseFormComponent>
    );

    let initialLength = form?.controls?.field6.value?.length || 0;
    for (let i = 0; i < form?.controls?.field6.value?.length; i++) {
      await act(async () => {
        form?.controls?.field6.value?.splice(
          form?.controls?.field6.value?.length - 1,
          1
        );
      });
      await waitFor(() => {
        const expectedIdx = initialLength - i - 1;
        expect(form?.controls?.field6.value?.length).toBe(expectedIdx);
        expect(
          !queryByTestId(`form6-${expectedIdx}`),
          "form field6 should be deleted"
        );
      });
    }
  });
});
