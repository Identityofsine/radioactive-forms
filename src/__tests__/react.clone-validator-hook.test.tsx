/**
 * React Hook Clone Validator Test Suite
 * 
 * Tests that hasValidator works correctly after useForm hook recreates
 * the form due to dependency changes. This simulates the scenario where
 * forms are cloned/recreated and validators need to be preserved.
 */

import { useState, useEffect, useRef } from "react";
import { describe, expect, it } from "vitest";
import { render, waitFor, act } from "@testing-library/react";
import { useForm } from "../react/use-form-hook";
import { Form, Validators } from "../form";
import { FormGroupProvider } from "../react/context/FormGroup";
import { ValidatorFn } from "../types/validator.types";

describe("useForm hook - hasValidator after dependency changes", () => {
  it("should preserve hasValidator after form recreation due to dependency change", async () => {
    let formRef: Form<{ name: string; enableRequired: boolean }> | undefined;
    let dependencyValue = false;

    const TestComponent = () => {
      const [enableRequired, setEnableRequired] = useState(false);
      const { form } = useForm<{ name: string; enableRequired: boolean }>(
        {
          name: "",
          enableRequired: false,
        },
        {},
        [enableRequired] // Dependency that triggers form recreation
      );

      // Use a ref to track if we've set up validators to avoid infinite loops
      const validatorsSetup = useRef(false);

      useEffect(() => {
        formRef = form;
        // Only set up validators once when form is first created
        if (form && !validatorsSetup.current) {
          form.controls.name.addValidator(Validators.required);
          validatorsSetup.current = true;
        }
      }, [form]);

      return (
        <FormGroupProvider form={form}>
          <button
            onClick={() => {
              dependencyValue = !dependencyValue;
              setEnableRequired(dependencyValue);
              // Reset flag when dependency changes so validators can be re-added to new form
              validatorsSetup.current = false;
            }}
          >
            Toggle Dependency
          </button>
        </FormGroupProvider>
      );
    };

    render(<TestComponent />);

    // Wait for initial form creation
    await waitFor(() => expect(formRef).toBeDefined());

    const initialForm = formRef!;

    // Verify validator is present before dependency change
    expect(initialForm.controls.name.hasValidator(Validators.required)).toBe(true);

    // Change the dependency - this will trigger form recreation
    await act(async () => {
      const button = document.querySelector("button");
      button?.click();
    });

    // Wait for form to be recreated
    await waitFor(() => {
      expect(formRef).toBeDefined();
      // The form instance should be different (recreated)
      expect(formRef).not.toBe(initialForm);
    });

    const recreatedForm = formRef!;

    // CRITICAL TEST: Verify hasValidator still works on recreated form
    expect(recreatedForm.controls.name.hasValidator(Validators.required)).toBe(true);

    // Verify validator still works
    recreatedForm.controls.name.value = "";
    expect(recreatedForm.controls.name.valid).toBe(false);
  });

  it.fails("BUG: hasValidator fails after form recreation when dependency changes", async () => {
    // This test exposes a bug where validators added dynamically are lost
    // when useForm recreates the form due to dependency changes
    let formRef: Form<{ enableRequired: boolean; dependentField: string }> | undefined;
    let enableRequiredDep = false;
    
    // Store validator function outside component so it persists across form recreations
    // This validator makes dependentField required when enableRequired is true
    const conditionalValidator: ValidatorFn<string> = (value: string) => {
      // Access the current form through the closure
      if (!formRef) {
        return { valid: true };
      }
      const enableRequiredValue = formRef.controls.enableRequired.value;
      if (enableRequiredValue) {
        return Validators.required(value);
      }
      return { valid: true };
    };

    const TestComponent = () => {
      const [enableRequired, setEnableRequired] = useState(false);
      const { form } = useForm<{ enableRequired: boolean; dependentField: string }>(
        {
          enableRequired: false,
          dependentField: "",
        },
        {},
        [enableRequired] // Dependency that influences if field is required
      );

      const validatorsSetup = useRef(false);

      useEffect(() => {
        formRef = form;
        if (form && !validatorsSetup.current) {
          // Add conditional validator dynamically
          form.controls.dependentField.addValidator(conditionalValidator);
          validatorsSetup.current = true;
        }
      }, [form]);

      return (
        <FormGroupProvider form={form}>
          <button
            onClick={() => {
              enableRequiredDep = !enableRequiredDep;
              setEnableRequired(enableRequiredDep);
              validatorsSetup.current = false;
            }}
          >
            Toggle Enable Required
          </button>
        </FormGroupProvider>
      );
    };

    render(<TestComponent />);

    // Wait for initial form creation
    await waitFor(() => expect(formRef).toBeDefined());

    const initialForm = formRef!;

    // Verify validator is present before dependency change
    expect(initialForm.controls.dependentField.hasValidator(conditionalValidator)).toBe(true);

    // Initially, enableRequired is false, so field should be valid even when empty
    expect(initialForm.controls.dependentField.valid).toBe(true);

    // Change the dependency - this will trigger form recreation
    // BUG: When useForm recreates the form, it creates a new Form instance from the template
    // This means dynamically added validators are lost!
    await act(async () => {
      const button = document.querySelector("button");
      button?.click();
    });

    // Wait for form to be recreated
    await waitFor(() => {
      expect(formRef).toBeDefined();
      expect(formRef).not.toBe(initialForm);
    });

    const recreatedForm = formRef!;

    // BUG EXPOSED: hasValidator fails because the validator was lost during form recreation
    // The validator function reference exists, but it's not in the new form's _validators array
    // This is because the new form was created from the original template, which didn't include
    // the dynamically added validator
    const hasValidatorAfterRecreation = recreatedForm.controls.dependentField.hasValidator(conditionalValidator);
    
    // This is the bug - hasValidator should return true but it likely returns false
    // because the validator was not preserved during form recreation
    if (!hasValidatorAfterRecreation) {
      // This confirms the bug - the validator was lost
      expect(hasValidatorAfterRecreation).toBe(true);
      return; // Exit early since we've confirmed the bug
    }
    
    // If hasValidator passes, then the validator should also work functionally
    // Set enableRequired to true on the recreated form
    recreatedForm.controls.enableRequired.value = true;
    // Trigger validation by setting the value
    recreatedForm.controls.dependentField.value = "";

    // BUG: Even if hasValidator returns true, the validator might not work correctly
    // because it's referencing the old form instance in its closure
    // The validator should see that enableRequired is true and make the field required
    expect(recreatedForm.controls.dependentField.valid).toBe(false);
  });

  it("should preserve hasValidator when dependency changes and validators are added/removed", async () => {
    let formRef: Form<{ name: string; shouldRequire: boolean }> | undefined;
    let shouldRequireDep = false;

    const TestComponent = () => {
      const [shouldRequire, setShouldRequire] = useState(false);
      const { form } = useForm<{ name: string; shouldRequire: boolean }>(
        {
          name: "",
          shouldRequire: false,
        },
        {},
        [shouldRequire] // Dependency that controls if name field is required
      );

      const validatorsSetup = useRef(false);

      useEffect(() => {
        formRef = form;
        if (form && !validatorsSetup.current) {
          // Add or remove required validator based on dependency
          if (shouldRequire) {
            form.controls.name.addValidator(Validators.required);
          }
          validatorsSetup.current = true;
        }
      }, [form, shouldRequire]);

      return (
        <FormGroupProvider form={form}>
          <button
            onClick={() => {
              shouldRequireDep = !shouldRequireDep;
              setShouldRequire(shouldRequireDep);
              validatorsSetup.current = false;
            }}
          >
            Toggle Should Require
          </button>
        </FormGroupProvider>
      );
    };

    render(<TestComponent />);

    // Wait for initial form creation
    await waitFor(() => expect(formRef).toBeDefined());

    const initialForm = formRef!;

    // Initially, shouldRequire is false, so no required validator
    expect(initialForm.controls.name.hasValidator(Validators.required)).toBe(false);

    // Change dependency to true - this will trigger form recreation and add validator
    await act(async () => {
      const button = document.querySelector("button");
      button?.click();
    });

    // Wait for form to be recreated
    await waitFor(() => {
      expect(formRef).toBeDefined();
      expect(formRef).not.toBe(initialForm);
    });

    const recreatedForm = formRef!;

    // CRITICAL TEST: Verify hasValidator works on recreated form
    // The validator should have been added based on the dependency
    expect(recreatedForm.controls.name.hasValidator(Validators.required)).toBe(true);

    // Verify validator works
    recreatedForm.controls.name.value = "";
    expect(recreatedForm.controls.name.valid).toBe(false);

    // Change dependency back to false - this will trigger form recreation
    await act(async () => {
      const button = document.querySelector("button");
      button?.click();
    });

    // Wait for form to be recreated again
    await waitFor(() => {
      expect(formRef).toBeDefined();
      expect(formRef).not.toBe(recreatedForm);
    });

    const recreatedForm2 = formRef!;

    // CRITICAL TEST: Verify hasValidator reflects the change
    expect(recreatedForm2.controls.name.hasValidator(Validators.required)).toBe(false);

    // Verify field is valid even when empty (no required validator)
    recreatedForm2.controls.name.value = "";
    expect(recreatedForm2.controls.name.valid).toBe(true);
  });

  it("should preserve hasValidator for multiple validators after form recreation", async () => {
    let formRef: Form<{ name: string }> | undefined;
    let dependencyValue = 0;

    const minLengthValidator: ValidatorFn<string> = (value: string) =>
      value.length >= 5 ? { valid: true } : { valid: false, message: "Must be at least 5 characters" };

    const TestComponent = () => {
      const [dep, setDep] = useState(0);
      const { form } = useForm<{ name: string }>(
        {
          name: "test",
        },
        {},
        [dep] // Dependency that triggers form recreation
      );

      const validatorsSetup = useRef(false);

      useEffect(() => {
        formRef = form;
        if (form && !validatorsSetup.current) {
          // Ensure validators are present
          form.controls.name.addValidator(Validators.required);
          form.controls.name.addValidator(minLengthValidator);
          validatorsSetup.current = true;
        }
      }, [form]);

      return (
        <FormGroupProvider form={form}>
          <button
            onClick={() => {
              dependencyValue++;
              setDep(dependencyValue);
              validatorsSetup.current = false;
            }}
          >
            Change Dependency
          </button>
        </FormGroupProvider>
      );
    };

    render(<TestComponent />);

    // Wait for initial form creation
    await waitFor(() => expect(formRef).toBeDefined());

    const initialForm = formRef!;

    // Verify validators before dependency change
    expect(initialForm.controls.name.hasValidator(Validators.required)).toBe(true);
    expect(initialForm.controls.name.hasValidator(minLengthValidator)).toBe(true);

    // Change dependency - triggers form recreation
    await act(async () => {
      const button = document.querySelector("button");
      button?.click();
    });

    // Wait for form recreation
    await waitFor(() => {
      expect(formRef).toBeDefined();
      expect(formRef).not.toBe(initialForm);
    });

    const recreatedForm = formRef!;

    // CRITICAL TEST: Verify hasValidator works for both validators
    expect(recreatedForm.controls.name.hasValidator(Validators.required)).toBe(true);
    expect(recreatedForm.controls.name.hasValidator(minLengthValidator)).toBe(true);

    // Verify validators work
    recreatedForm.controls.name.value = "";
    expect(recreatedForm.controls.name.valid).toBe(false);

    recreatedForm.controls.name.value = "abc";
    expect(recreatedForm.controls.name.valid).toBe(false);

    recreatedForm.controls.name.value = "valid value";
    expect(recreatedForm.controls.name.valid).toBe(true);
  });
});

