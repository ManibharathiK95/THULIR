import React, { useState, useMemo } from "react";
import { Contractor, Project, IncomeEntry, ExpenseEntry } from "../types";
import { parseDate, sortByDateAsc } from "../utils/date";
import { formatCurrency } from "../utils/currency";
import { FileText, Download, Calendar, ArrowRight, Printer } from "lucide-react";

interface PdfExportProps {
  contractors: Contractor[];
  projects: Project[];
  income: IncomeEntry[];
  expenses: ExpenseEntry[];
}

export default function PdfExport({ contractors, projects, income, expenses }: PdfExportProps) {
  const [selectedContractorId, setSelectedContractorId] = useState<string>("");
  const [selectedProjectCode, setSelectedProjectCode] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // Default contractor selection
  React.useEffect(() => {
    if (contractors.length > 0 && !selectedContractorId) {
      setSelectedContractorId(contractors[0].id);
    }
  }, [contractors, selectedContractorId]);

  // Projects filtered by selected contractor
  const filteredProjects = useMemo(() => {
    if (!selectedContractorId) return [];
    return projects.filter(p => p.contractorId === selectedContractorId);
  }, [projects, selectedContractorId]);

  // Selected contractor details
  const currentContractor = useMemo(() => {
    return contractors.find(c => c.id === selectedContractorId);
  }, [contractors, selectedContractorId]);

  // Map for easy project lookup
  const projectMap = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach(p => map.set(p.code, p.name));
    return map;
  }, [projects]);

  // Selected contractor's Income (filtered & sorted)
  const statementIncome = useMemo(() => {
    if (!selectedContractorId) return [];
    let list = income.filter(i => i.contractorId === selectedContractorId);
    
    if (selectedProjectCode !== "all") {
      list = list.filter(i => i.projectCode === selectedProjectCode);
    }
    if (fromDate) {
      const fTime = new Date(fromDate).getTime();
      list = list.filter(i => parseDate(i.date).getTime() >= fTime);
    }
    if (toDate) {
      const tTime = new Date(toDate).getTime();
      list = list.filter(i => parseDate(i.date).getTime() <= tTime);
    }

    // MANDATORY Date Order
    list = sortByDateAsc(list);

    // Compute Running Balance
    let running = 0;
    return list.map(item => {
      const amt = Number(item.amount) || 0;
      const rec = Number(item.creditReceived) || 0;
      running = running + amt - rec;
      return { ...item, runningBalance: running };
    });
  }, [income, selectedContractorId, selectedProjectCode, fromDate, toDate]);

  // Selected contractor's Expenses (filtered & sorted)
  const statementExpenses = useMemo(() => {
    if (!selectedContractorId) return [];
    let list = expenses.filter(e => e.contractorId === selectedContractorId);
    
    if (selectedProjectCode !== "all") {
      list = list.filter(e => e.projectCode === selectedProjectCode);
    }
    if (fromDate) {
      const fTime = new Date(fromDate).getTime();
      list = list.filter(e => parseDate(e.date).getTime() >= fTime);
    }
    if (toDate) {
      const tTime = new Date(toDate).getTime();
      list = list.filter(e => parseDate(e.date).getTime() <= tTime);
    }

    // MANDATORY Date Order
    list = sortByDateAsc(list);

    // Compute Running Balance
    let running = 0;
    return list.map(item => {
      const amt = Number(item.amount) || 0;
      const paid = Number(item.creditPaid) || 0;
      running = running + amt - paid;
      return { ...item, runningBalance: running };
    });
  }, [expenses, selectedContractorId, selectedProjectCode, fromDate, toDate]);

  // Grand totals
  const totalIncomeValue = statementIncome.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalIncomeReceived = statementIncome.reduce((sum, item) => sum + (Number(item.creditReceived) || 0), 0);
  const finalIncomeBal = statementIncome.length > 0 ? statementIncome[statementIncome.length - 1].runningBalance : 0;

  const totalExpenseValue = statementExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalExpensePaid = statementExpenses.reduce((sum, item) => sum + (Number(item.creditPaid) || 0), 0);
  const finalExpenseBal = statementExpenses.length > 0 ? statementExpenses[statementExpenses.length - 1].runningBalance : 0;

  // Function to open Print view and generate landscape PDF
  const triggerPrintStatement = () => {
    if (!currentContractor) return;

    const contractorNameUpper = currentContractor.name.toUpperCase();
    const acctNum = currentContractor.accountNumber || "N/A";
    const contactNo = currentContractor.contactNumber || "N/A";

    const incomeRowsHtml = statementIncome.map(i => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 6px; font-family: monospace; font-size: 10px;">${i.date}</td>
        <td style="border: 1px solid #ddd; padding: 6px; font-family: monospace; font-size: 10px;">${i.projectCode}</td>
        <td style="border: 1px solid #ddd; padding: 6px; font-size: 10px;">${projectMap.get(i.projectCode) || ""}</td>
        <td style="border: 1px solid #ddd; padding: 6px; font-size: 10px;">${i.description}</td>
        <td style="border: 1px solid #ddd; padding: 6px; font-size: 10px; text-align: right;">${formatCurrency(i.amount, i.currency)}</td>
        <td style="border: 1px solid #ddd; padding: 6px; font-size: 10px; text-align: right; color: #34a853;">${formatCurrency(i.creditReceived, i.currency)}</td>
        <td style="border: 1px solid #ddd; padding: 6px; font-family: monospace; font-size: 10px; text-align: right;">${formatCurrency(i.runningBalance, i.currency)}</td>
      </tr>
    `).join("");

    const expenseRowsHtml = statementExpenses.map(e => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 6px; font-family: monospace; font-size: 10px;">${e.date}</td>
        <td style="border: 1px solid #ddd; padding: 6px; font-size: 10px;">${e.vendor}</td>
        <td style="border: 1px solid #ddd; padding: 6px; font-family: monospace; font-size: 10px;">${e.projectCode}</td>
        <td style="border: 1px solid #ddd; padding: 6px; font-size: 10px;">${projectMap.get(e.projectCode) || ""}</td>
        <td style="border: 1px solid #ddd; padding: 6px; font-size: 10px;">${e.description}</td>
        <td style="border: 1px solid #ddd; padding: 6px; font-size: 10px; text-align: right;">${formatCurrency(e.amount, e.currency)}</td>
        <td style="border: 1px solid #ddd; padding: 6px; font-size: 10px; text-align: right; color: #ea4335;">${formatCurrency(e.creditPaid, e.currency)}</td>
        <td style="border: 1px solid #ddd; padding: 6px; font-family: monospace; font-size: 10px; text-align: right;">${formatCurrency(e.runningBalance, e.currency)}</td>
      </tr>
    `).join("");

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to generate and view the PDF.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Statement of Accounts - ${currentContractor.name}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .header {
            text-align: center;
            margin-bottom: 15px;
          }
          .header h1 {
            font-size: 16px;
            font-weight: bold;
            margin: 0 0 5px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .header p {
            font-size: 11px;
            color: #666;
            margin: 2px 0;
          }
          .container {
            display: flex;
            width: 100%;
            gap: 15px;
          }
          .column {
            flex: 1;
            width: 50%;
          }
          .section-title {
            font-size: 12px;
            font-weight: bold;
            margin: 0 0 8px 0;
            text-transform: uppercase;
            color: #1a73e8;
            border-bottom: 2px solid #e8f0fe;
            padding-bottom: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
          }
          th {
            background-color: #f1f3f4;
            border: 1px solid #ddd;
            padding: 6px;
            font-size: 9px;
            font-weight: bold;
            text-align: left;
            text-transform: uppercase;
          }
          td {
            border: 1px solid #ddd;
            padding: 5px;
            font-size: 9px;
          }
          .total-row {
            background-color: #e8f0fe;
            font-weight: bold;
          }
          .total-row td {
            font-weight: bold;
            border-top: 1.5px solid #1a73e8;
          }
          .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 9px;
            color: #888;
            border-top: 1px solid #eee;
            padding-top: 5px;
            font-weight: 500;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PROJECT STATEMENT OF ACCOUNTS (${contractorNameUpper})</h1>
          <p>Account Number: <strong>${acctNum}</strong> &nbsp;|&nbsp; Contact Number: <strong>${contactNo}</strong></p>
          <p>Statement Range: ${fromDate || "Start"} to ${toDate || "End"} ${selectedProjectCode !== "all" ? `&nbsp;|&nbsp; Project: ${selectedProjectCode}` : ""}</p>
        </div>

        <div class="container">
          <!-- Income Column -->
          <div class="column">
            <h2 class="section-title">Income / Invoices Raised</h2>
            <table>
              <thead>
                <tr>
                  <th style="width: 12%">Date</th>
                  <th style="width: 15%">Proj</th>
                  <th style="width: 15%">Name</th>
                  <th style="width: 23%">Desc</th>
                  <th style="text-align: right; width: 12%">Invoice</th>
                  <th style="text-align: right; width: 12%">Credit</th>
                  <th style="text-align: right; width: 11%">Balance</th>
                </tr>
              </thead>
              <tbody>
                ${incomeRowsHtml || '<tr><td colspan="7" style="text-align:center; color:#999; padding:20px;">No Income recorded</td></tr>'}
                ${incomeRowsHtml ? `
                <tr class="total-row">
                  <td colspan="3">TOTALS</td>
                  <td></td>
                  <td style="text-align: right;">${formatCurrency(totalIncomeValue, "AED")}</td>
                  <td style="text-align: right; color:#34a853;">${formatCurrency(totalIncomeReceived, "AED")}</td>
                  <td style="text-align: right;">${formatCurrency(finalIncomeBal, "AED")}</td>
                </tr>` : ""}
              </tbody>
            </table>
          </div>

          <!-- Expense Column -->
          <div class="column">
            <h2 class="section-title">Expenses / Payments Made</h2>
            <table>
              <thead>
                <tr>
                  <th style="width: 11%">Date</th>
                  <th style="width: 12%">Vendor</th>
                  <th style="width: 11%">Proj</th>
                  <th style="width: 12%">Name</th>
                  <th style="width: 20%">Desc</th>
                  <th style="text-align: right; width: 12%">Invoice</th>
                  <th style="text-align: right; width: 11%">Paid</th>
                  <th style="text-align: right; width: 11%">Balance</th>
                </tr>
              </thead>
              <tbody>
                ${expenseRowsHtml || '<tr><td colspan="8" style="text-align:center; color:#999; padding:20px;">No Expenses recorded</td></tr>'}
                ${expenseRowsHtml ? `
                <tr class="total-row">
                  <td colspan="5">TOTALS</td>
                  <td style="text-align: right;">${formatCurrency(totalExpenseValue, "AED")}</td>
                  <td style="text-align: right; color:#ea4335;">${formatCurrency(totalExpensePaid, "AED")}</td>
                  <td style="text-align: right;">${formatCurrency(finalExpenseBal, "AED")}</td>
                </tr>` : ""}
              </tbody>
            </table>
          </div>
        </div>

        <div class="footer">
          Thulir Design and QS Services &bull; Page 1 of 1 &bull; Generated on ${new Date().toLocaleDateString()}
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Configuration Form Card */}
      <div className="bg-white p-5 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.12)]">
        <div className="flex items-center space-x-2 pb-3 border-b border-gray-50 mb-4">
          <FileText className="w-5 h-5 text-blue-500" />
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Statement Generator</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Contractor Select */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider" htmlFor="pdf-contractor">
              1. Contractor
            </label>
            <select
              id="pdf-contractor"
              value={selectedContractorId}
              onChange={(e) => setSelectedContractorId(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 font-medium cursor-pointer"
            >
              {contractors.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.id})
                </option>
              ))}
            </select>
          </div>

          {/* Project Select */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider" htmlFor="pdf-project">
              2. Project
            </label>
            <select
              id="pdf-project"
              value={selectedProjectCode}
              onChange={(e) => setSelectedProjectCode(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 font-medium cursor-pointer"
            >
              <option value="all">All Projects</option>
              {filteredProjects.map(p => (
                <option key={p.code} value={p.code}>
                  {p.code} - {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* From Date */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider" htmlFor="pdf-from">
              3. Date From
            </label>
            <input
              id="pdf-from"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 font-medium cursor-pointer"
            />
          </div>

          {/* To Date */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider" htmlFor="pdf-to">
              4. Date To
            </label>
            <input
              id="pdf-to"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 font-medium cursor-pointer"
            />
          </div>
        </div>

        <div className="flex justify-end mt-5 pt-4 border-t border-gray-50">
          <button
            onClick={triggerPrintStatement}
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors cursor-pointer shadow-xs uppercase tracking-wider focus:outline-none"
          >
            <Printer className="w-4 h-4" />
            <span>Generate & Print PDF</span>
          </button>
        </div>
      </div>

      {/* Visual Live Preview Section */}
      {currentContractor && (
        <div className="bg-white p-6 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.12)] space-y-5 overflow-hidden">
          {/* Header Mockup */}
          <div className="text-center border-b border-gray-100 pb-4">
            <h3 className="text-base font-extrabold text-gray-900 uppercase tracking-wide">
              PROJECT STATEMENT OF ACCOUNTS ({currentContractor.name.toUpperCase()})
            </h3>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Account Number: <strong className="text-gray-700">{currentContractor.accountNumber || "N/A"}</strong> &nbsp;|&nbsp; 
              Contact Number: <strong className="text-gray-700">{currentContractor.contactNumber || "N/A"}</strong>
            </p>
            <p className="text-[10px] text-gray-400 font-semibold uppercase mt-0.5">
              Filters: {fromDate || "Start"} to {toDate || "End"} &bull; Project: {selectedProjectCode}
            </p>
          </div>

          {/* Side-by-Side Live Statement View */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Income Table */}
            <div>
              <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider border-b border-blue-50 pb-1 mb-2">
                Income / Invoices Raised
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="p-2">Date</th>
                      <th className="p-2">Proj</th>
                      <th className="p-2">Name</th>
                      <th className="p-2">Description</th>
                      <th className="p-2 text-right">Invoice</th>
                      <th className="p-2 text-right">Credit</th>
                      <th className="p-2 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {statementIncome.length > 0 ? (
                      statementIncome.map((i, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/30">
                          <td className="p-2 font-mono text-[10px]">{i.date}</td>
                          <td className="p-2 font-mono text-[10px]">{i.projectCode}</td>
                          <td className="p-2 text-[10px] text-gray-400 font-medium max-w-[80px] truncate">{projectMap.get(i.projectCode) || ""}</td>
                          <td className="p-2 text-gray-500 truncate max-w-[100px]" title={i.description}>{i.description}</td>
                          <td className="p-2 text-right">{formatCurrency(i.amount, i.currency)}</td>
                          <td className="p-2 text-right text-emerald-600">{formatCurrency(i.creditReceived, i.currency)}</td>
                          <td className="p-2 text-right font-semibold text-gray-700">{formatCurrency(i.runningBalance, i.currency)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-gray-400">No income records</td>
                      </tr>
                    )}
                    {statementIncome.length > 0 && (
                      <tr className="bg-blue-50/35 font-bold border-t border-blue-100">
                        <td colSpan={3} className="p-2">TOTALS</td>
                        <td className="p-2"></td>
                        <td className="p-2 text-right">{formatCurrency(totalIncomeValue, "AED")}</td>
                        <td className="p-2 text-right text-emerald-600">{formatCurrency(totalIncomeReceived, "AED")}</td>
                        <td className="p-2 text-right text-blue-700 font-mono font-bold">{formatCurrency(finalIncomeBal, "AED")}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Expense Table */}
            <div>
              <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider border-b border-red-50 pb-1 mb-2">
                Expenses / Payments Made
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="p-2">Date</th>
                      <th className="p-2">Vendor</th>
                      <th className="p-2">Proj</th>
                      <th className="p-2">Name</th>
                      <th className="p-2">Description</th>
                      <th className="p-2 text-right">Invoice</th>
                      <th className="p-2 text-right">Paid</th>
                      <th className="p-2 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {statementExpenses.length > 0 ? (
                      statementExpenses.map((e, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/30">
                          <td className="p-2 font-mono text-[10px]">{e.date}</td>
                          <td className="p-2 font-medium text-gray-700">{e.vendor}</td>
                          <td className="p-2 font-mono text-[10px]">{e.projectCode}</td>
                          <td className="p-2 text-[10px] text-gray-400 font-medium max-w-[80px] truncate">{projectMap.get(e.projectCode) || ""}</td>
                          <td className="p-2 text-gray-500 truncate max-w-[100px]" title={e.description}>{e.description}</td>
                          <td className="p-2 text-right">{formatCurrency(e.amount, e.currency)}</td>
                          <td className="p-2 text-right text-red-600">{formatCurrency(e.creditPaid, e.currency)}</td>
                          <td className="p-2 text-right font-semibold text-gray-700">{formatCurrency(e.runningBalance, e.currency)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-gray-400">No expense records</td>
                      </tr>
                    )}
                    {statementExpenses.length > 0 && (
                      <tr className="bg-blue-50/35 font-bold border-t border-blue-100">
                        <td colSpan={5} className="p-2">TOTALS</td>
                        <td className="p-2 text-right">{formatCurrency(totalExpenseValue, "AED")}</td>
                        <td className="p-2 text-right text-red-600">{formatCurrency(totalExpensePaid, "AED")}</td>
                        <td className="p-2 text-right text-blue-700 font-mono font-bold">{formatCurrency(finalExpenseBal, "AED")}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer Mockup */}
          <div className="text-center pt-3 border-t border-gray-100 text-[10px] text-gray-400 font-semibold tracking-wider">
            THULIR DESIGN AND QS SERVICES &bull; STATEMENT STATEMENT-PREVIEW &bull; A4 LANDSCAPE FORMAT
          </div>
        </div>
      )}
    </div>
  );
}
