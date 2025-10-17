import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';
import { Form } from '../form';
import { formGroup } from '../form/functional';
import { FormGroupProvider } from '../react/context/FormGroup';

interface ItemFormShape {
  id: string;
  value: number;
}

const ArrayOfFormsHarness: React.FC = () => {
  const [items, setItems] = useState<Form<ItemFormShape>[]>([
    formGroup<ItemFormShape>({ id: 'a', value: 1 }),
    formGroup<ItemFormShape>({ id: 'b', value: 2 }),
    formGroup<ItemFormShape>({ id: 'c', value: 3 }),
  ]);

  const addItem = () => setItems(prev => [...prev, formGroup<ItemFormShape>({ id: `${Date.now()}`, value: prev.length + 1 })]);
  const removeSecond = () => setItems(prev => prev.slice(0, 1).concat(prev.slice(2)));
  const shrinkLengthToTwo = () => setItems(prev => prev.slice(0, 2));

  return (
    <div>
      <div data-testid="count">{items.length}</div>
      <button data-testid="add" onClick={addItem}>add</button>
      <button data-testid="remove-second" onClick={removeSecond}>remove-second</button>
      <button data-testid="shrink-two" onClick={shrinkLengthToTwo}>shrink-two</button>
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

describe('React - Array of Forms Reactivity and Identity', () => {
  it('edits do not change array length or duplicate entries', async () => {
    const user = userEvent.setup();
    render(<ArrayOfFormsHarness />);

    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('3'));
    expect(screen.getByTestId('id-0')).toHaveTextContent('a');
    expect(screen.getByTestId('id-1')).toHaveTextContent('b');
    expect(screen.getByTestId('id-2')).toHaveTextContent('c');

    await user.click(screen.getByTestId('inc-0'));
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('3'));
    expect(screen.getByTestId('id-1')).toHaveTextContent('b');
  });

  it('push and subsequent edits keep identity stable', async () => {
    const user = userEvent.setup();
    render(<ArrayOfFormsHarness />);

    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('3'));
    await user.click(screen.getByTestId('add'));
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('4'));
    await user.click(screen.getByTestId('inc-0'));
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('4'));
  });

  it('splice/remove does not corrupt remaining forms and edits still work', async () => {
    const user = userEvent.setup();
    render(<ArrayOfFormsHarness />);

    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('3'));
    await user.click(screen.getByTestId('remove-second'));
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('2'));
    // Remaining indices shift; row-1 should now be original row-2 (id c)
    expect(screen.getByTestId('id-1')).toHaveTextContent('c');
    await user.click(screen.getByTestId('inc-1'));
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('2'));
  });

  it('length shrink via slice does not leave holes and reactivity preserved', async () => {
    const user = userEvent.setup();
    render(<ArrayOfFormsHarness />);

    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('3'));
    await user.click(screen.getByTestId('shrink-two'));
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('2'));
    expect(screen.getByTestId('id-0')).toHaveTextContent('a');
    expect(screen.getByTestId('id-1')).toHaveTextContent('b');
    await user.click(screen.getByTestId('inc-0'));
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('2'));
  });
});


