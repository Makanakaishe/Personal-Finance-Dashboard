import React, { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, X, PiggyBank, RotateCcw } from "lucide-react";

// ---- Design tokens (ledger / checkbook-register theme) ----
const T = {
  bg: "#101C15",
  surface: "#17251C",
  raised: "#1E2F24",
  paper: "#F3EEDF",
  paperMuted: "#DFD8C4",
  ink: "#ECE6D6",
  inkMuted: "#93A092",
  rule: "#33453A",
  gold: "#C9A227",
  brick: "#C1573D",
  teal: "#5C8577",
  dustyBlue: "#5C7A93",
  olive: "#8A8F4C",
  mauve: "#96667A",
};

const CATEGORY_COLORS = {
  "Food": T.teal,
  "Transport": T.dustyBlue,
  "Subscriptions": T.olive,
  "Content & Props": T.mauve,
  "Fashion": T.brick,
  "Rent & Bills": T.dustyBlue,
  "Fun": T.gold,
};

const EXPENSE_CATEGORIES = ["Food", "Transport", "Subscriptions", "Content & Props", "Fashion", "Rent & Bills", "Fun"];
const INCOME_CATEGORIES = ["Brand Deal", "Freelance", "Allowance", "Other Income"];

const STORAGE_KEY = "finance-dashboard-data";

function seedData() {
  const tx = [
    { id: "1", date: "2026-09-02", description: "Rent + utilities", category: "Rent & Bills", amount: -6000 },
    { id: "2", date: "2026-09-03", description: "Grocery run", category: "Food", amount: -640 },
    { id: "3", date: "2026-09-04", description: "Sponsored post — skincare brand", category: "Brand Deal", amount: 4500 },
    { id: "4", date: "2026-09-05", description: "Metro card top-up", category: "Transport", amount: -300 },
    { id: "5", date: "2026-09-07", description: "Ring light + backdrop", category: "Content & Props", amount: -900 },
    { id: "6", date: "2026-09-08", description: "Adobe + Canva subs", category: "Subscriptions", amount: -350 },
    { id: "7", date: "2026-09-10", description: "Thrifted outfit for shoot", category: "Fashion", amount: -750 },
    { id: "8", date: "2026-09-12", description: "Freelance landing page", category: "Freelance", amount: 2200 },
    { id: "9", date: "2026-09-13", description: "Coffee with friends", category: "Fun", amount: -260 },
    { id: "10", date: "2026-08-14", description: "Rent + utilities", category: "Rent & Bills", amount: -5800 },
    { id: "11", date: "2026-08-18", description: "Grocery run", category: "Food", amount: -2100 },
    { id: "12", date: "2026-08-20", description: "Brand collab — sneakers", category: "Brand Deal", amount: 3800 },
    { id: "13", date: "2026-08-22", description: "New outfit pieces", category: "Fashion", amount: -1500 },
    { id: "14", date: "2026-08-25", description: "Bus + taxi", category: "Transport", amount: -600 },
  ];
  const budgets = {
    "Food": 2500,
    "Transport": 700,
    "Subscriptions": 400,
    "Content & Props": 1200,
    "Fashion": 1500,
    "Rent & Bills": 6000,
    "Fun": 500,
  };
  const goal = { name: "Camera Upgrade", target: 25000, current: 9500 };
  return { transactions: tx, budgets, goal };
}

function fmt(n) {
  const sign = n < 0 ? "-" : "";
  return sign + "₺" + Math.abs(Math.round(n)).toLocaleString("tr-TR");
}

function monthLabel(key) {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function FinanceDashboard() {
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    type: "expense",
    description: "",
    category: "Food",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get(STORAGE_KEY, false);
        if (result && result.value) {
          const data = JSON.parse(result.value);
          setTransactions(data.transactions || []);
          setBudgets(data.budgets || {});
          setGoal(data.goal || null);
        } else {
          const seed = seedData();
          setTransactions(seed.transactions);
          setBudgets(seed.budgets);
          setGoal(seed.goal);
          await window.storage.set(STORAGE_KEY, JSON.stringify(seed), false);
        }
      } catch (e) {
        const seed = seedData();
        setTransactions(seed.transactions);
        setBudgets(seed.budgets);
        setGoal(seed.goal);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const months = useMemo(() => {
    const set = new Set(transactions.map((t) => t.date.slice(0, 7)));
    set.add(new Date().toISOString().slice(0, 7));
    return Array.from(set).sort().reverse();
  }, [transactions]);

  useEffect(() => {
    if (!month && months.length) setMonth(months[0]);
  }, [months, month]);

  async function persist(next) {
    try {
      await window.storage.set(
        STORAGE_KEY,
        JSON.stringify({
          transactions: next.transactions ?? transactions,
          budgets: next.budgets ?? budgets,
          goal: next.goal ?? goal,
        }),
        false
      );
    } catch (e) {
      setError("Couldn't save — your changes may not persist.");
    }
  }

  function addTransaction(e) {
    e.preventDefault();
    const amt = parseFloat(form.amount);
    if (!form.description.trim() || isNaN(amt) || amt <= 0) return;
    const tx = {
      id: Date.now().toString(),
      date: form.date,
      description: form.description.trim(),
      category: form.category,
      amount: form.type === "income" ? amt : -amt,
    };
    const next = [tx, ...transactions];
    setTransactions(next);
    persist({ transactions: next });
    setForm({ ...form, description: "", amount: "" });
    setShowForm(false);
    setMonth(tx.date.slice(0, 7));
  }

  function deleteTransaction(id) {
    const next = transactions.filter((t) => t.id !== id);
    setTransactions(next);
    persist({ transactions: next });
  }

  function updateBudget(category, value) {
    const next = { ...budgets, [category]: value };
    setBudgets(next);
    persist({ budgets: next });
  }

  function updateGoal(field, value) {
    const next = { ...goal, [field]: value };
    setGoal(next);
    persist({ goal: next });
  }

  async function resetData() {
    const seed = seedData();
    setTransactions(seed.transactions);
    setBudgets(seed.budgets);
    setGoal(seed.goal);
    setMonth(seed.transactions[0].date.slice(0, 7));
    await persist(seed);
  }

  const filtered = transactions.filter((t) => t.date.startsWith(month));
  const income = filtered.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expense = filtered.filter((t) => t.amount < 0).reduce((s, t) => s + -t.amount, 0);
  const net = income - expense;

  const byCategory = useMemo(() => {
    const map = {};
    filtered.forEach((t) => {
      if (t.amount < 0) map[t.category] = (map[t.category] || 0) + -t.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filtered]);
  const maxCat = byCategory.length ? byCategory[0][1] : 1;

  if (loading) {
    return (
      <div style={{ background: T.bg, color: T.inkMuted, minHeight: 400, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono', monospace" }}>
        Opening the ledger…
      </div>
    );
  }

  return (
    <div style={{ background: T.bg, color: T.ink, minHeight: "100%", fontFamily: "'IBM Plex Mono', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        .fd-serif { font-family: 'Lora', serif; }
        .fd-input {
          background: ${T.raised};
          border: 1px solid ${T.rule};
          color: ${T.ink};
          font-family: 'IBM Plex Mono', monospace;
          padding: 8px 10px;
          border-radius: 2px;
          font-size: 13px;
        }
        .fd-input:focus { outline: 1px solid ${T.gold}; outline-offset: 1px; }
        .fd-btn {
          background: ${T.gold};
          color: #1A1406;
          border: none;
          padding: 9px 16px;
          border-radius: 2px;
          font-family: 'IBM Plex Mono', monospace;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .fd-btn:hover { filter: brightness(1.08); }
        .fd-btn-ghost {
          background: transparent;
          color: ${T.inkMuted};
          border: 1px solid ${T.rule};
          padding: 8px 14px;
          border-radius: 2px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          cursor: pointer;
        }
        .fd-btn-ghost:hover { color: ${T.ink}; border-color: ${T.inkMuted}; }
        .fd-row:hover { background: ${T.raised}; }
        select.fd-input { -webkit-appearance: none; appearance: none; }
      `}</style>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "36px 20px 60px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, borderBottom: `1px solid ${T.rule}`, paddingBottom: 18 }}>
          <div>
            <div className="fd-serif" style={{ fontSize: 26, fontWeight: 700, letterSpacing: 0.2 }}>The Ledger</div>
            <div style={{ color: T.inkMuted, fontSize: 12, marginTop: 4 }}>Personal finance, kept honestly</div>
          </div>
          <select className="fd-input" value={month} onChange={(e) => setMonth(e.target.value)} style={{ cursor: "pointer" }}>
            {months.map((m) => (
              <option key={m} value={m}>{monthLabel(m)}</option>
            ))}
          </select>
        </div>

        {error && <div style={{ color: T.brick, fontSize: 12, marginBottom: 16 }}>{error}</div>}

        {/* Balance hero */}
        <div style={{ background: T.paper, color: "#1A1F16", borderRadius: 3, padding: "24px 26px", marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
          <div>
            <div style={{ fontSize: 12, color: "#5C5847", marginBottom: 6 }}>Net for {monthLabel(month || months[0] || "")}</div>
            <div className="fd-serif" style={{ fontSize: 40, fontWeight: 700, color: net >= 0 ? "#3D5A3D" : T.brick }}>
              {fmt(net)}
            </div>
          </div>
          <div style={{ display: "flex", gap: 28 }}>
            <div>
              <div style={{ fontSize: 11, color: "#5C5847" }}>Income</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{fmt(income)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#5C5847" }}>Expenses</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{fmt(-expense)}</div>
            </div>
          </div>
        </div>

        {/* Add transaction */}
        <div style={{ marginBottom: 28 }}>
          {!showForm ? (
            <button className="fd-btn" onClick={() => setShowForm(true)}>
              <Plus size={15} /> Add entry
            </button>
          ) : (
            <form onSubmit={addTransaction} style={{ background: T.surface, border: `1px solid ${T.rule}`, borderRadius: 3, padding: 16, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
              <select className="fd-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, category: e.target.value === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0] })}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <input className="fd-input" placeholder="Description" style={{ flex: 1, minWidth: 140 }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
              <select className="fd-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {(form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input className="fd-input" type="number" placeholder="Amount" style={{ width: 100 }} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required min="0" step="0.01" />
              <input className="fd-input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              <button className="fd-btn" type="submit">Save</button>
              <button type="button" className="fd-btn-ghost" onClick={() => setShowForm(false)}><X size={13} /></button>
            </form>
          )}
        </div>

        {/* Spending by category */}
        <Section title="Spending by category">
          {byCategory.length === 0 && <Empty text="No expenses logged this month yet." />}
          {byCategory.map(([cat, amt]) => (
            <div key={cat} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span>{cat}</span>
                <span>{fmt(-amt)}</span>
              </div>
              <div style={{ height: 6, background: T.raised, borderRadius: 2 }}>
                <div style={{ height: "100%", width: `${(amt / maxCat) * 100}%`, background: CATEGORY_COLORS[cat] || T.gold, borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </Section>

        {/* Budgets */}
        <Section title="Budgets">
          {Object.keys(budgets).map((cat) => {
            const spent = filtered.filter((t) => t.category === cat && t.amount < 0).reduce((s, t) => s + -t.amount, 0);
            const limit = budgets[cat] || 0;
            const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
            const over = spent > limit;
            return (
              <div key={cat} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4, alignItems: "center" }}>
                  <span>{cat}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: over ? T.brick : T.inkMuted }}>{fmt(spent)} / </span>
                    <input
                      className="fd-input"
                      type="number"
                      value={limit}
                      onChange={(e) => updateBudget(cat, Number(e.target.value))}
                      style={{ width: 76, padding: "4px 6px" }}
                    />
                  </span>
                </div>
                <div style={{ height: 6, background: T.raised, borderRadius: 2 }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: over ? T.brick : T.gold, borderRadius: 2 }} />
                </div>
              </div>
            );
          })}
        </Section>

        {/* Savings goal */}
        {goal && (
          <Section title="Savings goal">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <PiggyBank size={16} color={T.gold} />
                <input
                  className="fd-input"
                  value={goal.name}
                  onChange={(e) => updateGoal("name", e.target.value)}
                  style={{ background: "transparent", border: "none", fontSize: 14, fontWeight: 600, padding: 0, color: T.ink }}
                />
              </div>
              <div style={{ fontSize: 13, color: T.inkMuted }}>
                {fmt(goal.current)} of {fmt(goal.target)}
              </div>
            </div>
            <div style={{ height: 8, background: T.raised, borderRadius: 2, marginBottom: 10 }}>
              <div style={{ height: "100%", width: `${Math.min((goal.current / goal.target) * 100, 100)}%`, background: T.gold, borderRadius: 2 }} />
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: T.inkMuted }}>Update saved amount</span>
              <input
                className="fd-input"
                type="number"
                value={goal.current}
                onChange={(e) => updateGoal("current", Number(e.target.value))}
                style={{ width: 100 }}
              />
              <span style={{ fontSize: 12, color: T.inkMuted }}>target</span>
              <input
                className="fd-input"
                type="number"
                value={goal.target}
                onChange={(e) => updateGoal("target", Number(e.target.value))}
                style={{ width: 100 }}
              />
            </div>
          </Section>
        )}

        {/* Transactions */}
        <Section title={`Entries — ${monthLabel(month || months[0] || "")}`}>
          {filtered.length === 0 && <Empty text="Nothing logged this month yet. Add your first entry above." />}
          {filtered
            .slice()
            .sort((a, b) => (a.date < b.date ? 1 : -1))
            .map((t) => (
              <div key={t.id} className="fd-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 4px", borderBottom: `1px solid ${T.rule}`, fontSize: 13 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
                  <span style={{ color: T.inkMuted, fontSize: 11, width: 62, flexShrink: 0 }}>{t.date.slice(5)}</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description}</span>
                  <span style={{ color: T.inkMuted, fontSize: 11, background: T.raised, padding: "2px 7px", borderRadius: 2, flexShrink: 0 }}>{t.category}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  <span style={{ color: t.amount >= 0 ? T.gold : T.brick, fontWeight: 600 }}>{fmt(t.amount)}</span>
                  <button onClick={() => deleteTransaction(t.id)} style={{ background: "none", border: "none", color: T.inkMuted, cursor: "pointer", padding: 2 }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
        </Section>

        <div style={{ textAlign: "right", marginTop: 30 }}>
          <button className="fd-btn-ghost" onClick={resetData} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <RotateCcw size={12} /> Reset to sample data
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 30 }}>
      <div className="fd-serif" style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

function Empty({ text }) {
  return <div style={{ color: "#6B7A6D", fontSize: 12.5, fontStyle: "italic", padding: "8px 0" }}>{text}</div>;
}
