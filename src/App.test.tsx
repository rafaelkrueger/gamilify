import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('date-fns', () => ({
  format: () => 'Mon',
  subDays: (date: Date) => date,
  isToday: () => false
}));
jest.mock('date-fns/locale', () => ({ ptBR: {} }));

import App from './App';

beforeEach(() => {
  localStorage.clear();
});

test('mostra modal de autenticação quando usuário não está logado', () => {
  render(<App />);
  expect(screen.getByText(/Login/i)).toBeInTheDocument();
});

test('exibe título do progresso quando usuário está logado', () => {
  localStorage.setItem('currentUser', JSON.stringify('user'));
  localStorage.setItem('habits_user', JSON.stringify([]));
  localStorage.setItem('xp_user', JSON.stringify(0));
  render(<App />);
  const heading = screen.getByText(/Meu Progresso/i);
  expect(heading).toBeInTheDocument();
});

test('carrega hábitos e xp do usuário logado', async () => {
  const habits = [
    { id: '1', name: 'Ler', streak: 2, completed: false, history: [], category: 'Saúde' }
  ];
  localStorage.setItem('currentUser', JSON.stringify('user'));
  localStorage.setItem('habits_user', JSON.stringify(habits));
  localStorage.setItem('xp_user', JSON.stringify(20));

  render(<App />);

  expect(await screen.findByText('Ler')).toBeInTheDocument();
  expect(screen.getByText(/20 XP/)).toBeInTheDocument();
});
