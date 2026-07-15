import React, { useState, useMemo } from "react";
import { Contractor, Project, ExpenseEntry } from "../types";
import { parseDate, sortByDateDesc } from "../utils/date";
import { formatCurrency } from "../utils/currency";
import { Search, SlidersHorizontal, Calendar, HelpCircle } from "lucide-react";

interface AllExpensesProps {
  contractors: Contractor[];
  projects: Project[];
  expenses: ExpenseEntry[];
}

export default function AllExpenses({ contractors, projects, expenses }: AllExpensesProps) {
  // Filter states
  const [selectedContractorId, setSelectedContractorId] = useState<string>("all");
  const [selectedProjectCode, setSelectedProjectCode] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Get dynamic projects list based on contractor selection
  const filteredProjects = useMemo(() => {
    if (selectedContractorId === "all") {
      return projects;
    }
    return projects.filter(p => p.contractorId === selectedContractorId);
  }, [projects, selectedContractorId]);

  // Reset project filter if current selected is not in the filtered projects list
  React.useEffect(() => {
    if (selectedProjectCode !== "all") {
      const exists = filteredProjects.some(p => p.code === selectedProjectCode);
      if (!exists) {
        setSelectedProjectCode("all");
      }
    }
  }, [filteredProjects, selectedProjectCode]);

  // Map for easy contractor / project name lookups
  const contractorMap = useMemo(() => {
    const map = new Map<string, string>();
    contractors.forEach(c => map.set(c.id, c.name));
    return map;
  }, [contractors]);

  const projectMap = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach(p => map.set(p.code, p.name));
    return map;
  }, [projects]);

  // Filter and sort the expenses
  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    // Contractor Filter
    if (selectedContractorId !== "all") {
      result = result.filter(e => e.contractorId === selectedContractorId);
    }

    // Project Filter
    if (selectedProjectCode !== "all") {
      result = result.filter(e => e.projectCode === selectedProjectCode);
    }

    // Date From Filter
    if (fromDate) {
      const fromTime = new Date(fromDate).getTime();
      result = result.filter(e => parseDate(e.date).getTime() >= fromTime);
    }

    // Date To Filter
    if (toDate) {
      const toTime = new Date(toDate).getTime();
      result = result.filter(e => parseDate(e.date).getTime() <= toTime);
    }

    // Search Query (Vendor & Description)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(e => 
        (e.vendor || "").toLowerCase().includes(q) || 
        (e.description || "").toLowerCase().includes(q)
      );
    }

    // Default newest first
    return sortByDateDesc(result);
  }, [expenses, selectedContractorId, selectedProjectCode, fromDate, toDate, searchQuery]);

  // Calculate totals
  const totalAmountAED = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [filteredExpenses]);

  return (
    <div className="space-y-4">
      {/* Filters Sticky Panel */}
      <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.12)] p-4 sticky top-0 z-20 space-y-3">
        <div className="flex items-center space-x-2 text-gray-800 font-semibold text-sm pb-1 border-b border-gray-50">
          <SlidersHorizontal className="w-4 h-4 text-blue-500" />
          <span>Unified Expense Explorer</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Contractor Dropdown */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider" htmlFor="contractor-filter">
              Contractor
            </label>
            <select
              id="contractor-filter"
              value={selectedContractorId}
              onChange={(e) => setSelectedContractorId(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 font-medium cursor-pointer"
            >
              <option value="all">All Contractors</option>
              {contractors.map(c => (
                <option key={c.id} value={c.id}>
                  {c.id} - {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Project Dropdown */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider" htmlFor="project-filter">
              Project Code
            </label>
            <select
              id="project-filter"
              value={selectedProjectCode}
              onChange={(e) => setSelectedProjectCode(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 font-medium cursor-pointer"
            >
              <option value="all">All Projects</option>
              {filteredProjects.map(p => (
                <option key={p.code} value={p.code}>
                  {p.code} - {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* From Date Picker */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider" htmlFor="from-date-filter">
              From Date
            </label>
            <div className="relative">
              <input
                id="from-date-filter"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 font-medium cursor-pointer"
              />
            </div>
          </div>

          {/* To Date Picker */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider" htmlFor="to-date-filter">
              To Date
            </label>
            <input
              id="to-date-filter"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 font-medium cursor-pointer"
            />
          </div>

          {/* Free Search Query */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider" htmlFor="search-filter">
              Vendor / Description Search
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-gray-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                id="search-filter"
                type="text"
                placeholder="Search name/details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg pl-8 pr-2.5 py-2 font-medium focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Clear Filters Button if any active */}
        {(selectedContractorId !== "all" || selectedProjectCode !== "all" || fromDate || toDate || searchQuery) && (
          <div className="flex justify-end pt-1">
            <button
              onClick={() => {
                setSelectedContractorId("all");
                setSelectedProjectCode("all");
                setFromDate("");
                setToDate("");
                setSearchQuery("");
              }}
              className="text-[11px] font-semibold text-blue-500 hover:text-blue-600 uppercase tracking-wider focus:outline-none"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.12)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-5 sticky left-0 bg-gray-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Date</th>
                <th className="py-3 px-5">Contractor</th>
                <th className="py-3 px-5">Project</th>
                <th className="py-3 px-5">Vendor</th>
                <th className="py-3 px-5">Description</th>
                <th className="py-3 px-5 text-right">Amount</th>
                <th className="py-3 px-5 text-center">Paid Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm text-gray-600">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((expense, idx) => {
                  const paid = expense.creditPaid;
                  const isPaid = paid !== undefined && paid !== null && Number(paid) > 0;
                  const isFullyPaid = isPaid && Number(paid) >= Number(expense.amount);

                  return (
                    <tr key={idx} className="hover:bg-gray-50/40 select-none">
                      {/* Sticky Date */}
                      <td className="py-3 px-5 font-mono text-xs text-gray-500 sticky left-0 bg-white group-hover:bg-gray-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                        {expense.date}
                      </td>
                      <td className="py-3 px-5 font-medium text-gray-800">
                        {contractorMap.get(expense.contractorId) || expense.contractorId}
                      </td>
                      <td className="py-3 px-5 font-mono text-xs">
                        {expense.projectCode}
                        <span className="text-gray-400 font-sans ml-1 text-[11px] block sm:inline">
                          ({projectMap.get(expense.projectCode) || ""})
                        </span>
                      </td>
                      <td className="py-3 px-5 font-medium text-gray-800">{expense.vendor}</td>
                      <td className="py-3 px-5 text-xs text-gray-500 max-w-xs truncate" title={expense.description}>
                        {expense.description}
                      </td>
                      <td className="py-3 px-5 text-right font-semibold text-red-500">
                        {formatCurrency(expense.amount, expense.currency)}
                      </td>
                      <td className="py-3 px-5 text-center">
                        {isFullyPaid ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 uppercase tracking-wider">
                            Paid
                          </span>
                        ) : isPaid ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 uppercase tracking-wider">
                            Partial ({formatCurrency(paid, expense.currency)})
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 uppercase tracking-wider">
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 text-sm">
                    No expenses found matching the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="bg-gray-50 px-5 py-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider gap-2">
          <div>
            Showing {filteredExpenses.length} of {expenses.length} Expenses
          </div>
          <div className="text-right text-gray-700">
            Total Filtered: <span className="font-extrabold text-red-500">{formatCurrency(totalAmountAED, "AED")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
