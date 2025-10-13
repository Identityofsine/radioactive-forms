import { assert, describe, it } from "vitest";
import { Form } from "../form/form";

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
