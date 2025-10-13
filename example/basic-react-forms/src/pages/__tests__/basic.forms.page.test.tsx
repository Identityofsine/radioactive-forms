import { describe, it, expect } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BasicFormPage from '../BasicFormPage';

const renderInRouter = () =>
  render(
    <MemoryRouter initialEntries={["/basic"]}>
      <Routes>
        <Route path="/basic" element={<BasicFormPage />} />
      </Routes>
    </MemoryRouter>
  );

describe('BasicFormPage', () => {
  it('validates required fields and toggles readonly', async () => {
    const user = userEvent.setup();
    renderInRouter();

    const name = await screen.findByTestId('name');
    const email = await screen.findByTestId('email');
    const submit = await screen.findByTestId('submit');
    const toggleReadonly = await screen.findByTestId('toggle-readonly');

    // Initially invalid because required fields are empty
    expect(submit).toBeDisabled();

    await user.type(name, 'Ada Lovelace');
    await user.type(email, 'ada@lovelace.test');

    expect(submit).not.toBeDisabled();

    // toggle readonly should disable submit
    await user.click(toggleReadonly);
    expect(submit).toBeDisabled();
  });

  it('reset returns form to initial values', async () => {
    const user = userEvent.setup();
    renderInRouter();

    const name = await screen.findByTestId('name');
    const reset = await screen.findByTestId('reset');

    await user.type(name, 'X');
    expect((name as HTMLInputElement).value).toContain('X');
    await user.click(reset);
    expect((name as HTMLInputElement).value).toBe('');
  });
});



