import React, { useState, useMemo } from "react";
import { Contractor, Project, ExpenseEntry } from "../types";
import { parseDate } from "../utils/date";
import { formatCurrency } from "../utils/currency";
import { exportToCsv } from "../utils/csv";
import { Search, SlidersHorizontal, ArrowUpDown, ArrowUp, ArrowDown, Edit2, Trash2, Download, AlertCircle, X } from "lucide-react";

interface AllExpensesProps {
  contractors: Contractor[];
  projects: Project[];
  expenses: ExpenseEntry[];
  onEditExpense?: (
    id: string,
    date: string,
    contractorId: string,
    projectCode: string,
    vendor: string,
    description: string,
    amount: number,
    currency: string,
    creditPaid: number,
    paymentMethod?: string,
    entryType?: string
  ) => Promise<boolean>;
  onDeleteExpense?: (id: string) => Promise<boolean>;
}

export default function AllExpenses({
  contractors,
  projects,
  expenses,
  onEditExpense,
  onDeleteExpense
}: AllExpensesProps) {
  // Filter states
  const [selectedContractorId, setSelectedContractorId] = useState<string>("all");
  const [selectedProjectCode, setSelectedProjectCode] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Sort states
  const [sortField, setSortField] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Edit Modal state
  const [editingExpense, setEditingExpense] = useState<ExpenseEntry | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editContractorId, setEditContractorId] = useState("");
  const [editProjectCode, setEditProjectCode] = useState("");
  const [editVendor, setEditVendor] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCurrency, setEditCurrency] = useState("AED");
  const [editPaid, setEditPaid] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState("Cash");
  const [editEntryType, setEditEntryType] = useState("Invoice");
  const [editLoading, setEditLoading] = useState(false);

  // Get dynamic projects list based on contractor selection for Edit form
  const editProjects = useMemo(() => {
    if (!editContractorId) return projects;
    return projects.filter(p => p.contractorId === editContractorId);
  }, [projects, editContractorId]);

  // Adjust Project in Edit Modal if it becomes invalid for selected Contractor
  React.useEffect(() => {
    if (editingExpense && editContractorId) {
      const isValid = editProjects.some(p => p.code === editProjectCode);
      if (!isValid && editProjects.length > 0) {
        setEditProjectCode(editProjects[0].code);
      }
    }
  }, [editContractorId, editProjects]);

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

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const renderSortArrow = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-gray-300 ml-1.5 inline" />;
    return sortDirection === "asc" ? (
      <ArrowUp className="w-3 h-3 text-blue-600 ml-1.5 inline" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-600 ml-1.5 inline" />
    );
  };

  // Filter, sort, and process expenses
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
      result = result.filter(
        e =>
          (e.vendor || "").toLowerCase().includes(q) ||
          (e.description || "").toLowerCase().includes(q)
      );
    }

    // Apply Sorting
    result.sort((a, b) => {
      let valA: any = "";
      let valB: any = "";

      if (sortField === "date") {
        valA = parseDate(a.date).getTime();
        valB = parseDate(b.date).getTime();
      } else if (sortField === "contractor") {
        valA = (contractorMap.get(a.contractorId || "") || a.contractorId || "TDQS General").toLowerCase();
        valB = (contractorMap.get(b.contractorId || "") || b.contractorId || "TDQS General").toLowerCase();
      } else if (sortField === "project") {
        valA = (a.projectCode || "").toLowerCase();
        valB = (b.projectCode || "").toLowerCase();
      } else if (sortField === "vendor") {
        valA = (a.vendor || "").toLowerCase();
        valB = (b.vendor || "").toLowerCase();
      } else if (sortField === "description") {
        valA = (a.description || "").toLowerCase();
        valB = (b.description || "").toLowerCase();
      } else if (sortField === "amount") {
        valA = Number(a.amount) || 0;
        valB = Number(b.amount) || 0;
      } else if (sortField === "paymentMethod") {
        valA = (a.paymentMethod || "Cash").toLowerCase();
        valB = (b.paymentMethod || "Cash").toLowerCase();
      } else if (sortField === "entryType") {
        valA = (a.entryType || "Invoice").toLowerCase();
        valB = (b.entryType || "Invoice").toLowerCase();
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [
    expenses,
    selectedContractorId,
    selectedProjectCode,
    fromDate,
    toDate,
    searchQuery,
    sortField,
    sortDirection,
    contractorMap
  ]);

  // Calculate totals
  const totalAmountAED = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [filteredExpenses]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      "Date",
      "Contractor ID",
      "Contractor Name",
      "Project Code",
      "Project Name",
      "Vendor",
      "Description",
      "Amount",
      "Currency",
      "Credit Paid",
      "Payment Method",
      "Entry Type",
      "Status"
    ];
    const rows = filteredExpenses.map(e => {
      const paid = Number(e.creditPaid) || 0;
      const status = paid >= Number(e.amount) ? "Paid" : paid > 0 ? "Partial" : "Pending";
      return [
        e.date,
        e.contractorId || "",
        contractorMap.get(e.contractorId || "") || "TDQS General",
        e.projectCode,
        projectMap.get(e.projectCode) || "",
        e.vendor,
        e.description,
        e.amount,
        e.currency,
        e.creditPaid,
        e.paymentMethod || "Cash",
        e.entryType || "Invoice",
        status
      ];
    });
    exportToCsv("TDQS_Expenses_Report.csv", headers, rows);
  };

  // Open Edit Dialog
  const handleOpenEdit = (expense: ExpenseEntry) => {
    setEditingExpense(expense);
    // Convert e.g. "09 Oct 2025" to "2025-10-09"
    try {
      const dObj = parseDate(expense.date);
      const yyyy = dObj.getFullYear();
      const mm = String(dObj.getMonth() + 1).padStart(2, "0");
      const dd = String(dObj.getDate()).padStart(2, "0");
      setEditDate(`${yyyy}-${mm}-${dd}`);
    } catch {
      setEditDate("");
    }
    setEditContractorId(expense.contractorId || "");
    setEditProjectCode(expense.projectCode || "");
    setEditVendor(expense.vendor || "");
    setEditDesc(expense.description || "");
    setEditAmount(String(expense.amount || ""));
    setEditCurrency(expense.currency || "AED");
    setEditPaid(String(expense.creditPaid || "0"));
    setEditPaymentMethod(expense.paymentMethod || "Cash");
    setEditEntryType(expense.entryType || "Invoice");
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense || !editingExpense.id) return;
    if (!editDate || !editProjectCode || !editVendor.trim() || !editDesc.trim() || !editAmount) {
      alert("Please fill all required fields");
      return;
    }
    setEditLoading(true);
    try {
      // Reformat the input date to sheet format (DD MMM YYYY)
      const dateObj = new Date(editDate);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const formattedDate = `${String(dateObj.getDate()).padStart(2, "0")} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;

      if (onEditExpense) {
        const success = await onEditExpense(
          editingExpense.id,
          formattedDate,
          editContractorId, // can be empty string for TDQS General
          editProjectCode,
          editVendor.trim(),
          editDesc.trim(),
          Number(editAmount),
          editCurrency,
          Number(editPaid) || 0,
          editPaymentMethod,
          editEntryType
        );
        if (success) {
          setEditingExpense(null);
        }
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  // Handle Delete
  const handleDelete = async (expense: ExpenseEntry) => {
    if (!expense.id || !onDeleteExpense) return;
    const confirmMsg = `Are you sure you want to remove this expense entry?\n\nDate: ${expense.date}\nVendor: ${expense.vendor}\nAmount: ${formatCurrency(expense.amount, expense.currency)}`;
    if (window.confirm(confirmMsg)) {
      await onDeleteExpense(expense.id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters Sticky Panel */}
      <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.12)] p-4 sticky top-0 z-20 space-y-3 border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1 border-b border-gray-50">
          <div className="flex items-center space-x-2 text-gray-800 font-bold text-xs uppercase tracking-wider">
            <SlidersHorizontal className="w-4 h-4 text-blue-500" />
            <span>Unified Expense Explorer</span>
          </div>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer uppercase tracking-wider"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Contractor Dropdown */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider" htmlFor="contractor-filter">
              Contractor
            </label>
            <select
              id="contractor-filter"
              value={selectedContractorId}
              onChange={(e) => setSelectedContractorId(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 font-medium cursor-pointer"
            >
              <option value="all">All Contractors</option>
              <option value="">TDQS General</option>
              {contractors.map(c => (
                <option key={c.id} value={c.id}>
                  {c.id} - {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Project Dropdown */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider" htmlFor="project-filter">
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
            <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider" htmlFor="from-date-filter">
              From Date
            </label>
            <input
              id="from-date-filter"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 font-medium cursor-pointer"
            />
          </div>

          {/* To Date Picker */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider" htmlFor="to-date-filter">
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
            <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider" htmlFor="search-filter">
              Vendor / Description
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-gray-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                id="search-filter"
                type="text"
                placeholder="Search vendor/details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg pl-8 pr-2.5 py-2 font-medium focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Clear Filters Button */}
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
              className="text-[11px] font-extrabold text-blue-600 hover:text-blue-700 uppercase tracking-wider focus:outline-none cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.12)] overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider select-none">
                <th
                  onClick={() => handleSort("date")}
                  className="py-3.5 px-5 sticky left-0 bg-gray-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] cursor-pointer hover:bg-gray-100"
                >
                  Date {renderSortArrow("date")}
                </th>
                <th
                  onClick={() => handleSort("contractor")}
                  className="py-3.5 px-5 cursor-pointer hover:bg-gray-100"
                >
                  Contractor {renderSortArrow("contractor")}
                </th>
                <th
                  onClick={() => handleSort("project")}
                  className="py-3.5 px-5 cursor-pointer hover:bg-gray-100"
                >
                  Project {renderSortArrow("project")}
                </th>
                <th
                  onClick={() => handleSort("vendor")}
                  className="py-3.5 px-5 cursor-pointer hover:bg-gray-100"
                >
                  Vendor {renderSortArrow("vendor")}
                </th>
                <th
                  onClick={() => handleSort("description")}
                  className="py-3.5 px-5 cursor-pointer hover:bg-gray-100"
                >
                  Description {renderSortArrow("description")}
                </th>
                <th
                  onClick={() => handleSort("paymentMethod")}
                  className="py-3.5 px-5 cursor-pointer hover:bg-gray-100 text-center"
                >
                  Method {renderSortArrow("paymentMethod")}
                </th>
                <th
                  onClick={() => handleSort("entryType")}
                  className="py-3.5 px-5 cursor-pointer hover:bg-gray-100 text-center"
                >
                  Type {renderSortArrow("entryType")}
                </th>
                <th
                  onClick={() => handleSort("amount")}
                  className="py-3.5 px-5 cursor-pointer hover:bg-gray-100 text-right"
                >
                  Amount {renderSortArrow("amount")}
                </th>
                <th className="py-3.5 px-5 text-center">Paid Status</th>
                <th className="py-3.5 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm text-gray-600">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((expense, idx) => {
                  const paid = expense.creditPaid;
                  const isPaid = paid !== undefined && paid !== null && Number(paid) > 0;
                  const isFullyPaid = isPaid && Number(paid) >= Number(expense.amount);
                  const isDeduction = expense.entryType === "Deduction";

                  return (
                    <tr
                      key={expense.id || idx}
                      className={`hover:bg-gray-50/40 transition-colors ${
                        isDeduction ? "bg-red-50/45 text-red-900 border-red-100/50" : ""
                      }`}
                    >
                      {/* Sticky Date */}
                      <td className={`py-3.5 px-5 font-mono text-xs text-gray-500 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] ${
                        isDeduction ? "bg-red-50/95" : "bg-white"
                      }`}>
                        {expense.date}
                      </td>
                      <td className={`py-3.5 px-5 font-bold ${isDeduction ? "text-red-950" : "text-gray-800"}`}>
                        {contractorMap.get(expense.contractorId || "") || "TDQS General"}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-xs">
                        {expense.projectCode}
                        <span className={`font-sans ml-1 text-[11px] block sm:inline ${isDeduction ? "text-red-700" : "text-gray-400"}`}>
                          ({projectMap.get(expense.projectCode) || ""})
                        </span>
                      </td>
                      <td className={`py-3.5 px-5 font-bold ${isDeduction ? "text-red-950" : "text-gray-800"}`}>
                        {expense.vendor}
                      </td>
                      <td className="py-3.5 px-5 text-xs max-w-xs truncate" title={expense.description}>
                        {expense.description}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200 uppercase tracking-wide">
                          {expense.paymentMethod || "Cash"}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        {expense.entryType === "Deduction" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 uppercase tracking-wide">
                            Deduction
                          </span>
                        ) : expense.entryType === "Adjustment" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wide">
                            Adjustment
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200 uppercase tracking-wide">
                            Invoice
                          </span>
                        )}
                      </td>
                      <td className={`py-3.5 px-5 text-right font-semibold ${isDeduction ? "text-red-700 font-extrabold" : "text-red-500"}`}>
                        {formatCurrency(expense.amount, expense.currency)}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        {isFullyPaid ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-150 uppercase tracking-wider">
                            Paid
                          </span>
                        ) : isPaid ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-150 uppercase tracking-wider">
                            Partial ({formatCurrency(paid, expense.currency)})
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-150 uppercase tracking-wider">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleOpenEdit(expense)}
                            title="Edit entry"
                            className="p-1 hover:bg-blue-50 text-blue-600 hover:text-blue-800 rounded transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(expense)}
                            title="Delete entry"
                            className="p-1 hover:bg-red-50 text-red-600 hover:text-red-800 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-400 text-sm">
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
            Total Filtered:{" "}
            <span className="font-extrabold text-red-500">
              {formatCurrency(totalAmountAED, "AED")}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Modal Dialog */}
      {editingExpense && (
        <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Edit Expense Entry
                </h3>
              </div>
              <button
                onClick={() => setEditingExpense(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2.5 font-medium outline-none cursor-pointer focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">
                    Contractor (Optional)
                  </label>
                  <select
                    value={editContractorId}
                    onChange={(e) => setEditContractorId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2.5 font-medium cursor-pointer focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">TDQS General (No Contractor)</option>
                    {contractors.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">
                    Project Code *
                  </label>
                  <select
                    value={editProjectCode}
                    onChange={(e) => setEditProjectCode(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2.5 font-medium cursor-pointer focus:ring-1 focus:ring-blue-500"
                    disabled={editProjects.length === 0}
                  >
                    {editProjects.length > 0 ? (
                      editProjects.map(p => (
                        <option key={p.code} value={p.code}>
                          {p.code} - {p.name}
                        </option>
                      ))
                    ) : (
                      <option value="">No Projects found</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">
                    Vendor *
                  </label>
                  <input
                    type="text"
                    required
                    value={editVendor}
                    onChange={(e) => setEditVendor(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">
                    Description *
                  </label>
                  <input
                    type="text"
                    required
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">
                    Currency *
                  </label>
                  <select
                    value={editCurrency}
                    onChange={(e) => setEditCurrency(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2.5 font-medium cursor-pointer focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="AED">AED</option>
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">
                    Claim Value (Amount) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">
                    Credit Paid
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editPaid}
                    onChange={(e) => setEditPaid(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={editPaymentMethod}
                    onChange={(e) => setEditPaymentMethod(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2.5 font-medium cursor-pointer focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">
                    Entry Type *
                  </label>
                  <select
                    value={editEntryType}
                    onChange={(e) => setEditEntryType(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2.5 font-medium cursor-pointer focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Invoice">Invoice</option>
                    <option value="Adjustment">Adjustment</option>
                    <option value="Deduction">Deduction</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="bg-gray-100 hover:bg-gray-250 text-gray-700 text-xs font-bold py-2.5 px-5 rounded-lg transition-colors cursor-pointer uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold py-2.5 px-5 rounded-lg transition-colors cursor-pointer uppercase tracking-wider shadow-2xs"
                >
                  {editLoading ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
