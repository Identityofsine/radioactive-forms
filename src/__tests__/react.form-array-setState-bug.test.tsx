import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useContext, useState } from 'react';
import { Form, FormGroupProvider, useFormgroup } from '../react/context/FormGroup';
import { FormGroupContext } from '../react/context/FormGroup';
import { formGroup } from '../form/functional';

/**
 * React IncentiveBonusWidget Bug Tests
 * 
 * Form Array setState Corruption Bug Tests
 * 
 * Tests the bug where modifying one form in an array causes others to disappear:
 * 1. Add 2 forms to array
 * 2. Edit the first one's field
 * 3. Second form disappears
 * 
 * This suggests the form's setState is doing:
 * control.value = [...control.value, self]
 * instead of
 * control.value[index] = self
 */

interface ContractBonus {
  bonusId: string;
  bonusYear: number;
  bonusAmount: number;
}

// Parent component that manages bonuses array
const EditableFormArrayComponent: React.FC = () => {
  const [bonuses, setBonuses] = useState<Form<ContractBonus>[]>([
    formGroup<ContractBonus>({ bonusId: 'bonus-1', bonusYear: 2024, bonusAmount: 100 }),
    formGroup<ContractBonus>({ bonusId: 'bonus-2', bonusYear: 2025, bonusAmount: 200 }),
  ]);

  const [addCount, setAddCount] = useState(0);

  const addBonus = () => {
    const newBonus = formGroup<ContractBonus>({
      bonusId: `bonus-${Date.now()}`,
      bonusYear: 2026 + addCount,
      bonusAmount: (addCount + 1) * 100,
    });
    setBonuses((prev) => [...prev, newBonus]);
    setAddCount((c) => c + 1);
  };

  return (
    <div>
      <button onClick={addBonus} data-testid="add-bonus-btn">
        Add Bonus
      </button>
      <div data-testid="bonus-count">{bonuses.length}</div>
      <div data-testid="bonuses-container">
        {bonuses.map((form, idx) => (
          <FormGroupProvider
            key={String(form.getControl('bonusId')?.value)}
            form={form}
          >
            <div data-testid={`bonus-widget-${idx}`} data-bonus-id={form.getControl('bonusId')?.value}>
              <span data-testid={`bonus-id-${idx}`}>{form.getControl('bonusId')?.value}</span>
              <span data-testid={`bonus-year-${idx}`}>{form.getControl('bonusYear')?.value}</span>
              <span data-testid={`bonus-amount-${idx}`}>{form.getControl('bonusAmount')?.value}</span>
              <button
                data-testid={`edit-amount-${idx}`}
                onClick={() => {
                  form.controls.bonusAmount.value = form.getControl('bonusAmount')?.value + 100;
                }}
              >
                Add 100
              </button>
            </div>
          </FormGroupProvider>
        ))}
      </div>
    </div>
  );
};

describe('React - Form Array Bug (Disappearing Items)', () => {
  it('should not lose second bonus when editing first bonus', async () => {
    const user = userEvent.setup();
    render(<EditableFormArrayComponent />);

    // Verify initial state - 2 bonuses
    await waitFor(() => {
      expect(screen.getByTestId('bonus-count')).toHaveTextContent('2');
    });

    expect(screen.getByTestId('bonus-id-0')).toHaveTextContent('bonus-1');
    expect(screen.getByTestId('bonus-id-1')).toHaveTextContent('bonus-2');

    // Edit first bonus by clicking "Add 100"
    const editBtn0 = screen.getByTestId('edit-amount-0');
    await user.click(editBtn0);

    // Verify count stays stable after edit
    await waitFor(() => {
      expect(screen.getByTestId('bonus-count')).toHaveTextContent('2');
    });

    // Verify both bonuses still exist
    expect(screen.getByTestId('bonus-count')).toHaveTextContent('2');
    expect(screen.getByTestId('bonus-id-0')).toHaveTextContent('bonus-1');
    expect(screen.getByTestId('bonus-id-1')).toHaveTextContent('bonus-2');
  });

  it('should maintain all bonuses when editing in different order', async () => {
    const user = userEvent.setup();
    render(<EditableFormArrayComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('bonus-count')).toHaveTextContent('2');
    });

    // Edit second bonus first
    await user.click(screen.getByTestId('edit-amount-1'));

    await waitFor(() => {
      expect(screen.getByTestId('bonus-count')).toHaveTextContent('2');
    });

    // Both should still exist
    expect(screen.getByTestId('bonus-count')).toHaveTextContent('2');
    expect(screen.getByTestId('bonus-id-0')).toHaveTextContent('bonus-1');
    expect(screen.getByTestId('bonus-id-1')).toHaveTextContent('bonus-2');

    // Now edit first bonus
    await user.click(screen.getByTestId('edit-amount-0'));

    await waitFor(() => {
      expect(screen.getByTestId('bonus-count')).toHaveTextContent('2');
    });

    // Still should have both
    expect(screen.getByTestId('bonus-count')).toHaveTextContent('2');
    expect(screen.getByTestId('bonus-id-0')).toHaveTextContent('bonus-1');
    expect(screen.getByTestId('bonus-id-1')).toHaveTextContent('bonus-2');
  });

  it('should handle multiple edits to same bonus without losing others', async () => {
    const user = userEvent.setup();
    render(<EditableFormArrayComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('bonus-count')).toHaveTextContent('2');
    });

    // Edit first bonus multiple times
    const editBtn0 = screen.getByTestId('edit-amount-0');

    await user.click(editBtn0);
    await waitFor(() => {
      expect(screen.getByTestId('bonus-count')).toHaveTextContent('2');
    });

    await user.click(editBtn0);
    await waitFor(() => {
      expect(screen.getByTestId('bonus-count')).toHaveTextContent('2');
    });

    await user.click(editBtn0);
    await waitFor(() => {
      expect(screen.getByTestId('bonus-count')).toHaveTextContent('2');
    });

    // Second bonus should NOT disappear
    expect(screen.getByTestId('bonus-count')).toHaveTextContent('2');
    expect(screen.getByTestId('bonus-id-1')).toHaveTextContent('bonus-2');
  });

  it('should maintain integrity when adding and editing bonuses', async () => {
    const user = userEvent.setup();
    render(<EditableFormArrayComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('bonus-count')).toHaveTextContent('2');
    });

    // Add a third bonus
    await user.click(screen.getByTestId('add-bonus-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('bonus-count')).toHaveTextContent('3');
    });

    // Edit first bonus
    await user.click(screen.getByTestId('edit-amount-0'));

    await waitFor(() => {
      expect(screen.getByTestId('bonus-count')).toHaveTextContent('3');
    });

    // All three should still be there
    expect(screen.getByTestId('bonus-count')).toHaveTextContent('3');
    expect(screen.getByTestId('bonus-id-0')).toHaveTextContent('bonus-1');
    expect(screen.getByTestId('bonus-id-1')).toHaveTextContent('bonus-2');
    expect(screen.queryByTestId('bonus-widget-2')).toBeInTheDocument();

    // Edit second bonus
    await user.click(screen.getByTestId('edit-amount-1'));

    await waitFor(() => {
      expect(screen.getByTestId('bonus-count')).toHaveTextContent('3');
    });

    // All three should STILL be there
    expect(screen.getByTestId('bonus-count')).toHaveTextContent('3');
  });
});
