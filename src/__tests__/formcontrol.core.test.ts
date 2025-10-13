import { assert, describe, it } from "vitest";
import { Validators } from "../form";
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
