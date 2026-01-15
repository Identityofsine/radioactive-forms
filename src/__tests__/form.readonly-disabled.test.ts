import { assert, describe, it } from "vitest";
import { Form } from "../form/form";
import { formGroup } from "../form/functional";

const GenericForm = () =>
  new Form({
    name: "Christine",
    age: 25,
    email: "christine@example.com",
    likes: ["cats", "iced-coffee", "travel"],
    dislikes: ["loud-noises", "crowds", "software-bugs"],
  });

const checkDisabled = (form: Form<any>, expected: boolean) => {
  assert.equal(form.disabled, expected, `Form disabled should be ${expected}`);
  Object.values(form.controls).forEach((control) => {
    assert.equal(
      control.disabled,
      expected,
      `Control ${String(control.key)} disabled should be ${expected}`,
    );
  });
};

const checkReadonly = (form: Form<any>, expected: boolean) => {
  assert.equal(form.readonly, expected, `Form readonly should be ${expected}`);
  Object.values(form.controls).forEach((control) => {
    assert.equal(
      control.readonly,
      expected,
      `Control ${String(control.key)} readonly should be ${expected}`,
    );
  });
};

// Boilerplate test cases for readonly/disabled behavior
describe("Form - readonly/disabled", () => {
  const form = GenericForm();
  it("toggles readonly at form level and propagates to controls", () => {
    form.readonly = true;
    checkReadonly(form, true);

    form.disabled = true;
    checkDisabled(form, true);

    form.readonly = false;
    checkReadonly(form, false);

    form.disabled = false;
    checkDisabled(form, false);
  });

  it("readonly cascades to nested forms", () => {
    const form = new Form({
      user: GenericForm(),
      admin: GenericForm(),
    });

    form.readonly = true;
    checkReadonly(form, true);

    form.disabled = true;
    checkDisabled(form, true);

    form.readonly = false;
    checkReadonly(form, false);

    form.disabled = false;
    checkDisabled(form, false);
  });
});

describe("Form - initial readOnly option", () => {
  it("does not override nested forms that explicitly set readOnly (even when parent is false)", () => {
    const complex = formGroup({ something: 1 }, { readOnly: true });

    // Parent form default readOnly: false
    const parent = new Form({
      primitive1: 0,
      complex,
    });

    assert.equal(parent.readonly, false);
    assert.equal(parent.controls.primitive1.readonly, false);

    // Nested form should keep its own explicit readOnly: true (not overridden to false)
    assert.equal(parent.controls.complex.value.readonly, true);
  });

  it("overrides nested forms/arrays when readOnly was not explicitly set", () => {
    // Explicit nested: should NOT be overridden
    const complex = formGroup({ something: 1 }, { readOnly: true });

    // Implicit nested: should be overridden
    const complex2 = formGroup({ something2: 2 });

    // Mixed explicit array: should NOT be overridden (keep [true, false])
    const complex3 = [
      formGroup({ something3: "a" }, { readOnly: true }),
      formGroup({ something6: "b" }, { readOnly: false }),
    ];

    // Implicit array: should be overridden
    const complex4 = [formGroup({ something4: "c" }), formGroup({ something5: "d" })];

    const parent = new Form(
      {
        primitive1: 0,
        primitive2: [0, []],
        complex,
        complex2,
        complex3,
        complex4,
      },
      undefined,
      undefined,
      { readOnly: true }
    );

    assert.equal(parent.readonly, true);
    assert.equal(parent.controls.primitive1.readonly, true);
    assert.equal(parent.controls.primitive2.readonly, true);

    // complex should keep explicit readOnly: true
    assert.equal(parent.controls.complex.value.readonly, true);

    // complex2 should be overridden to true
    assert.equal(parent.controls.complex2.value.readonly, true);

    // mixed explicit array should NOT be overridden
    assert.equal(parent.controls.complex3.value[0].readonly, true);
    assert.equal(parent.controls.complex3.value[1].readonly, false);

    // implicit array should be overridden
    assert.equal(parent.controls.complex4.value[0].readonly, true);
    assert.equal(parent.controls.complex4.value[1].readonly, true);
  });

  it("runtime parent readonly setter always overrides nested explicit readOnly", () => {
    const nestedExplicitTrue = formGroup({ a: 1 }, { readOnly: true });
    const nestedExplicitFalse = formGroup({ b: 2 }, { readOnly: false });
    const mixedArray = [
      formGroup({ c: 3 }, { readOnly: true }),
      formGroup({ d: 4 }, { readOnly: false }),
    ];

    const parent = new Form(
      {
        primitive1: 0,
        nestedExplicitTrue,
        nestedExplicitFalse,
        mixedArray,
      },
      undefined,
      undefined,
      { readOnly: false }
    );

    // Initial explicit values should be respected
    assert.equal(parent.readonly, false);
    assert.equal(parent.controls.primitive1.readonly, false);
    assert.equal(parent.controls.nestedExplicitTrue.value.readonly, true);
    assert.equal(parent.controls.nestedExplicitFalse.value.readonly, false);
    assert.equal(parent.controls.mixedArray.value[0].readonly, true);
    assert.equal(parent.controls.mixedArray.value[1].readonly, false);

    // Runtime override: parent wins everywhere
    parent.readonly = true;
    assert.equal(parent.readonly, true);
    assert.equal(parent.controls.primitive1.readonly, true);
    assert.equal(parent.controls.nestedExplicitTrue.value.readonly, true);
    assert.equal(parent.controls.nestedExplicitFalse.value.readonly, true);
    assert.equal(parent.controls.mixedArray.value[0].readonly, true);
    assert.equal(parent.controls.mixedArray.value[1].readonly, true);

    parent.readonly = false;
    assert.equal(parent.readonly, false);
    assert.equal(parent.controls.primitive1.readonly, false);
    assert.equal(parent.controls.nestedExplicitTrue.value.readonly, false);
    assert.equal(parent.controls.nestedExplicitFalse.value.readonly, false);
    assert.equal(parent.controls.mixedArray.value[0].readonly, false);
    assert.equal(parent.controls.mixedArray.value[1].readonly, false);
  });
});
