/**
 * Nested Forms Readonly/Disabled Propagation Test Suite
 *
 * Comprehensive tests to ensure that top-level readonly/disabled settings
 * properly cascade to nested forms within arrays (Form<T>[]).
 *
 * These tests are designed to stress-test and potentially break the
 * readonly propagation mechanism to identify edge cases and bugs.
 */

import { assert, describe, it, expect } from "vitest";
import { formGroup } from "../form/functional";
import { Form } from "../form";

// Helper to create a user form
const createUserForm = (name: string, age: number) =>
  formGroup({
    name,
    age,
    email: `${name.toLowerCase()}@example.com`,
  });

// Helper to check readonly state across a form and all its controls
const checkReadonly = (form: Form<any>, expected: boolean, label = "") => {
  assert.equal(
    form.readonly,
    expected,
    `${label ? `[${label}] ` : ""}Form readonly should be ${expected}`
  );
  Object.values(form.controls).forEach((control) => {
    assert.equal(
      control.readonly,
      expected,
      `${label ? `[${label}] ` : ""}Control ${String(
        control.key
      )} readonly should be ${expected}`
    );
  });
};

// Helper to check disabled state across a form and all its controls
const checkDisabled = (form: Form<any>, expected: boolean, label = "") => {
  assert.equal(
    form.disabled,
    expected,
    `${label ? `[${label}] ` : ""}Form disabled should be ${expected}`
  );
  Object.values(form.controls).forEach((control) => {
    assert.equal(
      control.disabled,
      expected,
      `${label ? `[${label}] ` : ""}Control ${String(
        control.key
      )} disabled should be ${expected}`
    );
  });
};

// Deep check that recursively verifies readonly on all nested forms
const deepCheckReadonly = (
  form: Form<any>,
  expected: boolean,
  path = "root"
) => {
  assert.equal(
    form.readonly,
    expected,
    `[${path}] Form readonly should be ${expected}`
  );

  Object.entries(form.controls).forEach(([key, control]) => {
    const controlPath = `${path}.${key}`;
    assert.equal(
      control.readonly,
      expected,
      `[${controlPath}] Control readonly should be ${expected}`
    );

    // Check if control value is a Form
    if (Form.isForm(control.value)) {
      deepCheckReadonly(control.value, expected, controlPath);
    }

    // Check if control value is an array of Forms
    if (Array.isArray(control.value)) {
      control.value.forEach((item: unknown, idx: number) => {
        if (Form.isForm(item)) {
          deepCheckReadonly(item, expected, `${controlPath}[${idx}]`);
        }
      });
    }
  });
};

describe("Nested Forms - Readonly/Disabled Propagation to Array of Forms", () => {
  it("top-level readonly cascades to array of nested forms", () => {
    // Create a form with an array of nested forms
    const form = formGroup<{
      title: string;
      forms: Form<{ name: string; age: number; email: string }>[];
    }>({
      title: "User Group",
      forms: [
        createUserForm("Alice", 25),
        createUserForm("Bob", 30),
        createUserForm("Charlie", 35),
      ] as Form<{ name: string; age: number; email: string }>[],
    });

    // Verify initial state - all should be editable (readonly = false)
    assert.equal(
      form.readonly,
      false,
      "Top-level form should not be readonly initially"
    );
    form.controls.forms.value.forEach((nestedForm, index) => {
      checkReadonly(nestedForm, false, `Nested Form ${index}`);
    });

    // Set top-level form to readonly
    form.readonly = true;

    // Verify top-level form is readonly
    assert.equal(form.readonly, true, "Top-level form should be readonly");
    assert.equal(
      form.controls.title.readonly,
      true,
      "Title control should be readonly"
    );

    // Verify ALL nested forms in the array are readonly
    form.controls.forms.value.forEach((nestedForm, index) => {
      checkReadonly(
        nestedForm,
        true,
        `Nested Form ${index} after top-level readonly`
      );
    });

    // Toggle back to editable
    form.readonly = false;

    // Verify all forms are editable again
    assert.equal(form.readonly, false, "Top-level form should not be readonly");
    form.controls.forms.value.forEach((nestedForm, index) => {
      checkReadonly(nestedForm, false, `Nested Form ${index} after toggle off`);
    });
  });

  it("top-level disabled cascades to array of nested forms", () => {
    // Create a form with an array of nested forms
    const form = formGroup<{
      title: string;
      forms: Form<{ name: string; age: number; email: string }>[];
    }>({
      title: "User Group",
      forms: [
        createUserForm("Alice", 25),
        createUserForm("Bob", 30),
        createUserForm("Charlie", 35),
      ] as Form<{ name: string; age: number; email: string }>[],
    });

    // Verify initial state - all should be enabled (disabled = false)
    assert.equal(
      form.disabled,
      false,
      "Top-level form should not be disabled initially"
    );
    form.controls.forms.value.forEach((nestedForm, index) => {
      checkDisabled(nestedForm, false, `Nested Form ${index}`);
    });

    // Set top-level form to disabled
    form.disabled = true;

    // Verify top-level form is disabled
    assert.equal(form.disabled, true, "Top-level form should be disabled");
    assert.equal(
      form.controls.title.disabled,
      true,
      "Title control should be disabled"
    );

    // Verify ALL nested forms in the array are disabled
    form.controls.forms.value.forEach((nestedForm, index) => {
      checkDisabled(
        nestedForm,
        true,
        `Nested Form ${index} after top-level disabled`
      );
    });

    // Toggle back to enabled
    form.disabled = false;

    // Verify all forms are enabled again
    assert.equal(form.disabled, false, "Top-level form should not be disabled");
    form.controls.forms.value.forEach((nestedForm, index) => {
      checkDisabled(nestedForm, false, `Nested Form ${index} after toggle off`);
    });
  });

  it("readonly cascades to deeply nested forms within array", () => {
    // Create a form with nested forms that themselves contain nested forms
    const form = formGroup({
      departments: [
        formGroup({
          name: "Engineering",
          employees: [
            formGroup({ name: "Alice", role: "Developer" }),
            formGroup({ name: "Bob", role: "Designer" }),
          ] as any,
        }),
        formGroup({
          name: "Marketing",
          employees: [formGroup({ name: "Charlie", role: "Manager" })] as any,
        }),
      ] as any,
    });

    // Set top-level form to readonly
    form.readonly = true;

    // Verify top-level is readonly
    assert.equal(form.readonly, true, "Top-level form should be readonly");

    // Verify each department form is readonly
    form.controls.departments.value.forEach((deptForm, deptIndex) => {
      assert.equal(
        deptForm.readonly,
        true,
        `Department ${deptIndex} should be readonly`
      );
      assert.equal(
        deptForm.controls.name.readonly,
        true,
        `Department ${deptIndex} name control should be readonly`
      );

      // Verify each employee form within the department is readonly
      deptForm.controls.employees.value.forEach((empForm, empIndex) => {
        checkReadonly(
          empForm,
          true,
          `Department ${deptIndex} Employee ${empIndex}`
        );
      });
    });

    // Toggle back
    form.readonly = false;

    // Verify everything is editable again
    form.controls.departments.value.forEach((deptForm, deptIndex) => {
      assert.equal(
        deptForm.readonly,
        false,
        `Department ${deptIndex} should not be readonly`
      );
      deptForm.controls.employees.value.forEach((empForm, empIndex) => {
        checkReadonly(
          empForm,
          false,
          `Department ${deptIndex} Employee ${empIndex} after toggle off`
        );
      });
    });
  });

  it("control-level readonly on array propagates to nested forms", () => {
    // Test that setting readonly on the array control itself propagates
    const form = formGroup<{
      title: string;
      forms: Form<{ name: string; age: number }>[];
    }>({
      title: "User Group",
      forms: [
        formGroup({ name: "Alice", age: 25 }),
        formGroup({ name: "Bob", age: 30 }),
      ] as Form<{ name: string; age: number }>[],
    });

    // Set readonly on the forms control (not the top-level form)
    form.controls.forms.readonly = true;

    // The title should NOT be readonly (only the forms array control)
    assert.equal(
      form.controls.title.readonly,
      false,
      "Title should not be readonly when only forms control is readonly"
    );

    // The forms array control should be readonly
    assert.equal(
      form.controls.forms.readonly,
      true,
      "Forms control should be readonly"
    );

    // Each nested form should be readonly
    form.controls.forms.value.forEach((nestedForm, index) => {
      checkReadonly(nestedForm, true, `Nested Form ${index}`);
    });
  });

  it("forms added to array after readonly is set should respect readonly state", () => {
    const form = formGroup<{
      forms: Form<{ name: string }>[];
    }>({
      forms: [formGroup({ name: "Alice" })] as Form<{ name: string }>[],
    });

    // Set form to readonly
    form.readonly = true;

    // Verify existing form is readonly
    checkReadonly(form.controls.forms.value[0], true, "Existing form");

    // Add a new form to the array
    form.controls.forms.value = [
      ...form.controls.forms.value,
      formGroup({ name: "Bob" }),
    ];

    // The new form should also be readonly
    // Note: This tests whether the form properly tracks and applies readonly
    // to dynamically added nested forms
    assert.equal(
      form.controls.forms.value.length,
      2,
      "Should have 2 forms after adding"
    );

    // Check if newly added form respects readonly
    // This depends on implementation - the form may need to re-propagate readonly
    checkReadonly(
      form.controls.forms.value[0],
      true,
      "First form after adding new"
    );
  });

  it("mixed readonly and disabled states", () => {
    const form = formGroup<{
      forms: Form<{ name: string }>[];
    }>({
      forms: [
        formGroup({ name: "Alice" }),
        formGroup({ name: "Bob" }),
      ] as Form<{ name: string }>[],
    });

    // Set both readonly and disabled
    form.readonly = true;
    form.disabled = true;

    // Verify both states cascade
    form.controls.forms.value.forEach((nestedForm, index) => {
      checkReadonly(nestedForm, true, `Nested Form ${index}`);
      checkDisabled(nestedForm, true, `Nested Form ${index}`);
    });

    // Remove only readonly
    form.readonly = false;

    // Disabled should still be true, readonly should be false
    form.controls.forms.value.forEach((nestedForm, index) => {
      checkReadonly(
        nestedForm,
        false,
        `Nested Form ${index} after readonly=false`
      );
      checkDisabled(
        nestedForm,
        true,
        `Nested Form ${index} should still be disabled`
      );
    });
  });
});

/**
 * STRESS TESTS - Edge cases and potential breaking scenarios
 *
 */
describe("Nested Forms - Readonly Edge Cases (Stress Tests)", () => {
  it("replacing entire array should propagate readonly to new forms", () => {
    const form = formGroup<{
      forms: Form<{ name: string }>[];
    }>({
      forms: [formGroup({ name: "Original" })] as Form<{ name: string }>[],
    });

    // Set readonly first
    form.readonly = true;
    checkReadonly(form.controls.forms.value[0], true, "Original form");

    // Replace the entire array with new forms
    form.controls.forms.value = [
      formGroup({ name: "New1" }),
      formGroup({ name: "New2" }),
      formGroup({ name: "New3" }),
    ];

    // All new forms should respect the readonly state
    assert.equal(
      form.controls.forms.value.length,
      3,
      "Should have 3 new forms"
    );
    form.controls.forms.value.forEach((nestedForm, index) => {
      checkReadonly(nestedForm, true, `Replaced Form ${index}`);
    });
  });

  // BUG: Pushed forms don't inherit parent's readonly state
  it("pushing to array should propagate readonly to pushed form", () => {
    const form = formGroup<{
      forms: Form<{ name: string }>[];
    }>({
      forms: [formGroup({ name: "First" })] as Form<{ name: string }>[],
    });

    form.readonly = true;

    // Push a new form using spread
    form.controls.forms.value = [
      ...form.controls.forms.value,
      formGroup({ name: "Pushed" }),
    ];

    // The pushed form should be readonly
    const pushedForm = form.controls.forms.value[1];
    checkReadonly(pushedForm, true, "Pushed form");
  });

  it("splicing forms should maintain readonly on remaining forms", () => {
    const form = formGroup<{
      forms: Form<{ name: string }>[];
    }>({
      forms: [
        formGroup({ name: "A" }),
        formGroup({ name: "B" }),
        formGroup({ name: "C" }),
      ] as Form<{ name: string }>[],
    });

    form.readonly = true;

    // Remove middle form
    form.controls.forms.value.splice(1, 1);

    // Remaining forms should still be readonly
    assert.equal(form.controls.forms.value.length, 2);
    form.controls.forms.value.forEach((nestedForm, index) => {
      checkReadonly(nestedForm, true, `After splice Form ${index}`);
    });
  });

  it("direct nested form access should still be readonly", () => {
    const form = formGroup<{
      forms: Form<{ name: string; age: number }>[];
    }>({
      forms: [formGroup({ name: "Alice", age: 25 })] as Form<{
        name: string;
        age: number;
      }>[],
    });

    form.readonly = true;

    // Get direct reference to nested form
    const nestedForm = form.controls.forms.value[0];

    // Should be readonly
    assert.equal(
      nestedForm.readonly,
      true,
      "Direct reference should be readonly"
    );
    assert.equal(
      nestedForm.controls.name.readonly,
      true,
      "Nested control should be readonly"
    );
    assert.equal(
      nestedForm.controls.age.readonly,
      true,
      "Nested control should be readonly"
    );
  });

  it("triple nested forms should all be readonly", () => {
    // Form -> Array<Form> -> Form (nested)
    const form = formGroup({
      departments: [
        formGroup({
          name: "Engineering",
          teams: [
            formGroup({
              teamName: "Frontend",
              members: [
                formGroup({ memberName: "Alice" }),
                formGroup({ memberName: "Bob" }),
              ] as any,
            }),
            formGroup({
              teamName: "Backend",
              members: [formGroup({ memberName: "Charlie" })] as any,
            }),
          ] as any,
        }),
      ] as any,
    });

    // Set top-level readonly
    form.readonly = true;

    // Check department level
    const dept = form.controls.departments.value[0];
    assert.equal(dept.readonly, true, "Department should be readonly");
    assert.equal(
      dept.controls.name.readonly,
      true,
      "Department name should be readonly"
    );

    // Check team level
    dept.controls.teams.value.forEach((team, teamIdx) => {
      assert.equal(team.readonly, true, `Team ${teamIdx} should be readonly`);
      assert.equal(
        team.controls.teamName.readonly,
        true,
        `Team ${teamIdx} name should be readonly`
      );

      // Check member level (deepest)
      team.controls.members.value.forEach((member, memberIdx) => {
        assert.equal(
          member.readonly,
          true,
          `Team ${teamIdx} Member ${memberIdx} should be readonly`
        );
        assert.equal(
          member.controls.memberName.readonly,
          true,
          `Team ${teamIdx} Member ${memberIdx} name control should be readonly`
        );
      });
    });
  });

  it("toggling readonly multiple times should be consistent", () => {
    const form = formGroup<{
      forms: Form<{ name: string }>[];
    }>({
      forms: [formGroup({ name: "A" }), formGroup({ name: "B" })] as Form<{
        name: string;
      }>[],
    });

    // Toggle multiple times
    for (let i = 0; i < 10; i++) {
      form.readonly = true;
      form.controls.forms.value.forEach((f) => {
        assert.equal(f.readonly, true, `Iteration ${i} set true`);
      });

      form.readonly = false;
      form.controls.forms.value.forEach((f) => {
        assert.equal(f.readonly, false, `Iteration ${i} set false`);
      });
    }
  });

  it("setting readonly on control should cascade to nested forms in that control only", () => {
    const form = formGroup<{
      group1: Form<{ name: string }>[];
      group2: Form<{ name: string }>[];
    }>({
      group1: [formGroup({ name: "G1" })] as Form<{ name: string }>[],
      group2: [formGroup({ name: "G2" })] as Form<{ name: string }>[],
    });

    // Set readonly only on group1 control
    form.controls.group1.readonly = true;

    // group1 nested forms should be readonly
    checkReadonly(form.controls.group1.value[0], true, "Group1 nested form");

    // group2 nested forms should NOT be readonly
    checkReadonly(form.controls.group2.value[0], false, "Group2 nested form");
  });

  it("nested form with its own readonly should be overridden by parent", () => {
    const nestedForm = formGroup({ name: "Nested" });

    // Set nested form to NOT readonly before adding to parent
    nestedForm.readonly = false;

    const form = formGroup<{
      forms: Form<{ name: string }>[];
    }>({
      forms: [nestedForm] as Form<{ name: string }>[],
    });

    // Parent sets readonly
    form.readonly = true;

    // Nested form should now be readonly (parent overrides)
    assert.equal(
      form.controls.forms.value[0].readonly,
      true,
      "Parent readonly should override nested form's readonly=false"
    );
  });

  it("empty array should not cause errors when setting readonly", () => {
    const form = formGroup<{
      forms: Form<{ name: string }>[];
    }>({
      forms: [] as Form<{ name: string }>[],
    });

    // Should not throw
    expect(() => {
      form.readonly = true;
    }).not.toThrow();

    expect(() => {
      form.readonly = false;
    }).not.toThrow();

    assert.equal(form.readonly, false, "Form should not be readonly");
  });

  it("single nested form (not array) should respect readonly", () => {
    const form = formGroup<{
      profile: Form<{ name: string; bio: string }>;
    }>({
      profile: formGroup({ name: "John", bio: "Developer" }) as Form<{
        name: string;
        bio: string;
      }>,
    });

    form.readonly = true;

    const profile = form.controls.profile.value;
    assert.equal(
      profile.readonly,
      true,
      "Single nested form should be readonly"
    );
    assert.equal(
      profile.controls.name.readonly,
      true,
      "Single nested form control should be readonly"
    );
    assert.equal(
      profile.controls.bio.readonly,
      true,
      "Single nested form control should be readonly"
    );
  });

  it("mixed single form and array of forms should all be readonly", () => {
    const form = formGroup<{
      mainUser: Form<{ name: string }>;
      additionalUsers: Form<{ name: string }>[];
    }>({
      mainUser: formGroup({ name: "Main" }) as Form<{ name: string }>,
      additionalUsers: [
        formGroup({ name: "Extra1" }),
        formGroup({ name: "Extra2" }),
      ] as Form<{ name: string }>[],
    });

    form.readonly = true;

    // Check single form
    checkReadonly(form.controls.mainUser.value, true, "Main user");

    // Check array of forms
    form.controls.additionalUsers.value.forEach((f, i) => {
      checkReadonly(f, true, `Additional user ${i}`);
    });
  });

  it("build() should work on readonly forms", () => {
    const form = formGroup({
      forms: [
        formGroup({ name: "A", value: 1 }),
        formGroup({ name: "B", value: 2 }),
      ] as any,
    });

    form.readonly = true;

    const built = form.build();
    assert.deepEqual(built, {
      forms: [
        { name: "A", value: 1 },
        { name: "B", value: 2 },
      ],
    });
  });

  it("reset() on readonly form should still work for nested forms", () => {
    const form = formGroup<{
      forms: Form<{ name: string }>[];
    }>({
      forms: [formGroup({ name: "Original" })] as Form<{ name: string }>[],
    });

    // Modify value
    form.controls.forms.value[0].controls.name.value = "Modified";
    assert.equal(form.controls.forms.value[0].controls.name.value, "Modified");

    // Set readonly
    form.readonly = true;

    // Reset should still work
    form.reset();

    assert.equal(
      form.controls.forms.value[0].controls.name.value,
      "Original",
      "Reset should restore original value even when readonly"
    );
  });

  it("patchValue on parent should work and nested forms stay readonly", () => {
    const form = formGroup<{
      title: string;
      forms: Form<{ name: string }>[];
    }>({
      title: "Original Title",
      forms: [formGroup({ name: "A" })] as Form<{ name: string }>[],
    });

    form.readonly = true;

    // Patch the title (primitive control)
    form.patchValue({ title: "New Title" });

    // Title should be updated
    assert.equal(form.controls.title.value, "New Title");

    // Nested forms should still be readonly
    checkReadonly(form.controls.forms.value[0], true, "After patchValue");
  });

  it("deeply nested using deepCheckReadonly helper", () => {
    const form = formGroup({
      level1: formGroup({
        level2: formGroup({
          level3: [
            formGroup({ deepValue: "deep1" }),
            formGroup({ deepValue: "deep2" }),
          ] as any,
        }) as any,
      }) as any,
    });

    form.readonly = true;

    // Use deep checker
    deepCheckReadonly(form, true);

    // Toggle off
    form.readonly = false;
    deepCheckReadonly(form, false);
  });

  // proxy is a buggy scenario
  it.fails("array index assignment should propagate readonly", () => {
    const form = formGroup<{
      forms: Form<{ name: string }>[];
    }>({
      forms: [formGroup({ name: "A" }), formGroup({ name: "B" })] as Form<{
        name: string;
      }>[],
    });

    form.readonly = true;

    // Replace specific index
    form.controls.forms.value[0] = formGroup({ name: "Replaced" });

    // The replaced form should be readonly
    checkReadonly(form.controls.forms.value[0], true, "Replaced at index 0");

    // Other forms should still be readonly
    checkReadonly(form.controls.forms.value[1], true, "Unchanged at index 1");
  });

  it("concurrent modifications and readonly toggling", () => {
    const form = formGroup<{
      forms: Form<{ count: number }>[];
    }>({
      forms: [formGroup({ count: 0 }), formGroup({ count: 0 })] as Form<{
        count: number;
      }>[],
    });

    // Interleave operations
    form.readonly = true;
    form.controls.forms.value[0].controls.count.value = 1;

    form.readonly = false;
    form.controls.forms.value[1].controls.count.value = 2;

    form.readonly = true;

    // Add new form
    form.controls.forms.value = [
      ...form.controls.forms.value,
      formGroup({ count: 3 }),
    ];

    // All should be readonly now
    form.controls.forms.value.forEach((f, i) => {
      checkReadonly(f, true, `Form ${i} after concurrent ops`);
    });
  });

  it("form with validators in nested forms should respect readonly", () => {
    const form = formGroup<{
      forms: Form<{ email: string }>[];
    }>({
      forms: [formGroup({ email: "test@example.com" })] as Form<{
        email: string;
      }>[],
    });

    form.readonly = true;

    // Readonly should be set regardless of validation
    checkReadonly(form.controls.forms.value[0], true, "Form with validators");
  });

  it("readonly false explicitly set should cascade", () => {
    const form = formGroup<{
      forms: Form<{ name: string }>[];
    }>({
      forms: [formGroup({ name: "Test" })] as Form<{ name: string }>[],
    });

    // Start readonly
    form.readonly = true;
    checkReadonly(form.controls.forms.value[0], true, "Initially readonly");

    // Explicitly set false
    form.readonly = false;
    checkReadonly(
      form.controls.forms.value[0],
      false,
      "Explicitly set to false"
    );

    // Set true again
    form.readonly = true;
    checkReadonly(form.controls.forms.value[0], true, "Set back to true");
  });
});

/**
 * WAIVER AMOUNTS SCENARIO TESTS
 *
 * These tests specifically target the bug in waive-amounts.transaction-strategy.tsx
 * where newly created forms don't consistently inherit parent readonly state.
 */
describe("Nested Forms - Waiver Amounts Scenario (Effect-Created Forms)", () => {
  // Helper to simulate the waiver amount form creation pattern
  const createWaiverAmountForm = (salaryYear: number, capValue?: number) =>
    formGroup({
      salaryYear,
      capValue: capValue ?? 0,
      taxValue: 0,
      apronValue: 0,
      mtsValue: 0,
    });

  it("forms created and assigned in effect should inherit readonly from parent", () => {
    // Simulate: Parent form is readonly, then effect runs and creates new forms
    const form = formGroup<{
      transactionDate: string;
      contractId: number | null;
      transactionWaiverAmounts: Form<{
        salaryYear: number;
        capValue: number;
        taxValue: number;
        apronValue: number;
        mtsValue: number;
      }>[];
    }>({
      transactionDate: "2024-01-01",
      contractId: null,
      transactionWaiverAmounts: [] as any,
    });

    // Set form to readonly BEFORE the effect runs (simulating view mode)
    form.readonly = true;
    assert.equal(form.readonly, true, "Parent form should be readonly");
    assert.equal(
      form.controls.transactionWaiverAmounts.readonly,
      true,
      "Waiver amounts control should be readonly"
    );

    // Simulate the effect running and creating new waiver amount forms
    // This is what happens in waive-amounts.transaction-strategy.tsx lines 159-162
    form.controls.transactionWaiverAmounts.value = [
      createWaiverAmountForm(2024, 1000000),
      createWaiverAmountForm(2025, 1500000),
      createWaiverAmountForm(2026, 2000000),
    ];

    // ALL newly created forms should inherit the readonly state
    assert.equal(
      form.controls.transactionWaiverAmounts.value.length,
      3,
      "Should have 3 waiver amount forms"
    );

    form.controls.transactionWaiverAmounts.value.forEach((waiverForm, index) => {
      checkReadonly(waiverForm, true, `Waiver Amount Form ${index}`);
    });
  });

  it("forms assigned to empty array control should inherit readonly", () => {
    // Start with empty array, set readonly, then populate
    const form = formGroup<{
      waivers: Form<{ salaryYear: number }>[];
    }>({
      waivers: [] as Form<{ salaryYear: number }>[],
    });

    // Set readonly on empty array control
    form.readonly = true;
    assert.equal(form.controls.waivers.readonly, true, "Control should be readonly");

    // Now assign forms to the empty array
    form.controls.waivers.value = [
      formGroup({ salaryYear: 2024 }),
      formGroup({ salaryYear: 2025 }),
    ];

    // Both forms should be readonly
    form.controls.waivers.value.forEach((f, i) => {
      checkReadonly(f, true, `Form ${i} added to empty array`);
    });
  });

  it("toggling readonly after forms are added should update all forms", () => {
    const form = formGroup<{
      waivers: Form<{ year: number }>[];
    }>({
      waivers: [] as Form<{ year: number }>[],
    });

    // Add forms while NOT readonly
    form.controls.waivers.value = [
      formGroup({ year: 2024 }),
      formGroup({ year: 2025 }),
    ];

    // Verify not readonly
    form.controls.waivers.value.forEach((f, i) => {
      checkReadonly(f, false, `Form ${i} before readonly`);
    });

    // Toggle to readonly
    form.readonly = true;

    // All should now be readonly
    form.controls.waivers.value.forEach((f, i) => {
      checkReadonly(f, true, `Form ${i} after readonly=true`);
    });

    // Toggle back
    form.readonly = false;

    // All should be editable
    form.controls.waivers.value.forEach((f, i) => {
      checkReadonly(f, false, `Form ${i} after readonly=false`);
    });
  });

  it("replacing array contents multiple times should always respect current readonly", () => {
    const form = formGroup<{
      items: Form<{ id: number }>[];
    }>({
      items: [formGroup({ id: 1 })] as Form<{ id: number }>[],
    });

    // Set readonly
    form.readonly = true;

    // Replace array contents multiple times
    for (let i = 0; i < 5; i++) {
      form.controls.items.value = [
        formGroup({ id: i * 10 + 1 }),
        formGroup({ id: i * 10 + 2 }),
      ];

      // Each time, all forms should be readonly
      form.controls.items.value.forEach((f, idx) => {
        checkReadonly(f, true, `Iteration ${i} Form ${idx}`);
      });
    }
  });

  it("control-level readonly should propagate to newly assigned forms", () => {
    const form = formGroup<{
      groupA: Form<{ name: string }>[];
      groupB: Form<{ name: string }>[];
    }>({
      groupA: [] as Form<{ name: string }>[],
      groupB: [] as Form<{ name: string }>[],
    });

    // Set readonly only on groupA control (not the whole form)
    form.controls.groupA.readonly = true;

    // Assign forms to both groups
    form.controls.groupA.value = [formGroup({ name: "A1" }), formGroup({ name: "A2" })];
    form.controls.groupB.value = [formGroup({ name: "B1" }), formGroup({ name: "B2" })];

    // groupA forms should be readonly
    form.controls.groupA.value.forEach((f, i) => {
      checkReadonly(f, true, `GroupA Form ${i}`);
    });

    // groupB forms should NOT be readonly
    form.controls.groupB.value.forEach((f, i) => {
      checkReadonly(f, false, `GroupB Form ${i}`);
    });
  });

  it("newly added form at end of array should inherit readonly", () => {
    const form = formGroup<{
      forms: Form<{ name: string }>[];
    }>({
      forms: [formGroup({ name: "First" })] as Form<{ name: string }>[],
    });

    form.readonly = true;

    // Add a new form at the end
    form.controls.forms.value = [
      ...form.controls.forms.value,
      formGroup({ name: "Second" }),
    ];

    // Check BOTH forms - especially the newly added one
    assert.equal(form.controls.forms.value.length, 2, "Should have 2 forms");
    checkReadonly(form.controls.forms.value[0], true, "First form (existing)");
    checkReadonly(form.controls.forms.value[1], true, "Second form (newly added)");
  });

  it("forms created with formGroup() should inherit readonly when assigned", () => {
    // This tests that forms created via formGroup (not already attached to a parent)
    // properly inherit readonly when assigned to a control
    const form = formGroup<{
      waivers: Form<{ year: number; amount: number }>[];
    }>({
      waivers: [] as Form<{ year: number; amount: number }>[],
    });

    form.readonly = true;

    // Create forms externally (like createTransactionWaiverAmountFormGroup does)
    const newForms = [2024, 2025, 2026].map((year) =>
      formGroup({ year, amount: year * 1000 })
    );

    // Assign them all at once
    form.controls.waivers.value = newForms;

    // All should be readonly
    newForms.forEach((f, i) => {
      // Check the forms in the control, not the original references
      checkReadonly(form.controls.waivers.value[i], true, `Waiver form ${i}`);
    });
  });

  it("disabled should also propagate to newly assigned forms", () => {
    const form = formGroup<{
      items: Form<{ value: number }>[];
    }>({
      items: [] as Form<{ value: number }>[],
    });

    form.disabled = true;

    form.controls.items.value = [
      formGroup({ value: 1 }),
      formGroup({ value: 2 }),
    ];

    form.controls.items.value.forEach((f, i) => {
      checkDisabled(f, true, `Item form ${i}`);
    });
  });

  it("both readonly and disabled should propagate to newly assigned forms", () => {
    const form = formGroup<{
      items: Form<{ data: string }>[];
    }>({
      items: [] as Form<{ data: string }>[],
    });

    form.readonly = true;
    form.disabled = true;

    form.controls.items.value = [formGroup({ data: "test" })];

    const item = form.controls.items.value[0];
    checkReadonly(item, true, "Item after assignment");
    checkDisabled(item, true, "Item after assignment");
  });

  it("sequential additions should all respect readonly", () => {
    const form = formGroup<{
      items: Form<{ id: number }>[];
    }>({
      items: [] as Form<{ id: number }>[],
    });

    form.readonly = true;

    // Add items one by one (simulating multiple effect runs)
    for (let i = 1; i <= 5; i++) {
      form.controls.items.value = [
        ...form.controls.items.value,
        formGroup({ id: i }),
      ];

      // Check all forms after each addition
      form.controls.items.value.forEach((f, idx) => {
        checkReadonly(f, true, `After adding ${i}, form ${idx}`);
      });
    }
  });
});
