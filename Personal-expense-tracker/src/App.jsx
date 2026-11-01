import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard, Wallet, ArrowDownLeft, ArrowUpRight,
  Plus, Search, Trash2, Pencil, Download, Moon, Sun,
  Target, Bell, X, Menu, TrendingUp, CircleDollarSign
} from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import "./App.css";

const initialTransactions = [
  { id: 1, title: "Monthly Salary", amount: 45000, type: "income", category: "Salary", date: "2026-10-01" },
  { id: 2, title: "Grocery Shopping", amount: 1800, type: "expense", category: "Food", date: "2026-10-03" },
  { id: 3, title: "Internet Bill", amount: 799, type: "expense", category: "Bills", date: "2026-10-05" },
  { id: 4, title: "Bus and Travel", amount: 650, type: "expense", category: "Travel", date: "2026-10-08" },
  { id: 5, title: "Freelance Project", amount: 5000, type: "income", category: "Freelance", date: "2026-10-10" },
  { id: 6, title: "New Headphones", amount: 2200, type: "expense", category: "Shopping", date: "2026-10-12" },
];

const categories = [
  "Food", "Travel", "Shopping", "Bills",
  "Entertainment", "Health", "Education", "Salary", "Freelance", "Other"
];

const colors = [
  "#635bff", "#16a085", "#f59e0b", "#ec4899",
  "#38bdf8", "#a78bfa", "#fb7185", "#14b8a6"
];

const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);

const today = () => new Date().toISOString().slice(0, 10);
const thisMonth = () => today().slice(0, 7);

function readStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function App() {
  const [transactions, setTransactions] = useState(() =>
    readStorage("pennypilot_transactions", initialTransactions)
  );
  const [budget, setBudget] = useState(() =>
    readStorage("pennypilot_budget", 15000)
  );
  const [goals, setGoals] = useState(() =>
    readStorage("pennypilot_goals", [
      { id: 1, name: "New Laptop", target: 60000, saved: 18000 },
      { id: 2, name: "Emergency Fund", target: 30000, saved: 12000 },
    ])
  );
  const [dark, setDark] = useState(() =>
    readStorage("pennypilot_dark", false)
  );
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [month, setMonth] = useState(thisMonth());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [form, setForm] = useState({
    title: "", amount: "", type: "expense",
    category: "Food", date: today()
  });

  useEffect(() => {
    localStorage.setItem("pennypilot_transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("pennypilot_budget", JSON.stringify(budget));
  }, [budget]);

  useEffect(() => {
    localStorage.setItem("pennypilot_goals", JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem("pennypilot_dark", JSON.stringify(dark));
    document.body.classList.toggle("dark-mode", dark);
  }, [dark]);

  const monthlyTransactions = useMemo(
    () => transactions.filter((t) => t.date.startsWith(month)),
    [transactions, month]
  );

  const income = monthlyTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expenses = monthlyTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = transactions.reduce(
    (sum, t) => sum + (t.type === "income" ? Number(t.amount) : -Number(t.amount)),
    0
  );

  const savings = income - expenses;
  const spentPercentage = budget > 0 ? (expenses / budget) * 100 : 0;

  const filteredTransactions = monthlyTransactions
    .filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(query.toLowerCase()) ||
        t.category.toLowerCase().includes(query.toLowerCase());

      const matchesType = filter === "all" || t.type === filter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const categoryData = categories
    .map((category) => ({
      name: category,
      value: monthlyTransactions
        .filter((t) => t.type === "expense" && t.category === category)
        .reduce((sum, t) => sum + Number(t.amount), 0),
    }))
    .filter((item) => item.value > 0);

  const lastSixMonths = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(`${month}-01T12:00:00`);
      d.setMonth(d.getMonth() - (5 - i));
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return {
        month: d.toLocaleString("en-IN", { month: "short" }),
        Income: transactions
          .filter((t) => t.type === "income" && t.date.startsWith(key))
          .reduce((sum, t) => sum + Number(t.amount), 0),
        Expenses: transactions
          .filter((t) => t.type === "expense" && t.date.startsWith(key))
          .reduce((sum, t) => sum + Number(t.amount), 0),
      };
    });
  }, [transactions, month]);

  function openAddForm() {
    setEditingId(null);
    setForm({
      title: "", amount: "", type: "expense",
      category: "Food", date: today()
    });
    setShowForm(true);
  }

  function openEditForm(transaction) {
    setEditingId(transaction.id);
    setForm({
      title: transaction.title,
      amount: String(transaction.amount),
      type: transaction.type,
      category: transaction.category,
      date: transaction.date,
    });
    setShowForm(true);
  }

  function saveTransaction(e) {
    e.preventDefault();

    const amount = Number(form.amount);
    if (!form.title.trim() || !Number.isFinite(amount) || amount <= 0 || !form.date) {
      alert("Enter a valid title, amount and date.");
      return;
    }

    const transaction = {
      ...form,
      title: form.title.trim(),
      amount,
      id: editingId ?? Date.now(),
    };

    if (editingId !== null) {
      setTransactions((prev) =>
        prev.map((t) => t.id === editingId ? transaction : t)
      );
    } else {
      setTransactions((prev) => [...prev, transaction]);
    }

    setShowForm(false);
    setEditingId(null);
  }

  function deleteTransaction(id) {
    if (window.confirm("Delete this transaction?")) {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    }
  }

  function exportCSV() {
    const headers = ["Title", "Amount", "Type", "Category", "Date"];
    const rows = filteredTransactions.map((t) =>
      [t.title, t.amount, t.type, t.category, t.date]
    );
    const csv = [headers, ...rows]
      .map((row) => row.map((v) =>
        `"${String(v).replace(/"/g, '""')}"`
      ).join(","))
      .join("\r\n");

    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `pennypilot-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function addGoal() {
    const name = window.prompt("Enter your savings goal name:");
    if (!name?.trim()) return;

    const raw = window.prompt("Enter your target amount in ₹:");
    const target = Number(raw);
    if (!Number.isFinite(target) || target <= 0) {
      alert("Enter a valid target amount.");
      return;
    }

    setGoals((prev) => [
      ...prev,
      { id: Date.now(), name: name.trim(), target, saved: 0 }
    ]);
  }

  function contributeToGoal(goal) {
    const raw = window.prompt(`How much do you want to add to ${goal.name}?`);
    if (raw === null) return;

    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Enter a valid amount.");
      return;
    }

    setGoals((prev) => prev.map((g) =>
      g.id === goal.id
        ? { ...g, saved: Math.min(g.saved + amount, g.target) }
        : g
    ));
  }

  function notifyBudget() {
    if (!("Notification" in window)) {
      alert(`You have spent ${money(expenses)} of your ${money(budget)} budget.`);
      return;
    }

    if (Notification.permission === "granted") {
      new Notification("PennyPilot Budget Update", {
        body: `Spent ${money(expenses)} out of ${money(budget)} this month.`,
      });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification("PennyPilot Budget Update", {
            body: `Spent ${money(expenses)} out of ${money(budget)} this month.`,
          });
        }
      });
    } else {
      alert(`You have spent ${money(expenses)} of your ${money(budget)} budget.`);
    }
  }

  return (
    <div className={`app-shell ${dark ? "theme-dark" : ""}`}>
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon"><Wallet size={23} /></div>
          <div>Penny<span>Pilot</span><small>SMART FINANCE</small></div>
          <button className="icon-button mobile-close" onClick={() => setMobileMenu(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <p className="nav-label">WORKSPACE</p>
        <a className="nav-item active" href="#dashboard" onClick={() => setMobileMenu(false)}>
          <LayoutDashboard size={19} /> Dashboard
        </a>
        <a className="nav-item" href="#transactions" onClick={() => setMobileMenu(false)}>
          <ArrowDownLeft size={19} /> Transactions
        </a>
        <a className="nav-item" href="#analytics" onClick={() => setMobileMenu(false)}>
          <TrendingUp size={19} /> Analytics
        </a>
        <a className="nav-item" href="#budgets" onClick={() => setMobileMenu(false)}>
          <Target size={19} /> Budget & Goals
        </a>

        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <div className="tip-icon"><CircleDollarSign size={22} /></div>
            <strong>Small steps, big savings.</strong>
            <p>Keep tracking. Keep growing.</p>
          </div>
          <div className="profile">
            <div className="avatar">PP</div>
            <div><strong>My Wallet</strong><small>Personal account</small></div>
          </div>
        </div>
      </aside>

      {mobileMenu && <button className="mobile-overlay" onClick={() => setMobileMenu(false)} aria-label="Close navigation" />}

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button menu-toggle" onClick={() => setMobileMenu(true)} aria-label="Open menu">
              <Menu size={22} />
            </button>
            <div>
              <p className="eyebrow">YOUR MONEY, YOUR CONTROL</p>
              <h1>Dashboard <span className="wave">✦</span></h1>
            </div>
          </div>
          <div className="top-actions">
            <input
              className="month-picker"
              aria-label="Choose dashboard month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
            <button className="icon-button" onClick={() => setDark(!dark)} aria-label="Toggle theme" title="Toggle dark mode">
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button className="icon-button" onClick={notifyBudget} aria-label="Budget notification" title="Budget notification">
              <Bell size={19} />
            </button>
            <button className="primary-button" onClick={openAddForm}>
              <Plus size={18} /> <span>Add Transaction</span>
            </button>
          </div>
        </header>

        <section className="welcome-row">
          <div>
            <h2>Your financial overview</h2>
            <p>Here is what's happening with your money.</p>
          </div>
          <span className="date-chip">{new Date(`${month}-01T12:00:00`).toLocaleString("en-IN", { month: "long", year: "numeric" })}</span>
        </section>

        <section className="stats-grid">
          <article className="stat-card balance-card">
            <div className="stat-top"><span>Total balance</span><div className="stat-icon"><Wallet size={20} /></div></div>
            <h2>{money(balance)}</h2>
            <p className="stat-note">Across all recorded transactions</p>
          </article>
          <article className="stat-card">
            <div className="stat-top"><span>Monthly income</span><div className="stat-icon income-icon"><ArrowDownLeft size={20} /></div></div>
            <h2>{money(income)}</h2>
            <p className="stat-note positive"><TrendingUp size={14} /> Selected month</p>
          </article>
          <article className="stat-card">
            <div className="stat-top"><span>Monthly expenses</span><div className="stat-icon expense-icon"><ArrowUpRight size={20} /></div></div>
            <h2>{money(expenses)}</h2>
            <p className="stat-note">Selected month</p>
          </article>
          <article className="stat-card">
            <div className="stat-top"><span>Monthly savings</span><div className="stat-icon savings-icon"><CircleDollarSign size={20} /></div></div>
            <h2>{money(savings)}</h2>
            <p className="stat-note">{income > 0 ? `${Math.round((savings / income) * 100)}% of income` : "No income recorded"}</p>
          </article>
        </section>

        <section className="chart-grid" id="analytics">
          <article className="panel">
            <div className="panel-heading">
              <div><h3>Cash flow</h3><p>Income vs expenses over 6 months</p></div>
              <span className="small-pill">6 months</span>
            </div>
            <div className="chart-area">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lastSixMonths} barGap={7}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--grid)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : v} width={35} />
                  <Tooltip formatter={(value) => money(value)} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--panel)", color: "var(--text)" }} />
                  <Bar dataKey="Income" fill="#16a085" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="Expenses" fill="#635bff" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-legend"><span><i className="dot green" /> Income</span><span><i className="dot purple" /> Expenses</span></div>
          </article>

          <article className="panel">
            <div className="panel-heading">
              <div><h3>Spending breakdown</h3><p>Where your money goes</p></div>
            </div>
            {categoryData.length ? (
              <>
                <div className="donut-area">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="86%" paddingAngle={3} stroke="none">
                        {categoryData.map((entry, i) => <Cell key={entry.name} fill={colors[i % colors.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value) => money(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="donut-center"><strong>{money(expenses)}</strong><span>Total spent</span></div>
                </div>
                <div className="category-legend">
                  {categoryData.slice(0, 5).map((item, i) => (
                    <div key={item.name}><span><i className="dot" style={{ background: colors[i % colors.length] }} />{item.name}</span><strong>{money(item.value)}</strong></div>
                  ))}
                </div>
              </>
            ) : <div className="empty-chart">No expenses recorded for this month.</div>}
          </article>
        </section>

        <section className="lower-grid" id="budgets">
          <article className="panel budget-panel">
            <div className="panel-heading">
              <div><h3>Monthly budget</h3><p>Keep your spending on track</p></div>
              <Target size={21} className="muted-icon" />
            </div>
            <div className="budget-amount-row">
              <div><small>You've spent</small><h2>{money(expenses)}</h2></div>
              <div className="budget-right"><small>Budget limit</small><input aria-label="Monthly budget amount" type="number" min="1" value={budget} onChange={(e) => setBudget(Math.max(0, Number(e.target.value)))} /></div>
            </div>
            <div className="progress-track"><div className={`progress-fill ${spentPercentage >= 100 ? "over-budget" : ""}`} style={{ width: `${Math.min(spentPercentage, 100)}%` }} /></div>
            <div className="budget-footer">
              <span>{Math.round(spentPercentage)}% used</span>
              <strong className={expenses > budget ? "danger-text" : ""}>{money(budget - expenses)} {expenses > budget ? "over budget" : "remaining"}</strong>
            </div>
            {expenses > budget && <p className="budget-warning">Budget limit exceeded. Review your spending.</p>}
          </article>

          <article className="panel goals-panel">
            <div className="panel-heading">
              <div><h3>Savings goals</h3><p>Little by little, get there</p></div>
              <button className="text-button" onClick={addGoal}><Plus size={16} /> Add goal</button>
            </div>
            <div className="goals-list">
              {goals.map((goal, i) => (
                <div className="goal-item" key={goal.id}>
                  <div className="goal-head">
                    <div className={`goal-symbol goal-${i % 3}`}><Target size={18} /></div>
                    <div className="goal-name"><strong>{goal.name}</strong><small>{money(goal.saved)} of {money(goal.target)}</small></div>
                    <strong className="goal-percent">{Math.round(goal.saved / goal.target * 100)}%</strong>
                  </div>
                  <div className="progress-track goal-track"><div className="progress-fill" style={{ width: `${Math.min(goal.saved / goal.target * 100, 100)}%` }} /></div>
                  <div className="goal-actions">
                    <span>{goal.saved >= goal.target ? "Goal reached!" : `${money(Math.max(0, goal.target - goal.saved))} to go`}</span>
                    <button className="text-button" onClick={() => contributeToGoal(goal)} disabled={goal.saved >= goal.target}>Add savings</button>
                    <button className="icon-button mini-button" aria-label={`Delete ${goal.name}`} onClick={() => setGoals((prev) => prev.filter((g) => g.id !== goal.id))}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
              {!goals.length && <p className="empty-chart">Create a savings goal to get started.</p>}
            </div>
          </article>
        </section>

        <section className="panel transactions-panel" id="transactions">
          <div className="panel-heading transaction-heading">
            <div><h3>Recent transactions</h3><p>Manage your income and expenses</p></div>
            <button className="secondary-button" onClick={exportCSV}>
              </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
            