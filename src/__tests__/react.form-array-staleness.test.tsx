import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useContext } from 'react';
import { Form } from '../form';
import { formGroup } from '../form/functional';
import { FormGroupContext, FormGroupProvider } from '../react/context/FormGroup';
import { BaseFormComponent } from '../test/react-test-utils';

interface ItemShape { id: string; value: number; }
interface RootSchema { items: Form<ItemShape>[] }

const ListFromControl: React.FC = () => {
  const ctx = useContext(FormGroupContext);
  const root = ctx?.form as unknown as Form<RootSchema> | undefined;
  const items = root?.controls?.items?.value as Form<ItemShape>[] | undefined;

  const add = () => {
    items?.push(formGroup<ItemShape>({ id: `n-${(items?.length ?? 0) + 1}`, value: (items?.length ?? 0) + 1 }));
  };

  const incFirst = () => {
    if (!items || items.length === 0) return;
    const f = items[0];
    f.controls.value.value = (f.getControl('value')?.value ?? 0) + 1;
  };

  return (
    <div>
      <div data-testid="count">{items?.length ?? 0}</div>
      <button data-testid="add" onClick={add}>add</button>
      <button data-testid="inc-first" onClick={incFirst}>inc-first</button>
      <div data-testid="container">
        {items?.map((form, idx) => (
          <FormGroupProvider key={String(form.getControl('id')?.value)} form={form}>
            <div data-testid={`row-${idx}`}>
              <span data-testid={`id-${idx}`}>{form.getControl('id')?.value}</span>
              <span data-testid={`val-${idx}`}>{form.getControl('value')?.value}</span>
            </div>
          </FormGroupProvider>
        ))}
      </div>
    </div>
  );
};

describe('Array-of-forms staleness (from FormControl array)', () => {
  it('render from control, add four, edit first, others remain', async () => {
    const user = userEvent.setup();

    const schema: RootSchema = {
      items: [formGroup<ItemShape>({ id: 'a', value: 1 })],
    };

    render(
      <BaseFormComponent schema={schema as any}>
        <ListFromControl />
      </BaseFormComponent>
    );

    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));
    expect(screen.getByTestId('id-0')).toHaveTextContent('a');
    expect(screen.getByTestId('val-0')).toHaveTextContent('1');

    // Add four more
    for (let i = 0; i < 4; i++) {
      await user.click(screen.getByTestId('add'));
    }

    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('5'));

    // Edit first
    await user.click(screen.getByTestId('inc-first'));

    // Ensure next three remain
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('5'));
    expect(screen.getByTestId('id-1')).toBeInTheDocument();
    expect(screen.getByTestId('id-2')).toBeInTheDocument();
    expect(screen.getByTestId('id-3')).toBeInTheDocument();

    // First value updated, others unchanged
    await waitFor(() => expect(screen.getByTestId('val-0')).toHaveTextContent('2'));
  });
});


