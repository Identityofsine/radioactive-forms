import { assert, describe, it } from "vitest";
import { formGroup } from "../form/functional";

// Boilerplate test cases for nested forms and arrays
describe("Form - nested forms and arrays", () => {
  it("supports nested Form as a control value", () => {
    const form = formGroup({
      version: 0,
      user: formGroup({
        name: "Alice",
        age: 28,
      }),
      admin: formGroup({
        name: "Bob",
        age: 35,
        permissions: ["read", "write"],
      }),
    });

    assert.equal(
      form.controls.version.value,
      0,
      "Version control should be initialized with 0",
    );
    assert.deepEqual(
      form.controls.user.value.build(),
      {
        name: "Alice",
        age: 28,
      },
      "User form should match expected structure",
    );
    assert.deepEqual(
      form.controls.admin.value.build(),
      {
        name: "Bob",
        age: 35,
        permissions: ["read", "write"] as any,
      },
      "Admin form should match expected structure",
    );

    // Update nested form values and verify propagation
    form.controls.user.value.patchValue({ age: 29 });

    assert.equal(
      form.controls.user.value.controls.age.value,
      29,
      "User age should be updated to 29",
    );

    assert.equal(
      form.dirty,
      true,
      "Parent form should be marked dirty after nested form update",
    );

    assert.equal(
      form.controls.user.dirty,
      true,
      "User control should be marked dirty after update",
    );

    // reset
    form.reset();

    assert.equal(
      form.controls.user.value.controls.age.value,
      28,
      "User age should be reset to initial value 28",
    );

    assert.equal(
      form.dirty,
      false,
      "Parent form should not be dirty after reset",
    );
  });

  it("adding forms to form array", () => {
    const obj = [
      {
        name: "User1",
        age: 20,
      },
      {
        name: "User2",
        age: 25,
      },
      {
        name: "User3",
        age: 30,
      },
    ];

    // form
    const form = formGroup({
      users: obj.map((u) => formGroup(u)),
    });

    assert.equal(form.controls.users.value.length, 3, "Should have 3 users");

    // Update a value in the first user
    form.controls.users.value[0].controls.age.value = 21;
    assert.equal(
      form.controls.users.value[0].controls.age.value,
      21,
      "First user's age should be updated to 21",
    );

    // Add a new user form
    assert.equal(
      form.dirty,
      true,
      "Parent form should be dirty after nested form update",
    );

    form.controls.users.value.push(
      formGroup({
        name: "User4",
        age: 40,
      }),
    );

    assert.equal(form.controls.users.value.length, 4, "Should have 4 users");
  });
});
