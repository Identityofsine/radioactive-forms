/**
 * React Form Methods Test Suite
 * 
 * Tests Form methods including build(), getControl(), addControls(),
 * patchValue(), and other form-level operations.
 */

import { describe, expect, it } from "vitest";
import { render, waitFor, act } from "@testing-library/react";
import { Form, Validators } from "../form";
import { formGroup } from "../form/functional";
import { BaseFormComponent } from "../test/react-test-utils";

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

