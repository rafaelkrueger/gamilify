import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('date-fns', () => ({
  format: () => 'Mon',
  subDays: (date: Date) => date,
  isToday: () => false
}));
jest.mock('date-fns/locale', () => ({ ptBR: {} }));

import App from './App';

test('exibe título do progresso do usuário', () => {
  render(<App />);
  const heading = screen.getByText(/Meu Progresso/i);
  expect(heading).toBeInTheDocument();
});
