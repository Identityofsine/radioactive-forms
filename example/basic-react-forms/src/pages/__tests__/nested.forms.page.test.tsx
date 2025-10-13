import { describe, it, expect } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NestedFormsPage from '../NestedFormsPage';

const renderInRouter = () =>
  render(
    <MemoryRouter initialEntries={["/nested"]}>
      <Routes>
        <Route path="/nested" element={<NestedFormsPage />} />
      </Routes>
    </MemoryRouter>
  );

describe('NestedFormsPage', () => {
  it('propagates readonly and can add nested forms', async () => {
    const user = userEvent.setup();
    renderInRouter();

    const addTeam = await screen.findByTestId('add-team');
    await user.click(addTeam);

    const toggleReadonly = await screen.findByTestId('toggle-readonly');
    await user.click(toggleReadonly);

    // Inputs should be readonly logically; we assert by trying to type then checking value unchanged
    const season = await screen.findByTestId('season');
    const before = (season as HTMLInputElement).value;
    await user.type(season, 'X');
    const after = (season as HTMLInputElement).value;
    expect(after).toBe(before); // change prevented by readonly state enforcement in app logic
  });
});



