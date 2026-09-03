/**
 * Budget alert banner shown when spending approaches or exceeds the budget.
 */
const BudgetAlert = ({ budget, spent, suggestions = [] }) => {
  const pct = budget > 0 ? (spent / budget) * 100 : 0;

  if (pct < 80) return null;

  const isOver = pct >= 100;
  const color  = isOver ? 'red' : 'amber';

  return (
    <div className={`rounded-xl p-4 mb-4 border ${isOver ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{isOver ? '🚨' : '⚠️'}</span>
        <div className="flex-1">
          <p className={`font-semibold ${isOver ? 'text-red-800' : 'text-amber-800'}`}>
            {isOver
              ? `Budget exceeded by $${(spent - budget).toFixed(2)}!`
              : `${pct.toFixed(0)}% of budget used – watch your spending!`}
          </p>
          {suggestions.length > 0 && (
            <ul className={`mt-2 space-y-1 text-sm ${isOver ? 'text-red-700' : 'text-amber-700'}`}>
              {suggestions.map((s, i) => <li key={i}>💡 {s}</li>)}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetAlert;
