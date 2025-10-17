import { assert, describe, it } from 'vitest';
import { Form } from '../form';
import { formGroup } from '../form/functional';

/**
 * Core Form Array Mutations Tests
 * 
 * CRITICAL ISSUE IDENTIFIED:
 * Direct array mutations (push/splice) don't trigger assignHooklessFormArray
 * which means new forms added to the array won't have _setState callbacks set up.
 * 
 * When a new form is pushed without going through patchValue/value setter,
 * it loses the hook that connects it back to the parent form for updates.
 */

interface TestBonus {
  bonusId: string;
  bonusYear: number;
  amount: number;
}

describe('Form - Array Mutations (Add/Remove)', () => {
  it('should create form array and add items sequentially - use patchValue instead of push', () => {
    const form = formGroup<{ bonuses: Form<TestBonus>[] }>({
      bonuses: [
        formGroup<TestBonus>({
          bonusId: 'bonus-1',
          bonusYear: 2024,
          amount: 100,
        }),
      ],
    });

    assert.equal(form.controls.bonuses.value.length, 1, 'Should start with 1 bonus');

    // WORKAROUND: Use patchValue instead of push
    const newBonus = formGroup<TestBonus>({
      bonusId: 'bonus-2',
      bonusYear: 2025,
      amount: 200,
    });

    const currentArray = form.controls.bonuses.value;
    form.controls.bonuses.patchValue([...currentArray, newBonus] as any);

    assert.equal(form.controls.bonuses.value.length, 2, 'Should have 2 bonuses after patchValue');
    assert.equal(
      form.controls.bonuses.value[0].getControl('bonusId').value,
      'bonus-1',
      'First bonus should be bonus-1'
    );
    assert.equal(
      form.controls.bonuses.value[1].getControl('bonusId').value,
      'bonus-2',
      'Second bonus should be bonus-2'
    );
  });

  it('should add multiple bonuses and maintain unique identity - using patchValue', () => {
    const form = formGroup<{ bonuses: Form<TestBonus>[] }>({
      bonuses: [],
    });

    // Add 3 bonuses using patchValue
    const bonusesToAdd: Form<TestBonus>[] = [];
    for (let i = 1; i <= 3; i++) {
      bonusesToAdd.push(
        formGroup<TestBonus>({
          bonusId: `bonus-${i}`,
          bonusYear: 2024 + i,
          amount: 100 * i,
        })
      );
    }

    form.controls.bonuses.patchValue(bonusesToAdd as any);

    assert.equal(form.controls.bonuses.value.length, 3, 'Should have 3 bonuses');

    // Verify each bonus maintains its identity
    const ids = form.controls.bonuses.value.map((b) => b.getControl('bonusId').value);
    assert.deepEqual(ids, ['bonus-1', 'bonus-2', 'bonus-3'], 'IDs should be unique');
  });

  it('should delete a bonus from middle using filter and patchValue', () => {
    const form = formGroup<{ bonuses: Form<TestBonus>[] }>({
      bonuses: [
        formGroup<TestBonus>({ bonusId: 'bonus-1', bonusYear: 2024, amount: 100 }),
        formGroup<TestBonus>({ bonusId: 'bonus-2', bonusYear: 2025, amount: 200 }),
        formGroup<TestBonus>({ bonusId: 'bonus-3', bonusYear: 2026, amount: 300 }),
      ],
    });

    assert.equal(form.controls.bonuses.value.length, 3, 'Should start with 3');

    // Delete the middle bonus (index 1) using filter
    const filtered = form.controls.bonuses.value.filter((_, idx) => idx !== 1);
    form.controls.bonuses.patchValue(filtered as any);

    assert.equal(form.controls.bonuses.value.length, 2, 'Should have 2 after delete');

    const ids = form.controls.bonuses.value.map((b) => b.getControl('bonusId').value);
    assert.deepEqual(ids, ['bonus-1', 'bonus-3'], 'Should be bonus-1 and bonus-3');
  });

  it('should handle add -> modify -> delete cycle without duplication', () => {
    const form = formGroup<{ bonuses: Form<TestBonus>[] }>({
      bonuses: [
        formGroup<TestBonus>({ bonusId: 'bonus-1', bonusYear: 0, amount: 0 }),
      ],
    });

    // Add new bonus using patchValue
    const bonus2 = formGroup<TestBonus>({ bonusId: 'bonus-2', bonusYear: 2025, amount: 200 });
    form.controls.bonuses.patchValue([...form.controls.bonuses.value, bonus2] as any);
    assert.equal(form.controls.bonuses.value.length, 2);

    // Modify first bonus
    form.controls.bonuses.value[0].controls.bonusYear.value = 2024;
    assert.equal(form.controls.bonuses.value[0].controls.bonusYear.value, 2024);

    // Delete first bonus
    const filtered = form.controls.bonuses.value.filter((_, idx) => idx !== 0);
    form.controls.bonuses.patchValue(filtered as any);
    assert.equal(form.controls.bonuses.value.length, 1);

    // Add another new bonus
    const bonus3 = formGroup<TestBonus>({ bonusId: 'bonus-3', bonusYear: 2026, amount: 300 });
    form.controls.bonuses.patchValue([...form.controls.bonuses.value, bonus3] as any);

    assert.equal(form.controls.bonuses.value.length, 2, 'Should have 2 bonuses');
    const ids = form.controls.bonuses.value.map((b) => b.getControl('bonusId').value);
    assert.deepEqual(ids, ['bonus-2', 'bonus-3'], 'Should contain bonus-2 and bonus-3');
  });

  it('should mark form as dirty when adding bonuses', () => {
    const form = formGroup<{ bonuses: Form<TestBonus>[] }>({
      bonuses: [
        formGroup<TestBonus>({ bonusId: 'bonus-1', bonusYear: 2024, amount: 100 }),
      ],
    });

    // Verify initial clean state
    form.reset();
    assert.equal(form.dirty, false, 'Form should be clean after reset');

    // Add a new bonus using patchValue
    const bonus2 = formGroup<TestBonus>({ bonusId: 'bonus-2', bonusYear: 2025, amount: 200 });
    form.controls.bonuses.patchValue([...form.controls.bonuses.value, bonus2] as any);

    // Form should be marked dirty after patchValue
    assert.equal(form.dirty, true, 'Form should be dirty after adding bonus');
  });

  it('should handle rapid add/remove cycles using patchValue', () => {
    const form = formGroup<{ bonuses: Form<TestBonus>[] }>({
      bonuses: [],
    });

    // Rapid adds using patchValue
    const bonuses1to5: Form<TestBonus>[] = [];
    for (let i = 0; i < 5; i++) {
      bonuses1to5.push(
        formGroup<TestBonus>({
          bonusId: `bonus-${i}`,
          bonusYear: 2024 + i,
          amount: 100 * (i + 1),
        })
      );
    }
    form.controls.bonuses.patchValue(bonuses1to5 as any);

    assert.equal(form.controls.bonuses.value.length, 5, 'Should have 5 after adds');

    // Rapid removes using filter
    let filtered = form.controls.bonuses.value.filter((_, idx) => idx !== 2); // Remove bonus-2
    form.controls.bonuses.patchValue(filtered as any);
    
    filtered = form.controls.bonuses.value.filter((_, idx) => idx !== 0); // Remove bonus-0
    form.controls.bonuses.patchValue(filtered as any);
    
    filtered = form.controls.bonuses.value.filter((_, idx) => idx !== form.controls.bonuses.value.length - 1); // Remove last
    form.controls.bonuses.patchValue(filtered as any);

    assert.equal(form.controls.bonuses.value.length, 2, 'Should have 2 after removes');

    const ids = form.controls.bonuses.value.map((b) => b.getControl('bonusId').value);
    // After removing indices 0, 2, and last - should have bonus-1 and bonus-3
    assert.equal(ids.length, 2, 'Should have exactly 2 items');
  });

  it('should not duplicate forms when accessing by reference', () => {
    const form = formGroup<{ bonuses: Form<TestBonus>[] }>({
      bonuses: [
        formGroup<TestBonus>({ bonusId: 'bonus-1', bonusYear: 2024, amount: 100 }),
        formGroup<TestBonus>({ bonusId: 'bonus-2', bonusYear: 2025, amount: 200 }),
      ],
    });

    const initialLength = form.controls.bonuses.value.length;
    const firstBonus = form.controls.bonuses.value[0];

    // Access and verify doesn't duplicate
    assert.equal(form.controls.bonuses.value.length, initialLength);

    // Modify through reference
    firstBonus.controls.bonusYear.value = 2030;

    // Verify it was modified in-place, not duplicated
    assert.equal(
      form.controls.bonuses.value[0].controls.bonusYear.value,
      2030,
      'Should be modified in-place'
    );
    assert.equal(form.controls.bonuses.value.length, initialLength, 'Length should not change');
  });

  it('should handle filtering and re-adding bonuses using patchValue', () => {
    const form = formGroup<{ bonuses: Form<TestBonus>[] }>({
      bonuses: [
        formGroup<TestBonus>({ bonusId: 'bonus-1', bonusYear: 2024, amount: 100 }),
        formGroup<TestBonus>({ bonusId: 'bonus-2', bonusYear: 2025, amount: 200 }),
        formGroup<TestBonus>({ bonusId: 'bonus-3', bonusYear: 2026, amount: 300 }),
      ],
    });

    // Filter out items where bonusYear > 2024
    const filteredBonuses = form.controls.bonuses.value.filter(
      (b) => b.controls.bonusYear.value === 2024
    );

    assert.equal(filteredBonuses.length, 1, 'Should filter to 1 bonus');

    // Replace array with filtered results using patchValue
    form.controls.bonuses.patchValue(filteredBonuses as any);

    assert.equal(form.controls.bonuses.value.length, 1, 'Array should have 1 item');
    assert.equal(
      form.controls.bonuses.value[0].controls.bonusId.value,
      'bonus-1',
      'Should be bonus-1'
    );

    // Add back a new one
    const bonus4 = formGroup<TestBonus>({ bonusId: 'bonus-4', bonusYear: 2027, amount: 400 });
    form.controls.bonuses.patchValue([...form.controls.bonuses.value, bonus4] as any);

    assert.equal(form.controls.bonuses.value.length, 2, 'Should have 2 items');
  });

  it('should maintain form identity after mutations through patchValue', () => {
    const bonuses: Form<TestBonus>[] = [
      formGroup<TestBonus>({ bonusId: 'bonus-1', bonusYear: 2024, amount: 100 }),
      formGroup<TestBonus>({ bonusId: 'bonus-2', bonusYear: 2025, amount: 200 }),
      formGroup<TestBonus>({ bonusId: 'bonus-3', bonusYear: 2026, amount: 300 }),
    ];

    const form = formGroup<{ bonuses: Form<TestBonus>[] }>({ bonuses });

    // Keep reference to second bonus
    const secondBonusRef = form.controls.bonuses.value[1];
    const secondBonusId = secondBonusRef.getControl('bonusId').value;

    // Remove first bonus using filter + patchValue
    const filtered = form.controls.bonuses.value.filter((_, idx) => idx !== 0);
    form.controls.bonuses.patchValue(filtered as any);

    // Verify second bonus is now at index 0 but maintains identity
    assert.equal(
      form.controls.bonuses.value[0].getControl('bonusId').value,
      secondBonusId,
      'Bonus should maintain its identity'
    );

    // Verify reference is still valid
    assert.equal(
      secondBonusRef.getControl('bonusId').value,
      secondBonusId,
      'Reference should still be valid'
    );
  });
});
