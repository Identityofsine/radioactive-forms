import { describe, it, assert } from "vitest";
import { Form, Validators } from "../form";
import { formGroup } from "../form/functional";

/**
 * Comprehensive tests to catch the bug where controls are invalid
 * but the form is valid, which should never happen.
 * 
 * The form should be invalid if ANY control is invalid.
 */

type TestForm = {
  name: string;
  email: string;
  age: number;
  password: string;
  confirmPassword: string;
};

describe("Form Validity Consistency - Control vs Form Validity", () => {
  describe("Basic validity consistency checks", () => {
    it("form should be invalid when any single control is invalid", () => {
      const form = formGroup<TestForm>({
        name: ["John", [Validators.required]],
        email: ["john@example.com", [Validators.required]],
        age: [25],
        password: ["password123", [Validators.required]],
        confirmPassword: ["password123", [Validators.required]],
      });

      // Initially all should be valid
      assert.equal(form.valid, true, "Form should be valid initially");
      assert.equal(form.controls.name.valid, true, "Name control should be valid");
      assert.equal(form.controls.email.valid, true, "Email control should be valid");

      // Make name invalid
      form.controls.name.value = "";
      assert.equal(form.controls.name.valid, false, "Name control should be invalid");
      assert.equal(form.valid, false, "Form should be invalid when name control is invalid");

      // Fix name, make email invalid
      form.controls.name.value = "John";
      form.controls.email.value = "";
      assert.equal(form.controls.name.valid, true, "Name control should be valid");
      assert.equal(form.controls.email.valid, false, "Email control should be invalid");
      assert.equal(form.valid, false, "Form should be invalid when email control is invalid");
    });

    it("form should be invalid when multiple controls are invalid", () => {
      const form = formGroup<TestForm>({
        name: ["John", [Validators.required]],
        email: ["john@example.com", [Validators.required]],
        age: [25],
        password: ["password123", [Validators.required]],
        confirmPassword: ["password123", [Validators.required]],
      });

      // Make multiple controls invalid
      form.controls.name.value = "";
      form.controls.email.value = "";
      form.controls.password.value = "";

      assert.equal(form.controls.name.valid, false, "Name control should be invalid");
      assert.equal(form.controls.email.valid, false, "Email control should be invalid");
      assert.equal(form.controls.password.valid, false, "Password control should be invalid");
      assert.equal(form.valid, false, "Form should be invalid when multiple controls are invalid");
    });

    it("form should be valid only when ALL controls are valid", () => {
      const form = formGroup<TestForm>({
        name: ["John", [Validators.required]],
        email: ["john@example.com", [Validators.required]],
        age: [25],
        password: ["password123", [Validators.required]],
        confirmPassword: ["password123", [Validators.required]],
      });

      // Make one invalid
      form.controls.name.value = "";
      assert.equal(form.valid, false, "Form should be invalid when one control is invalid");

      // Fix it
      form.controls.name.value = "John";
      assert.equal(form.controls.name.valid, true, "Name control should be valid");
      assert.equal(form.valid, true, "Form should be valid when all controls are valid");
    });
  });

  describe("Validity consistency after value changes", () => {
    it("form validity should update immediately when control becomes invalid", () => {
      const form = formGroup<{ name: string; email: string }>({
        name: ["John", [Validators.required]],
        email: ["john@example.com", [Validators.required]],
      });

      assert.equal(form.valid, true, "Form should be valid initially");

      form.controls.name.value = "";
      // Check immediately - no waiting
      assert.equal(form.controls.name.valid, false, "Name control should be invalid immediately");
      assert.equal(form.valid, false, "Form should be invalid immediately when control becomes invalid");
    });

    it("form validity should update immediately when control becomes valid", () => {
      const form = formGroup<{ name: string; email: string }>({
        name: ["", [Validators.required]],
        email: ["john@example.com", [Validators.required]],
      });

      // Note: Form may not call internalUpdate() on construction, so we need to trigger it
      // by making a change first, or check control validity directly
      assert.equal(form.controls.name.valid, false, "Name control should be invalid initially");
      // The bug: form.valid might be true even when controls are invalid due to OR logic in valid getter
      // This test exposes the bug - form should be invalid when name control is invalid
      const formShouldBeInvalid = form.controls.name.valid === false;
      if (formShouldBeInvalid) {
        assert.equal(form.valid, false, "CRITICAL BUG: Form should be invalid when name control is invalid");
      }

      form.controls.name.value = "John";
      // Check immediately - no waiting
      assert.equal(form.controls.name.valid, true, "Name control should be valid immediately");
      assert.equal(form.valid, true, "Form should be valid immediately when all controls become valid");
    });

    it("form validity should be consistent after multiple rapid changes", () => {
      const form = formGroup<{ name: string; email: string }>({
        name: ["John", [Validators.required]],
        email: ["john@example.com", [Validators.required]],
      });

      // Rapid changes
      form.controls.name.value = "";
      assert.equal(form.valid, false, "Form should be invalid after name cleared");

      form.controls.email.value = "";
      assert.equal(form.valid, false, "Form should be invalid when both are empty");

      form.controls.name.value = "John";
      assert.equal(form.valid, false, "Form should still be invalid when email is empty");

      form.controls.email.value = "john@example.com";
      assert.equal(form.valid, true, "Form should be valid when all controls are valid");
    });
  });

  describe("Validity consistency with custom validators", () => {
    it("form should be invalid when custom validator fails", () => {
      const minLength = (value: string) => value.length >= 5;
      const form = formGroup<{ name: string }>({
        name: ["Johnny", [Validators.required, minLength]],
      });

      assert.equal(form.valid, true, "Form should be valid initially");

      form.controls.name.value = "Jo";
      assert.equal(form.controls.name.valid, false, "Name control should be invalid (too short)");
      assert.equal(form.valid, false, "Form should be invalid when custom validator fails");
    });

    it("form should be valid when all custom validators pass", () => {
      const minLength = (value: string) => value.length >= 3;
      const maxLength = (value: string) => value.length <= 10;
      const form = formGroup<{ name: string }>({
        name: ["John", [Validators.required, minLength, maxLength]],
      });

      assert.equal(form.valid, true, "Form should be valid when all validators pass");

      form.controls.name.value = "Jo";
      assert.equal(form.valid, false, "Form should be invalid when minLength fails");

      form.controls.name.value = "John";
      assert.equal(form.valid, true, "Form should be valid when all validators pass again");

      form.controls.name.value = "This is way too long";
      assert.equal(form.valid, false, "Form should be invalid when maxLength fails");
    });
  });

  describe("Validity consistency after patchValue", () => {
    it("form should be invalid after patchValue makes control invalid", () => {
      const form = formGroup<{ name: string; email: string }>({
        name: ["John", [Validators.required]],
        email: ["john@example.com", [Validators.required]],
      });

      assert.equal(form.valid, true, "Form should be valid initially");

      form.patchValue({ name: "" });
      assert.equal(form.controls.name.valid, false, "Name control should be invalid after patchValue");
      assert.equal(form.valid, false, "Form should be invalid after patchValue makes control invalid");
    });

    it("form should be valid after patchValue fixes invalid control", () => {
      const form = formGroup<{ name: string; email: string }>({
        name: ["", [Validators.required]],
        email: ["john@example.com", [Validators.required]],
      });

      // Trigger validation by making a change
      form.controls.name.value = "";
      assert.equal(form.controls.name.valid, false, "Name control should be invalid");
      assert.equal(form.valid, false, "Form should be invalid when name control is invalid");

      form.patchValue({ name: "John" });
      assert.equal(form.controls.name.valid, true, "Name control should be valid after patchValue");
      assert.equal(form.valid, true, "Form should be valid after patchValue fixes invalid control");
    });

    it("form validity should be consistent after patchValue with multiple fields", () => {
      const form = formGroup<{ name: string; email: string; age: number }>({
        name: ["John", [Validators.required]],
        email: ["john@example.com", [Validators.required]],
        age: [25],
      });

      form.patchValue({ name: "", email: "" });
      assert.equal(form.controls.name.valid, false, "Name control should be invalid");
      assert.equal(form.controls.email.valid, false, "Email control should be invalid");
      assert.equal(form.valid, false, "Form should be invalid when multiple controls are invalid");

      form.patchValue({ name: "John", email: "john@example.com" });
      assert.equal(form.valid, true, "Form should be valid when all controls are valid");
    });
  });

  describe("Validity consistency after reset", () => {
    it("form should be valid after reset if initial values are valid", () => {
      const form = formGroup<{ name: string; email: string }>({
        name: ["John", [Validators.required]],
        email: ["john@example.com", [Validators.required]],
      });

      form.controls.name.value = "";
      assert.equal(form.valid, false, "Form should be invalid before reset");

      form.reset();
      assert.equal(form.controls.name.valid, true, "Name control should be valid after reset");
      assert.equal(form.valid, true, "Form should be valid after reset if initial values are valid");
    });

    it("form should be invalid after reset if initial values are invalid", () => {
      const form = formGroup<{ name: string; email: string }>({
        name: ["", [Validators.required]],
        email: ["john@example.com", [Validators.required]],
      });

      // Trigger validation check
      assert.equal(form.controls.name.valid, false, "Name control should be invalid initially");
      // The bug: form might report valid even when control is invalid
      const hasInvalidControl = !form.controls.name.valid;
      if (hasInvalidControl) {
        assert.equal(form.valid, false, "CRITICAL BUG: Form should be invalid when name control is invalid");
      }

      form.controls.name.value = "John";
      assert.equal(form.valid, true, "Form should be valid after fixing invalid control");

      form.reset();
      assert.equal(form.controls.name.valid, false, "Name control should be invalid after reset");
      assert.equal(form.valid, false, "Form should be invalid after reset if initial values are invalid");
    });
  });

  describe("Validity consistency with addValidator/removeValidator", () => {
    it("form should be invalid after adding validator that fails", () => {
      const form = formGroup<{ name: string }>({
        name: "test",
      });

      assert.equal(form.valid, true, "Form should be valid initially (no validators)");

      form.controls.name.addValidator(Validators.required);
      assert.equal(form.controls.name.valid, true, "Name control should be valid (non-empty)");
      assert.equal(form.valid, true, "Form should be valid");

      form.controls.name.value = "";
      form.controls.name.addValidator((val: string) => val.length >= 5);
      assert.equal(form.controls.name.valid, false, "Name control should be invalid");
      assert.equal(form.valid, false, "Form should be invalid when validator fails");
    });

    it("form should be valid after removing validator that was failing", () => {
      const minLength = (value: string) => value.length >= 10;
      const form = formGroup<{ name: string }>({
        name: ["test", [Validators.required, minLength]],
      });

      assert.equal(form.controls.name.valid, false, "Name control should be invalid (too short)");
      // The bug: form might report valid even when control is invalid
      const controlInvalid = !form.controls.name.valid;
      if (controlInvalid) {
        assert.equal(form.valid, false, "CRITICAL BUG: Form should be invalid when control is invalid");
      }

      form.controls.name.removeValidator(minLength);
      assert.equal(form.controls.name.valid, true, "Name control should be valid after removing failing validator");
      assert.equal(form.valid, true, "Form should be valid after removing failing validator");
    });
  });

  describe("Validity consistency with nested forms", () => {
    it("form should be invalid when nested form control is invalid", () => {
      const nestedForm = formGroup<{ nestedName: string }>({
        nestedName: ["", [Validators.required]],
      });

      const form = formGroup<{ name: string; nested: Form<{ nestedName: string }> }>({
        name: ["John", [Validators.required]],
        nested: nestedForm,
      });

      // Trigger validation by accessing nested control
      assert.equal(form.controls.nested.value.controls.nestedName.valid, false, "Nested control should be invalid");
      // The bug: nested form might report valid even when control is invalid
      const nestedControlInvalid = !form.controls.nested.value.controls.nestedName.valid;
      if (nestedControlInvalid) {
        assert.equal(form.controls.nested.value.valid, false, "CRITICAL BUG: Nested form should be invalid when control is invalid");
      }
    });

    it("nested form validity should be consistent", () => {
      const nestedForm = formGroup<{ nestedName: string }>({
        nestedName: ["John", [Validators.required]],
      });

      const form = formGroup<{ name: string; nested: Form<{ nestedName: string }> }>({
        name: ["John", [Validators.required]],
        nested: nestedForm,
      });

      assert.equal(form.controls.nested.value.valid, true, "Nested form should be valid initially");
      assert.equal(form.controls.nested.value.controls.nestedName.valid, true, "Nested control should be valid");

      form.controls.nested.value.controls.nestedName.value = "";
      assert.equal(form.controls.nested.value.controls.nestedName.valid, false, "Nested control should be invalid");
      assert.equal(form.controls.nested.value.valid, false, "Nested form should be invalid when control is invalid");
    });
  });

  describe("Edge cases - invalids array consistency", () => {
    it("form.invalids should contain all invalid controls", () => {
      const form = formGroup<{ name: string; email: string; age: number }>({
        name: ["John", [Validators.required]],
        email: ["john@example.com", [Validators.required]],
        age: [25],
      });

      assert.equal(form.invalids.length, 0, "Should have no invalid controls initially");

      form.controls.name.value = "";
      form.controls.email.value = "";

      const invalidControls = form.invalids;
      assert.equal(invalidControls.length, 2, "Should have 2 invalid controls");
      assert.ok(invalidControls.includes(form.controls.name), "Name control should be in invalids");
      assert.ok(invalidControls.includes(form.controls.email), "Email control should be in invalids");
      assert.equal(form.valid, false, "Form should be invalid when invalids array has items");
    });

    it("form.valid should be false when invalids array is not empty", () => {
      const form = formGroup<{ name: string; email: string }>({
        name: ["John", [Validators.required]],
        email: ["john@example.com", [Validators.required]],
      });

      form.controls.name.value = "";
      const invalids = form.invalids;
      
      assert.ok(invalids.length > 0, "Invalids array should not be empty");
      assert.equal(form.valid, false, "Form should be invalid when invalids array is not empty");
      
      // Check that form.valid matches the invalids array state
      assert.equal(form.valid, invalids.length === 0, "Form.valid should be false when invalids.length > 0");
    });

    it("form.valid should match control.valid states exactly", () => {
      const form = formGroup<{ name: string; email: string; age: number }>({
        name: ["John", [Validators.required]],
        email: ["john@example.com", [Validators.required]],
        age: [25],
      });

      // All valid
      const allControlsValid = form._flattenedControls?.every((c) => c.valid) ?? true;
      assert.equal(form.valid, allControlsValid, "Form.valid should match all controls being valid");

      // Make one invalid
      form.controls.name.value = "";
      const allControlsValidAfter = form._flattenedControls?.every((c) => c.valid) ?? true;
      assert.equal(form.valid, allControlsValidAfter, "Form.valid should match all controls being valid");
      assert.equal(allControlsValidAfter, false, "Not all controls should be valid");
      assert.equal(form.valid, false, "Form should be invalid");
    });
  });

  describe("Stress test - multiple operations", () => {
    it("form validity should remain consistent through complex operations", () => {
      const form = formGroup<{ name: string; email: string; age: number }>({
        name: ["John", [Validators.required]],
        email: ["john@example.com", [Validators.required]],
        age: [25],
      });

      // Operation 1: Make invalid
      form.controls.name.value = "";
      assert.equal(form.valid, false, "Should be invalid after step 1");

      // Operation 2: Fix and make another invalid
      form.controls.name.value = "John";
      form.controls.email.value = "";
      assert.equal(form.valid, false, "Should be invalid after step 2");

      // Operation 3: PatchValue
      form.patchValue({ name: "", email: "john@example.com" });
      assert.equal(form.valid, false, "Should be invalid after step 3");

      // Operation 4: Reset
      form.reset();
      assert.equal(form.valid, true, "Should be valid after reset");

      // Operation 5: Add validator
      form.controls.name.addValidator((val: string) => val.length >= 10);
      assert.equal(form.controls.name.valid, false, "Control should be invalid after adding failing validator");
      assert.equal(form.valid, false, "Should be invalid after adding failing validator");

      // Operation 6: Remove validator
      form.controls.name.removeValidator((val: string) => val.length >= 10);
      assert.equal(form.controls.name.valid, true, "Control should be valid after removing failing validator");
      assert.equal(form.valid, true, "Should be valid after removing failing validator");
    });
  });

  describe("Critical bug test - controls invalid but form valid", () => {
    it("CRITICAL: form should NEVER be valid when any control is invalid", () => {
      const form = formGroup<{ name: string; email: string; age: number }>({
        name: ["John", [Validators.required]],
        email: ["john@example.com", [Validators.required]],
        age: [25],
      });

      // Make controls invalid one by one and verify form is invalid
      form.controls.name.value = "";
      assert.equal(form.controls.name.valid, false, "Name control should be invalid");
      assert.equal(form.valid, false, "CRITICAL: Form MUST be invalid when name control is invalid");

      form.controls.name.value = "John";
      form.controls.email.value = "";
      assert.equal(form.controls.email.valid, false, "Email control should be invalid");
      assert.equal(form.valid, false, "CRITICAL: Form MUST be invalid when email control is invalid");

      // Check all controls
      const allControls = form._flattenedControls || [];
      const hasInvalidControl = allControls.some((c) => !c.valid);
      if (hasInvalidControl) {
        assert.equal(form.valid, false, "CRITICAL: Form MUST be invalid when ANY control is invalid");
      }
    });

    it("CRITICAL: form.valid should equal !form.invalids.length > 0", () => {
      const form = formGroup<{ name: string; email: string }>({
        name: ["John", [Validators.required]],
        email: ["john@example.com", [Validators.required]],
      });

      // When valid
      assert.equal(form.invalids.length, 0, "Should have no invalids when valid");
      assert.equal(form.valid, true, "Should be valid when no invalids");

      // When invalid
      form.controls.name.value = "";
      assert.ok(form.invalids.length > 0, "Should have invalids when invalid");
      assert.equal(form.valid, false, "CRITICAL: Should be invalid when invalids.length > 0");
    });

    it("CRITICAL: form.valid should equal all controls being valid", () => {
      const form = formGroup<{ name: string; email: string; age: number }>({
        name: ["John", [Validators.required]],
        email: ["john@example.com", [Validators.required]],
        age: [25],
      });

      const allControlsValid = form._flattenedControls?.every((c) => c.valid) ?? true;
      assert.equal(form.valid, allControlsValid, "CRITICAL: Form.valid should equal all controls being valid");

      form.controls.name.value = "";
      const allControlsValidAfter = form._flattenedControls?.every((c) => c.valid) ?? true;
      assert.equal(form.valid, allControlsValidAfter, "CRITICAL: Form.valid should equal all controls being valid after change");
      assert.equal(allControlsValidAfter, false, "Not all controls should be valid");
    });

    it("CRITICAL BUG EXPOSURE: Direct check - if ANY control is invalid, form MUST be invalid", () => {
      const form = formGroup<{ name: string; email: string; age: number }>({
        name: ["John", [Validators.required]],
        email: ["john@example.com", [Validators.required]],
        age: [25],
      });

      // Test with first control
      form.controls.name.value = "";
      const nameInvalid = !form.controls.name.valid;
      if (nameInvalid) {
        assert.equal(form.valid, false, "BUG: Form reports valid when name control is invalid!");
      }

      // Test with second control
      form.controls.name.value = "John";
      form.controls.email.value = "";
      const emailInvalid = !form.controls.email.valid;
      if (emailInvalid) {
        assert.equal(form.valid, false, "BUG: Form reports valid when email control is invalid!");
      }

      // Test with all controls
      form.controls.name.value = "";
      form.controls.email.value = "";
      const anyInvalid = form._flattenedControls?.some((c) => !c.valid) ?? false;
      if (anyInvalid) {
        assert.equal(form.valid, false, "BUG: Form reports valid when ANY control is invalid!");
      }
    });

    it("CRITICAL BUG EXPOSURE: Check invalids array consistency", () => {
      const form = formGroup<{ name: string; email: string }>({
        name: ["John", [Validators.required]],
        email: ["john@example.com", [Validators.required]],
      });

      form.controls.name.value = "";
      
      // Check control validity
      const controlInvalid = !form.controls.name.valid;
      const invalidsCount = form.invalids.length;
      const formValid = form.valid;

      // If control is invalid, invalids should have items AND form should be invalid
      if (controlInvalid) {
        assert.ok(invalidsCount > 0, "Invalids array should contain invalid control");
        assert.equal(formValid, false, "BUG: Form.valid is true but control is invalid and invalids.length > 0!");
      }

      // The form.valid should match the invalids array state
      assert.equal(formValid, invalidsCount === 0, "Form.valid should be false when invalids.length > 0");
    });

    it("CRITICAL BUG EXPOSURE: Check _flattenedControls consistency", () => {
      const form = formGroup<{ name: string; email: string; age: number }>({
        name: ["John", [Validators.required]],
        email: ["john@example.com", [Validators.required]],
        age: [25],
      });

      form.controls.name.value = "";

      const allControlsValid = form._flattenedControls?.every((c) => c.valid) ?? true;
      const formValid = form.valid;

      // These should ALWAYS match
      assert.equal(formValid, allControlsValid, "BUG: Form.valid does not match all controls being valid!");
      
      // If any control is invalid, form must be invalid
      const anyInvalid = form._flattenedControls?.some((c) => !c.valid) ?? false;
      if (anyInvalid) {
        assert.equal(formValid, false, "BUG: Form.valid is true but some controls are invalid!");
      }
    });
  });
});

