import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useContext, useState } from 'react';
import { Form } from '../form';
import { FormGroupContext, FormGroupProvider } from '../react/context/FormGroup';
import { formGroup } from '../form/functional';

// Mock bonus data structure similar to ContractBonus
interface MockBonus {
  bonusId: string;
  bonusYear: number;
  amount: number;
  criteria: string;
}

// Component that renders form array items
const FormArrayRenderer: React.FC<{
  forms: Form<MockBonus>[];
  onDelete: (idx: number) => void;
}> = ({ forms, onDelete }) => {
  return (
    <div data-testid="form-array-container">
      {forms.map((form, idx) => (
        <FormGroupProvider key={String(form.getControl('bonusId')?.value)} form={form}>
          <BonusItem index={idx} onDelete={onDelete} />
        </FormGroupProvider>
      ))}
    </div>
  );
};

// Individual bonus form item
const BonusItem: React.FC<{ index: number; onDelete: (idx: number) => void }> = ({
  index,
  onDelete,
}) => {
  const ctx = useContext(FormGroupContext);
  const form = ctx?.form as Form<MockBonus>;

  if (!form) return null;

  const bonusId = form.getControl('bonusId')?.value;
  const bonusYear = form.getControl('bonusYear')?.value;
  const amount = form.getControl('amount')?.value;

  return (
    <div
      data-testid={`bonus-item-${bonusId}`}
      data-bonus-id={bonusId}
      data-bonus-year={bonusYear}
    >
      <span data-testid={`bonus-id-${index}`}>{bonusId}</span>
      <span data-testid={`bonus-year-${index}`}>{bonusYear}</span>
      <span data-testid={`bonus-amount-${index}`}>{amount}</span>
      <button onClick={() => onDelete(index)} data-testid={`delete-bonus-${index}`}>
        Delete
      </button>
    </div>
  );
};

// Parent component that manages form array
const TestComponent: React.FC = () => {
  const [bonuses, setBonuses] = useState<Form<MockBonus>[]>([]);

  const createBonus = (id: string, year: number, amount: number): Form<MockBonus> =>
    formGroup<MockBonus>({
      bonusId: id,
      bonusYear: year,
      amount: amount,
      criteria: 'test',
    });

  const addBonus = () => {
    const newId = `bonus-${Date.now()}`;
    // Use patchValue pattern instead of push
    setBonuses((prev) => [...prev, createBonus(newId, 0, 0)]);
  };

  const addPopulatedBonus = (year: number, amount: number) => {
    const newId = `bonus-${Date.now()}`;
    setBonuses((prev) => [...prev, createBonus(newId, year, amount)]);
  };

  const deleteBonus = (idx: number) => {
    // Use filter pattern instead of splice
    setBonuses((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <button onClick={addBonus} data-testid="add-bonus">
        Add Bonus
      </button>
      <button onClick={() => addPopulatedBonus(2024, 100)} data-testid="add-populated-bonus">
        Add Populated Bonus
      </button>
      <FormArrayRenderer forms={bonuses} onDelete={deleteBonus} />
      <div data-testid="bonus-count">{bonuses.length}</div>
    </div>
  );
};

describe('Form Array Mutations - Add/Remove with FormGroupProvider', () => {
  it('should add a single bonus and render it correctly', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);

    const addButton = screen.getByTestId('add-bonus');
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByTestId('bonus-count')).toHaveTextContent('1');
    });

    // Verify bonus was created with unique key
    const items = screen.getByTestId('form-array-container').children;
    expect(items.length).toBe(1);
  });

  it('should add multiple bonuses and keep them distinct', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);

    const addButton = screen.getByTestId('add-bonus');
    
    // Add 3 bonuses
    await user.click(addButton);
    await user.click(addButton);
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByTestId('bonus-count')).toHaveTextContent('3');
    });

    const items = screen.getByTestId('form-array-container').children;
    expect(items.length).toBe(3);

    // Verify each has unique bonusId (based on timestamp)
    const bonusIds = Array.from(items).map((item) =>
      (item as HTMLElement).getAttribute('data-bonus-id')
    );
    const uniqueIds = new Set(bonusIds);
    expect(uniqueIds.size).toBe(3);
  });

  it('should add and delete bonuses without duplication', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);

    // Add 3 bonuses
    await user.click(screen.getByTestId('add-bonus'));
    await user.click(screen.getByTestId('add-bonus'));
    await user.click(screen.getByTestId('add-bonus'));

    await waitFor(() => {
      expect(screen.getByTestId('bonus-count')).toHaveTextContent('3');
    });

    // Delete the first bonus
    const deleteButton = screen.getByTestId('delete-bonus-0');
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByTestId('bonus-count')).toHaveTextContent('2');
    });

    const items = screen.getByTestId('form-array-container').children;
    expect(items.length).toBe(2);
  });

  it('should handle complex cycle: add -> populate -> delete -> add', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);

    // Add and populate
    await user.click(screen.getByTestId('add-populated-bonus'));
    await waitFor(() => expect(screen.getByTestId('bonus-count')).toHaveTextContent('1'));

    // Add another
    await user.click(screen.getByTestId('add-populated-bonus'));
    await waitFor(() => expect(screen.getByTestId('bonus-count')).toHaveTextContent('2'));

    // Delete first
    const deleteButton = screen.getByTestId('delete-bonus-0');
    await user.click(deleteButton);
    await waitFor(() => expect(screen.getByTestId('bonus-count')).toHaveTextContent('1'));

    // Add new one
    await user.click(screen.getByTestId('add-populated-bonus'));
    await waitFor(() => expect(screen.getByTestId('bonus-count')).toHaveTextContent('2'));

    // Verify we have 2 distinct items
    const items = screen.getByTestId('form-array-container').children;
    expect(items.length).toBe(2);

    // Verify each has unique ID
    const bonusIds = Array.from(items).map((item) =>
      (item as HTMLElement).getAttribute('data-bonus-id')
    );
    const uniqueIds = new Set(bonusIds);
    expect(uniqueIds.size).toBe(2);
  });

  it('should delete multiple items in sequence correctly', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);

    // Add 5 bonuses with small delays to ensure unique timestamps
    await user.click(screen.getByTestId('add-bonus'));
    await new Promise(r => setTimeout(r, 10));
    await user.click(screen.getByTestId('add-bonus'));
    await new Promise(r => setTimeout(r, 10));
    await user.click(screen.getByTestId('add-bonus'));
    await new Promise(r => setTimeout(r, 10));
    await user.click(screen.getByTestId('add-bonus'));
    await new Promise(r => setTimeout(r, 10));
    await user.click(screen.getByTestId('add-bonus'));

    await waitFor(() => {
      expect(screen.getByTestId('bonus-count')).toHaveTextContent('5');
    });

    let items = screen.getByTestId('form-array-container').children;
    expect(items.length).toBe(5);

    // Delete from end (index 4)
    let deleteBtn = screen.getByTestId('delete-bonus-4');
    await user.click(deleteBtn);
    await waitFor(() => {
      expect(screen.getByTestId('bonus-count')).toHaveTextContent('4');
    });

    // Delete from end again (index 3)
    items = screen.getByTestId('form-array-container').children;
    deleteBtn = items[items.length - 1].querySelector('[data-testid^="delete-bonus"]') as HTMLElement;
    await user.click(deleteBtn);
    await waitFor(() => {
      expect(screen.getByTestId('bonus-count')).toHaveTextContent('3');
    });

    // Delete from end again (index 2)
    items = screen.getByTestId('form-array-container').children;
    deleteBtn = items[items.length - 1].querySelector('[data-testid^="delete-bonus"]') as HTMLElement;
    await user.click(deleteBtn);
    await waitFor(() => {
      expect(screen.getByTestId('bonus-count')).toHaveTextContent('2');
    });

    items = screen.getByTestId('form-array-container').children;
    expect(items.length).toBe(2);
  });

  it('should handle rapid add/delete cycles without ghost items', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);

    // Rapid add
    await user.click(screen.getByTestId('add-bonus'));
    await user.click(screen.getByTestId('add-bonus'));
    await user.click(screen.getByTestId('add-bonus'));

    await waitFor(() => {
      expect(screen.getByTestId('bonus-count')).toHaveTextContent('3');
    });

    let items = screen.getByTestId('form-array-container').children;
    const initialIds = Array.from(items).map((item) =>
      (item as HTMLElement).getAttribute('data-bonus-id')
    );

    // Delete middle
    await user.click(screen.getByTestId('delete-bonus-1'));
    await waitFor(() => {
      expect(screen.getByTestId('bonus-count')).toHaveTextContent('2');
    });

    items = screen.getByTestId('form-array-container').children;
    const afterDeleteIds = Array.from(items).map((item) =>
      (item as HTMLElement).getAttribute('data-bonus-id')
    );

    // Verify no duplicates remain
    const uniqueIds = new Set(afterDeleteIds);
    expect(uniqueIds.size).toBe(2);

    // Verify deleted item is truly gone
    expect(afterDeleteIds).not.toContain(initialIds[1]);
  });
});
