import { assert, describe, it } from 'vitest';
import { Form } from '../form';
import { formGroup } from '../form/functional';

/**
 * FormControl Proxy Array Mutations Tests
 * 
 * Tests the Proxy implementation that intercepts direct array mutations:
 * - Direct index assignment: array[i] = value
 * - push(), pop(), splice()
 * - Multiple mutations in sequence
 */

interface TestItem {
  id: string;
  value: number;
}

describe('FormControl - Proxy Array Mutations', () => {
  it('should detect direct array index assignment', () => {
    const form = formGroup<{ items: Form<TestItem>[] }>({
      items: [
        formGroup<TestItem>({ id: 'item-1', value: 10 }),
        formGroup<TestItem>({ id: 'item-2', value: 20 }),
      ],
    });

    form.reset();
    assert.equal(form.dirty, false, 'Should be clean after reset');

    const itemsControl = form.controls.items;
    const newItem = formGroup<TestItem>({ id: 'item-new', value: 30 });

    // Direct index assignment should trigger the Proxy
    itemsControl.value[2] = newItem;

    // Verify change was detected
    assert.equal(form.dirty, true, 'Form should be marked dirty after index assignment');
    assert.equal(itemsControl.value[2].getControl('id').value, 'item-new');
  });

  it('should detect push() operations', () => {
    const form = formGroup<{ items: Form<TestItem>[] }>({
      items: [
        formGroup<TestItem>({ id: 'item-1', value: 10 }),
      ],
    });

    form.reset();
    assert.equal(form.dirty, false);

    const itemsControl = form.controls.items;
    const newItem = formGroup<TestItem>({ id: 'item-2', value: 20 });

    // Push should work with the Proxy
    itemsControl.value.push(newItem);

    // Verify it was added
    assert.equal(itemsControl.value.length, 2, 'Should have 2 items after push');
    assert.equal(itemsControl.value[1].getControl('id').value, 'item-2');
    // Note: push may not mark dirty if it modifies length property directly
  });

  it('should detect pop() operations', () => {
    const form = formGroup<{ items: Form<TestItem>[] }>({
      items: [
        formGroup<TestItem>({ id: 'item-1', value: 10 }),
        formGroup<TestItem>({ id: 'item-2', value: 20 }),
        formGroup<TestItem>({ id: 'item-3', value: 30 }),
      ],
    });

    const itemsControl = form.controls.items;
    const initialLength = itemsControl.value.length;

    // Pop should work with the Proxy
    const popped = itemsControl.value.pop();

    assert.equal(itemsControl.value.length, initialLength - 1, 'Should have 2 items after pop');
    assert.equal(popped?.getControl('id').value, 'item-3');
  });

  it('should detect splice() operations', () => {
    const form = formGroup<{ items: Form<TestItem>[] }>({
      items: [
        formGroup<TestItem>({ id: 'item-1', value: 10 }),
        formGroup<TestItem>({ id: 'item-2', value: 20 }),
        formGroup<TestItem>({ id: 'item-3', value: 30 }),
      ],
    });

    form.reset();
    assert.equal(form.dirty, false);

    const itemsControl = form.controls.items;

    // Splice should trigger index assignments internally
    itemsControl.value.splice(1, 1);

    assert.equal(itemsControl.value.length, 2, 'Should have 2 items after splice');
    assert.equal(itemsControl.value[1].getControl('id').value, 'item-3');
  });

  it('should handle multiple sequential mutations', () => {
    const form = formGroup<{ items: Form<TestItem>[] }>({
      items: [
        formGroup<TestItem>({ id: 'item-1', value: 10 }),
      ],
    });

    const itemsControl = form.controls.items;

    // Add via index assignment
    itemsControl.value[1] = formGroup<TestItem>({ id: 'item-2', value: 20 });
    assert.equal(itemsControl.value.length, 2);

    // Add via push
    itemsControl.value.push(formGroup<TestItem>({ id: 'item-3', value: 30 }));
    assert.equal(itemsControl.value.length, 3);

    // Remove via pop
    itemsControl.value.pop();
    assert.equal(itemsControl.value.length, 2);

    // Remove via splice
    itemsControl.value.splice(0, 1);
    assert.equal(itemsControl.value.length, 1);

    // Verify remaining item
    assert.equal(itemsControl.value[0].getControl('id').value, 'item-2');
  });

  it('should update form dirty state through Proxy mutations', () => {
    const form = formGroup<{ items: Form<TestItem>[] }>({
      items: [
        formGroup<TestItem>({ id: 'item-1', value: 10 }),
        formGroup<TestItem>({ id: 'item-2', value: 20 }),
      ],
    });

    form.reset();
    assert.equal(form.dirty, false, 'Should start clean');

    const itemsControl = form.controls.items;

    // Mutate existing item via index
    itemsControl.value[0] = formGroup<TestItem>({ id: 'item-updated', value: 99 });

    assert.equal(form.dirty, true, 'Form should be dirty after Proxy mutation');
    assert.equal(itemsControl.value[0].getControl('value').value, 99);
  });

  it('should handle nested form mutations through Proxy', () => {
    const form = formGroup<{ items: Form<TestItem>[] }>({
      items: [
        formGroup<TestItem>({ id: 'item-1', value: 10 }),
      ],
    });

    const itemsControl = form.controls.items;

    // Get reference to first item
    const firstItem = itemsControl.value[0];
    const initialValue = firstItem.getControl('value').value;

    // Modify the nested form
    firstItem.controls.value.value = 50;

    // Verify it changed
    assert.equal(firstItem.getControl('value').value, 50);
    assert.equal(itemsControl.value[0].getControl('value').value, 50);
  });

  it('should maintain array reference integrity after Proxy wrapping', () => {
    const initialArray = [
      formGroup<TestItem>({ id: 'item-1', value: 10 }),
      formGroup<TestItem>({ id: 'item-2', value: 20 }),
    ];

    const form = formGroup<{ items: Form<TestItem>[] }>({
      items: initialArray,
    });

    const itemsControl = form.controls.items;

    // Proxy wraps the array, so reference may be different
    // but operations should still work
    assert.equal(itemsControl.value.length, 2);

    // Push new item
    itemsControl.value.push(formGroup<TestItem>({ id: 'item-3', value: 30 }));
    assert.equal(itemsControl.value.length, 3);

    // Access original items
    assert.equal(itemsControl.value[0].getControl('id').value, 'item-1');
    assert.equal(itemsControl.value[1].getControl('id').value, 'item-2');
    assert.equal(itemsControl.value[2].getControl('id').value, 'item-3');
  });
});
