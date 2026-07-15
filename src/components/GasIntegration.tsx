import React, { useState } from "react";
import { Settings } from "../types";
import { Link2, Copy, Check, Info, Settings as SettingsIcon, AlertCircle } from "lucide-react";

interface GasIntegrationProps {
  settings: Settings;
  onSaveSettings: (url: string) => Promise<boolean>;
  source?: string;
  synced?: boolean;
}

export default function GasIntegration({ settings, onSaveSettings, source, synced }: GasIntegrationProps) {
  const [googleSheetUrl, setGoogleSheetUrl] = useState(settings.googleSheetUrl || "");
  const [saveLoading, setSaveLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Copy Google Apps Script Code.gs code block
  const scriptCode = `/**
 * Thulir Design and QS Services (TDQS) Financial Tracker
 * Google Sheets API/Web App Script (Code.gs)
 * 
 * Set up instructions:
 * 1. Open Google Sheet "TDQS Financial Tracker"
 * 2. Click Extensions > Apps Script
 * 3. Delete any default code, paste this script and click Save (disk icon)
 * 4. Click "Deploy" > "New deployment" > Select type "Web app"
 * 5. Configure: Execute as: "Me", Who has access: "Anyone"
 * 6. Click Deploy, copy Web App URL, and paste it below!
 */

function doGet(e) {
  var action = e.parameter.action;
  if (action === "getData") {
    return handleGetData();
  }
  return ContentService.createTextOutput(JSON.stringify({ error: "Invalid action" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action;
    var data = postData.data;
    
    if (action === "addContractor") {
      return handleAddContractor(data);
    } else if (action === "addProject") {
      return handleAddProject(data);
    } else if (action === "addIncome") {
      return handleAddIncome(data);
    } else if (action === "addExpense") {
      return handleAddExpense(data);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ error: "Invalid action" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleGetData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var contractors = getSheetDataAsObjects(ss.getSheetByName("Contractors"));
  var projects = getSheetDataAsObjects(ss.getSheetByName("Projects"));
  var income = getSheetDataAsObjects(ss.getSheetByName("Income"));
  var expenses = getSheetDataAsObjects(ss.getSheetByName("Expenses"));
  
  return ContentService.createTextOutput(JSON.stringify({
    contractors: contractors,
    projects: projects,
    income: income,
    expenses: expenses
  })).setMimeType(ContentService.MimeType.JSON);
}

function getSheetDataAsObjects(sheet) {
  if (!sheet) return [];
  var range = sheet.getDataRange();
  var values = range.getValues();
  if (values.length <= 1) return [];
  
  var headers = values[0].map(function(h) {
    return toCamelCase(h.toString().trim());
  });
  
  var objects = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var obj = {};
    var hasData = false;
    for (var j = 0; j < headers.length; j++) {
      var header = headers[j];
      if (header) {
        var cellVal = row[j];
        if (cellVal instanceof Date) {
          cellVal = formatDateString(cellVal);
        }
        obj[header] = cellVal;
        if (cellVal !== "" && cellVal !== null && cellVal !== undefined) {
          hasData = true;
        }
      }
    }
    if (hasData) objects.push(obj);
  }
  return objects;
}

function handleAddContractor(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Contractors") || ss.insertSheet("Contractors");
  sheet.appendRow([data.id, data.name, data.accountNumber || "", data.contactNumber || "", data.status || "Active"]);
  return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
}

function handleAddProject(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Projects") || ss.insertSheet("Projects");
  sheet.appendRow([data.code, data.name, data.contractorId, data.status || "Active"]);
  return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
}

function handleAddIncome(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Income") || ss.insertSheet("Income");
  sheet.appendRow([data.date, data.contractorId, data.projectCode, data.description, Number(data.amount), data.currency || "AED", data.creditReceived || ""]);
  return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
}

function handleAddExpense(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Expenses") || ss.insertSheet("Expenses");
  sheet.appendRow([data.date, data.contractorId, data.projectCode, data.vendor, data.description, Number(data.amount), data.currency || "AED", data.creditPaid || ""]);
  return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
}

function toCamelCase(str) {
  if (str === "Contractor ID") return "contractorId";
  if (str === "Project Code") return "projectCode";
  if (str === "Credit Received") return "creditReceived";
  if (str === "Credit Paid") return "creditPaid";
  return str.replace(/(?:^\\w|[A-Z]|\\b\\w)/g, function(word, index) {
    return index === 0 ? word.toLowerCase() : word.toUpperCase();
  }).replace(/\\s+/g, '');
}

function formatDateString(date) {
  var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return (date.getDate() < 10 ? '0' : '') + date.getDate() + ' ' + months[date.getMonth()] + ' ' + date.getFullYear();
}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setStatusMessage(null);
    try {
      const success = await onSaveSettings(googleSheetUrl.trim());
      if (success) {
        setStatusMessage("Settings saved successfully! Ready to sync.");
      } else {
        setStatusMessage("Failed to save settings. Please verify the URL.");
      }
    } catch (err: any) {
      setStatusMessage(err.message || "An error occurred.");
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Current Connection Status */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-800">Connection Engine Status</h2>
          <p className="text-xs text-gray-500 mt-1">Configured backend database connection status and sync state.</p>
        </div>
        <div className="flex items-center space-x-3 self-start sm:self-auto text-xs font-semibold">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Active Engine</span>
            <span className="text-gray-800 font-bold mt-0.5">{source || "Local Sandbox"}</span>
          </div>
          <div className="border-l border-gray-100 h-8 pl-3 flex flex-col items-start">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Sync State</span>
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase mt-0.5 ${synced ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>
              {synced ? "Synced Live" : "Local Sandbox Mode"}
            </span>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs">
        <div className="flex items-center space-x-2 pb-3 border-b border-gray-50 mb-4">
          <Link2 className="w-5 h-5 text-blue-500" />
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Configure Google Sheets Web App Connection</h3>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5" htmlFor="gas-url-input">
              Google Sheet Apps Script Web App URL
            </label>
            <input
              id="gas-url-input"
              type="url"
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              value={googleSheetUrl}
              onChange={(e) => setGoogleSheetUrl(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg p-3 font-medium focus:ring-1 focus:ring-blue-500 outline-none font-mono"
            />
            <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">
              * Paste your deployed Google Apps Script URL here. When entered, our server-side API automatically proxies all read and write requests directly to/from your physical spreadsheet in real-time, with 100% data integrity!
            </p>
          </div>

          {statusMessage && (
            <div className={`p-3 rounded-lg text-xs font-bold border flex items-center ${
              statusMessage.includes("success") 
                ? "bg-emerald-50 text-emerald-800 border-emerald-100" 
                : "bg-red-50 text-red-800 border-red-100"
            }`}>
              <Info className="w-4 h-4 mr-2" />
              <span>{statusMessage}</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saveLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold px-5 py-2 rounded-lg transition-colors cursor-pointer uppercase tracking-wider focus:outline-none shadow-xs"
            >
              {saveLoading ? "Saving Settings..." : "Save Connection Details"}
            </button>
          </div>
        </form>
      </div>

      {/* Guide & Source Code */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Setup Instructions */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs lg:col-span-1 space-y-4">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-50 pb-2 flex items-center">
            <SettingsIcon className="w-4 h-4 mr-1.5 text-blue-500" />
            Quick Setup Steps
          </h3>

          <ol className="list-decimal pl-4 text-xs text-gray-600 space-y-3 font-medium leading-relaxed">
            <li>
              Create a new <strong>Google Sheet</strong> called <code>TDQS Financial Tracker</code>.
            </li>
            <li>
              Add 4 tabs named exactly: <code>Contractors</code>, <code>Projects</code>, <code>Income</code>, <code>Expenses</code>.
            </li>
            <li>
              Set the exact column headers as shown in Row 1 of your sheet layout specifications.
            </li>
            <li>
              Open <strong>Extensions &gt; Apps Script</strong> in your spreadsheet.
            </li>
            <li>
              Copy the <code>Code.gs</code> code block on the right, paste it into the script editor, and click <strong>Save</strong>.
            </li>
            <li>
              Click <strong>Deploy &gt; New deployment</strong>. Select <strong>Web app</strong>.
            </li>
            <li>
              Configure: <br />
              &bull; <em>Execute as:</em> <strong>Me</strong><br />
              &bull; <em>Who has access:</em> <strong>Anyone</strong>
            </li>
            <li>
              Click <strong>Deploy</strong>, authorize the Google permissions, copy the generated Web App URL and paste it in the form above!
            </li>
          </ol>
        </div>

        {/* Apps Script Code */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs lg:col-span-2 flex flex-col space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-50">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Google Apps Script Source (Code.gs)
            </h3>
            <button
              onClick={copyToClipboard}
              className="inline-flex items-center space-x-1 bg-gray-50 hover:bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded border border-gray-200 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-auto max-h-[360px] border border-gray-100 rounded-lg">
            <pre className="p-3 text-[10px] font-mono text-gray-600 bg-gray-50/50 leading-relaxed whitespace-pre select-all">
              {scriptCode}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
