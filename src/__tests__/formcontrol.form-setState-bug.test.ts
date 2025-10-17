import { assert, describe, it } from 'vitest';
import { Form } from '../form';
import { formGroup } from '../form/functional';

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

describe('FormControl - Form setState Bug (Disappearing Items)', () => {
  it('should not lose second form when modifying first form in array', () => {
    const form1 = formGroup<TestForm>({ id: 'form-1', name: 'First', value: 10 });
    const form2 = formGroup<TestForm>({ id: 'form-2', name: 'Second', value: 20 });

    const parentForm = formGroup<{ items: Form<TestForm>[] }>({
      items: [form1, form2],
    });

    assert.equal(parentForm.controls.items.value.length, 2, 'Should start with 2 forms');
    assert.equal(
      parentForm.controls.items.value[0].getControl('id').value,
      'form-1',
      'First form should be form-1',
    );
    assert.equal(
      parentForm.controls.items.value[1].getControl('id').value,
      'form-2',
      'Second form should be form-2',
    );

    // Modify first form
    parentForm.controls.items.value[0].controls.value.value = 50;

    // BUG: After modifying form1, form2 should still exist
    assert.equal(
      parentForm.controls.items.value.length,
      2,
      'Should still have 2 forms after modifying first',
    );
    assert.equal(
      parentForm.controls.items.value[0].getControl('value').value,
      50,
      'First form value should be updated to 50',
    );
    assert.equal(
      parentForm.controls.items.value[1].getControl('id').value,
      'form-2',
      'Second form should still be form-2',
    );
  });

  it('should preserve array integrity when modifying second form', () => {
    const form1 = formGroup<TestForm>({ id: 'form-1', name: 'First', value: 10 });
    const form2 = formGroup<TestForm>({ id: 'form-2', name: 'Second', value: 20 });

    const parentForm = formGroup<{ items: Form<TestForm>[] }>({
      items: [form1, form2],
    });

    // Modify second form
    parentForm.controls.items.value[1].controls.value.value = 100;

    // Both forms should still exist
    assert.equal(parentForm.controls.items.value.length, 2);
    assert.equal(
      parentForm.controls.items.value[0].getControl('id').value,
      'form-1',
    );
    assert.equal(
      parentForm.controls.items.value[1].getControl('id').value,
      'form-2',
    );
    assert.equal(
      parentForm.controls.items.value[1].getControl('value').value,
      100,
    );
  });

  it('should not duplicate forms when modifying in sequence', () => {
    const forms = [
      formGroup<TestForm>({ id: 'form-1', name: 'First', value: 10 }),
      formGroup<TestForm>({ id: 'form-2', name: 'Second', value: 20 }),
      formGroup<TestForm>({ id: 'form-3', name: 'Third', value: 30 }),
    ];

    const parentForm = formGroup<{ items: Form<TestForm>[] }>({
      items: forms,
    });

    assert.equal(parentForm.controls.items.value.length, 3, 'Start with 3 forms');

    // Modify first form
    parentForm.controls.items.value[0].controls.value.value = 15;
    assert.equal(
      parentForm.controls.items.value.length,
      3,
      'After modifying form1, should still have 3 forms',
    );

    // Modify second form
    parentForm.controls.items.value[1].controls.value.value = 25;
    assert.equal(
      parentForm.controls.items.value.length,
      3,
      'After modifying form2, should still have 3 forms',
    );

    // Modify third form
    parentForm.controls.items.value[2].controls.value.value = 35;
    assert.equal(
      parentForm.controls.items.value.length,
      3,
      'After modifying form3, should still have 3 forms',
    );

    // Verify all forms are still there with correct IDs
    assert.equal(
      parentForm.controls.items.value[0].getControl('id').value,
      'form-1',
    );
    assert.equal(
      parentForm.controls.items.value[1].getControl('id').value,
      'form-2',
    );
    assert.equal(
      parentForm.controls.items.value[2].getControl('id').value,
      'form-3',
    );
  });

  it('should handle nested property modifications without array corruption', () => {
    const form1 = formGroup<TestForm>({ id: 'form-1', name: 'First', value: 10 });
    const form2 = formGroup<TestForm>({ id: 'form-2', name: 'Second', value: 20 });

    const parentForm = formGroup<{ items: Form<TestForm>[] }>({
      items: [form1, form2],
    });

    // Modify multiple fields in first form
    parentForm.controls.items.value[0].controls.name.value = 'Modified First';
    assert.equal(parentForm.controls.items.value.length, 2);

    parentForm.controls.items.value[0].controls.value.value = 99;
    assert.equal(parentForm.controls.items.value.length, 2);

    parentForm.controls.items.value[0].controls.id.value = 'form-1-updated';
    assert.equal(parentForm.controls.items.value.length, 2);

    // Second form should still exist
    assert.equal(
      parentForm.controls.items.value[1].getControl('id').value,
      'form-2',
    );
  });

  it('should track array indices correctly when setState is called', () => {
    const form1 = formGroup<TestForm>({ id: 'form-1', name: 'First', value: 10 });
    const form2 = formGroup<TestForm>({ id: 'form-2', name: 'Second', value: 20 });
    const form3 = formGroup<TestForm>({ id: 'form-3', name: 'Third', value: 30 });

    const parentForm = formGroup<{ items: Form<TestForm>[] }>({
      items: [form1, form2, form3],
    });

    // Keep track of form references
    const form1Ref = parentForm.controls.items.value[0];
    const form2Ref = parentForm.controls.items.value[1];
    const form3Ref = parentForm.controls.items.value[2];

    // Modify middle form
    form2Ref.controls.value.value = 200;

    // Verify the forms are still at the same indices
    assert.equal(
      parentForm.controls.items.value[0],
      form1Ref,
      'Form1 should still be at index 0',
    );
    assert.equal(
      parentForm.controls.items.value[1],
      form2Ref,
      'Form2 should still be at index 1',
    );
    assert.equal(
      parentForm.controls.items.value[2],
      form3Ref,
      'Form3 should still be at index 2',
    );

    // Now modify first form
    form1Ref.controls.value.value = 100;

    // All forms should still be at correct indices
    assert.equal(
      parentForm.controls.items.value[0],
      form1Ref,
      'Form1 should still be at index 0 after update',
    );
    assert.equal(
      parentForm.controls.items.value[1],
      form2Ref,
      'Form2 should still be at index 1 after form1 update',
    );
    assert.equal(
      parentForm.controls.items.value[2],
      form3Ref,
      'Form3 should still be at index 2 after form1 update',
    );
  });

  it('should not have setState appending form to array instead of replacing', () => {
    const form1 = formGroup<TestForm>({ id: 'form-1', name: 'First', value: 10 });
    const form2 = formGroup<TestForm>({ id: 'form-2', name: 'Second', value: 20 });

    const parentForm = formGroup<{ items: Form<TestForm>[] }>({
      items: [form1, form2],
    });

    const initialLength = parentForm.controls.items.value.length;
    const initialFirstId = parentForm.controls.items.value[0].getControl('id').value;
    const initialSecondId = parentForm.controls.items.value[1].getControl('id').value;

    // Modify first form - this should NOT append it to the array
    parentForm.controls.items.value[0].controls.value.value = 999;

    // BUG SYMPTOM: If setState is doing [...array, self], then:
    // - Length will increase
    // - Second form will be overwritten or moved
    // - First form might appear twice

    const finalLength = parentForm.controls.items.value.length;
    const finalFirstId = parentForm.controls.items.value[0].getControl('id').value;
    const finalSecondId = parentForm.controls.items.value[1]?.getControl('id').value;

    assert.equal(
      finalLength,
      initialLength,
      'Array length should NOT change when modifying form1',
    );
    assert.equal(
      finalFirstId,
      initialFirstId,
      'First form ID should remain the same',
    );
    assert.equal(
      finalSecondId,
      initialSecondId,
      'Second form ID should still exist and be the same',
    );
  });
});
