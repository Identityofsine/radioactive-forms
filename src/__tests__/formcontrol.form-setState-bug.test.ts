import { assert, describe, it } from "vitest";
import { Form } from "../form";
import { formGroup } from "../form/functional";

/**
 * FormControl setState Bug Tests
 *
 * Bug: When adding forms to an array and then modifying the first form,
 * the second form disappears. This suggests the setState callback is doing:
 * control.array = [...control.array, self] instead of replacing in-place.
 *
 * Expected: Modifying form1 should only update form1
 * Actual: Array gets corrupted, form2 disappears
 */

interface TestForm {
  id: string;
  name: string;
  value: number;
}

describe("FormControl - Form setState Bug (Disappearing Items)", () => {
  it("should not lose second form when modifying first form in array", () => {
    const form1 = formGroup<TestForm>({
      id: "form-1",
      name: "First",
      value: 10,
    });
    const form2 = formGroup<TestForm>({
      id: "form-2",
      name: "Second",
      value: 20,
    });

    const parentForm = formGroup<{ items: Form<TestForm>[] }>({
      items: [form1, form2],
    });

    assert.equal(
      parentForm.controls.items.value.length,
      2,
      "Should start with 2 forms"
    );
    assert.equal(
      parentForm.controls.items.value[0].getControl("id").value,
      "form-1",
      "First form should be form-1"
    );
    assert.equal(
      parentForm.controls.items.value[1].getControl("id").value,
      "form-2",
      "Second form should be form-2"
    );

    // Modify first form
    parentForm.controls.items.value[0].controls.value.value = 50;

    // BUG: After modifying form1, form2 should still exist
    assert.equal(
      parentForm.controls.items.value.length,
      2,
      "Should still have 2 forms after modifying first"
    );
    assert.equal(
      parentForm.controls.items.value[0].getControl("value").value,
      50,
      "First form value should be updated to 50"
    );
    assert.equal(
      parentForm.controls.items.value[1].getControl("id").value,
      "form-2",
      "Second form should still be form-2"
    );
  });

  it("should preserve array integrity when modifying second form", () => {
    const form1 = formGroup<TestForm>({
      id: "form-1",
      name: "First",
      value: 10,
    });
    const form2 = formGroup<TestForm>({
      id: "form-2",
      name: "Second",
      value: 20,
    });

    const parentForm = formGroup<{ items: Form<TestForm>[] }>({
      items: [form1, form2],
    });

    // Modify second form
    parentForm.controls.items.value[1].controls.value.value = 100;

    // Both forms should still exist
    assert.equal(parentForm.controls.items.value.length, 2);
    assert.equal(
      parentForm.controls.items.value[0].getControl("id").value,
      "form-1"
    );
    assert.equal(
      parentForm.controls.items.value[1].getControl("id").value,
      "form-2"
    );
    assert.equal(
      parentForm.controls.items.value[1].getControl("value").value,
      100
    );
  });

  it("should not duplicate forms when modifying in sequence", () => {
    const forms = [
      formGroup<TestForm>({ id: "form-1", name: "First", value: 10 }),
      formGroup<TestForm>({ id: "form-2", name: "Second", value: 20 }),
      formGroup<TestForm>({ id: "form-3", name: "Third", value: 30 }),
    ];

    const parentForm = formGroup<{ items: Form<TestForm>[] }>({
      items: forms,
    });

    assert.equal(
      parentForm.controls.items.value.length,
      3,
      "Start with 3 forms"
    );

    // Modify first form
    parentForm.controls.items.value[0].controls.value.value = 15;
    assert.equal(
      parentForm.controls.items.value.length,
      3,
      "After modifying form1, should still have 3 forms"
    );

    // Modify second form
    parentForm.controls.items.value[1].controls.value.value = 25;
    assert.equal(
      parentForm.controls.items.value.length,
      3,
      "After modifying form2, should still have 3 forms"
    );

    // Modify third form
    parentForm.controls.items.value[2].controls.value.value = 35;
    assert.equal(
      parentForm.controls.items.value.length,
      3,
      "After modifying form3, should still have 3 forms"
    );

    // Verify all forms are still there with correct IDs
    assert.equal(
      parentForm.controls.items.value[0].getControl("id").value,
      "form-1"
    );
    assert.equal(
      parentForm.controls.items.value[1].getControl("id").value,
      "form-2"
    );
    assert.equal(
      parentForm.controls.items.value[2].getControl("id").value,
      "form-3"
    );
  });
});
