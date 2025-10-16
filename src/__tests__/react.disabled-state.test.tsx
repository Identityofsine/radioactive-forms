/**
 * React Disabled State Test Suite
 * 
 * Tests disabled state propagation and behavior across forms,
 * controls, and nested structures.
 */

import { useContext, useEffect } from "react";
import { describe, expect, it } from "vitest";
import { render, waitFor, act } from "@testing-library/react";
import { FormGroupContext } from "../react/context/FormGroup";
import { Form } from "../form";
import { formGroup } from "../form/functional";
import { BaseFormComponent } from "../test/react-test-utils";

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

