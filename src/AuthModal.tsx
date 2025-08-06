import React, { useState } from 'react';
import { loadFromStorage, saveToStorage } from './utils/storage';

type AuthModalProps = {
  onLogin: (username: string) => void;
};

const AuthModal: React.FC<AuthModalProps> = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const users = loadFromStorage<Record<string, { password: string }>>('users', {});

    if (!username || !password) {
      setError('Preencha todos os campos');
      return;
    }

    if (isRegister) {
      if (users[username]) {
        setError('Usuário já existe');
        return;
      }
      users[username] = { password };
      saveToStorage('users', users);
      saveToStorage(`habits_${username}`, []);
      saveToStorage(`xp_${username}`, 0);
      onLogin(username);
    } else {
      if (!users[username] || users[username].password !== password) {
        setError('Credenciais inválidas');
        return;
      }
      onLogin(username);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{isRegister ? 'Registro' : 'Login'}</h2>
        <input
          type="text"
          placeholder="Usuário"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        {error && <p className="error">{error}</p>}
        <button onClick={handleSubmit}>{isRegister ? 'Registrar' : 'Entrar'}</button>
        <button className="link" onClick={() => { setIsRegister(!isRegister); setError(''); }}>
          {isRegister ? 'Já possui conta? Entre' : 'Criar conta'}
        </button>
      </div>
    </div>
  );
};

export default AuthModal;
