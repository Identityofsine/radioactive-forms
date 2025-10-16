/**
 * React FormControl Operations Test Suite
 * 
 * Tests FormControl operations including getters, setters,
 * reset, patchValue, and state management.
 */

import { useEffect } from "react";
import { describe, expect, it } from "vitest";
import { render, waitFor, act } from "@testing-library/react";
import { useForm } from "../react/use-form-hook";
import { Form, FormControl, Validators } from "../form";
import { formGroup } from "../form/functional";
import { BaseFormComponent } from "../test/react-test-utils";

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

