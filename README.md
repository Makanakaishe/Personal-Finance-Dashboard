**Ledger — Personal Finance Dashboard**

A personal finance dashboard styled like a checkbook register: track income and expenses, set category budgets, and watch a savings goal fill up. Built as a single React component with no backend data is saved automatically as you use it.

**Features**

Monthly overview — net balance, total income, and total expenses at a glance

Add entries — log income or expenses with category, amount, and date

Spending by category — ruled bar breakdown of where your money went

Budgets — set a limit per category; the bar turns red if you go over

Savings goal tracker — editable target and current saved amount

Persistent storage — entries, budgets, and goals are saved between sessions

Reset option — restore sample data at any time


**Tech stack**

React (hooks: useState, useEffect, useMemo)

lucide-react for icons

Plain CSS-in-JS, no external UI framework

**Getting started**

bash
npm create vite@latest ledger-dashboard -- --template react

cd ledger-dashboard

npm install lucide-react

Drop FinanceDashboard.jsx into src/, import it in App.jsx:

jsx
import FinanceDashboard from "./FinanceDashboard";
function App() {
  return <FinanceDashboard />;
}
export default App;
Then run:
bash
npm run dev


**Notes**

Amounts are formatted in USD ($) by default — change the fmt() function to switch currencies.
This project was originally built in an environment with a built-in window.storage API. Outside that environment, swap the storage calls for localStorage, IndexedDB, or a backend of your choice if you want persistence.

**License

MIT** 
