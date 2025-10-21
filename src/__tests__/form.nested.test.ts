import { assert, describe, it } from "vitest";
import { formGroup } from "../form/functional";
import { Form } from "../form";

// Boilerplate test cases for nested forms and arrays
describe("Form - nested forms and arrays", () => {
  it("supports nested Form as a control value", () => {
    const form = formGroup({
      version: 0,
      user: formGroup({
        name: "Alice",
        age: 28,
      }),
      admin: formGroup<{
        name: string;
        age: number;
        permissions: string[];
      }>({
        name: "Bob",
        age: 35,
        permissions: ["read", "write"] as string[],
      }),
    });

    assert.equal(
      form.controls.version.value,
      0,
      "Version control should be initialized with 0"
    );
    assert.deepEqual(
      form.controls.user.value.build(),
      {
        name: "Alice",
        age: 28,
      },
      "User form should match expected structure"
    );
    assert.deepEqual(
      form.controls.admin.value.build(),
      {
        name: "Bob",
        age: 35,
        permissions: ["read", "write"] as any,
      },
      "Admin form should match expected structure"
    );

    // Update nested form values and verify propagation
    form.controls.user.value.patchValue({ age: 29 });

    assert.equal(
      form.controls.user.value.controls.age.value,
      29,
      "User age should be updated to 29"
    );

    assert.equal(
      form.dirty,
      true,
      "Parent form should be marked dirty after nested form update"
    );

    assert.equal(
      form.controls.user.dirty,
      true,
      "User control should be marked dirty after update"
    );

    // reset
    form.reset();

    assert.equal(
      form.controls.user.value.controls.age.value,
      28,
      "User age should be reset to initial value 28"
    );

    assert.equal(
      form.dirty,
      false,
      "Parent form should not be dirty after reset"
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
    const form = formGroup<{
      users: Form<{ name: string; age: number }>[];
      admins: Form<{ name: string; age: number }>[];
    }>({
      users: obj.map((u) => formGroup(u)) as Form<{
        name: string;
        age: number;
      }>[],
      admins: [
        obj.map((u) => formGroup(u)) as Form<{ name: string; age: number }>[],
        [],
      ],
    });

    assert.equal(form.controls.users.value.length, 3, "Should have 3 users");

    // Update a value in the first user
    form.controls.users.value[0].controls.age.value = 21;
    assert.equal(
      form.controls.users.value[0].controls.age.value,
      21,
      "First user's age should be updated to 21"
    );

    // Add a new user form
    /**
    assert.equal(
      form.dirty,
      true,
      "Parent form should be dirty after nested form update",
    );
    */

    form.controls.users.value = [
      ...form.controls.users.value,
      ...[
        formGroup({
          name: "User4",
          age: 40,
        }),
      ],
    ];

    assert.equal(form.controls.users.value.length, 4, "Should have 4 users");

    // Test admins array
    assert.equal(form.controls.admins.value.length, 3, "Should have 3 admins");

    // Update a value in the first admin
    form.controls.admins.value[0].controls.age.value = 36;
    assert.equal(
      form.controls.admins.value[0].controls.age.value,
      36,
      "First admin's age should be updated to 36"
    );

    // Verify parent form is still dirty
    assert.equal(
      form.dirty,
      true,
      "Parent form should remain dirty after admin update"
    );

    // Add a new admin form
    form.controls.admins.value = [
      ...form.controls.admins.value,
      formGroup({
        name: "Admin4",
        age: 45,
      }),
    ];

    assert.equal(form.controls.admins.value.length, 4, "Should have 4 admins");

    // Verify we can access the new admin's data
    assert.equal(
      form.controls.admins.value[3].controls.name.value,
      "Admin4",
      "New admin's name should be Admin4"
    );
    assert.equal(
      form.controls.admins.value[3].controls.age.value,
      45,
      "New admin's age should be 45"
    );
  });
  it("nested forms builds correct structure", () => {
    const form = formGroup<{
      profile: {
        firstName: string;
        lastName: string;
        address: { street: string; city: string; zip: string };
      };
      settings: { theme: string; notifications: boolean }[];
    }>({
      profile: formGroup({
        firstName: "John",
        lastName: "Doe",
        address: formGroup({
          street: "123 Main St",
          city: "Anytown",
          zip: "12345",
        }),
      }),
      settings: [
        formGroup({
          theme: "dark",
          notifications: true,
        }),
        formGroup({
          theme: "light",
          notifications: false,
        }),
      ] as Form<{ theme: string; notifications: boolean }>[],
    } as any);

    form.controls.settings.value[0].controls.notifications.value = false;
    form.controls.settings.value[1].controls.theme.value = "dark";

    const built = form.build();
    assert.deepEqual(
      built,
      {
        profile: {
          firstName: "John",
          lastName: "Doe",
          address: {
            street: "123 Main St",
            city: "Anytown",
            zip: "12345",
          },
        },
        settings: [
          {
            theme: "dark",
            notifications: false,
          },
          {
            theme: "dark",
            notifications: false,
          },
        ],
      },
      "Built structure should match expected nested object"
    );

    assert.doesNotThrow(() => {
      JSON.stringify(form);
    });
  });
});
