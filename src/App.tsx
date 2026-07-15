import React, { useState, useEffect, useMemo } from "react";
import { Contractor, Project, IncomeEntry, ExpenseEntry, AppData, Settings } from "./types";
import { getCurrentFinancialYear, getFinancialYear } from "./utils/date";
import Dashboard from "./components/Dashboard";
import AllExpenses from "./components/AllExpenses";
import ContractorTab from "./components/ContractorTab";
import AddData from "./components/AddData";
import PdfExport from "./components/PdfExport";
import GasIntegration from "./components/GasIntegration";
import { motion, AnimatePresence } from "motion/react";
import { 
  RefreshCw, 
  LayoutDashboard, 
  SlidersHorizontal, 
  PlusCircle, 
  Printer, 
  Settings as SettingsIcon, 
  FileSpreadsheet, 
  AlertCircle,
  TrendingUp,
  X,
  Lock
} from "lucide-react";

export default function App() {
  // App data state
  const [data, setData] = useState<AppData>({
    contractors: [],
    projects: [],
    income: [],
    expenses: [],
    settings: { googleSheetUrl: "" }
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active Tab State: 
  // "dashboard", "all-expenses", "contractor-[ID]", "add-data", "pdf-export"
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Global Financial Year selection (for Dashboard and defaults)
  const [selectedFY, setSelectedFY] = useState<string>(getCurrentFinancialYear());

  // Settings Modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Fetch all data from Express backend
  const fetchAllData = async (isSilent: boolean = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    
    setError(null);
    try {
      const res = await fetch("/api/data");
      if (!res.ok) {
        throw new Error(`Server returned status: ${res.status}`);
      }
      const json = await res.json();
      setData(json);

      // If there are unique financial years, make sure selected is valid or default
      // Let's compute available FYs dynamically
      const years = Array.from(new Set([
        ...json.income.map((i: any) => getFinancialYear(i.date)),
        ...json.expenses.map((e: any) => getFinancialYear(e.date))
      ])).filter(Boolean).sort() as string[];

      if (years.length > 0 && !years.includes(selectedFY)) {
        // Find latest available year or keep current
        setSelectedFY(years[years.length - 1]);
      }
    } catch (err: any) {
      console.error("Failed to load financial data:", err);
      setError(err.message || "An unexpected error occurred while fetching tracking data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Compute available FYs dynamically across all income & expense entries
  const availableFYs = useMemo(() => {
    const years = Array.from(new Set([
      ...data.income.map(i => getFinancialYear(i.date)),
      ...data.expenses.map(e => getFinancialYear(e.date))
    ])).filter(Boolean).sort();
    
    // Always ensure current FY is at least option
    const cur = getCurrentFinancialYear();
    if (!years.includes(cur)) {
      years.push(cur);
    }
    return years.sort();
  }, [data.income, data.expenses]);

  // Write handlers mapping to API routes
  const handleAddContractor = async (name: string, accountNumber: string, contactNumber: string) => {
    try {
      const res = await fetch("/api/contractors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, accountNumber, contactNumber })
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to create contractor");
      }
      await fetchAllData(true);
      return true;
    } catch (err: any) {
      alert(err.message);
      return false;
    }
  };

  const handleAddProject = async (code: string, name: string, contractorId: string) => {
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name, contractorId })
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to create project");
      }
      await fetchAllData(true);
      return true;
    } catch (err: any) {
      alert(err.message);
      return false;
    }
  };

  const handleAddIncome = async (
    date: string,
    contractorId: string,
    projectCode: string,
    description: string,
    amount: number,
    currency: string,
    creditReceived: number
  ) => {
    try {
      const res = await fetch("/api/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, contractorId, projectCode, description, amount, currency, creditReceived })
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to record income entry");
      }
      await fetchAllData(true);
      return true;
    } catch (err: any) {
      alert(err.message);
      return false;
    }
  };

  const handleAddExpense = async (
    date: string,
    contractorId: string,
    projectCode: string,
    vendor: string,
    description: string,
    amount: number,
    currency: string,
    creditPaid: number
  ) => {
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, contractorId, projectCode, vendor, description, amount, currency, creditPaid })
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to record expense entry");
      }
      await fetchAllData(true);
      return true;
    } catch (err: any) {
      alert(err.message);
      return false;
    }
  };

  const handleSaveSettings = async (googleSheetUrl: string) => {
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ googleSheetUrl })
      });
      if (!res.ok) throw new Error("Failed to save synchronization settings");
      await fetchAllData(true);
      return true;
    } catch (err: any) {
      alert(err.message);
      return false;
    }
  };

  const handleResetData = async () => {
    try {
      const res = await fetch("/api/reset", { method: "POST" });
      if (res.ok) {
        await fetchAllData(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // List of active contractors from database to construct dynamic tabs
  const activeContractors = useMemo(() => {
    return data.contractors.filter(c => c.status === "Active" || !c.status);
  }, [data.contractors]);

  // Construct top navigation tabs structure:
  // Tab 1: Dashboard
  // Tab 2: All Expenses
  // Dynamic Contractor Tabs...
  // Tab: Add Data (Second to last, fixed)
  // Tab: PDF Export (Always last, fixed)
  const navigationTabs = useMemo(() => {
    const list = [
      { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4 mr-1.5" /> },
      { id: "all-expenses", label: "All Expenses", icon: <SlidersHorizontal className="w-4 h-4 mr-1.5" /> }
    ];

    activeContractors.forEach(c => {
      list.push({
        id: `contractor-${c.id}`,
        label: c.name,
        icon: <FileSpreadsheet className="w-4 h-4 mr-1.5 text-blue-500" />
      });
    });

    list.push({ id: "add-data", label: "Add Data", icon: <PlusCircle className="w-4 h-4 mr-1.5 text-emerald-500" /> });
    list.push({ id: "pdf-export", label: "PDF Export", icon: <Printer className="w-4 h-4 mr-1.5 text-blue-600" /> });

    return list;
  }, [activeContractors]);

  // Main UI render
  return (
    <div className="min-h-screen bg-gray-50/50 text-gray-800 font-sans antialiased flex flex-col">
      {/* Top Professional Banner */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold shadow-sm">
              TD
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-gray-900 tracking-tight uppercase leading-none">
                Thulir Design and QS Services
              </h1>
              <p className="text-[10px] text-gray-500 font-bold tracking-wide uppercase mt-1">
                Financial Tracking Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Google Sheets Live Sync Indicator & Config Button */}
            <button
              onClick={() => setShowSettingsModal(true)}
              className={`inline-flex items-center space-x-1.5 border px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer focus:outline-none ${
                data.synced 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/60" 
                  : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/60"
              }`}
            >
              <SettingsIcon className="w-3.5 h-3.5 animate-spin-hover" />
              <span>{data.synced ? "Sheets Connected" : "Link Sheets"}</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => fetchAllData(true)}
              disabled={refreshing}
              title="Refresh tracking data from sheet backend"
              className="p-2 bg-gray-50 hover:bg-gray-100 disabled:opacity-60 text-gray-600 rounded-lg border border-gray-200 transition-colors cursor-pointer focus:outline-none"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Tab bar (Top Navigation Bar, horizontally scrollable on mobile) */}
      <nav className="bg-white border-b border-gray-100 px-6 py-1 sticky top-[69px] z-20 shadow-3xs overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center space-x-2 whitespace-nowrap min-w-max">
          {navigationTabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-3 outline-none cursor-pointer ${
                  isActive 
                    ? "border-[#1a73e8] text-[#1a73e8]" 
                    : "border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content Body */}
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="relative">
                <div className="w-10 h-10 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest animate-pulse">
                Loading Financial Records...
              </p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center max-w-xl mx-auto space-y-3">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
              <h3 className="font-bold text-red-800 text-sm uppercase tracking-wider">Database Connection Failed</h3>
              <p className="text-xs text-red-700 leading-relaxed font-medium">{error}</p>
              <button
                onClick={() => fetchAllData()}
                className="mt-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors focus:outline-none"
              >
                Retry Request
              </button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
              >
                {/* Dashboard Tab */}
                {activeTab === "dashboard" && (
                  <Dashboard
                    contractors={data.contractors}
                    income={data.income}
                    expenses={data.expenses}
                    selectedFY={selectedFY}
                    onChangeFY={setSelectedFY}
                    availableFYs={availableFYs}
                  />
                )}

                {/* All Expenses Tab */}
                {activeTab === "all-expenses" && (
                  <AllExpenses
                    contractors={data.contractors}
                    projects={data.projects}
                    expenses={data.expenses}
                  />
                )}

                {/* Dynamic Contractor Tabs */}
                {activeTab.startsWith("contractor-") && (() => {
                  const cId = activeTab.replace("contractor-", "");
                  const currentC = data.contractors.find(c => c.id === cId);
                  if (!currentC) return <div className="text-xs text-gray-400">Contractor not found.</div>;
                  return (
                    <ContractorTab
                      contractor={currentC}
                      projects={data.projects}
                      income={data.income}
                      expenses={data.expenses}
                      availableFYs={availableFYs}
                      selectedFY={selectedFY}
                    />
                  );
                })()}

                {/* Add Data Tab */}
                {activeTab === "add-data" && (
                  <AddData
                    contractors={data.contractors}
                    projects={data.projects}
                    onAddContractor={handleAddContractor}
                    onAddProject={handleAddProject}
                    onAddIncome={handleAddIncome}
                    onAddExpense={handleAddExpense}
                    onResetData={handleResetData}
                  />
                )}

                {/* PDF Export Tab */}
                {activeTab === "pdf-export" && (
                  <PdfExport
                    contractors={data.contractors}
                    projects={data.projects}
                    income={data.income}
                    expenses={data.expenses}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* Google Sheets Setup live overlay modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-blue-500" />
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                    Google Sheets Backend Configuration
                  </h3>
                </div>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <GasIntegration
                  settings={data.settings}
                  onSaveSettings={handleSaveSettings}
                  source={data.source}
                  synced={data.synced}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-6 px-6 text-center text-xs text-gray-400 font-medium">
        <div className="max-w-7xl mx-auto">
          Thulir Design and QS Services &copy; 2026. All rights reserved. &bull; Standard Financial Compliance Statement System
        </div>
      </footer>
    </div>
  );
}
