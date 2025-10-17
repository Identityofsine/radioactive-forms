import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';
import { Form } from '../form';
import { formGroup } from '../form/functional';
import { FormGroupProvider } from '../react/context/FormGroup';

interface ItemShape { id: string; value: number; }

// Harness simulating external state that adds to array and then edits the first item
const StalenessHarness: React.FC = () => {
  const [items, setItems] = useState<Form<ItemShape>[]>([
    formGroup<ItemShape>({ id: 'a', value: 1 }),
  ]);

  const add = () => setItems(prev => [...prev, formGroup<ItemShape>({ id: 'b', value: 2 })]);

  return (
    <div>
      <div data-testid="count">{items.length}</div>
      <button data-testid="add" onClick={add}>add</button>
      <div data-testid="container">
        {items.map((form, idx) => (
          <FormGroupProvider key={form.getControl('id')?.value} form={form}>
            <div data-testid={`row-${idx}`}>
              <span data-testid={`id-${idx}`}>{form.getControl('id')?.value}</span>
              <span data-testid={`val-${idx}`}>{form.getControl('value')?.value}</span>
              <button data-testid={`inc-${idx}`} onClick={() => {
                form.controls.value.value = (form.getControl('value')?.value ?? 0) + 1;
              }}>inc</button>
            </div>
          </FormGroupProvider>
        ))}
      </div>
    </div>
  );
};

describe('Array-of-forms staleness (factory should return current control)', () => {
  it('after adding a new form, editing the first does not delete/duplicate others', async () => {
    const user = userEvent.setup();
    render(<StalenessHarness />);

    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));
    expect(screen.getByTestId('id-0')).toHaveTextContent('a');

    // Add second form (this is where stale factory historically caused issues)
    await user.click(screen.getByTestId('add'));
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('2'));
    expect(screen.getByTestId('id-1')).toHaveTextContent('b');

    // Edit first form
    await user.click(screen.getByTestId('inc-0'));

    // Ensure both remain and values update
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('2'));
    expect(screen.getByTestId('id-0')).toHaveTextContent('a');
    expect(screen.getByTestId('id-1')).toHaveTextContent('b');
    await waitFor(() => expect(screen.getByTestId('val-0')).toHaveTextContent('2'));
  });
});


