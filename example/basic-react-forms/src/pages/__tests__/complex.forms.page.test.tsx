import { describe, it, expect } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ComplexFormPage from '../ComplexFormPage';

const renderInRouter = () =>
  render(
    <MemoryRouter initialEntries={["/complex"]}>
      <Routes>
        <Route path="/complex" element={<ComplexFormPage />} />
      </Routes>
    </MemoryRouter>
  );

describe('ComplexFormPage', () => {
  it('disables Pay button when pristine or invalid; enables when valid and dirty', async () => {
    const user = userEvent.setup();
    renderInRouter();

    const pay = await screen.findByTestId('pay');
    expect(pay).toBeDisabled();

    const fullName = await screen.findByTestId('fullName');
    const email = await screen.findByTestId('email');
    await user.type(fullName, 'Grace Hopper');
    await user.type(email, 'grace@hopper.test');

    expect(pay).toBeDisabled();

    const cardNumber = await screen.findByTestId('cardNumber');
    const expiry = await screen.findByTestId('expiry');
    const cvc = await screen.findByTestId('cvc');
    await user.type(cardNumber, '4242424242424242');
    await user.type(expiry, '12/30');
    await user.type(cvc, '123');

    expect(pay).not.toBeDisabled();
  });
});



