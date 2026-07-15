import React, { useState, useMemo } from "react";
import { Contractor, Project, IncomeEntry, ExpenseEntry } from "../types";
import { getFinancialYear, sortByDateAsc } from "../utils/date";
import { formatCurrency } from "../utils/currency";
import { CreditCard, Phone, Filter, Calendar, TrendingUp, TrendingDown, Landmark } from "lucide-react";

interface ContractorTabProps {
  contractor: Contractor;
  projects: Project[];
  income: IncomeEntry[];
  expenses: ExpenseEntry[];
  availableFYs: string[];
  selectedFY: string;
}

export default function ContractorTab({
  contractor,
  projects,
  income,
  expenses,
  availableFYs,
  selectedFY: initialFY
}: ContractorTabProps) {
  // Scoped filters
  const [selectedProjectCode, setSelectedProjectCode] = useState<string>("all");
  const [selectedFY, setSelectedFY] = useState<string>(initialFY);

  // Get active contractor projects
  const contractorProjects = useMemo(() => {
    return projects.filter(p => p.contractorId === contractor.id);
  }, [projects, contractor.id]);

  // Sync FY changes from top selector if desired, but also keep local control
  React.useEffect(() => {
    setSelectedFY(initialFY);
  }, [initialFY]);

  // Filter income and expenses by contractor, selected project, and selected FY
  const filteredIncome = useMemo(() => {
    let result = income.filter(i => i.contractorId === contractor.id);
    
    if (selectedProjectCode !== "all") {
      result = result.filter(i => i.projectCode === selectedProjectCode);
    }
    
    if (selectedFY !== "all") {
      result = result.filter(i => getFinancialYear(i.date) === selectedFY);
    }

    // MANDATORY: Sort by Date Ascending (oldest first)
    return sortByDateAsc(result);
  }, [income, contractor.id, selectedProjectCode, selectedFY]);

  const filteredExpenses = useMemo(() => {
    let result = expenses.filter(e => e.contractorId === contractor.id);
    
    if (selectedProjectCode !== "all") {
      result = result.filter(e => e.projectCode === selectedProjectCode);
    }
    
    if (selectedFY !== "all") {
      result = result.filter(e => getFinancialYear(e.date) === selectedFY);
    }

    // MANDATORY: Sort by Date Ascending (oldest first)
    return sortByDateAsc(result);
  }, [expenses, contractor.id, selectedProjectCode, selectedFY]);

  // Compute RUNNING BALANCE for Income Table
  const incomeWithRunningBalance = useMemo(() => {
    let running = 0;
    return filteredIncome.map(item => {
      const invoiceAmt = Number(item.amount) || 0;
      const received = Number(item.creditReceived) || 0;
      running = running + invoiceAmt - received;
      return {
        ...item,
        runningBalance: running
      };
    });
  }, [filteredIncome]);

  // Compute RUNNING BALANCE for Expense Table
  const expensesWithRunningBalance = useMemo(() => {
    let running = 0;
    return filteredExpenses.map(item => {
      const invoiceAmt = Number(item.amount) || 0;
      const paid = Number(item.creditPaid) || 0;
      running = running + invoiceAmt - paid;
      return {
        ...item,
        runningBalance: running
      };
    });
  }, [filteredExpenses]);

  // Calculate Summary Totals
  const totalInvoiceIncome = useMemo(() => {
    return filteredIncome.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredIncome]);

  const totalReceivedIncome = useMemo(() => {
    return filteredIncome.reduce((sum, item) => sum + (Number(item.creditReceived) || 0), 0);
  }, [filteredIncome]);

  const finalIncomeBalance = useMemo(() => {
    const len = incomeWithRunningBalance.length;
    return len > 0 ? incomeWithRunningBalance[len - 1].runningBalance : 0;
  }, [incomeWithRunningBalance]);

  const totalInvoiceExpense = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredExpenses]);

  const totalPaidExpense = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + (Number(item.creditPaid) || 0), 0);
  }, [filteredExpenses]);

  const finalExpenseBalance = useMemo(() => {
    const len = expensesWithRunningBalance.length;
    return len > 0 ? expensesWithRunningBalance[len - 1].runningBalance : 0;
  }, [expensesWithRunningBalance]);

  // Summary Metrics
  const balance = totalInvoiceIncome - totalInvoiceExpense;
  const profitPercentage = totalInvoiceIncome > 0 ? (balance / totalInvoiceIncome) * 100 : 0;

  // Net Position (Section G)
  const netInHand = totalReceivedIncome - totalPaidExpense;

  return (
    <div className="space-y-6">
      {/* Section A: Contractor Header */}
      <div className="bg-white p-5 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.12)] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="inline-block bg-blue-50 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-md mb-1 uppercase font-mono tracking-wider">
            Contractor ID: {contractor.id}
          </span>
          <h2 className="text-xl font-extrabold text-gray-800">{contractor.name}</h2>
          
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 mt-2 text-xs text-gray-500 font-medium">
            <div className="flex items-center space-x-1.5">
              <Landmark className="w-3.5 h-3.5 text-gray-400" />
              <span>Account: <span className="font-mono font-bold text-gray-700">{contractor.accountNumber || "N/A"}</span></span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              <span>Contact: <span className="font-mono font-bold text-gray-700">{contractor.contactNumber || "N/A"}</span></span>
            </div>
          </div>
        </div>

        {/* Section B & C: Filters */}
        <div className="flex flex-wrap items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200/60 self-start md:self-auto">
          {/* Project Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={selectedProjectCode}
              onChange={(e) => setSelectedProjectCode(e.target.value)}
              className="bg-white border border-gray-200 text-gray-800 text-xs rounded-md p-1.5 font-semibold cursor-pointer outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Projects</option>
              {contractorProjects.map(p => (
                <option key={p.code} value={p.code}>
                  {p.code} ({p.name})
                </option>
              ))}
            </select>
          </div>

          {/* Financial Year Filter */}
          <div className="flex items-center space-x-2 border-l border-gray-200 pl-3">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={selectedFY}
              onChange={(e) => setSelectedFY(e.target.value)}
              className="bg-white border border-gray-200 text-gray-800 text-xs rounded-md p-1.5 font-semibold cursor-pointer outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Years</option>
              {availableFYs.map(fy => (
                <option key={fy} value={fy}>
                  FY {fy}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Section D: Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Income */}
        <div className="bg-white p-5 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.12)] border-l-4 border-[#34a853] flex flex-col justify-between h-24">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contractor Total Income</span>
          <span className="text-xl font-bold text-gray-800">
            {formatCurrency(totalInvoiceIncome, "AED")}
          </span>
        </div>

        {/* Total Expense */}
        <div className="bg-white p-5 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.12)] border-l-4 border-[#ea4335] flex flex-col justify-between h-24">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contractor Total Expenses</span>
          <span className="text-xl font-bold text-gray-800">
            {formatCurrency(totalInvoiceExpense, "AED")}
          </span>
        </div>

        {/* Profit Percentage */}
        <div className="bg-white p-5 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.12)] border-l-4 border-blue-500 flex flex-col justify-between h-24">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Balance & margin</span>
          <div className="flex items-baseline space-x-2">
            <span className={`text-xl font-bold ${balance >= 0 ? "text-gray-800" : "text-red-600"}`}>
              {formatCurrency(balance, "AED")}
            </span>
            {totalInvoiceIncome > 0 && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-sm ${profitPercentage >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                {profitPercentage.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Section E: Income Table */}
      <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.12)] overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
            Income / Invoices Raised (Sorted Chronologically)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-2.5 px-5 sticky left-0 bg-gray-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Date</th>
                <th className="py-2.5 px-5">Project Code</th>
                <th className="py-2.5 px-5">Description</th>
                <th className="py-2.5 px-5 text-right">Invoice Value</th>
                <th className="py-2.5 px-5 text-right">Credit Received</th>
                <th className="py-2.5 px-5 text-right">Outstanding Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm text-gray-600">
              {incomeWithRunningBalance.length > 0 ? (
                incomeWithRunningBalance.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/30">
                    <td className="py-2.5 px-5 font-mono text-xs text-gray-500 sticky left-0 bg-white group-hover:bg-gray-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      {item.date}
                    </td>
                    <td className="py-2.5 px-5 font-mono text-xs">{item.projectCode}</td>
                    <td className="py-2.5 px-5 text-xs text-gray-500 max-w-xs truncate" title={item.description}>
                      {item.description}
                    </td>
                    <td className="py-2.5 px-5 text-right font-medium text-gray-800">
                      {formatCurrency(item.amount, item.currency)}
                    </td>
                    <td className="py-2.5 px-5 text-right font-medium text-emerald-600">
                      {formatCurrency(item.creditReceived, item.currency)}
                    </td>
                    <td className="py-2.5 px-5 text-right font-semibold text-gray-700 font-mono text-xs">
                      {formatCurrency(item.runningBalance, item.currency)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400 text-xs">
                    No income invoices recorded for selected criteria.
                  </td>
                </tr>
              )}

              {/* Totals Row */}
              <tr className="bg-blue-50/40 font-bold border-t border-blue-100 text-gray-800">
                <td className="py-3 px-5 text-xs" colSpan={3}>TOTAL INVOICING OUTSTANDING</td>
                <td className="py-3 px-5 text-right font-bold text-gray-900">
                  {formatCurrency(totalInvoiceIncome, "AED")}
                </td>
                <td className="py-3 px-5 text-right font-bold text-emerald-600">
                  {formatCurrency(totalReceivedIncome, "AED")}
                </td>
                <td className="py-3 px-5 text-right font-extrabold text-blue-700 font-mono text-xs">
                  {formatCurrency(finalIncomeBalance, "AED")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section F: Expense Table */}
      <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.12)] overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-xs font-bold text-red-700 uppercase tracking-wider">
            Expenses / Payments Made (Sorted Chronologically)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-2.5 px-5 sticky left-0 bg-gray-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Date</th>
                <th className="py-2.5 px-5">Project Code</th>
                <th className="py-2.5 px-5">Vendor</th>
                <th className="py-2.5 px-5">Description</th>
                <th className="py-2.5 px-5 text-right">Invoice Value</th>
                <th className="py-2.5 px-5 text-right">Credit Paid</th>
                <th className="py-2.5 px-5 text-right">Outstanding Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm text-gray-600">
              {expensesWithRunningBalance.length > 0 ? (
                expensesWithRunningBalance.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/30">
                    <td className="py-2.5 px-5 font-mono text-xs text-gray-500 sticky left-0 bg-white group-hover:bg-gray-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      {item.date}
                    </td>
                    <td className="py-2.5 px-5 font-mono text-xs">{item.projectCode}</td>
                    <td className="py-2.5 px-5 font-medium text-gray-800 text-xs">{item.vendor}</td>
                    <td className="py-2.5 px-5 text-xs text-gray-500 max-w-xs truncate" title={item.description}>
                      {item.description}
                    </td>
                    <td className="py-2.5 px-5 text-right font-medium text-gray-800">
                      {formatCurrency(item.amount, item.currency)}
                    </td>
                    <td className="py-2.5 px-5 text-right font-medium text-red-600">
                      {formatCurrency(item.creditPaid, item.currency)}
                    </td>
                    <td className="py-2.5 px-5 text-right font-semibold text-gray-700 font-mono text-xs">
                      {formatCurrency(item.runningBalance, item.currency)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400 text-xs">
                    No expense payments recorded for selected criteria.
                  </td>
                </tr>
              )}

              {/* Totals Row */}
              <tr className="bg-blue-50/40 font-bold border-t border-blue-100 text-gray-800">
                <td className="py-3 px-5 text-xs" colSpan={4}>TOTAL CLAIMING OUTSTANDING</td>
                <td className="py-3 px-5 text-right font-bold text-gray-900">
                  {formatCurrency(totalInvoiceExpense, "AED")}
                </td>
                <td className="py-3 px-5 text-right font-bold text-red-600">
                  {formatCurrency(totalPaidExpense, "AED")}
                </td>
                <td className="py-3 px-5 text-right font-extrabold text-blue-700 font-mono text-xs">
                  {formatCurrency(finalExpenseBalance, "AED")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section G: Net Position */}
      <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.12)] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h4 className="font-bold text-gray-800 uppercase text-xs tracking-wider">Net Project Cashflow Position</h4>
          <p className="text-xs text-gray-500 mt-1">Shows final actual cash collected minus cash paid in hand.</p>
        </div>
        <div className="flex flex-wrap items-center gap-6 text-sm font-semibold">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total Cash Received</span>
            <span className="text-emerald-600 mt-0.5">{formatCurrency(totalReceivedIncome, "AED")}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total Cash Paid</span>
            <span className="text-red-500 mt-0.5">{formatCurrency(totalPaidExpense, "AED")}</span>
          </div>
          <div className="flex flex-col border-l border-gray-100 pl-6">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Net Cash in Hand</span>
            <span className={`text-base font-extrabold mt-0.5 px-2 py-0.5 rounded ${netInHand >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
              {formatCurrency(netInHand, "AED")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
