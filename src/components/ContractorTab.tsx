import React, { useState, useMemo } from "react";
import { Contractor, Project, IncomeEntry, ExpenseEntry } from "../types";
import { getFinancialYear, parseDate, getDaysSince } from "../utils/date";
import { formatCurrency } from "../utils/currency";
import { exportToCsv } from "../utils/csv";
import {
  CreditCard,
  Phone,
  Filter,
  Calendar,
  Landmark,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Download,
  X,
  AlertCircle
} from "lucide-react";

interface ContractorTabProps {
  contractor: Contractor;
  projects: Project[];
  income: IncomeEntry[];
  expenses: ExpenseEntry[];
  availableFYs: string[];
  selectedFY: string;
  onEditIncome?: (
    id: string,
    date: string,
    contractorId: string,
    projectCode: string,
    description: string,
    amount: number,
    currency: string,
    creditReceived: number,
    paymentMethod?: string,
    entryType?: string
  ) => Promise<boolean>;
  onDeleteIncome?: (id: string) => Promise<boolean>;
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

export default function ContractorTab({
  contractor,
  projects,
  income,
  expenses,
  availableFYs,
  selectedFY: initialFY,
  onEditIncome,
  onDeleteIncome,
  onEditExpense,
  onDeleteExpense
}: ContractorTabProps) {
  // Scoped filters
  const [selectedProjectCode, setSelectedProjectCode] = useState<string>("all");
  const [selectedFY, setSelectedFY] = useState<string>(initialFY);

  // Sorting states
  const [incSortField, setIncSortField] = useState<string>("date");
  const [incSortDirection, setIncSortDirection] = useState<"asc" | "desc">("asc");

  const [expSortField, setExpSortField] = useState<string>("date");
  const [expSortDirection, setExpSortDirection] = useState<"asc" | "desc">("asc");

  // Edit Modals states
  const [editingIncome, setEditingIncome] = useState<IncomeEntry | null>(null);
  const [editIncDate, setEditIncDate] = useState("");
  const [editIncProjectCode, setEditIncProjectCode] = useState("");
  const [editIncDesc, setEditIncDesc] = useState("");
  const [editIncAmount, setEditIncAmount] = useState("");
  const [editIncCurrency, setEditIncCurrency] = useState("AED");
  const [editIncReceived, setEditIncReceived] = useState("");
  const [editIncPaymentMethod, setEditIncPaymentMethod] = useState("Cash");
  const [editIncEntryType, setEditIncEntryType] = useState("Invoice");
  const [editIncLoading, setEditIncLoading] = useState(false);

  const [editingExpense, setEditingExpense] = useState<ExpenseEntry | null>(null);
  const [editExpDate, setEditExpDate] = useState("");
  const [editExpProjectCode, setEditExpProjectCode] = useState("");
  const [editExpVendor, setEditExpVendor] = useState("");
  const [editExpDesc, setEditExpDesc] = useState("");
  const [editExpAmount, setEditExpAmount] = useState("");
  const [editExpCurrency, setEditExpCurrency] = useState("AED");
  const [editExpPaid, setEditExpPaid] = useState("");
  const [editExpPaymentMethod, setEditExpPaymentMethod] = useState("Cash");
  const [editExpEntryType, setEditExpEntryType] = useState("Invoice");
  const [editExpLoading, setEditExpLoading] = useState(false);

  // Get active contractor projects
  const contractorProjects = useMemo(() => {
    return projects.filter(p => p.contractorId === contractor.id);
  }, [projects, contractor.id]);

  // Sync FY changes from top selector
  React.useEffect(() => {
    setSelectedFY(initialFY);
  }, [initialFY]);

  // Project code lookups map
  const projectMap = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach(p => map.set(p.code, p.name));
    return map;
  }, [projects]);

  // Filter and sort Income List
  const filteredIncome = useMemo(() => {
    let result = income.filter(i => i.contractorId === contractor.id);

    if (selectedProjectCode !== "all") {
      result = result.filter(i => i.projectCode === selectedProjectCode);
    }

    if (selectedFY !== "all") {
      result = result.filter(i => getFinancialYear(i.date) === selectedFY);
    }

    // Apply Sorting
    result.sort((a, b) => {
      let valA: any = "";
      let valB: any = "";

      if (incSortField === "date") {
        valA = parseDate(a.date).getTime();
        valB = parseDate(b.date).getTime();
      } else if (incSortField === "projectCode") {
        valA = a.projectCode.toLowerCase();
        valB = b.projectCode.toLowerCase();
      } else if (incSortField === "description") {
        valA = a.description.toLowerCase();
        valB = b.description.toLowerCase();
      } else if (incSortField === "amount") {
        valA = Number(a.amount) || 0;
        valB = Number(b.amount) || 0;
      } else if (incSortField === "creditReceived") {
        valA = Number(a.creditReceived) || 0;
        valB = Number(b.creditReceived) || 0;
      } else if (incSortField === "paymentMethod") {
        valA = (a.paymentMethod || "Cash").toLowerCase();
        valB = (b.paymentMethod || "Cash").toLowerCase();
      } else if (incSortField === "entryType") {
        valA = (a.entryType || "Invoice").toLowerCase();
        valB = (b.entryType || "Invoice").toLowerCase();
      }

      if (valA < valB) return incSortDirection === "asc" ? -1 : 1;
      if (valA > valB) return incSortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [income, contractor.id, selectedProjectCode, selectedFY, incSortField, incSortDirection]);

  // Filter and sort Expense List
  const filteredExpenses = useMemo(() => {
    let result = expenses.filter(e => e.contractorId === contractor.id);

    if (selectedProjectCode !== "all") {
      result = result.filter(e => e.projectCode === selectedProjectCode);
    }

    if (selectedFY !== "all") {
      result = result.filter(e => getFinancialYear(e.date) === selectedFY);
    }

    // Apply Sorting
    result.sort((a, b) => {
      let valA: any = "";
      let valB: any = "";

      if (expSortField === "date") {
        valA = parseDate(a.date).getTime();
        valB = parseDate(b.date).getTime();
      } else if (expSortField === "projectCode") {
        valA = a.projectCode.toLowerCase();
        valB = b.projectCode.toLowerCase();
      } else if (expSortField === "vendor") {
        valA = a.vendor.toLowerCase();
        valB = b.vendor.toLowerCase();
      } else if (expSortField === "description") {
        valA = a.description.toLowerCase();
        valB = b.description.toLowerCase();
      } else if (expSortField === "amount") {
        valA = Number(a.amount) || 0;
        valB = Number(b.amount) || 0;
      } else if (expSortField === "creditPaid") {
        valA = Number(a.creditPaid) || 0;
        valB = Number(b.creditPaid) || 0;
      } else if (expSortField === "paymentMethod") {
        valA = (a.paymentMethod || "Cash").toLowerCase();
        valB = (b.paymentMethod || "Cash").toLowerCase();
      } else if (expSortField === "entryType") {
        valA = (a.entryType || "Invoice").toLowerCase();
        valB = (b.entryType || "Invoice").toLowerCase();
      }

      if (valA < valB) return expSortDirection === "asc" ? -1 : 1;
      if (valA > valB) return expSortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [expenses, contractor.id, selectedProjectCode, selectedFY, expSortField, expSortDirection]);

  // Compute RUNNING BALANCE for Income Table, starting from Contractor Opening Balance
  const incomeWithRunningBalance = useMemo(() => {
    let running = Number(contractor.openingBalance) || 0;
    return filteredIncome.map(item => {
      const invoiceAmt = Number(item.amount) || 0;
      const received = Number(item.creditReceived) || 0;
      running = running + invoiceAmt - received;
      return {
        ...item,
        runningBalance: running
      };
    });
  }, [filteredIncome, contractor.openingBalance]);

  // Compute RUNNING BALANCE for Expense Table, starting from Contractor Opening Balance
  const expensesWithRunningBalance = useMemo(() => {
    let running = Number(contractor.openingBalance) || 0;
    return filteredExpenses.map(item => {
      const invoiceAmt = Number(item.amount) || 0;
      const paid = Number(item.creditPaid) || 0;
      running = running + invoiceAmt - paid;
      return {
        ...item,
        runningBalance: running
      };
    });
  }, [filteredExpenses, contractor.openingBalance]);

  // Summary Totals
  const totalInvoiceIncome = useMemo(() => {
    return filteredIncome.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredIncome]);

  const totalReceivedIncome = useMemo(() => {
    return filteredIncome.reduce((sum, item) => sum + (Number(item.creditReceived) || 0), 0);
  }, [filteredIncome]);

  const finalIncomeBalance = useMemo(() => {
    const len = incomeWithRunningBalance.length;
    return len > 0 ? incomeWithRunningBalance[len - 1].runningBalance : (Number(contractor.openingBalance) || 0);
  }, [incomeWithRunningBalance, contractor.openingBalance]);

  const totalInvoiceExpense = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredExpenses]);

  const totalPaidExpense = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + (Number(item.creditPaid) || 0), 0);
  }, [filteredExpenses]);

  const finalExpenseBalance = useMemo(() => {
    const len = expensesWithRunningBalance.length;
    return len > 0 ? expensesWithRunningBalance[len - 1].runningBalance : (Number(contractor.openingBalance) || 0);
  }, [expensesWithRunningBalance, contractor.openingBalance]);

  const balance = totalInvoiceIncome - totalInvoiceExpense;
  const profitPercentage = totalInvoiceIncome > 0 ? (balance / totalInvoiceIncome) * 100 : 0;
  const netInHand = totalReceivedIncome - totalPaidExpense;

  // Header click sorting toggles
  const handleIncSort = (field: string) => {
    if (incSortField === field) {
      setIncSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setIncSortField(field);
      setIncSortDirection("asc");
    }
  };

  const renderIncSortArrow = (field: string) => {
    if (incSortField !== field) return <ArrowUpDown className="w-3 h-3 text-gray-300 ml-1 inline" />;
    return incSortDirection === "asc" ? (
      <ArrowUp className="w-3 h-3 text-blue-600 ml-1 inline" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-600 ml-1 inline" />
    );
  };

  const handleExpSort = (field: string) => {
    if (expSortField === field) {
      setExpSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setExpSortField(field);
      setExpSortDirection("asc");
    }
  };

  const renderExpSortArrow = (field: string) => {
    if (expSortField !== field) return <ArrowUpDown className="w-3 h-3 text-gray-300 ml-1 inline" />;
    return expSortDirection === "asc" ? (
      <ArrowUp className="w-3 h-3 text-blue-600 ml-1 inline" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-600 ml-1 inline" />
    );
  };

  // CSV Export for Contractor Income
  const handleExportIncomeCSV = () => {
    const headers = ["Date", "Project Code", "Project Name", "Description", "Amount", "Currency", "Credit Received", "Payment Method", "Entry Type", "Running Balance"];
    const rows = incomeWithRunningBalance.map(item => [
      item.date,
      item.projectCode,
      projectMap.get(item.projectCode) || "",
      item.description,
      item.amount,
      item.currency,
      item.creditReceived,
      item.paymentMethod || "Cash",
      item.entryType || "Invoice",
      item.runningBalance
    ]);
    exportToCsv(`${contractor.id}_Income_Report.csv`, headers, rows);
  };

  // CSV Export for Contractor Expenses
  const handleExportExpenseCSV = () => {
    const headers = ["Date", "Project Code", "Project Name", "Vendor", "Description", "Amount", "Currency", "Credit Paid", "Payment Method", "Entry Type", "Running Balance"];
    const rows = expensesWithRunningBalance.map(item => [
      item.date,
      item.projectCode,
      projectMap.get(item.projectCode) || "",
      item.vendor,
      item.description,
      item.amount,
      item.currency,
      item.creditPaid,
      item.paymentMethod || "Cash",
      item.entryType || "Invoice",
      item.runningBalance
    ]);
    exportToCsv(`${contractor.id}_Expenses_Report.csv`, headers, rows);
  };

  // Pre-fill Edit Income Dialog
  const handleOpenEditIncome = (item: IncomeEntry) => {
    setEditingIncome(item);
    try {
      const dObj = parseDate(item.date);
      const yyyy = dObj.getFullYear();
      const mm = String(dObj.getMonth() + 1).padStart(2, "0");
      const dd = String(dObj.getDate()).padStart(2, "0");
      setEditIncDate(`${yyyy}-${mm}-${dd}`);
    } catch {
      setEditIncDate("");
    }
    setEditIncProjectCode(item.projectCode || "");
    setEditIncDesc(item.description || "");
    setEditIncAmount(String(item.amount || ""));
    setEditIncCurrency(item.currency || "AED");
    setEditIncReceived(String(item.creditReceived || "0"));
    setEditIncPaymentMethod(item.paymentMethod || "Cash");
    setEditIncEntryType(item.entryType || "Invoice");
  };

  // Submit Income Edit
  const handleEditIncSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIncome || !editingIncome.id || !onEditIncome) return;
    if (!editIncDate || !editIncProjectCode || !editIncDesc.trim() || !editIncAmount) {
      alert("Please fill all required fields");
      return;
    }
    setEditIncLoading(true);
    try {
      const dateObj = new Date(editIncDate);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const formattedDate = `${String(dateObj.getDate()).padStart(2, "0")} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;

      const success = await onEditIncome(
        editingIncome.id,
        formattedDate,
        contractor.id,
        editIncProjectCode,
        editIncDesc.trim(),
        Number(editIncAmount),
        editIncCurrency,
        Number(editIncReceived) || 0,
        editIncPaymentMethod,
        editIncEntryType
      );
      if (success) {
        setEditingIncome(null);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setEditIncLoading(false);
    }
  };

  // Pre-fill Edit Expense Dialog
  const handleOpenEditExpense = (item: ExpenseEntry) => {
    setEditingExpense(item);
    try {
      const dObj = parseDate(item.date);
      const yyyy = dObj.getFullYear();
      const mm = String(dObj.getMonth() + 1).padStart(2, "0");
      const dd = String(dObj.getDate()).padStart(2, "0");
      setEditExpDate(`${yyyy}-${mm}-${dd}`);
    } catch {
      setEditExpDate("");
    }
    setEditExpProjectCode(item.projectCode || "");
    setEditExpVendor(item.vendor || "");
    setEditExpDesc(item.description || "");
    setEditExpAmount(String(item.amount || ""));
    setEditExpCurrency(item.currency || "AED");
    setEditExpPaid(String(item.creditPaid || "0"));
    setEditExpPaymentMethod(item.paymentMethod || "Cash");
    setEditExpEntryType(item.entryType || "Invoice");
  };

  // Submit Expense Edit
  const handleEditExpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense || !editingExpense.id || !onEditExpense) return;
    if (!editExpDate || !editExpProjectCode || !editExpVendor.trim() || !editExpDesc.trim() || !editExpAmount) {
      alert("Please fill all required fields");
      return;
    }
    setEditExpLoading(true);
    try {
      const dateObj = new Date(editExpDate);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const formattedDate = `${String(dateObj.getDate()).padStart(2, "0")} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;

      const success = await onEditExpense(
        editingExpense.id,
        formattedDate,
        contractor.id,
        editExpProjectCode,
        editExpVendor.trim(),
        editExpDesc.trim(),
        Number(editExpAmount),
        editExpCurrency,
        Number(editExpPaid) || 0,
        editExpPaymentMethod,
        editExpEntryType
      );
      if (success) {
        setEditingExpense(null);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setEditExpLoading(false);
    }
  };

  // Delete handlers
  const handleDeleteIncome = async (item: IncomeEntry) => {
    if (!item.id || !onDeleteIncome) return;
    const confirmMsg = `Are you sure you want to remove this income entry?\n\nDate: ${item.date}\nDescription: ${item.description}\nAmount: ${formatCurrency(item.amount, item.currency)}`;
    if (window.confirm(confirmMsg)) {
      await onDeleteIncome(item.id);
    }
  };

  const handleDeleteExpense = async (item: ExpenseEntry) => {
    if (!item.id || !onDeleteExpense) return;
    const confirmMsg = `Are you sure you want to remove this expense entry?\n\nDate: ${item.date}\nVendor: ${item.vendor}\nAmount: ${formatCurrency(item.amount, item.currency)}`;
    if (window.confirm(confirmMsg)) {
      await onDeleteExpense(item.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section A: Contractor Header */}
      <div className="bg-white p-5 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.12)] flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-gray-100">
        <div>
          <span className="inline-block bg-blue-50 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-md mb-1 uppercase font-mono tracking-wider border border-blue-100">
            Contractor ID: {contractor.id}
          </span>
          <h2 className="text-xl font-extrabold text-gray-800">{contractor.name}</h2>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 mt-2 text-xs text-gray-500 font-semibold">
            <div className="flex items-center space-x-1.5">
              <Landmark className="w-3.5 h-3.5 text-gray-400" />
              <span>
                Account:{" "}
                <span className="font-mono font-bold text-gray-700">
                  {contractor.accountNumber || "N/A"}
                </span>
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              <span>
                Contact:{" "}
                <span className="font-mono font-bold text-gray-700">
                  {contractor.contactNumber || "N/A"}
                </span>
              </span>
            </div>
            {contractor.openingBalance !== undefined && (
              <div className="flex items-center space-x-1.5 bg-amber-50 text-amber-800 border border-amber-100 px-2 py-0.5 rounded">
                <span>
                  Opening Balance:{" "}
                  <span className="font-bold">
                    {formatCurrency(contractor.openingBalance, "AED")}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Section B & C: Filters */}
        <div className="flex flex-wrap items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100 self-start md:self-auto">
          {/* Project Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={selectedProjectCode}
              onChange={(e) => setSelectedProjectCode(e.target.value)}
              className="bg-white border border-gray-200 text-gray-800 text-xs rounded-md p-1.5 font-bold cursor-pointer outline-none focus:ring-1 focus:ring-blue-500"
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
              className="bg-white border border-gray-200 text-gray-800 text-xs rounded-md p-1.5 font-bold cursor-pointer outline-none focus:ring-1 focus:ring-blue-500"
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
        <div className="bg-white p-5 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.12)] border-l-4 border-[#34a853] flex flex-col justify-between h-24 border border-gray-100/60">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Contractor Total Income
          </span>
          <span className="text-xl font-bold text-gray-800">
            {formatCurrency(totalInvoiceIncome, "AED")}
          </span>
        </div>

        {/* Total Expense */}
        <div className="bg-white p-5 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.12)] border-l-4 border-[#ea4335] flex flex-col justify-between h-24 border border-gray-100/60">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Contractor Total Expenses
          </span>
          <span className="text-xl font-bold text-gray-800">
            {formatCurrency(totalInvoiceExpense, "AED")}
          </span>
        </div>

        {/* Profit Percentage */}
        <div className="bg-white p-5 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.12)] border-l-4 border-blue-500 flex flex-col justify-between h-24 border border-gray-100/60">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Balance & margin
          </span>
          <div className="flex items-baseline space-x-2">
            <span className={`text-xl font-bold ${balance >= 0 ? "text-gray-800" : "text-red-600"}`}>
              {formatCurrency(balance, "AED")}
            </span>
            {totalInvoiceIncome > 0 && (
              <span
                className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                  profitPercentage >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                }`}
              >
                {profitPercentage.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Section E: Income Table */}
      <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.12)] overflow-hidden border border-gray-100">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3">
          <h3 className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">
            Income / Invoices Raised
          </h3>
          <button
            onClick={handleExportIncomeCSV}
            className="inline-flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] px-2.5 py-1 rounded transition-colors cursor-pointer uppercase tracking-wider"
          >
            <Download className="w-3 h-3" />
            <span>CSV</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider select-none">
                <th
                  onClick={() => handleIncSort("date")}
                  className="py-3 px-5 sticky left-0 bg-gray-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] cursor-pointer hover:bg-gray-100"
                >
                  Date {renderIncSortArrow("date")}
                </th>
                <th
                  onClick={() => handleIncSort("projectCode")}
                  className="py-3 px-5 cursor-pointer hover:bg-gray-100"
                >
                  Project {renderIncSortArrow("projectCode")}
                </th>
                <th
                  onClick={() => handleIncSort("description")}
                  className="py-3 px-5 cursor-pointer hover:bg-gray-100"
                >
                  Description {renderIncSortArrow("description")}
                </th>
                <th
                  onClick={() => handleIncSort("paymentMethod")}
                  className="py-3 px-5 cursor-pointer hover:bg-gray-100 text-center"
                >
                  Method {renderIncSortArrow("paymentMethod")}
                </th>
                <th
                  onClick={() => handleIncSort("entryType")}
                  className="py-3 px-5 cursor-pointer hover:bg-gray-100 text-center"
                >
                  Type {renderIncSortArrow("entryType")}
                </th>
                <th
                  onClick={() => handleIncSort("amount")}
                  className="py-3 px-5 cursor-pointer hover:bg-gray-100 text-right"
                >
                  Invoice Value {renderIncSortArrow("amount")}
                </th>
                <th
                  onClick={() => handleIncSort("creditReceived")}
                  className="py-3 px-5 cursor-pointer hover:bg-gray-100 text-right"
                >
                  Credit Received {renderIncSortArrow("creditReceived")}
                </th>
                <th className="py-3 px-5 text-center">Status</th>
                <th className="py-3 px-5 text-right font-bold">Running Balance</th>
                <th className="py-3 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm text-gray-600">
              {incomeWithRunningBalance.length > 0 ? (
                incomeWithRunningBalance.map((item, idx) => {
                  const outstanding = Number(item.amount) - Number(item.creditReceived);
                  const isPending = outstanding > 0;
                  const daysSince = getDaysSince(item.date);
                  const isDeduction = item.entryType === "Deduction";

                  return (
                    <tr
                      key={item.id || idx}
                      className={`hover:bg-gray-50/30 transition-colors ${
                        isDeduction ? "bg-red-50/45 text-red-900 border-red-100/50" : ""
                      }`}
                    >
                      <td className={`py-3 px-5 font-mono text-xs text-gray-500 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] ${
                        isDeduction ? "bg-red-50/95" : "bg-white"
                      }`}>
                        {item.date}
                      </td>
                      <td className="py-3 px-5 font-mono text-xs">
                        {item.projectCode}
                        <span className={`font-sans ml-1 text-[11px] block sm:inline ${isDeduction ? "text-red-700" : "text-gray-400"}`}>
                          ({projectMap.get(item.projectCode) || ""})
                        </span>
                      </td>
                      <td className="py-3 px-5 text-xs max-w-xs truncate" title={item.description}>
                        {item.description}
                      </td>
                      <td className="py-3 px-5 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200 uppercase tracking-wide">
                          {item.paymentMethod || "Cash"}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-center">
                        {item.entryType === "Deduction" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 uppercase tracking-wide">
                            Deduction
                          </span>
                        ) : item.entryType === "Adjustment" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wide">
                            Adjustment
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200 uppercase tracking-wide">
                            Invoice
                          </span>
                        )}
                      </td>
                      <td className={`py-3 px-5 text-right font-medium ${isDeduction ? "text-red-700 font-extrabold" : "text-gray-800"}`}>
                        {formatCurrency(item.amount, item.currency)}
                      </td>
                      <td className="py-3 px-5 text-right font-medium text-emerald-600">
                        {formatCurrency(item.creditReceived, item.currency)}
                      </td>
                      <td className="py-3 px-5 text-center">
                        {isPending ? (
                          <div className="flex flex-col items-center justify-center space-y-0.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                              Pending
                            </span>
                            <span className="text-[10px] text-amber-600 font-bold shrink-0">
                              {formatCurrency(outstanding, item.currency)} ({daysSince}d aging)
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-150 uppercase tracking-wider">
                            Paid
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-5 text-right font-semibold text-gray-700 font-mono text-xs">
                        {formatCurrency(item.runningBalance, item.currency)}
                      </td>
                      <td className="py-3 px-5 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => handleOpenEditIncome(item)}
                            title="Edit"
                            className="p-1 hover:bg-blue-50 text-blue-600 hover:text-blue-800 rounded transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteIncome(item)}
                            title="Delete"
                            className="p-1 hover:bg-red-50 text-red-600 hover:text-red-800 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-gray-400 text-xs">
                    No income invoices recorded for selected criteria.
                  </td>
                </tr>
              )}

              {/* Totals Row */}
              <tr className="bg-blue-50/40 font-bold border-t border-blue-100 text-gray-800">
                <td className="py-3 px-5 text-xs" colSpan={5}>
                  TOTALS & REMAINING
                </td>
                <td className="py-3 px-5 text-right font-bold text-gray-900">
                  {formatCurrency(totalInvoiceIncome, "AED")}
                </td>
                <td className="py-3 px-5 text-right font-bold text-emerald-600">
                  {formatCurrency(totalReceivedIncome, "AED")}
                </td>
                <td className="py-3 px-5 text-center font-bold text-amber-700 text-xs">
                  {totalInvoiceIncome - totalReceivedIncome > 0 ? (
                    <span className="bg-amber-100 border border-amber-200 px-2 py-0.5 rounded font-extrabold uppercase">
                      Pending: {formatCurrency(totalInvoiceIncome - totalReceivedIncome, "AED")}
                    </span>
                  ) : (
                    <span className="bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded font-extrabold uppercase text-emerald-800">
                      Fully Cleared
                    </span>
                  )}
                </td>
                <td className="py-3 px-5 text-right font-extrabold text-blue-700 font-mono text-xs">
                  {formatCurrency(finalIncomeBalance, "AED")}
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section F: Expense Table */}
      <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.12)] overflow-hidden border border-gray-100">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3">
          <h3 className="text-xs font-extrabold text-red-700 uppercase tracking-wider">
            Expenses / Payments Made
          </h3>
          <button
            onClick={handleExportExpenseCSV}
            className="inline-flex items-center space-x-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[10px] px-2.5 py-1 rounded transition-colors cursor-pointer uppercase tracking-wider"
          >
            <Download className="w-3 h-3" />
            <span>CSV</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider select-none">
                <th
                  onClick={() => handleExpSort("date")}
                  className="py-3 px-5 sticky left-0 bg-gray-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] cursor-pointer hover:bg-gray-100"
                >
                  Date {renderExpSortArrow("date")}
                </th>
                <th
                  onClick={() => handleExpSort("projectCode")}
                  className="py-3 px-5 cursor-pointer hover:bg-gray-100"
                >
                  Project {renderExpSortArrow("projectCode")}
                </th>
                <th
                  onClick={() => handleExpSort("vendor")}
                  className="py-3 px-5 cursor-pointer hover:bg-gray-100"
                >
                  Vendor {renderExpSortArrow("vendor")}
                </th>
                <th
                  onClick={() => handleExpSort("description")}
                  className="py-3 px-5 cursor-pointer hover:bg-gray-100"
                >
                  Description {renderExpSortArrow("description")}
                </th>
                <th
                  onClick={() => handleExpSort("paymentMethod")}
                  className="py-3 px-5 cursor-pointer hover:bg-gray-100 text-center"
                >
                  Method {renderExpSortArrow("paymentMethod")}
                </th>
                <th
                  onClick={() => handleExpSort("entryType")}
                  className="py-3 px-5 cursor-pointer hover:bg-gray-100 text-center"
                >
                  Type {renderExpSortArrow("entryType")}
                </th>
                <th
                  onClick={() => handleExpSort("amount")}
                  className="py-3 px-5 cursor-pointer hover:bg-gray-100 text-right"
                >
                  Invoice Value {renderExpSortArrow("amount")}
                </th>
                <th
                  onClick={() => handleExpSort("creditPaid")}
                  className="py-3 px-5 cursor-pointer hover:bg-gray-100 text-right"
                >
                  Credit Paid {renderExpSortArrow("creditPaid")}
                </th>
                <th className="py-3 px-5 text-center">Status</th>
                <th className="py-3 px-5 text-right font-bold">Running Balance</th>
                <th className="py-3 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm text-gray-600">
              {expensesWithRunningBalance.length > 0 ? (
                expensesWithRunningBalance.map((item, idx) => {
                  const outstanding = Number(item.amount) - Number(item.creditPaid);
                  const isPending = outstanding > 0;
                  const daysSince = getDaysSince(item.date);
                  const isDeduction = item.entryType === "Deduction";

                  return (
                    <tr
                      key={item.id || idx}
                      className={`hover:bg-gray-50/30 transition-colors ${
                        isDeduction ? "bg-red-50/45 text-red-900 border-red-100/50" : ""
                      }`}
                    >
                      <td className={`py-3 px-5 font-mono text-xs text-gray-500 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] ${
                        isDeduction ? "bg-red-50/95" : "bg-white"
                      }`}>
                        {item.date}
                      </td>
                      <td className="py-3 px-5 font-mono text-xs">
                        {item.projectCode}
                        <span className={`font-sans ml-1 text-[11px] block sm:inline ${isDeduction ? "text-red-700" : "text-gray-400"}`}>
                          ({projectMap.get(item.projectCode) || ""})
                        </span>
                      </td>
                      <td className={`py-3 px-5 font-bold ${isDeduction ? "text-red-950" : "text-gray-800"}`}>
                        {item.vendor}
                      </td>
                      <td className="py-3 px-5 text-xs max-w-xs truncate" title={item.description}>
                        {item.description}
                      </td>
                      <td className="py-3 px-5 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200 uppercase tracking-wide">
                          {item.paymentMethod || "Cash"}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-center">
                        {item.entryType === "Deduction" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 uppercase tracking-wide">
                            Deduction
                          </span>
                        ) : item.entryType === "Adjustment" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wide">
                            Adjustment
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200 uppercase tracking-wide">
                            Invoice
                          </span>
                        )}
                      </td>
                      <td className={`py-3 px-5 text-right font-medium ${isDeduction ? "text-red-700 font-extrabold" : "text-gray-800"}`}>
                        {formatCurrency(item.amount, item.currency)}
                      </td>
                      <td className="py-3 px-5 text-right font-medium text-red-600">
                        {formatCurrency(item.creditPaid, item.currency)}
                      </td>
                      <td className="py-3 px-5 text-center">
                        {isPending ? (
                          <div className="flex flex-col items-center justify-center space-y-0.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                              Pending
                            </span>
                            <span className="text-[10px] text-amber-600 font-bold shrink-0">
                              {formatCurrency(outstanding, item.currency)} ({daysSince}d aging)
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-150 uppercase tracking-wider">
                            Paid
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-5 text-right font-semibold text-gray-700 font-mono text-xs">
                        {formatCurrency(item.runningBalance, item.currency)}
                      </td>
                      <td className="py-3 px-5 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => handleOpenEditExpense(item)}
                            title="Edit"
                            className="p-1 hover:bg-blue-50 text-blue-600 hover:text-blue-800 rounded transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(item)}
                            title="Delete"
                            className="p-1 hover:bg-red-50 text-red-600 hover:text-red-800 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-gray-400 text-xs">
                    No expense payments recorded for selected criteria.
                  </td>
                </tr>
              )}

              {/* Totals Row */}
              <tr className="bg-blue-50/40 font-bold border-t border-blue-100 text-gray-800">
                <td className="py-3 px-5 text-xs" colSpan={6}>
                  TOTALS & REMAINING
                </td>
                <td className="py-3 px-5 text-right font-bold text-gray-900">
                  {formatCurrency(totalInvoiceExpense, "AED")}
                </td>
                <td className="py-3 px-5 text-right font-bold text-red-600">
                  {formatCurrency(totalPaidExpense, "AED")}
                </td>
                <td className="py-3 px-5 text-center font-bold text-amber-700 text-xs">
                  {totalInvoiceExpense - totalPaidExpense > 0 ? (
                    <span className="bg-amber-100 border border-amber-200 px-2 py-0.5 rounded font-extrabold uppercase">
                      Pending: {formatCurrency(totalInvoiceExpense - totalPaidExpense, "AED")}
                    </span>
                  ) : (
                    <span className="bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded font-extrabold uppercase text-emerald-800">
                      Fully Cleared
                    </span>
                  )}
                </td>
                <td className="py-3 px-5 text-right font-extrabold text-blue-700 font-mono text-xs">
                  {formatCurrency(finalExpenseBalance, "AED")}
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section G: Net Position */}
      <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.12)] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-gray-100">
        <div>
          <h4 className="font-bold text-gray-800 uppercase text-xs tracking-wider">
            Net Project Cashflow Position
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            Shows final actual cash collected minus cash paid in hand.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-6 text-sm font-semibold">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
              Total Cash Received
            </span>
            <span className="text-emerald-600 mt-0.5">
              {formatCurrency(totalReceivedIncome, "AED")}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
              Total Cash Paid
            </span>
            <span className="text-red-500 mt-0.5">
              {formatCurrency(totalPaidExpense, "AED")}
            </span>
          </div>
          <div className="flex flex-col border-l border-gray-100 pl-6">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
              Net Cash in Hand
            </span>
            <span
              className={`text-base font-extrabold mt-0.5 px-2 py-0.5 rounded ${
                netInHand >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
              }`}
            >
              {formatCurrency(netInHand, "AED")}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Income Modal */}
      {editingIncome && (
        <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Edit Income Entry
                </h3>
              </div>
              <button
                onClick={() => setEditingIncome(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditIncSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={editIncDate}
                    onChange={(e) => setEditIncDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2.5 font-medium outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">
                    Project Code *
                  </label>
                  <select
                    value={editIncProjectCode}
                    onChange={(e) => setEditIncProjectCode(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2.5 font-medium cursor-pointer focus:ring-1 focus:ring-emerald-500"
                  >
                    {contractorProjects.map(p => (
                      <option key={p.code} value={p.code}>
                        {p.code} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">
                    Description *
                  </label>
                  <input
                    type="text"
                    required
                    value={editIncDesc}
                    onChange={(e) => setEditIncDesc(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">
                    Currency *
                  </label>
                  <select
                    value={editIncCurrency}
                    onChange={(e) => setEditIncCurrency(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2.5 font-medium cursor-pointer focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="AED">AED</option>
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">
                    Invoice Value *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editIncAmount}
                    onChange={(e) => setEditIncAmount(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">
                    Credit Received
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editIncReceived}
                    onChange={(e) => setEditIncReceived(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={editIncPaymentMethod}
                    onChange={(e) => setEditIncPaymentMethod(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2.5 font-medium cursor-pointer focus:ring-1 focus:ring-emerald-500"
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
                    value={editIncEntryType}
                    onChange={(e) => setEditIncEntryType(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2.5 font-medium cursor-pointer focus:ring-1 focus:ring-emerald-500"
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
                  onClick={() => setEditingIncome(null)}
                  className="bg-gray-100 hover:bg-gray-250 text-gray-700 text-xs font-bold py-2.5 px-5 rounded-lg transition-colors cursor-pointer uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editIncLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold py-2.5 px-5 rounded-lg transition-colors cursor-pointer uppercase tracking-wider shadow-2xs"
                >
                  {editIncLoading ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Expense Modal */}
      {editingExpense && (
        <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-4 h-4 text-red-600" />
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

            <form onSubmit={handleEditExpSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={editExpDate}
                    onChange={(e) => setEditExpDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2.5 font-medium outline-none cursor-pointer focus:ring-1 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">
                    Project Code *
                  </label>
                  <select
                    value={editExpProjectCode}
                    onChange={(e) => setEditExpProjectCode(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2.5 font-medium cursor-pointer focus:ring-1 focus:ring-red-500"
                  >
                    {contractorProjects.map(p => (
                      <option key={p.code} value={p.code}>
                        {p.code} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">
                    Vendor *
                  </label>
                  <input
                    type="text"
                    required
                    value={editExpVendor}
                    onChange={(e) => setEditExpVendor(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-red-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">
                    Description *
                  </label>
                  <input
                    type="text"
                    required
                    value={editExpDesc}
                    onChange={(e) => setEditExpDesc(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-red-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">
                    Currency *
                  </label>
                  <select
                    value={editExpCurrency}
                    onChange={(e) => setEditExpCurrency(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2.5 font-medium cursor-pointer focus:ring-1 focus:ring-red-500"
                  >
                    <option value="AED">AED</option>
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">
                    Invoice Value (Amount) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editExpAmount}
                    onChange={(e) => setEditExpAmount(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-red-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">
                    Credit Paid
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editExpPaid}
                    onChange={(e) => setEditExpPaid(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-red-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={editExpPaymentMethod}
                    onChange={(e) => setEditExpPaymentMethod(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2.5 font-medium cursor-pointer focus:ring-1 focus:ring-red-500"
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
                    value={editExpEntryType}
                    onChange={(e) => setEditExpEntryType(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2.5 font-medium cursor-pointer focus:ring-1 focus:ring-red-500"
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
                  disabled={editExpLoading}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-xs font-bold py-2.5 px-5 rounded-lg transition-colors cursor-pointer uppercase tracking-wider shadow-2xs"
                >
                  {editExpLoading ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
