import { assert, describe, it } from "vitest";
import { Form, Validators } from "../form";
import { formGroup } from "../form/functional";
import { ValidatorFn } from "../types/validator.types";

describe("FormControl - hasValidator after clone", () => {
  it("should preserve hasValidator functionality after cloning form with conditional validator", () => {
    // Create a form where one field's required validator depends on another field
    // This tests that hasValidator works after cloning, even when validators are conditionally applied
    const form = formGroup<{ enableRequired: boolean; dependentField: string }>({
      enableRequired: false,
      dependentField: "",
    });

    // Create a conditional validator that makes dependentField required when enableRequired is true
    // The validator function captures the form reference to check enableRequired
    const conditionalValidator: ValidatorFn<string> = (value: string) => {
      const enableRequired = form.controls.enableRequired.value;
      if (enableRequired) {
        return Validators.required(value);
      }
      return { valid: true };
    };

    // Add the conditional validator to dependentField
    form.controls.dependentField.addValidator(conditionalValidator);

    // Verify validator is present before cloning
    assert.equal(
      form.controls.dependentField.hasValidator(conditionalValidator),
      true,
      "Control should have conditional validator before cloning"
    );

    // Initially, enableRequired is false, so dependentField should be valid even when empty
    assert.equal(
      form.controls.dependentField.valid,
      true,
      "Dependent field should be valid when enableRequired is false"
    );

    // Clone the form - this is where the issue might occur
    const clonedForm = form.clone();

    // CRITICAL TEST: Verify hasValidator still works on cloned form
    // This is the main issue the user is experiencing - hasValidator should work even after cloning
    assert.equal(
      clonedForm.controls.dependentField.hasValidator(conditionalValidator),
      true,
      "Cloned control should still have conditional validator - hasValidator must work after clone()"
    );

    // Verify hasValidator works for the required validator too (if we add it conditionally)
    // First, let's test that we can check for Validators.required when it's not there
    assert.equal(
      clonedForm.controls.dependentField.hasValidator(Validators.required),
      false,
      "Cloned control should not have direct required validator (it's conditional)"
    );

    // Now test the dependency: add/remove required validator based on enableRequired
    // When enableRequired is true, add required validator
    form.controls.enableRequired.value = true;
    form.controls.dependentField.addValidator(Validators.required);

    // Verify hasValidator works after adding validator
    assert.equal(
      form.controls.dependentField.hasValidator(Validators.required),
      true,
      "Control should have required validator after adding it based on dependency"
    );

    // Clone again to test hasValidator after cloning with the new validator
    const clonedForm2 = form.clone();

    // CRITICAL TEST: Verify hasValidator works on the newly cloned form
    assert.equal(
      clonedForm2.controls.dependentField.hasValidator(Validators.required),
      true,
      "Cloned control should have required validator that was added based on dependency"
    );
    assert.equal(
      clonedForm2.controls.dependentField.hasValidator(conditionalValidator),
      true,
      "Cloned control should still have conditional validator"
    );

    // Test that the dependency influences if the field is required
    // When enableRequired is false, remove the required validator
    form.controls.enableRequired.value = false;
    form.controls.dependentField.removeValidator(Validators.required);

    assert.equal(
      form.controls.dependentField.hasValidator(Validators.required),
      false,
      "Control should not have required validator when dependency is false"
    );

    // Clone again and verify hasValidator reflects the change
    const clonedForm3 = form.clone();
    assert.equal(
      clonedForm3.controls.dependentField.hasValidator(Validators.required),
      false,
      "Cloned control should not have required validator when dependency removed it"
    );
  });

  it("should preserve hasValidator for multiple validators after cloning", () => {
    const minLengthValidator: ValidatorFn<string> = (value: string) =>
      value.length >= 5 ? { valid: true } : { valid: false, message: "Must be at least 5 characters" };

    const form = formGroup<{ name: string }>({
      name: ["test", [Validators.required, minLengthValidator]],
    });

    const control = form.controls.name;

    // Verify validators before cloning
    assert.equal(
      control.hasValidator(Validators.required),
      true,
      "Control should have required validator before cloning"
    );
    assert.equal(
      control.hasValidator(minLengthValidator),
      true,
      "Control should have minLength validator before cloning"
    );

    // Clone the form
    const clonedForm = form.clone();
    const clonedControl = clonedForm.controls.name;

    // Verify hasValidator still works for both validators after cloning
    assert.equal(
      clonedControl.hasValidator(Validators.required),
      true,
      "Cloned control should still have required validator"
    );
    assert.equal(
      clonedControl.hasValidator(minLengthValidator),
      true,
      "Cloned control should still have minLength validator"
    );

    // Verify validators still work correctly
    clonedControl.value = "";
    assert.equal(
      clonedControl.valid,
      false,
      "Cloned control should be invalid with empty value (required validator)"
    );

    clonedControl.value = "abc";
    assert.equal(
      clonedControl.valid,
      false,
      "Cloned control should be invalid with short value (minLength validator)"
    );

    clonedControl.value = "valid value";
    assert.equal(
      clonedControl.valid,
      true,
      "Cloned control should be valid with proper value"
    );
  });

  it("should preserve hasValidator after multiple clones", () => {
    const form = formGroup<{ name: string }>({
      name: ["test", [Validators.required]],
    });

    const control = form.controls.name;
    assert.equal(
      control.hasValidator(Validators.required),
      true,
      "Control should have required validator initially"
    );

    // Clone multiple times
    const clone1 = form.clone();
    const clone2 = clone1.clone();
    const clone3 = clone2.clone();

    // Verify hasValidator works on all clones
    assert.equal(
      clone1.controls.name.hasValidator(Validators.required),
      true,
      "First clone should have required validator"
    );
    assert.equal(
      clone2.controls.name.hasValidator(Validators.required),
      true,
      "Second clone should have required validator"
    );
    assert.equal(
      clone3.controls.name.hasValidator(Validators.required),
      true,
      "Third clone should have required validator"
    );

    // Verify validators still work
    clone3.controls.name.value = "";
    assert.equal(
      clone3.controls.name.valid,
      false,
      "Third clone should be invalid with empty value"
    );
  });

  it("should preserve hasValidator after cloning when validator is added dynamically", () => {
    const form = formGroup<{ name: string }>({
      name: "test",
    });

    const control = form.controls.name;
    assert.equal(
      control.hasValidator(Validators.required),
      false,
      "Control should not have required validator initially"
    );

    // Add validator dynamically
    control.addValidator(Validators.required);
    assert.equal(
      control.hasValidator(Validators.required),
      true,
      "Control should have required validator after adding"
    );

    // Clone the form
    const clonedForm = form.clone();
    const clonedControl = clonedForm.controls.name;

    // Verify hasValidator still works after cloning
    assert.equal(
      clonedControl.hasValidator(Validators.required),
      true,
      "Cloned control should still have required validator that was added dynamically"
    );

    // Verify validator still works
    clonedControl.value = "";
    assert.equal(
      clonedControl.valid,
      false,
      "Cloned control should be invalid with empty value"
    );
  });
});

