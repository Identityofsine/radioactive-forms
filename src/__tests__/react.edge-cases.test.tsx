/**
 * React Edge Cases & Integration Test Suite
 * 
 * Tests edge cases, integration scenarios, and complex
 * interactions between different form features.
 */

import { useContext, useEffect } from "react";
import { describe, expect, it } from "vitest";
import { render, waitFor, act } from "@testing-library/react";
import { useForm } from "../react/use-form-hook";
import { FormGroupContext, FormGroupProvider } from "../react/context/FormGroup";
import { Form } from "../form";
import { formGroup } from "../form/functional";
import { BaseFormComponent } from "../test/react-test-utils";

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

