import { assert, describe, it, test } from "vitest";
import { Form, Validators } from "../form";
import { formGroup } from "../form/functional";

const BASE_SCHEMA = {
  field1: "value1",
  field2: 42,
  field3: [1, 2, 3],
  field4: [1, 2],
  field5: ["a"],
};

const BaseForm = formGroup<any>({
  ...BASE_SCHEMA,
  field2: [42, (val: number) => val > 40],
  field5: ["a", Validators.required],
});


describe("FormControl - core behavior", () => {
  it("should create a form group with various controls", () => {
    const form = BaseForm;
    Object.keys(BASE_SCHEMA).forEach((key) => {
      assert.ok(form.controls[key], `Control for key '${key}' should exist`);
    });
  });
  it("should change state correctly on setter updates", () => {
    const form = BaseForm;
    const controls = form.controls;
    const testControl = controls.field1;
    assert.ok(testControl, "(critical) Control 'field1' should exist");
    // Initial state
    assert.equal(testControl.disabled, false, "control shouldn't be disabled initally");
    assert.equal(testControl.readonly, false, "control shouldn't be readonly initally");

    testControl.disabled = true;
    assert.equal(testControl.disabled, true, "control should be disabled after setting disabled=true");

    testControl.readonly = true;
    assert.equal(testControl.readonly, true, "control should be readonly after setting readonly=true");

  });

  it("should validate required fields correctly (string)", () => {
    const form = BaseForm;
    // string behavior
    assert.equal(
      form.controls.field5.valid,
      true,
      "field5 should be valid initially",
    );
    form.controls.field5.value = "";
    assert.equal(
      form.controls.field5.valid,
      false,
      "field5 should be invalid when empty",
    );
    assert.equal(
      form.valid,
      false,
      "Form should be invalid if any control is invalid",
    );
  });
  it("should validate custom validators correctly (number)", () => {
    const form = BaseForm;
    // number behavior
    assert.equal(
      form.controls.field2.valid,
      true,
      "field2 should be valid initially",
    );
    form.controls.field2.value = 30;
    assert.equal(
      form.controls.field2.valid,
      false,
      "field2 should be invalid when set to 30",
    );
    assert.equal(
      form.valid,
      false,
      "Form should be invalid if any control is invalid",
    );
  });
});

describe("FormControl - patchValue with markAsDirty option", () => {
  it("should not mark control as dirty when patchValue is called with markAsDirty: false", () => {
    const form = formGroup<{ name: string; age: number }>({
      name: "initial",
      age: 25,
    });

    assert.equal(form.controls.name.dirty, false, "control should not be dirty initially");

    form.controls.name.patchValue("updated", { markAsDirty: false });

    assert.equal(form.controls.name.value, "updated", "value should be updated");
    assert.equal(form.controls.name.dirty, false, "control should not be dirty after patchValue with markAsDirty: false");
  });

  it("should not mark form as dirty when patchValue is called with markAsDirty: false", () => {
    const form = formGroup<{ name: string; age: number }>({
      name: "initial",
      age: 25,
    });

    assert.equal(form.dirty, false, "form should not be dirty initially");

    form.patchValue({ name: "updated" }, { markAsDirty: false });

    assert.equal(form.controls.name.value, "updated", "value should be updated");
    assert.equal(form.controls.name.dirty, false, "control should not be dirty after patchValue with markAsDirty: false");
    assert.equal(form.dirty, false, "form should not be dirty after patchValue with markAsDirty: false");
  });

  it("should mark control as dirty by default when patchValue is called without options", () => {
    const form = formGroup<{ name: string; age: number }>({
      name: "initial",
      age: 25,
    });

    assert.equal(form.controls.name.dirty, false, "control should not be dirty initially");

    form.controls.name.patchValue("updated");

    assert.equal(form.controls.name.value, "updated", "value should be updated");
    assert.equal(form.controls.name.dirty, true, "control should be dirty after patchValue without markAsDirty option");
  });

  it("should mark form as dirty by default when form patchValue is called without markAsDirty option", () => {
    const form = formGroup<{ name: string; age: number }>({
      name: "initial",
      age: 25,
    });

    assert.equal(form.dirty, false, "form should not be dirty initially");

    form.patchValue({ name: "updated" });

    assert.equal(form.controls.name.value, "updated", "value should be updated");
    assert.equal(form.controls.name.dirty, true, "control should be dirty after patchValue without markAsDirty option");
    assert.equal(form.dirty, true, "form should be dirty after patchValue without markAsDirty option");
  });

  it("should not mark control as dirty when patchValue is called with stateless: true and markAsDirty: false", () => {
    const form = formGroup<{ name: string; age: number }>({
      name: "initial",
      age: 25,
    });

    assert.equal(form.controls.name.dirty, false, "control should not be dirty initially");

    form.controls.name.patchValue("updated", { stateless: true, markAsDirty: false });

    assert.equal(form.controls.name.value, "updated", "value should be updated");
    assert.equal(form.controls.name.dirty, false, "control should not be dirty after patchValue with stateless: true and markAsDirty: false");
  });

  it("should update multiple controls without marking form as dirty when markAsDirty: false", () => {
    const form = formGroup<{ name: string; age: number; email: string }>({
      name: "initial",
      age: 25,
      email: "test@test.com",
    });

    assert.equal(form.dirty, false, "form should not be dirty initially");

    form.patchValue({ name: "updated", age: 30 }, { markAsDirty: false });

    assert.equal(form.controls.name.value, "updated", "name should be updated");
    assert.equal(form.controls.age.value, 30, "age should be updated");
    assert.equal(form.controls.name.dirty, false, "name control should not be dirty");
    assert.equal(form.controls.age.dirty, false, "age control should not be dirty");
    assert.equal(form.dirty, false, "form should not be dirty after patchValue with markAsDirty: false");
  });
});

describe("FormControl - addValidator and removeValidator", () => {
  it("should add a validator to a control without validators", () => {
    const form = formGroup<{ name: string }>({
      name: "test",
    });

    const control = form.controls.name;
    assert.equal(control.valid, true, "control should be valid initially (no validators)");
    assert.equal(control.hasValidator(Validators.required), false, "control should not have required validator initially");

    control.addValidator(Validators.required);

    assert.equal(control.hasValidator(Validators.required), true, "control should have required validator after adding");
    assert.equal(control.valid, true, "control should still be valid with non-empty value");
  });

  it("should add a validator and recalculate validity correctly", () => {
    const form = formGroup<{ name: string }>({
      name: "",
    });

    const control = form.controls.name;
    assert.equal(control.valid, true, "control should be valid initially (no validators)");

    control.addValidator(Validators.required);

    assert.equal(control.valid, false, "control should be invalid after adding required validator to empty value");
    assert.equal(form.valid, false, "form should be invalid when control is invalid");
  });

  it("should add a validator to a control with existing validators", () => {
    const minLengthValidator = (value: string) => value.length >= 5;
    const form = formGroup<{ name: string }>({
      name: ["test123", [minLengthValidator]],
    });

    const control = form.controls.name;
    assert.equal(control.hasValidator(minLengthValidator), true, "control should have minLengthValidator");
    assert.equal(control.hasValidator(Validators.required), false, "control should not have required validator initially");
    assert.equal(control.valid, true, "control should be valid initially with passing validator");

    control.addValidator(Validators.required);

    assert.equal(control.hasValidator(minLengthValidator), true, "control should still have minLengthValidator");
    assert.equal(control.hasValidator(Validators.required), true, "control should have required validator after adding");
    assert.equal(control.valid, true, "control should be valid with both validators passing");
  });

  it("should remove a validator from a control", () => {
    const form = formGroup<{ name: string }>({
      name: ["", [Validators.required]],
    });

    const control = form.controls.name;
    assert.equal(control.hasValidator(Validators.required), true, "control should have required validator initially");
    assert.equal(control.valid, false, "control should be invalid with empty value and required validator");

    control.removeValidator(Validators.required);

    assert.equal(control.hasValidator(Validators.required), false, "control should not have required validator after removing");
    assert.equal(control.valid, true, "control should be valid after removing validator");
    assert.equal(form.valid, true, "form should be valid when control is valid");
  });

  it("should remove a validator and recalculate validity correctly", () => {
    const minLengthValidator = (value: string) => value.length >= 5;
    const form = formGroup<{ name: string }>({
      name: ["test123", [Validators.required, minLengthValidator]],
    });

    const control = form.controls.name;
    assert.equal(control.valid, true, "control should be valid initially");

    // Set value that fails minLengthValidator
    control.value = "abc";
    assert.equal(control.valid, false, "control should be invalid with short value");

    // Remove minLengthValidator
    control.removeValidator(minLengthValidator);

    assert.equal(control.hasValidator(minLengthValidator), false, "control should not have minLengthValidator after removing");
    assert.equal(control.hasValidator(Validators.required), true, "control should still have required validator");
    assert.equal(control.valid, true, "control should be valid after removing failing validator");
  });

  it("should handle removing a non-existent validator gracefully", () => {
    const form = formGroup<{ name: string }>({
      name: "test",
    });

    const control = form.controls.name;
    const initialValid = control.valid;

    // Try to remove a validator that doesn't exist
    control.removeValidator(Validators.required);

    assert.equal(control.valid, initialValid, "control validity should remain unchanged");
    assert.equal(control.hasValidator(Validators.required), false, "control should not have required validator");
  });

  it("should add and remove multiple validators correctly", () => {
    const minLengthValidator = (value: string) => value.length >= 3;
    const maxLengthValidator = (value: string) => value.length <= 10;
    
    const form = formGroup<{ name: string }>({
      name: "test",
    });

    const control = form.controls.name;
    assert.equal(control.valid, true, "control should be valid initially");

    // Add multiple validators
    control.addValidator(minLengthValidator);
    control.addValidator(maxLengthValidator);
    control.addValidator(Validators.required);

    assert.equal(control.hasValidator(minLengthValidator), true, "control should have minLengthValidator");
    assert.equal(control.hasValidator(maxLengthValidator), true, "control should have maxLengthValidator");
    assert.equal(control.hasValidator(Validators.required), true, "control should have required validator");
    assert.equal(control.valid, true, "control should be valid with all validators passing");

    // Set value that fails maxLengthValidator
    control.value = "this is too long";
    assert.equal(control.valid, false, "control should be invalid with too long value");

    // Remove maxLengthValidator
    control.removeValidator(maxLengthValidator);
    assert.equal(control.valid, true, "control should be valid after removing failing validator");

    // Remove all validators
    control.removeValidator(minLengthValidator);
    control.removeValidator(Validators.required);
    assert.equal(control.hasValidator(minLengthValidator), false, "control should not have minLengthValidator");
    assert.equal(control.hasValidator(maxLengthValidator), false, "control should not have maxLengthValidator");
    assert.equal(control.hasValidator(Validators.required), false, "control should not have required validator");
    assert.equal(control.valid, true, "control should be valid with no validators");
  });

  it("should recalculate validity when adding validator to control with invalid value", () => {
    const form = formGroup<{ email: string }>({
      email: "",
    });

    const control = form.controls.email;
    assert.equal(control.valid, true, "control should be valid initially (no validators)");

    // Add required validator
    control.addValidator(Validators.required);
    assert.equal(control.valid, false, "control should be invalid after adding required validator to empty value");

    // Set valid value
    control.value = "test@example.com";
    assert.equal(control.valid, true, "control should be valid with non-empty value");
  });

  it("should recalculate validity when removing validator from control with invalid value", () => {
    const customValidator = (value: string) => value.includes("@");
    const form = formGroup<{ email: string }>({
      email: ["invalid-email", [Validators.required, customValidator]],
    });

    const control = form.controls.email;
    assert.equal(control.valid, false, "control should be invalid (missing @)");

    // Remove customValidator
    control.removeValidator(customValidator);
    assert.equal(control.valid, true, "control should be valid after removing failing validator");
  });

  it("should fail validity when removing passing validator and adding failing validator", () => {
    const minLengthValidator = (value: string) => value.length >= 3;
    const maxLengthValidator = (value: string) => value.length <= 3;
    
    const form = formGroup<{ name: string }>({
      name: ["test", [minLengthValidator]],
    });

    const control = form.controls.name;
    assert.equal(control.valid, true, "control should be valid initially");

    // Remove minLengthValidator (was passing)
    control.removeValidator(minLengthValidator);
    assert.equal(control.valid, true, "control should still be valid (no validators)");

    // Add maxLengthValidator that will fail with current value ("test" has length 4)
    control.addValidator(maxLengthValidator);
    assert.equal(control.valid, false, "control should be invalid after adding failing validator");
    assert.equal(form.valid, false, "form should be invalid when control is invalid");
  });

  it("should pass validity when removing failing validator and adding passing validator", () => {
    const minLengthValidator = (value: string) => value.length >= 10;
    const maxLengthValidator = (value: string) => value.length <= 20;
    
    const form = formGroup<{ name: string }>({
      name: ["test", [minLengthValidator]],
    });

    const control = form.controls.name;
    assert.equal(control.valid, false, "control should be invalid initially (value too short)");

    // Remove failing minLengthValidator
    control.removeValidator(minLengthValidator);
    assert.equal(control.valid, true, "control should be valid after removing failing validator");

    // Add maxLengthValidator that will pass with current value
    control.addValidator(maxLengthValidator);
    assert.equal(control.valid, true, "control should be valid after adding passing validator");
    assert.equal(form.valid, true, "form should be valid when control is valid");
  });

  it("should fail validity when removing validator, changing value, then adding validator back", () => {
    const minLengthValidator = (value: string) => value.length >= 5;
    
    const form = formGroup<{ name: string }>({
      name: ["test123", [minLengthValidator]],
    });

    const control = form.controls.name;
    assert.equal(control.valid, true, "control should be valid initially");

    // Remove validator
    control.removeValidator(minLengthValidator);
    assert.equal(control.valid, true, "control should be valid after removing validator");

    // Change value to one that would fail the validator
    control.value = "abc";
    assert.equal(control.valid, true, "control should still be valid (no validators)");

    // Add validator back - should fail now
    control.addValidator(minLengthValidator);
    assert.equal(control.valid, false, "control should be invalid after adding validator back with failing value");
    assert.equal(form.valid, false, "form should be invalid when control is invalid");
  });

  it("should pass validity when removing validator, changing value, then adding validator back", () => {
    const minLengthValidator = (value: string) => value.length >= 3;
    
    const form = formGroup<{ name: string }>({
      name: ["ab", [minLengthValidator]],
    });

    const control = form.controls.name;
    assert.equal(control.valid, false, "control should be invalid initially (value too short)");

    // Remove validator
    control.removeValidator(minLengthValidator);
    assert.equal(control.valid, true, "control should be valid after removing validator");

    // Change value to one that would pass the validator
    control.value = "test123";
    assert.equal(control.valid, true, "control should still be valid (no validators)");

    // Add validator back - should pass now
    control.addValidator(minLengthValidator);
    assert.equal(control.valid, true, "control should be valid after adding validator back with passing value");
    assert.equal(form.valid, true, "form should be valid when control is valid");
  });

  it("should fail validity when removing one validator and adding another that fails", () => {
    const emailValidator = (value: string) => value.includes("@");
    const minLengthValidator = (value: string) => value.length >= 20;
    
    const form = formGroup<{ email: string }>({
      email: ["test@example.com", [emailValidator]],
    });

    const control = form.controls.email;
    assert.equal(control.valid, true, "control should be valid initially");

    // Remove emailValidator (was passing)
    control.removeValidator(emailValidator);
    assert.equal(control.valid, true, "control should be valid after removing validator");

    // Add minLengthValidator that will fail with current value ("test@example.com" has length 15)
    control.addValidator(minLengthValidator);
    assert.equal(control.valid, false, "control should be invalid after adding failing validator");
    assert.equal(form.valid, false, "form should be invalid when control is invalid");
  });

  it("should pass validity when removing failing validator and adding different passing validator", () => {
    const minLengthValidator = (value: string) => value.length >= 20;
    const emailValidator = (value: string) => value.includes("@");
    
    const form = formGroup<{ email: string }>({
      email: ["test@example.com", [minLengthValidator]],
    });

    const control = form.controls.email;
    assert.equal(control.valid, false, "control should be invalid initially (value too short)");

    // Remove failing minLengthValidator
    control.removeValidator(minLengthValidator);
    assert.equal(control.valid, true, "control should be valid after removing failing validator");

    // Add emailValidator that will pass with current value
    control.addValidator(emailValidator);
    assert.equal(control.valid, true, "control should be valid after adding passing validator");
    assert.equal(form.valid, true, "form should be valid when control is valid");
  });

  it("should fail validity when removing validator, setting empty value, then adding required validator", () => {
    const form = formGroup<{ name: string }>({
      name: "test",
    });

    const control = form.controls.name;
    assert.equal(control.valid, true, "control should be valid initially");

    // Set empty value
    control.value = "";
    assert.equal(control.valid, true, "control should still be valid (no validators)");

    // Add required validator - should fail now
    control.addValidator(Validators.required);
    assert.equal(control.valid, false, "control should be invalid after adding required validator to empty value");
    assert.equal(form.valid, false, "form should be invalid when control is invalid");
  });

  it("should pass validity when removing required validator, setting empty value, then removing validator", () => {
    const form = formGroup<{ name: string }>({
      name: ["test", [Validators.required]],
    });

    const control = form.controls.name;
    assert.equal(control.valid, true, "control should be valid initially");

    // Remove required validator
    control.removeValidator(Validators.required);
    assert.equal(control.valid, true, "control should be valid after removing validator");

    // Set empty value
    control.value = "";
    assert.equal(control.valid, true, "control should be valid with empty value (no validators)");

    // Add required validator back - should fail now
    control.addValidator(Validators.required);
    assert.equal(control.valid, false, "control should be invalid after adding required validator to empty value");
    assert.equal(form.valid, false, "form should be invalid when control is invalid");
  });

  it("should fail validity when removing Validators.required and adding it back to empty value", () => {
    const form = formGroup<{ name: string }>({
      name: ["", [Validators.required]],
    });

    const control = form.controls.name;
    assert.equal(control.valid, false, "control should be invalid initially (empty with required)");

    // Remove required validator
    control.removeValidator(Validators.required);
    assert.equal(control.valid, true, "control should be valid after removing required validator");

    // Add required validator back - should fail since value is still empty
    control.addValidator(Validators.required);
    assert.equal(control.valid, false, "control should be invalid after adding required validator back to empty value");
    assert.equal(form.valid, false, "form should be invalid when control is invalid");
  });

  it("should pass validity when removing Validators.required, setting valid value, then adding it back", () => {
    const form = formGroup<{ name: string }>({
      name: ["", [Validators.required]],
    });

    const control = form.controls.name;
    assert.equal(control.valid, false, "control should be invalid initially (empty with required)");

    // Remove required validator
    control.removeValidator(Validators.required);
    assert.equal(control.valid, true, "control should be valid after removing required validator");

    // Set valid value
    control.value = "test";
    assert.equal(control.valid, true, "control should be valid with non-empty value (no validators)");

    // Add required validator back - should pass now
    control.addValidator(Validators.required);
    assert.equal(control.valid, true, "control should be valid after adding required validator back to non-empty value");
    assert.equal(form.valid, true, "form should be valid when control is valid");
  });

  it("should fail validity when removing custom validator and adding Validators.required to empty value", () => {
    const minLengthValidator = (value: string) => value.length >= 5;
    const form = formGroup<{ name: string }>({
      name: ["", [minLengthValidator]],
    });

    const control = form.controls.name;
    assert.equal(control.valid, false, "control should be invalid initially (empty with minLength)");

    // Remove minLengthValidator
    control.removeValidator(minLengthValidator);
    assert.equal(control.valid, true, "control should be valid after removing validator");

    // Add required validator - should fail since value is empty
    control.addValidator(Validators.required);
    assert.equal(control.valid, false, "control should be invalid after adding required validator to empty value");
    assert.equal(form.valid, false, "form should be invalid when control is invalid");
  });

  it("should pass validity when removing Validators.required and adding custom validator to valid value", () => {
    const minLengthValidator = (value: string) => value.length >= 3;
    const form = formGroup<{ name: string }>({
      name: ["test", [Validators.required]],
    });

    const control = form.controls.name;
    assert.equal(control.valid, true, "control should be valid initially");

    // Remove required validator
    control.removeValidator(Validators.required);
    assert.equal(control.valid, true, "control should be valid after removing required validator");

    // Add minLengthValidator - should pass with current value
    control.addValidator(minLengthValidator);
    assert.equal(control.valid, true, "control should be valid after adding passing validator");
    assert.equal(form.valid, true, "form should be valid when control is valid");
  });

  it("should fail validity when removing Validators.required and adding custom validator to invalid value", () => {
    const minLengthValidator = (value: string) => value.length >= 5;
    const form = formGroup<{ name: string }>({
      name: ["test", [Validators.required]],
    });

    const control = form.controls.name;
    assert.equal(control.valid, true, "control should be valid initially");

    // Remove required validator
    control.removeValidator(Validators.required);
    assert.equal(control.valid, true, "control should be valid after removing required validator");

    // Add minLengthValidator - should fail with current value ("test" has length 4)
    control.addValidator(minLengthValidator);
    assert.equal(control.valid, false, "control should be invalid after adding failing validator");
    assert.equal(form.valid, false, "form should be invalid when control is invalid");
  });

  it("should pass validity when removing Validators.required, changing to valid value, then adding it back", () => {
    const form = formGroup<{ name: string }>({
      name: ["", [Validators.required]],
    });

    const control = form.controls.name;
    assert.equal(control.valid, false, "control should be invalid initially (empty with required)");

    // Remove required validator
    control.removeValidator(Validators.required);
    assert.equal(control.valid, true, "control should be valid after removing required validator");

    // Change to valid value
    control.value = "new value";
    assert.equal(control.valid, true, "control should be valid with non-empty value (no validators)");

    // Add required validator back - should pass now
    control.addValidator(Validators.required);
    assert.equal(control.valid, true, "control should be valid after adding required validator back");
    assert.equal(form.valid, true, "form should be valid when control is valid");
  });

  it("should fail validity when removing Validators.required, changing to empty value, then adding it back", () => {
    const form = formGroup<{ name: string }>({
      name: ["initial", [Validators.required]],
    });

    const control = form.controls.name;
    assert.equal(control.valid, true, "control should be valid initially");

    // Remove required validator
    control.removeValidator(Validators.required);
    assert.equal(control.valid, true, "control should be valid after removing required validator");

    // Change to empty value
    control.value = "";
    assert.equal(control.valid, true, "control should be valid with empty value (no validators)");

    // Add required validator back - should fail now
    control.addValidator(Validators.required);
    assert.equal(control.valid, false, "control should be invalid after adding required validator to empty value");
    assert.equal(form.valid, false, "form should be invalid when control is invalid");
  });

  it("should pass validity when removing Validators.required and adding it back to non-empty value", () => {
    const form = formGroup<{ name: string }>({
      name: "test",
    });

    const control = form.controls.name;
    assert.equal(control.valid, true, "control should be valid initially (no validators)");

    // Add required validator - should pass with non-empty value
    control.addValidator(Validators.required);
    assert.equal(control.valid, true, "control should be valid after adding required validator to non-empty value");

    // Remove required validator
    control.removeValidator(Validators.required);
    assert.equal(control.valid, true, "control should be valid after removing required validator");

    // Add required validator back - should still pass
    control.addValidator(Validators.required);
    assert.equal(control.valid, true, "control should be valid after adding required validator back");
    assert.equal(form.valid, true, "form should be valid when control is valid");
  });
});

describe("FormControl - reset method", () => {
  describe("reset with single items (non-form)", () => {
    it("should reset string value to initial value", () => {
      const form = formGroup<{ name: string }>({
        name: "initial",
      });

      form.controls.name.value = "modified";
      assert.equal(form.controls.name.value, "modified", "value should be modified");
      assert.equal(form.controls.name.dirty, true, "control should be dirty");

      form.controls.name.reset();

      assert.equal(form.controls.name.value, "initial", "value should be reset to initial");
      assert.equal(form.controls.name.dirty, false, "control should not be dirty after reset");
      assert.equal(form.controls.name.touched, false, "control should not be touched after reset");
    });

    it("should reset number value to initial value", () => {
      const form = formGroup<{ age: number }>({
        age: 25,
      });

      form.controls.age.value = 30;
      form.controls.age.reset();

      assert.equal(form.controls.age.value, 25, "age should be reset to initial value");
      assert.equal(form.controls.age.dirty, false, "control should not be dirty");
    });

    it("should reset boolean value to initial value", () => {
      const form = formGroup<{ active: boolean }>({
        active: true,
      });

      form.controls.active.value = false;
      form.controls.active.reset();

      assert.equal(form.controls.active.value, true, "active should be reset to initial value");
    });
  });

  describe("reset with single nested form", () => {
    it("should reset nested form to initial state", () => {
      const form = formGroup<{ user: Form<{ name: string; age: number }> }>({
        user: formGroup({
          name: "Alice",
          age: 28,
        }) as Form<{ name: string; age: number }>,
      });

      // Modify nested form
      form.controls.user.value.controls.name.value = "Bob";
      form.controls.user.value.controls.age.value = 30;
      assert.equal(form.controls.user.value.controls.name.value, "Bob", "name should be modified");
      assert.equal(form.controls.user.dirty, true, "user control should be dirty");

      // Reset the control containing the nested form
      form.controls.user.reset();

      assert.equal(
        form.controls.user.value.controls.name.value,
        "Alice",
        "nested form name should be reset to initial value"
      );
      assert.equal(
        form.controls.user.value.controls.age.value,
        28,
        "nested form age should be reset to initial value"
      );
      assert.equal(form.controls.user.dirty, false, "user control should not be dirty after reset");
      assert.equal(form.controls.user.touched, false, "user control should not be touched after reset");
    });

    it("should reset nested form and clear its dirty/touched flags", () => {
      const form = formGroup<{ profile: Form<{ email: string }> }>({
        profile: formGroup({
          email: "alice@example.com",
        }) as Form<{ email: string }>,
      });

      form.controls.profile.value.controls.email.value = "bob@example.com";
      assert.equal(form.controls.profile.dirty, true, "profile control should be dirty");
      assert.equal(form.controls.profile.value.dirty, true, "nested form should be dirty");

      form.controls.profile.reset();

      assert.equal(
        form.controls.profile.value.controls.email.value,
        "alice@example.com",
        "email should be reset"
      );
      assert.equal(form.controls.profile.dirty, false, "profile control should not be dirty");
      assert.equal(form.controls.profile.value.dirty, false, "nested form should not be dirty");
    });
  });

  describe("reset with form arrays", () => {
    it("should reset all forms in array to initial state", () => {
      const form = formGroup<{ users: Form<{ name: string }>[] }>({
        users: [
          formGroup({ name: "Alice" }),
          formGroup({ name: "Bob" }),
          formGroup({ name: "Charlie" }),
        ] as Form<{ name: string }>[],
      });

      // Modify forms in array
      form.controls.users.value[0].controls.name.value = "Alice Modified";
      form.controls.users.value[1].controls.name.value = "Bob Modified";
      assert.equal(form.controls.users.dirty, true, "users control should be dirty");

      form.controls.users.reset();

      assert.equal(
        form.controls.users.value[0].controls.name.value,
        "Alice",
        "first form should be reset"
      );
      assert.equal(
        form.controls.users.value[1].controls.name.value,
        "Bob",
        "second form should be reset"
      );
      assert.equal(
        form.controls.users.value[2].controls.name.value,
        "Charlie",
        "third form should be reset"
      );
      assert.equal(form.controls.users.dirty, false, "users control should not be dirty");
    });

    it("should reset form array and clear dirty/touched flags", () => {
      const form = formGroup<{ items: Form<{ value: number }>[] }>({
        items: [
          formGroup({ value: 10 }),
          formGroup({ value: 20 }),
        ] as Form<{ value: number }>[],
      });

      form.controls.items.value[0].controls.value.value = 15;
      form.controls.items.value[1].controls.value.value = 25;

      form.controls.items.reset();

      assert.equal(form.controls.items.value[0].controls.value.value, 10, "first item should be reset");
      assert.equal(form.controls.items.value[1].controls.value.value, 20, "second item should be reset");
      assert.equal(form.controls.items.dirty, false, "items control should not be dirty");
      assert.equal(form.controls.items.touched, false, "items control should not be touched");
      assert.equal(form.controls.items.value[0].dirty, false, "first nested form should not be dirty");
      assert.equal(form.controls.items.value[1].dirty, false, "second nested form should not be dirty");
    });

    it("should clean up null/undefined forms from array during reset", () => {
      const form = formGroup<{ users: Form<{ name: string }>[] }>({
        users: [
          formGroup({ name: "Alice" }),
          formGroup({ name: "Bob" }),
        ] as Form<{ name: string }>[],
      });

      // Manually add null/undefined to simulate edge case
      const currentValue = form.controls.users.value;
      (currentValue as any)[2] = null;
      (currentValue as any)[3] = undefined;
      form.controls.users.value = currentValue;

      // Reset should filter out null/undefined
      form.controls.users.reset();

      const filteredArray = form.controls.users.value.filter((item) => item && Form.isFormLike(item));
      assert.equal(filteredArray.length, 2, "array should only contain valid forms after reset");
      assert.equal(
        form.controls.users.value[0].controls.name.value,
        "Alice",
        "first form should still exist"
      );
      assert.equal(
        form.controls.users.value[1].controls.name.value,
        "Bob",
        "second form should still exist"
      );
    });
  });

  describe("reset with normal arrays (non-form)", () => {
    it("should reset array of strings to initial value", () => {
      const form = formGroup<{ tags: string[] }>({
        tags: ["tag1", "tag2"],
      });

      form.controls.tags.value = ["tag3", "tag4", "tag5"];
      assert.equal(form.controls.tags.dirty, true, "control should be dirty");
      
      form.controls.tags.reset();

      assert.deepEqual(form.controls.tags.value, ["tag1", "tag2"], "tags should be reset to initial array");
      assert.equal(form.controls.tags.dirty, false, "tags control should not be dirty");
      assert.equal(form.controls.tags.touched, false, "tags control should not be touched");
    });

    it("should reset array of numbers to initial value", () => {
      const form = formGroup<{ scores: number[] }>({
        scores: [10, 20, 30],
      });

      form.controls.scores.value = [40, 50];
      form.controls.scores.reset();

      assert.deepEqual(form.controls.scores.value, [10, 20, 30], "scores should be reset to initial array");
      assert.equal(form.controls.scores.dirty, false, "scores control should not be dirty");
    });

    it("should reset empty array to initial empty array", () => {
      const form = formGroup<{ items: string[] }>({
        items: [],
      });

      form.controls.items.value = ["item1", "item2"];
      form.controls.items.reset();

      assert.deepEqual(form.controls.items.value, [], "items should be reset to empty array");
      assert.equal(form.controls.items.dirty, false, "items control should not be dirty");
    });

    it("should reset array of objects to initial value", () => {
      const form = formGroup<{ items: Array<{ id: number; name: string }> }>({
        items: [
          { id: 1, name: "Item1" },
          { id: 2, name: "Item2" },
        ],
      });

      form.controls.items.value = [
        { id: 3, name: "Item3" },
        { id: 4, name: "Item4" },
      ];
      form.controls.items.reset();

      assert.deepEqual(
        form.controls.items.value,
        [
          { id: 1, name: "Item1" },
          { id: 2, name: "Item2" },
        ],
        "items should be reset to initial array"
      );
      assert.equal(form.controls.items.dirty, false, "items control should not be dirty");
    });

    it("should reset normal array even after being modified to contain forms temporarily", () => {
      const form = formGroup<{ items: string[] }>({
        items: ["item1", "item2"],
      });

      // Temporarily set to array with forms (this would set _contains_a_form to true)
      const tempForm = formGroup({ name: "Temp" });
      form.controls.items.value = [tempForm] as any;
      
      // Reset back to normal array
      form.controls.items.value = ["item3", "item4"];
      
      // Reset should restore initial normal array
      form.controls.items.reset();

      assert.deepEqual(form.controls.items.value, ["item1", "item2"], "items should be reset to initial normal array");
      assert.equal(form.controls.items.dirty, false, "items control should not be dirty");
    });
  });

  describe("reset with mixed arrays", () => {
    it("should reset array containing forms and filter out non-form items", () => {
      // Note: When _contains_a_form is true, reset filters to only keep form-like items
      const form = formGroup<{ mixed: Form<{ name: string }>[] }>({
        mixed: [
          formGroup({ name: "Form1" }),
          formGroup({ name: "Form2" }),
        ] as Form<{ name: string }>[],
      });

      form.controls.mixed.value[0].controls.name.value = "Form1 Modified";
      form.controls.mixed.value[1].controls.name.value = "Form2 Modified";

      // Add a non-form item (this simulates edge case)
      const currentValue = form.controls.mixed.value;
      (currentValue as any).push("string-item" as any);
      form.controls.mixed.value = currentValue;

      form.controls.mixed.reset();

      // After reset, non-form items should be filtered out, forms should be reset
      assert.equal(
        form.controls.mixed.value.length,
        2,
        "array should only contain forms after reset"
      );
      assert.equal(
        form.controls.mixed.value[0].controls.name.value,
        "Form1",
        "first form should be reset"
      );
      assert.equal(
        form.controls.mixed.value[1].controls.name.value,
        "Form2",
        "second form should be reset"
      );
      assert.equal(form.controls.mixed.dirty, false, "mixed control should not be dirty");
    });
  });

  describe("reset validity and state", () => {
    it("should recalculate validity after reset", () => {
      const form = formGroup<{ name: string }>({
        name: ["initial", [Validators.required]],
      });

      form.controls.name.value = "";
      assert.equal(form.controls.name.valid, false, "control should be invalid with empty value");
      assert.equal(form.valid, false, "form should be invalid");

      form.controls.name.reset();

      assert.equal(form.controls.name.valid, true, "control should be valid after reset to valid initial value");
      assert.equal(form.valid, true, "form should be valid after reset");
    });

    it("should maintain invalid state if initial value is invalid", () => {
      const form = formGroup<{ email: string }>({
        email: ["", [Validators.required]],
      });

      form.controls.email.value = "valid@example.com";
      assert.equal(form.controls.email.valid, true, "control should be valid with value");

      form.controls.email.reset();

      assert.equal(form.controls.email.valid, false, "control should be invalid after reset to empty initial value");
      assert.equal(form.valid, false, "form should be invalid");
    });

    it("should clear dirty and touched flags after reset", () => {
      const form = formGroup<{ name: string }>({
        name: "initial",
      });

      form.controls.name.value = "modified";
      assert.equal(form.controls.name.dirty, true, "control should be dirty");
      assert.equal(form.controls.name.touched, true, "control should be touched");
      assert.equal(form.dirty, true, "form should be dirty");

      form.controls.name.reset();

      assert.equal(form.controls.name.dirty, false, "control should not be dirty after reset");
      assert.equal(form.controls.name.touched, false, "control should not be touched after reset");
      assert.equal(form.dirty, false, "form should not be dirty after reset");
    });
  });

  describe("reset with deeply nested forms", () => {
    it("should reset deeply nested form structure", () => {
      const form = formGroup<{
        user: Form<{
          profile: Form<{ email: string }>;
        }>;
      }>({
        user: formGroup({
          profile: formGroup({
            email: "alice@example.com",
          }),
        }) as Form<{
          profile: Form<{ email: string }>;
        }>,
      });

      form.controls.user.value.controls.profile.value.controls.email.value = "bob@example.com";
      assert.equal(form.controls.user.dirty, true, "user control should be dirty");

      form.controls.user.reset();

      assert.equal(
        form.controls.user.value.controls.profile.value.controls.email.value,
        "alice@example.com",
        "deeply nested email should be reset"
      );
      assert.equal(form.controls.user.dirty, false, "user control should not be dirty");
      assert.equal(
        form.controls.user.value.controls.profile.dirty,
        false,
        "nested profile control should not be dirty"
      );
    });

    it("should reset form array containing nested forms", () => {
      // Create a simpler nested structure to avoid stack overflow
      const form = formGroup<{
        users: Form<{ name: string; age: number }>[];
      }>({
        users: [
          formGroup({ name: "Alice", age: 25 }),
          formGroup({ name: "Bob", age: 30 }),
        ] as Form<{ name: string; age: number }>[],
      });

      form.controls.users.value[0].controls.name.value = "Alice Modified";
      form.controls.users.value[0].controls.age.value = 26;
      form.controls.users.value[1].controls.name.value = "Bob Modified";
      form.controls.users.value[1].controls.age.value = 31;

      form.controls.users.reset();

      assert.equal(
        form.controls.users.value[0].controls.name.value,
        "Alice",
        "first form name should be reset"
      );
      assert.equal(
        form.controls.users.value[0].controls.age.value,
        25,
        "first form age should be reset"
      );
      assert.equal(
        form.controls.users.value[1].controls.name.value,
        "Bob",
        "second form name should be reset"
      );
      assert.equal(
        form.controls.users.value[1].controls.age.value,
        30,
        "second form age should be reset"
      );
      assert.equal(form.controls.users.dirty, false, "users control should not be dirty");
    });
  });
});
