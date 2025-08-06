import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { format, subDays, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './App.css';
import { loadFromStorage, saveToStorage } from './utils/storage';

type Habit = {
  id: string;
  name: string;
  streak: number;
  completed: boolean;
  history: { date: string; completed: boolean }[];
  category: string;
};

type DailyProgress = {
  date: string;
  day: string;
  completed: number;
  total: number;
  xp: number;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const CATEGORIES = ['Saúde', 'Aprendizado', 'Produtividade', 'Mental', 'Físico', 'Social'];

const generateHabitId = () => Math.random().toString(36).substring(2, 15);

const App = () => {
  const [habits, setHabits] = useState<Habit[]>(() =>
    loadFromStorage('habits', [])
  );

  const [dailyProgress, setDailyProgress] = useState<DailyProgress[]>([]);
  const [xp, setXp] = useState(() => loadFromStorage('xp', 0));
  const [newHabit, setNewHabit] = useState({ name: '', category: CATEGORIES[0] });
  const [activeTab, setActiveTab] = useState('habits');

  // Carregar dados iniciais
  useEffect(() => {
    if (habits.length === 0) {
      const initialHabits: Habit[] = [];
      setHabits(initialHabits);
    }

    generateProgressData();
  }, []);

  // Persistir dados
  useEffect(() => {
    saveToStorage('habits', habits);
    saveToStorage('xp', xp);
    generateProgressData();
  }, [habits, xp]);

  function generateHistory(streak: number, completed: boolean, todayCompleted = false) {
    const history = [];
    const today = new Date();

    for (let i = streak; i > 0; i--) {
      const date = subDays(today, i - 1);
      history.push({
        date: format(date, 'yyyy-MM-dd'),
        completed: i === streak && isToday(date) ? todayCompleted : true
      });
    }

    return history;
  }

  function generateProgressData() {
    const progress = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');

      const dayHabits = habits.flatMap(habit =>
        habit.history.filter(entry => entry.date === dateStr)
      );

      const completed = dayHabits.filter(entry => entry.completed).length;
      const total = habits.length;

      progress.push({
        date: dateStr,
        day: format(date, 'EEE', { locale: ptBR }),
        completed,
        total,
        xp: completed * 10
      });
    }

    setDailyProgress(progress);
  }

  const handleCompleteHabit = (id: string) => {
    setHabits(habits.map(habit => {
      if (habit.id === id) {
        const wasCompleted = habit.completed;
        const today = format(new Date(), 'yyyy-MM-dd');

        const newHistory = habit.history.some(h => h.date === today)
          ? habit.history.map(h => h.date === today ? {...h, completed: !h.completed} : h)
          : [...habit.history, { date: today, completed: true }];

        const streak = !wasCompleted
          ? habit.streak + 1
          : Math.max(0, habit.streak - 1);

        const completed = !wasCompleted;

        setXp(prev => wasCompleted ? Math.max(0, prev - 10) : prev + 10);

        return {
          ...habit,
          streak,
          completed,
          history: newHistory
        };
      }
      return habit;
    }));
  };

  const addHabit = () => {
    if (newHabit.name.trim()) {
      const habit: Habit = {
        id: generateHabitId(),
        name: newHabit.name,
        streak: 0,
        completed: false,
        category: newHabit.category,
        history: []
      };

      setHabits([...habits, habit]);
      setNewHabit({ name: '', category: CATEGORIES[0] });
    }
  };

  const deleteHabit = (id: string) => {
    setHabits(habits.filter(habit => habit.id !== id));
  };

  const calculateLevel = () => Math.floor(xp / 100);
  const levelProgress = xp % 100;

  return (
    <div className="app">
      <header className="app-header">
        <div className="user-card">
          <div className="avatar">👤</div>
          <div>
            <h1>Meu Progresso</h1>
            <div className="level-container">
              <span>Nível {calculateLevel()}</span>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${levelProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
          <div className="xp-badge">
            <span>{xp} XP</span>
          </div>
        </div>
      </header>

      <nav className="tabs">
        <button
          className={activeTab === 'habits' ? 'active' : ''}
          onClick={() => setActiveTab('habits')}
        >
          Hábitos
        </button>
        <button
          className={activeTab === 'progress' ? 'active' : ''}
          onClick={() => setActiveTab('progress')}
        >
          Progresso
        </button>
        <button
          className={activeTab === 'stats' ? 'active' : ''}
          onClick={() => setActiveTab('stats')}
        >
          Estatísticas
        </button>
      </nav>

      {activeTab === 'habits' && (
        <section className="habit-section">
          <div className="section-header">
            <h2>Meus Hábitos</h2>
            <div className="add-habit">
              <input
                type="text"
                placeholder="Novo hábito..."
                value={newHabit.name}
                onChange={(e) => setNewHabit({...newHabit, name: e.target.value})}
                onKeyPress={(e) => e.key === 'Enter' && addHabit()}
              />
              <select
                value={newHabit.category}
                onChange={(e) => setNewHabit({...newHabit, category: e.target.value})}
              >
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <button onClick={addHabit}>+</button>
            </div>
          </div>

          <div className="habit-grid">
            {habits.map(habit => (
              <div
                key={habit.id}
                className={`habit-card ${habit.completed ? 'completed' : ''}`}
              >
                <div className="habit-header">
                  <span className="category-tag" style={{
                    backgroundColor: COLORS[CATEGORIES.indexOf(habit.category) % COLORS.length]
                  }}>
                    {habit.category}
                  </span>
                  <button
                    className="delete-btn"
                    onClick={() => deleteHabit(habit.id)}
                  >
                    ×
                  </button>
                </div>

                <h3>{habit.name}</h3>

                <div className="streak-container">
                  <span>🔥 {habit.streak} dias</span>
                  <button
                    className={habit.completed ? 'checked' : 'check'}
                    onClick={() => handleCompleteHabit(habit.id)}
                  >
                    {habit.completed ? '✓' : 'Marcar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'progress' && (
        <section className="progress-section">
          <h2>Progresso Semanal</h2>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyProgress}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(30, 30, 40, 0.9)',
                    borderRadius: '10px',
                    border: 'none'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="xp"
                  stroke="#8884d8"
                  strokeWidth={3}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <h3>Consistência Diária</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyProgress}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="day" />
                <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                <Tooltip
                  formatter={(value) => [`${value}%`, 'Conclusão']}
                  contentStyle={{
                    backgroundColor: 'rgba(30, 30, 40, 0.9)',
                    borderRadius: '10px',
                    border: 'none'
                  }}
                />
                <Bar dataKey={(entry) => (entry.completed / entry.total) * 100}>
                  {dailyProgress.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="progress-summary">
            <div className="summary-card">
              <span>Atual</span>
              <strong>{dailyProgress[dailyProgress.length - 1]?.completed || 0}/{habits.length}</strong>
            </div>
            <div className="summary-card">
              <span>Média</span>
              <strong>
                {Math.round(
                  dailyProgress.reduce((sum, day) => sum + (day.completed / day.total), 0) * 100 / 7
                )}%
              </strong>
            </div>
            <div className="summary-card">
              <span>Sequência</span>
              <strong>
                {habits.reduce((longest, habit) =>
                  habit.streak > longest ? habit.streak : longest, 0)} dias
              </strong>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'stats' && (
        <section className="stats-section">
          <h2>Estatísticas</h2>

          <div className="category-stats">
            <h3>Distribuição por Categoria</h3>
            <div className="category-grid">
              {CATEGORIES.map((category, index) => {
                const count = habits.filter(h => h.category === category).length;
                return count > 0 ? (
                  <div key={category} className="category-item">
                    <div
                      className="color-box"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span>{category}</span>
                    <div className="count-badge">{count}</div>
                  </div>
                ) : null;
              })}
            </div>
          </div>

          <div className="streak-stats">
            <h3>Top Sequências</h3>
            {[...habits]
              .sort((a, b) => b.streak - a.streak)
              .slice(0, 3)
              .map((habit, index) => (
                <div key={habit.id} className="streak-item">
                  <div className="rank">#{index + 1}</div>
                  <div className="habit-info">
                    <span>{habit.name}</span>
                    <small>{habit.category}</small>
                  </div>
                  <div className="streak-count">
                    🔥 {habit.streak} dias
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      <footer className="app-footer">
        <p>Desenvolvido para crescimento pessoal • {format(new Date(), 'dd/MM/yyyy')}</p>
      </footer>
    </div>
  );
};

export default App;