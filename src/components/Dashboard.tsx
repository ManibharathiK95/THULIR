import React from "react";
import { Contractor, IncomeEntry, ExpenseEntry } from "../types";
import { getFinancialYear, sortByDateAsc } from "../utils/date";
import { formatCurrency, formatSummaryAmount } from "../utils/currency";
import CustomChart from "./CustomChart";
import { ArrowUpRight, ArrowDownRight, Scale, TrendingUp } from "lucide-react";

interface DashboardProps {
  contractors: Contractor[];
  income: IncomeEntry[];
  expenses: ExpenseEntry[];
  selectedFY: string;
  onChangeFY: (fy: string) => void;
  availableFYs: string[];
}

export default function Dashboard({
  contractors,
  income,
  expenses,
  selectedFY,
  onChangeFY,
  availableFYs
}: DashboardProps) {

  // Filter income and expenses by selected FY
  const filteredIncome = income.filter(item => getFinancialYear(item.date) === selectedFY);
  const filteredExpenses = expenses.filter(item => getFinancialYear(item.date) === selectedFY);

  // Calculate stats
  // We use formatSummaryAmount to calculate totals safely and check for mixed currencies
  const incomeSummary = formatSummaryAmount(filteredIncome, "amount");
  const expenseSummary = formatSummaryAmount(filteredExpenses, "amount");

  const totalIncomeVal = filteredIncome.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalExpenseVal = filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const balanceVal = totalIncomeVal - totalExpenseVal;
  
  const profitPercentage = totalIncomeVal > 0 
    ? (balanceVal / totalIncomeVal) * 100 
    : 0;

  // Mixed currency flags
  const isMixedIncome = incomeSummary.isMixed;
  const isMixedExpense = expenseSummary.isMixed;
  const hasMixedNote = isMixedIncome || isMixedExpense;

  // Contractor FY Breakdown
  const contractorRows = contractors.map(c => {
    const cIncome = filteredIncome.filter(item => item.contractorId === c.id);
    const cExpense = filteredExpenses.filter(item => item.contractorId === c.id);
    
    const incomeSum = cIncome.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const expenseSum = cExpense.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const bal = incomeSum - expenseSum;

    // Check currencies for this contractor
    const currencies = Array.from(new Set([
      ...cIncome.map(i => i.currency),
      ...cExpense.map(e => e.currency)
    ])).filter(Boolean);
    const isCContractorMixed = currencies.length > 1;

    return {
      contractor: c,
      incomeSum,
      expenseSum,
      balance: bal,
      isMixed: isCContractorMixed,
      currency: currencies[0] || "AED"
    };
  });

  const generalExpenses = filteredExpenses.filter(item => !item.contractorId);
  const generalExpensesSum = generalExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const allRows = [
    ...contractorRows,
    ...(generalExpensesSum > 0 ? [{
      contractor: { id: "GENERAL", name: "TDQS General", accountNumber: "", contactNumber: "", status: "Active" },
      incomeSum: 0,
      expenseSum: generalExpensesSum,
      balance: -generalExpensesSum,
      isMixed: false,
      currency: "AED"
    }] : [])
  ];

  return (
    <div className="space-y-6">
      {/* Financial Year Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Financial Performance Overview</h2>
          <p className="text-xs text-gray-500 mt-0.5">Automated running totals, balances, and breakdown reports.</p>
        </div>
        <div className="flex items-center space-x-3">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider" htmlFor="fy-select">
            Financial Year:
          </label>
          <select
            id="fy-select"
            value={selectedFY}
            onChange={(e) => onChangeFY(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 font-medium cursor-pointer outline-none"
          >
            {availableFYs.map(fy => (
              <option key={fy} value={fy}>
                FY {fy} (Apr - Mar)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Income Card */}
        <div className="bg-white p-5 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.12)] border-l-4 border-[#34a853] flex flex-col justify-between h-24">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Income</span>
          <div>
            <span className="text-2xl font-bold text-gray-800 block truncate">
              {isMixedIncome ? formatCurrency(totalIncomeVal, "AED") : incomeSummary.formatted}
            </span>
            {isMixedIncome && <span className="text-[10px] text-amber-500 font-medium block">Mixed Currencies</span>}
          </div>
        </div>

        {/* Expense Card */}
        <div className="bg-white p-5 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.12)] border-l-4 border-[#ea4335] flex flex-col justify-between h-24">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Expenses</span>
          <div>
            <span className="text-2xl font-bold text-gray-800 block truncate">
              {isMixedExpense ? formatCurrency(totalExpenseVal, "AED") : expenseSummary.formatted}
            </span>
            {isMixedExpense && <span className="text-[10px] text-amber-500 font-medium block">Mixed Currencies</span>}
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-white p-5 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.12)] border-l-4 border-blue-500 flex flex-col justify-between h-24">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Net Balance</span>
          <div>
            <span className={`text-2xl font-bold block truncate ${balanceVal >= 0 ? "text-gray-800" : "text-red-600"}`}>
              {formatCurrency(balanceVal, "AED")}
            </span>
            {hasMixedNote && <span className="text-[10px] text-amber-500 font-medium block">Combined Sum</span>}
          </div>
        </div>

        {/* Profit % Card */}
        <div className="bg-white p-5 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.12)] border-l-4 border-orange-400 flex flex-col justify-between h-24">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Profit Margin</span>
          <div>
            <span className="text-2xl font-bold text-gray-800 block truncate">
              {totalIncomeVal > 0 ? `${profitPercentage.toFixed(2)}%` : "N/A"}
            </span>
            <span className="text-[9px] text-gray-400 block mt-0.5">(Balance / Income) × 100</span>
          </div>
        </div>
      </div>

      {/* Grid Layout for Chart & Contractor breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col">
          <CustomChart
            income={filteredIncome}
            expenses={filteredExpenses}
            financialYear={selectedFY}
          />
        </div>

        <div className="lg:col-span-1 flex flex-col">
          <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.12)] p-4 flex-grow flex flex-col">
            <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">
              Contractor Breakdown
            </h3>
            <div className="flex-grow overflow-y-auto max-h-[350px] lg:max-h-[400px] pr-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-2.5 px-2">Name</th>
                    <th className="py-2.5 px-2 text-right">Income</th>
                    <th className="py-2.5 px-2 text-right">Expense</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-600">
                  {allRows.map((row) => (
                    <tr key={row.contractor.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-2 font-medium text-gray-800">
                        {row.contractor.name}
                        <span className="text-[10px] text-gray-400 font-mono block">ID: {row.contractor.id}</span>
                      </td>
                      <td className="py-3 px-2 text-right text-[#34a853] font-semibold">
                        {formatCurrency(row.incomeSum, row.isMixed ? "AED" : row.currency)}
                      </td>
                      <td className="py-3 px-2 text-right text-[#ea4335]">
                        {formatCurrency(row.expenseSum, row.isMixed ? "AED" : row.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-blue-50 font-bold text-blue-900 border-t border-blue-100">
                    <td className="py-2.5 px-2 text-[10px] uppercase">Total (AED)</td>
                    <td className="py-2.5 px-2 text-right">
                      {isMixedIncome ? formatCurrency(totalIncomeVal, "AED") : incomeSummary.formatted}
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      {isMixedExpense ? formatCurrency(totalExpenseVal, "AED") : expenseSummary.formatted}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {hasMixedNote && (
                <div className="mt-4 p-3 bg-gray-50 border border-gray-100 rounded-lg text-[10px] text-gray-500">
                  <div className="font-bold mb-0.5 uppercase tracking-wider">Mixed Currencies Note</div>
                  <p className="text-[9px] text-gray-400 leading-relaxed italic">
                    Entries in non-AED currencies (e.g. INR, USD) are converted to AED equivalents in summary totals for consolidated comparison.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
