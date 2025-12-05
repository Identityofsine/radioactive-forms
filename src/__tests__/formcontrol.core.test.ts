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
