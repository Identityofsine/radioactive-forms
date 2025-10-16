/**
 * React Validators Test Suite
 * 
 * Tests validator functionality including built-in validators,
 * custom validators, and validation state management.
 */

import { describe, expect, it } from "vitest";
import { render, waitFor, act } from "@testing-library/react";
import { Form, Validators } from "../form";
import { formGroup } from "../form/functional";
import { BaseFormComponent } from "../test/react-test-utils";

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

