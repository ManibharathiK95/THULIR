import React, { useState, useMemo } from "react";
import { Contractor, Project } from "../types";
import { formatDateToString } from "../utils/date";
import { UserPlus, FolderPlus, DollarSign, Wallet, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";

interface AddDataProps {
  contractors: Contractor[];
  projects: Project[];
  onAddContractor: (name: string, accountNumber: string, contactNumber: string) => Promise<boolean>;
  onAddProject: (code: string, name: string, contractorId: string) => Promise<boolean>;
  onAddIncome: (
    date: string,
    contractorId: string,
    projectCode: string,
    description: string,
    amount: number,
    currency: string,
    creditReceived: number
  ) => Promise<boolean>;
  onAddExpense: (
    date: string,
    contractorId: string,
    projectCode: string,
    vendor: string,
    description: string,
    amount: number,
    currency: string,
    creditPaid: number
  ) => Promise<boolean>;
  onResetData: () => Promise<void>;
}

export default function AddData({
  contractors,
  projects,
  onAddContractor,
  onAddProject,
  onAddIncome,
  onAddExpense,
  onResetData
}: AddDataProps) {
  // Notification states
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Form 1: Add Contractor
  const [cName, setCName] = useState("");
  const [cAccount, setCAccount] = useState("");
  const [cContact, setCContact] = useState("");
  const [cLoading, setCLoading] = useState(false);

  const handleContractorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim()) return showToast("Contractor name is required", "error");
    setCLoading(true);
    try {
      const success = await onAddContractor(cName.trim(), cAccount.trim(), cContact.trim());
      if (success) {
        showToast("Contractor added successfully!");
        setCName("");
        setCAccount("");
        setCContact("");
      } else {
        showToast("Failed to add contractor.", "error");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setCLoading(false);
    }
  };

  // Form 2: Add Project
  const [pCode, setPCode] = useState("");
  const [pName, setPName] = useState("");
  const [pContractorId, setPContractorId] = useState("");
  const [pLoading, setPLoading] = useState(false);

  // Initialize contractor selection
  React.useEffect(() => {
    if (contractors.length > 0 && !pContractorId) {
      setPContractorId(contractors[0].id);
    }
  }, [contractors, pContractorId]);

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pCode.trim() || !pName.trim() || !pContractorId) {
      return showToast("All project fields are required", "error");
    }
    setPLoading(true);
    try {
      const success = await onAddProject(pCode.trim().toUpperCase(), pName.trim(), pContractorId);
      if (success) {
        showToast("Project added successfully!");
        setPCode("");
        setPName("");
      } else {
        showToast("Failed to add project.", "error");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setPLoading(false);
    }
  };

  // Form 3: Add Income Entry
  const [incDate, setIncDate] = useState("");
  const [incContractorId, setIncContractorId] = useState("");
  const [incProjectCode, setIncProjectCode] = useState("");
  const [incDesc, setIncDesc] = useState("");
  const [incAmount, setIncAmount] = useState("");
  const [incCurrency, setIncCurrency] = useState("AED");
  const [incReceived, setIncReceived] = useState("");
  const [incLoading, setIncLoading] = useState(false);

  // Filter projects for Income form
  const incProjects = useMemo(() => {
    if (!incContractorId) return [];
    return projects.filter(p => p.contractorId === incContractorId);
  }, [projects, incContractorId]);

  // Set default selections
  React.useEffect(() => {
    if (contractors.length > 0 && !incContractorId) {
      setIncContractorId(contractors[0].id);
    }
  }, [contractors, incContractorId]);

  React.useEffect(() => {
    if (incProjects.length > 0) {
      setIncProjectCode(incProjects[0].code);
    } else {
      setIncProjectCode("");
    }
  }, [incProjects]);

  const handleIncomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incDate || !incContractorId || !incProjectCode || !incDesc.trim() || !incAmount) {
      return showToast("Please fill all required income fields", "error");
    }
    setIncLoading(true);
    try {
      // Format the picker date (YYYY-MM-DD) into sheet style "DD MMM YYYY"
      const dateObj = new Date(incDate);
      const sheetDateStr = formatDateToString(dateObj);
      
      const success = await onAddIncome(
        sheetDateStr,
        incContractorId,
        incProjectCode,
        incDesc.trim(),
        Number(incAmount),
        incCurrency,
        incReceived ? Number(incReceived) : 0
      );

      if (success) {
        showToast("Income entry recorded successfully!");
        setIncDesc("");
        setIncAmount("");
        setIncReceived("");
      } else {
        showToast("Failed to record income entry.", "error");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIncLoading(false);
    }
  };

  // Form 4: Add Expense Entry
  const [expDate, setExpDate] = useState("");
  const [expContractorId, setExpContractorId] = useState("");
  const [expProjectCode, setExpProjectCode] = useState("");
  const [expVendor, setExpVendor] = useState("");
  const [expDesc, setExpDesc] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expCurrency, setExpCurrency] = useState("AED");
  const [expPaid, setExpPaid] = useState("");
  const [expLoading, setExpLoading] = useState(false);

  // Filter projects for Expense form
  const expProjects = useMemo(() => {
    if (!expContractorId) return [];
    return projects.filter(p => p.contractorId === expContractorId);
  }, [projects, expContractorId]);

  // Set default selections
  React.useEffect(() => {
    if (contractors.length > 0 && !expContractorId) {
      setExpContractorId(contractors[0].id);
    }
  }, [contractors, expContractorId]);

  React.useEffect(() => {
    if (expProjects.length > 0) {
      setExpProjectCode(expProjects[0].code);
    } else {
      setExpProjectCode("");
    }
  }, [expProjects]);

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expDate || !expContractorId || !expProjectCode || !expVendor.trim() || !expDesc.trim() || !expAmount) {
      return showToast("Please fill all required expense fields", "error");
    }
    setExpLoading(true);
    try {
      const dateObj = new Date(expDate);
      const sheetDateStr = formatDateToString(dateObj);

      const success = await onAddExpense(
        sheetDateStr,
        expContractorId,
        expProjectCode,
        expVendor.trim(),
        expDesc.trim(),
        Number(expAmount),
        expCurrency,
        expPaid ? Number(expPaid) : 0
      );

      if (success) {
        showToast("Expense entry recorded successfully!");
        setExpVendor("");
        setExpDesc("");
        setExpAmount("");
        setExpPaid("");
      } else {
        showToast("Failed to record expense entry.", "error");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setExpLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto relative pb-10">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center p-3 rounded-lg shadow-lg text-xs font-bold border transform transition-all duration-300 ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 mr-2 text-red-600" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Database Quick Tools Box */}
      <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-200/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-amber-800">Preview & Demo Database Controls</h3>
          <p className="text-[11px] text-amber-700/80 font-medium mt-0.5">
            Reset the sandbox local database anytime to the pre-populated starting sample rows.
          </p>
        </div>
        <button
          onClick={async () => {
            if (confirm("Reset local database to original sample records? Any new rows you added will be removed.")) {
              await onResetData();
              showToast("Database has been reset to starting sample data!");
            }
          }}
          className="inline-flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition-colors focus:outline-none uppercase tracking-wider cursor-pointer shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Sample Data</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Add Contractor */}
        <div className="bg-white p-5 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.12)] flex flex-col">
          <div className="flex items-center space-x-2 pb-3 border-b border-gray-50 mb-4">
            <UserPlus className="w-4 h-4 text-blue-500" />
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Section 1: Add Contractor</h3>
          </div>

          <form onSubmit={handleContractorSubmit} className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1" htmlFor="c-name">
                  Contractor Name *
                </label>
                <input
                  id="c-name"
                  type="text"
                  required
                  placeholder="e.g. Al Ghanim International"
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2 font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1" htmlFor="c-acct">
                  Account Number
                </label>
                <input
                  id="c-acct"
                  type="text"
                  placeholder="e.g. AE82 0260 0010 1561 6092 501"
                  value={cAccount}
                  onChange={(e) => setCAccount(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2 font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1" htmlFor="c-tel">
                  Contact Number
                </label>
                <input
                  id="c-tel"
                  type="text"
                  placeholder="e.g. +971 55 667 6720"
                  value={cContact}
                  onChange={(e) => setCContact(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2 font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-50">
              <button
                type="submit"
                disabled={cLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors cursor-pointer uppercase tracking-wider focus:outline-none shadow-3xs"
              >
                {cLoading ? "Adding..." : "Add Contractor"}
              </button>
            </div>
          </form>
        </div>

        {/* Section 2: Add Project */}
        <div className="bg-white p-5 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.12)] flex flex-col">
          <div className="flex items-center space-x-2 pb-3 border-b border-gray-50 mb-4">
            <FolderPlus className="w-4 h-4 text-blue-500" />
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Section 2: Add Project</h3>
          </div>

          <form onSubmit={handleProjectSubmit} className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1" htmlFor="p-contractor">
                  Contractor *
                </label>
                <select
                  id="p-contractor"
                  value={pContractorId}
                  onChange={(e) => setPContractorId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2 font-medium cursor-pointer focus:ring-1 focus:ring-blue-500"
                >
                  {contractors.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1" htmlFor="p-code">
                  Project Code *
                </label>
                <input
                  id="p-code"
                  type="text"
                  required
                  placeholder="e.g. R1089"
                  value={pCode}
                  onChange={(e) => setPCode(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2 font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1" htmlFor="p-name">
                  Project Name *
                </label>
                <input
                  id="p-name"
                  type="text"
                  required
                  placeholder="e.g. Development of Cycle Track"
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2 font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-50">
              <button
                type="submit"
                disabled={pLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors cursor-pointer uppercase tracking-wider focus:outline-none shadow-3xs"
              >
                {pLoading ? "Adding..." : "Add Project"}
              </button>
            </div>
          </form>
        </div>

        {/* Section 3: Add Income Entry */}
        <div className="bg-white p-5 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.12)] flex flex-col md:col-span-2">
          <div className="flex items-center space-x-2 pb-3 border-b border-gray-50 mb-4">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Section 3: Add Income Entry</h3>
          </div>

          <form onSubmit={handleIncomeSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1" htmlFor="inc-date">
                  Date *
                </label>
                <input
                  id="inc-date"
                  type="date"
                  required
                  value={incDate}
                  onChange={(e) => setIncDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2 font-medium cursor-pointer outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1" htmlFor="inc-contractor">
                  Contractor *
                </label>
                <select
                  id="inc-contractor"
                  value={incContractorId}
                  onChange={(e) => setIncContractorId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2 font-medium cursor-pointer"
                >
                  {contractors.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1" htmlFor="inc-project">
                  Project Code *
                </label>
                <select
                  id="inc-project"
                  value={incProjectCode}
                  onChange={(e) => setIncProjectCode(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2 font-medium cursor-pointer"
                  disabled={incProjects.length === 0}
                >
                  {incProjects.length > 0 ? (
                    incProjects.map(p => (
                      <option key={p.code} value={p.code}>
                        {p.code} - {p.name}
                      </option>
                    ))
                  ) : (
                    <option value="">No Projects found</option>
                  )}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1" htmlFor="inc-desc">
                  Description *
                </label>
                <input
                  id="inc-desc"
                  type="text"
                  required
                  placeholder="e.g. TDQS/INV/2025-10/001"
                  value={incDesc}
                  onChange={(e) => setIncDesc(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2 font-medium focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1" htmlFor="inc-currency">
                  Currency *
                </label>
                <select
                  id="inc-currency"
                  value={incCurrency}
                  onChange={(e) => setIncCurrency(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2 font-medium cursor-pointer"
                >
                  <option value="AED">AED</option>
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1" htmlFor="inc-amount">
                  Invoice Amount *
                </label>
                <input
                  id="inc-amount"
                  type="number"
                  step="any"
                  required
                  min="0"
                  placeholder="e.g. 24167"
                  value={incAmount}
                  onChange={(e) => setIncAmount(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2 font-medium focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1" htmlFor="inc-rec">
                  Credit Received (Optional)
                </label>
                <input
                  id="inc-rec"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="Leave 0 if not received yet"
                  value={incReceived}
                  onChange={(e) => setIncReceived(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2 font-medium focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-gray-50 flex justify-end">
              <button
                type="submit"
                disabled={incLoading || incProjects.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold py-2.5 px-6 rounded-lg transition-colors cursor-pointer uppercase tracking-wider focus:outline-none shadow-3xs"
              >
                {incLoading ? "Saving..." : "Add Income Entry"}
              </button>
            </div>
          </form>
        </div>

        {/* Section 4: Add Expense Entry */}
        <div className="bg-white p-5 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.12)] flex flex-col md:col-span-2">
          <div className="flex items-center space-x-2 pb-3 border-b border-gray-50 mb-4">
            <Wallet className="w-4 h-4 text-red-500" />
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Section 4: Add Expense Entry</h3>
          </div>

          <form onSubmit={handleExpenseSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1" htmlFor="exp-date">
                  Date *
                </label>
                <input
                  id="exp-date"
                  type="date"
                  required
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2 font-medium cursor-pointer outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1" htmlFor="exp-contractor">
                  Contractor *
                </label>
                <select
                  id="exp-contractor"
                  value={expContractorId}
                  onChange={(e) => setExpContractorId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2 font-medium cursor-pointer"
                >
                  {contractors.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1" htmlFor="exp-project">
                  Project Code *
                </label>
                <select
                  id="exp-project"
                  value={expProjectCode}
                  onChange={(e) => setExpProjectCode(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2 font-medium cursor-pointer"
                  disabled={expProjects.length === 0}
                >
                  {expProjects.length > 0 ? (
                    expProjects.map(p => (
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
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1" htmlFor="exp-vendor">
                  Vendor *
                </label>
                <input
                  id="exp-vendor"
                  type="text"
                  required
                  placeholder="e.g. Influx"
                  value={expVendor}
                  onChange={(e) => setExpVendor(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2 font-medium focus:ring-1 focus:ring-red-500 outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1" htmlFor="exp-desc">
                  Description *
                </label>
                <input
                  id="exp-desc"
                  type="text"
                  required
                  placeholder="e.g. Account Transfer towards Invoice 1"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2 font-medium focus:ring-1 focus:ring-red-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1" htmlFor="exp-currency">
                  Currency *
                </label>
                <select
                  id="exp-currency"
                  value={expCurrency}
                  onChange={(e) => setExpCurrency(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2 font-medium cursor-pointer"
                >
                  <option value="AED">AED</option>
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1" htmlFor="exp-amount">
                  Claim Value (Amount) *
                </label>
                <input
                  id="exp-amount"
                  type="number"
                  step="any"
                  required
                  min="0"
                  placeholder="e.g. 13475"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2 font-medium focus:ring-1 focus:ring-red-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1" htmlFor="exp-paid">
                  Credit Paid (Optional)
                </label>
                <input
                  id="exp-paid"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="Leave 0 if not paid yet"
                  value={expPaid}
                  onChange={(e) => setExpPaid(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-2 font-medium focus:ring-1 focus:ring-red-500 outline-none"
                />
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-gray-50 flex justify-end">
              <button
                type="submit"
                disabled={expLoading || expProjects.length === 0}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-xs font-bold py-2.5 px-6 rounded-lg transition-colors cursor-pointer uppercase tracking-wider focus:outline-none shadow-3xs"
              >
                {expLoading ? "Saving..." : "Add Expense Entry"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
