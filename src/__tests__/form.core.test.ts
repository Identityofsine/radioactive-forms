import { describe, it, assert } from "vitest";
import { Form } from "../form/form";
import { formGroup } from "../form/functional";
import { Validators } from "../form";

type TestForm = {
  name: string;
  age: number;
  email: string;
  likes: string[];
  dislikes: string[];
  feloniesCommitted: number;
};

const initialData: TestForm = {
  name: "Admin",
  age: 32,
  email: "admin@example.com",
  likes: ["sports", "music"],
  dislikes: ["spam", "ads"],
  feloniesCommitted: 0,
};

const BasicForm = (customObjectSchema: any = {}) =>
  formGroup<TestForm>({
    ...initialData,
    feloniesCommitted: [0, [Validators.required]],
    ...customObjectSchema,
  });

// Boilerplate test cases for core Form behavior
describe("Form - core behavior", () => {
  let form: Form<TestForm>;

  it("initializes with provided controls", () => {
    form = BasicForm();
    assert.equal(
      form.controls.name.value,
      "Admin",
      `Primitive control 'name' (string) should be initialized with 'Admin'`,
    );
    assert.equal(
      form.controls.age.value,
      32,
      `Primitive control 'age' (number) should be initialized with 32`,
    );
    assert.equal(
      form.controls.email.value,
      "admin@example.com",
      `Primitive control 'email' (string) should be initialized with 'admin@example.com'`,
    );
    assert.deepEqual(
      form.controls.likes.value,
      ["sports", "music"],
      `Array control 'likes' should be initialized with ['sports', 'music']`,
    );
    assert.deepEqual(
      form.controls.dislikes.value,
      ["spam", "ads"],
      `Array control 'dislikes' should be initialized with ['spam', 'ads']`,
    );
    assert.equal(
      form.controls.feloniesCommitted.value,
      0,
      `Complex control 'feloniesCommitted' should be initialized with 0`,
    );
    assert.equal(
      form.controls.feloniesCommitted.valid,
      true,
      `'feloniesCommitted' should be valid with initial value 0`,
    );
  });

  it("patchValue updates multiple controls", () => {
    form.patchValue({
      name: "User",
      email: "user@example.com",
    });
    assert.equal(form.controls.name.value, "User");
    assert.equal(form.controls.email.value, "user@example.com");
  });

  it("reset clears dirty/touched and restores initial values", () => {
    form.controls.name.dirty = true;
    assert.equal(
      form.controls.name.dirty,
      true,
      "control should be dirty after modification",
    );
    assert.equal(
      form.dirty,
      true,
      "form should be dirty if any control is dirty",
    );
    form.reset();
    assert.equal(
      form.controls.name.dirty,
      false,
      "control should not be dirty after reset",
    );
  });

  it("build produces plain object tree", () => {
    const objTree = form.build();
    assert.deepEqual(
      objTree,
      initialData,
      `build objects should match initial data\nGot: ${JSON.stringify(objTree, null, 2)}\nExpected: ${JSON.stringify(initialData, null, 2)}`,
    );
  });
});

describe("Form - validation behavior", () => {
  const form = BasicForm({
    feloniesCommitted: [0, [Validators.required]],
    name: ["Admin", [(val: string) => val.length > 2]],
  });

  it("initializes with valid state", () => {
    assert.equal(form.valid, true, "Form should be valid with initial values");
    assert.equal(
      form.controls.name.valid,
      true,
      "Control 'name' should be valid with initial value 'Admin'",
    );
    assert.equal(
      form.controls.feloniesCommitted.valid,
      true,
      "Control 'feloniesCommitted' should be valid with initial value 0",
    );
  });

  it("should be invalid after setting a invalid value", () => {
    form.controls.name.value = "A";
    assert.equal(
      form.controls.name.valid,
      false,
      "Control 'name' should be invalid with value 'A'",
    );
    form.controls.feloniesCommitted.value = null as any;
    assert.equal(
      form.controls.feloniesCommitted.valid,
      false,
      "Control 'feloniesCommitted' should be invalid with value null",
    );
    assert.equal(
      form.valid,
      false,
      "Form should be invalid if any control is invalid",
    );
  });

  it("form validity should revert to valid after resetting values", () => {
    form.reset();
    assert.equal(form.valid, true, "Form should be valid after reset");
    assert.equal(
      form.controls.name.valid,
      true,
      "Control 'name' should be valid after reset",
    );
    assert.equal(
      form.controls.feloniesCommitted.valid,
      true,
      "Control 'feloniesCommitted' should be valid after reset",
    );
  });
});
