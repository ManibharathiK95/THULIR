import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";

// Local database path
const DB_PATH = path.join(process.cwd(), "db.json");

// Default sample data structure to fall back to
const DEFAULT_DATA = {
  contractors: [
    { id: "C001", name: "Al Ghanim International", accountNumber: "AE82 0260 0010 1561 6092 501", contactNumber: "+971 55 667 6720", status: "Active" },
    { id: "C002", name: "DNB Construction", accountNumber: "AE82 0260 0010 1561 6092 501", contactNumber: "+971 55 667 6720", status: "Active" },
    { id: "C003", name: "Naresco International", accountNumber: "AE82 0260 0010 1561 6092 501", contactNumber: "+971 55 667 6720", status: "Active" }
  ],
  projects: [
    { code: "R1089", name: "Development of Cycle Track", contractorId: "C001", status: "Active" },
    { code: "PR-D8839", name: "JAFZA DP WORLD Bridge 01", contractorId: "C001", status: "Active" },
    { code: "PJ060", name: "Dubai South Residential", contractorId: "C002", status: "Active" },
    { code: "PJ061", name: "JVT04KMRA008", contractorId: "C002", status: "Active" },
    { code: "PJ067", name: "Proposed Residential Building DIP", contractorId: "C002", status: "Active" },
    { code: "IND 1 & 2", name: "Indigo 1 & 2", contractorId: "C003", status: "Active" },
    { code: "25hours", name: "25hours Heimat", contractorId: "C003", status: "Active" },
    { code: "Rixos", name: "Rixos Financial Center Road", contractorId: "C003", status: "Active" }
  ],
  income: [
    { date: "09 Oct 2025", contractorId: "C001", projectCode: "R1089", description: "TDQS/INV/2025-10/001", amount: 24167, currency: "AED", creditReceived: 24167 },
    { date: "28 Nov 2025", contractorId: "C001", projectCode: "R1089", description: "Account Transfer towards Invoice 1", amount: 9667, currency: "AED", creditReceived: 14500 },
    { date: "14 Feb 2026", contractorId: "C001", projectCode: "R1089", description: "TDQS/INV/2026-01/001", amount: 7250, currency: "AED", creditReceived: 7250 },
    { date: "10 Apr 2026", contractorId: "C001", projectCode: "R1089", description: "Account Transfer towards Invoice 2", amount: 7250, currency: "AED", creditReceived: 0 },
    { date: "08 Jun 2026", contractorId: "C001", projectCode: "PR-D8839", description: "TDQS-INV-2606-ALG_001", amount: 18500, currency: "AED", creditReceived: 18500 },
    { date: "21 Jun 2026", contractorId: "C001", projectCode: "PR-D8839", description: "TDQS-INV-2606-ALG_002", amount: 15000, currency: "AED", creditReceived: 33500 },
    { date: "21 Jun 2026", contractorId: "C001", projectCode: "PR-D8839", description: "TDQS-INV-2606-ALG_003", amount: 450, "currency": "AED", creditReceived: 33950 },
    { date: "06 Jul 2026", contractorId: "C001", projectCode: "R1089", description: "TDQS-INV-2607-ALG_001", amount: 1650, "currency": "AED", creditReceived: 35600 },
    { date: "10 Jul 2026", contractorId: "C001", projectCode: "PR-D8839", description: "Cheque towards 2606-ALG_001", amount: 18500, "currency": "AED", creditReceived: 17100 },
    { date: "09 Dec 2025", contractorId: "C002", projectCode: "PJ060", description: "TDQS/INV/2025-12-001", amount: 6494, "currency": "AED", creditReceived: 0 },
    { date: "13 Jan 2026", contractorId: "C002", projectCode: "PJ060", description: "Cash Payment", amount: 6494, "currency": "AED", creditReceived: 6494 },
    { date: "04 Mar 2026", contractorId: "C002", projectCode: "PJ061", description: "TDQS/INV/DNB002", amount: 1549, "currency": "AED", creditReceived: 1549 },
    { date: "10 Mar 2026", contractorId: "C002", projectCode: "PJ060", description: "TDQS/INV/DNB003", amount: 2307, "currency": "AED", creditReceived: 2307 },
    { date: "30 Mar 2026", contractorId: "C002", projectCode: "PJ061", description: "TDQS/INV/DNB004", amount: 874, "currency": "AED", creditReceived: 870 },
    { date: "10 Apr 2026", contractorId: "C002", projectCode: "PJ060", description: "TDQS/INV/DNB005", amount: 1384, "currency": "AED", creditReceived: 1384 },
    { date: "08 Jun 2026", contractorId: "C002", projectCode: "PJ067", description: "TDQS-INV-2606-DNB_001", amount: 1532.74, "currency": "AED", creditReceived: 1532.74 },
    { "date": "06 Jul 2026", "contractorId": "C002", "projectCode": "PJ061", "description": "TDQS-INV-2607-DNB_001", "amount": 1423, "currency": "AED", "creditReceived": 1423 },
    { "date": "06 Jul 2026", "contractorId": "C002", "projectCode": "PJ061", "description": "TDQS-INV-2607-DNB_001", "amount": 854, "currency": "AED", "creditReceived": 854 },
    { "date": "30 Apr 2026", "contractorId": "C003", "projectCode": "IND 1 & 2", "description": "TDQS-INV-2604-NAS_001", "amount": 6300, "currency": "AED", "creditReceived": 6300 },
    { "date": "20 May 2026", "contractorId": "C003", "projectCode": "IND 1 & 2", "description": "TDQS-INV-2605-NAS_002", "amount": 3600, "currency": "AED", "creditReceived": 3600 },
    { "date": "03 Jul 2026", "contractorId": "C003", "projectCode": "25hours", "description": "TDQS-INV-2607-NAS_002", "amount": 2970, "currency": "AED", "creditReceived": 2970 },
    { "date": "03 Jul 2026", "contractorId": "C003", "projectCode": "Rixos", "description": "TDQS-INV-2607-NAS_001", "amount": 6210, "currency": "AED", "creditReceived": 0 }
  ],
  "expenses": [
    { "date": "17 Dec 2025", "contractorId": "C001", "projectCode": "R1089", "vendor": "Influx", "description": "Account Transfer towards Invoice 1", "amount": 13475, "currency": "AED", "creditPaid": 13475 },
    { "date": "30 Mar 2026", "contractorId": "C001", "projectCode": "R1089", "vendor": "Influx", "description": "Account Transfer towards Invoice 2", "amount": 4675, "currency": "AED", "creditPaid": 2500 },
    { "date": "30 Mar 2026", "contractorId": "C001", "projectCode": "R1089", "vendor": "Influx", "description": "Account Transfer towards Invoice 2", "amount": 2175, "currency": "AED", "creditPaid": 345 },
    { "date": "08 Jun 2026", "contractorId": "C001", "projectCode": "PR-D8839", "vendor": "Irumam", "description": "TDQS-INV-2606-ALG_001", "amount": 9225, "currency": "AED", "creditPaid": 0 },
    { "date": "21 Jun 2026", "contractorId": "C001", "projectCode": "PR-D8839", "vendor": "Irumam", "description": "TDQS-INV-2606-ALG_002", "amount": 11025, "currency": "AED", "creditPaid": 0 },
    { "date": "10 Jul 2026", "contractorId": "C001", "projectCode": "R1089", "vendor": "Influx", "description": "TDQS-INV-2607-ALG_001", "amount": 825, "currency": "AED", "creditPaid": 0 },
    { "date": "16 Jan 2026", "contractorId": "C002", "projectCode": "PJ060", "vendor": "Influx", "description": "Account Transfer towards Invoice 1", "amount": 5845, "currency": "AED", "creditPaid": 5845 },
    { "date": "30 Mar 2026", "contractorId": "C002", "projectCode": "PJ060", "vendor": "Influx", "description": "Account Transfer towards Invoice 3", "amount": 2076, "currency": "AED", "creditPaid": 2076 },
    { "date": "30 Mar 2026", "contractorId": "C002", "projectCode": "PJ061", "vendor": "Abdul", "description": "Account Transfer towards Invoice 2", "amount": 930, "currency": "AED", "creditPaid": 930 },
    { "date": "30 Mar 2026", "contractorId": "C002", "projectCode": "PJ061", "vendor": "Abdul", "description": "Account Transfer towards Invoice 4", "amount": 524, "currency": "AED", "creditPaid": 180 },
    { "date": "10 Apr 2026", "contractorId": "C002", "projectCode": "PJ060", "vendor": "Influx", "description": "Account Transfer towards Invoice 5", "amount": 1246, "currency": "AED", "creditPaid": 1246 },
    { "date": "08 Jun 2026", "contractorId": "C002", "projectCode": "PJ067", "vendor": "HARI", "description": "TDQS-INV-2606-DNB_001", "amount": 802.70, "currency": "AED", "creditPaid": 802.70 },
    { "date": "30 Apr 2026", "contractorId": "C003", "projectCode": "IND 1 & 2", "vendor": "Hari & Friends", "description": "TDQS-INV-2604-NAS_001", "amount": 5600, "currency": "AED", "creditPaid": 5600 },
    { "date": "20 May 2026", "contractorId": "C003", "projectCode": "IND 1 & 2", "vendor": "Hari & Friends", "description": "TDQS-INV-2605-NAS_002", "amount": 3200, "currency": "AED", "creditPaid": 3200 },
    { "date": "03 Jul 2026", "contractorId": "C003", "projectCode": "25hours", "vendor": "Puvi Rebar", "description": "TDQS-INV-2607-NAS_002", "amount": 2129, "currency": "AED", "creditPaid": 2129 },
    { "date": "03 Jul 2026", "contractorId": "C003", "projectCode": "Rixos", "vendor": "Puvi Rebar", "description": "TDQS-INV-2607-NAS_001", "amount": 1018, "currency": "AED", "creditPaid": 1018 }
  ],
  "settings": {
    "googleSheetUrl": ""
  }
};

// Helper to read database
async function readDb() {
  try {
    const dataStr = await fs.readFile(DB_PATH, "utf8");
    const db = JSON.parse(dataStr);
    let updated = false;
    if (db.income) {
      db.income = db.income.map((item: any, idx: number) => {
        if (!item.id) {
          item.id = `INC-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`;
          updated = true;
        }
        if (!item.paymentMethod) {
          item.paymentMethod = "Cash";
          updated = true;
        }
        if (!item.entryType) {
          item.entryType = "Invoice";
          updated = true;
        }
        return item;
      });
    }
    if (db.expenses) {
      db.expenses = db.expenses.map((item: any, idx: number) => {
        if (!item.id) {
          item.id = `EXP-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`;
          updated = true;
        }
        if (!item.paymentMethod) {
          item.paymentMethod = "Cash";
          updated = true;
        }
        if (!item.entryType) {
          item.entryType = "Invoice";
          updated = true;
        }
        return item;
      });
    }
    if (db.contractors) {
      db.contractors = db.contractors.map((c: any) => {
        if (c.openingBalance === undefined) {
          c.openingBalance = 0;
          updated = true;
        }
        return c;
      });
    }
    if (updated) {
      await writeDb(db);
    }
    return db;
  } catch (error) {
    // If file doesn't exist, write default data and return it
    const db = JSON.parse(JSON.stringify(DEFAULT_DATA));
    db.income = db.income.map((item: any, idx: number) => ({
      id: `INC-${idx + 1}`,
      paymentMethod: "Cash",
      entryType: "Invoice",
      ...item
    }));
    db.expenses = db.expenses.map((item: any, idx: number) => ({
      id: `EXP-${idx + 1}`,
      paymentMethod: "Cash",
      entryType: "Invoice",
      ...item
    }));
    db.contractors = db.contractors.map((c: any) => ({
      openingBalance: 0,
      ...c
    }));
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
    return db;
  }
}

// Helper to write database
async function writeDb(data: any) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), "utf8");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Get all financial tracking data
  app.get("/api/data", async (req, res) => {
    try {
      const db = await readDb();

      // Check if there's a system environment variable for google sheets first
      const sheetUrl = process.env.GOOGLE_SHEET_WEB_APP_URL || db.settings?.googleSheetUrl || "";

      if (sheetUrl && sheetUrl.startsWith("http")) {
        console.log(`Forwarding request to Google Sheet Web App: ${sheetUrl}`);
        try {
          // Attempt to fetch from the Google Web App
          const response = await fetch(`${sheetUrl}?action=getData`);
          if (response.ok) {
            const sheetData = await response.json();
            if (sheetData && sheetData.contractors) {
              // Update local db as cache
              db.contractors = sheetData.contractors;
              db.projects = sheetData.projects || [];
              db.income = sheetData.income || [];
              db.expenses = sheetData.expenses || [];
              await writeDb(db);
              return res.json({ ...db, source: "Google Sheets", synced: true });
            }
          }
        } catch (err: any) {
          console.error("Failed to fetch from Google Sheet web app, serving cached local data:", err.message);
        }
      }

      res.json({ ...db, source: "Local JSON Database", synced: false });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API Route: Reset database to sample data
  app.post("/api/reset", async (req, res) => {
    try {
      await writeDb(DEFAULT_DATA);
      res.json({ success: true, message: "Database reset to pre-populated sample data", data: DEFAULT_DATA });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API Route: Save settings (e.g. Google Sheets web app URL)
  app.post("/api/settings", async (req, res) => {
    try {
      const { googleSheetUrl } = req.body;
      const db = await readDb();
      db.settings = { googleSheetUrl: googleSheetUrl || "" };
      await writeDb(db);
      res.json({ success: true, settings: db.settings });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API Route: Add Contractor
  app.post("/api/contractors", async (req, res) => {
    try {
      const { name, accountNumber, contactNumber, openingBalance } = req.body;
      if (!name) return res.status(400).json({ error: "Contractor name is required" });

      const db = await readDb();
      // Generate next sequential contractor ID (e.g., C004)
      const activeContractors = db.contractors;
      const nextNum = activeContractors.length > 0 
        ? Math.max(...activeContractors.map((c: any) => parseInt(c.id.replace("C", "")) || 0)) + 1 
        : 1;
      const id = `C${nextNum.toString().padStart(3, "0")}`;

      const newContractor = {
        id,
        name,
        accountNumber: accountNumber || "",
        contactNumber: contactNumber || "",
        status: "Active",
        openingBalance: openingBalance !== undefined ? Number(openingBalance) : 0
      };

      db.contractors.push(newContractor);
      await writeDb(db);

      // Proxy to Google Sheets if configured
      const sheetUrl = process.env.GOOGLE_SHEET_WEB_APP_URL || db.settings?.googleSheetUrl || "";
      if (sheetUrl && sheetUrl.startsWith("http")) {
        try {
          await fetch(sheetUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "addContractor", data: newContractor })
          });
        } catch (e) {
          console.error("Error writing to remote sheet:", e);
        }
      }

      res.json({ success: true, contractor: newContractor });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API Route: Add Project
  app.post("/api/projects", async (req, res) => {
    try {
      const { code, name, contractorId } = req.body;
      if (!code || !name || !contractorId) {
        return res.status(400).json({ error: "Project Code, Name and Contractor ID are required" });
      }

      const db = await readDb();
      const newProject = {
        code,
        name,
        contractorId,
        status: "Active"
      };

      db.projects.push(newProject);
      await writeDb(db);

      // Proxy to Google Sheets if configured
      const sheetUrl = process.env.GOOGLE_SHEET_WEB_APP_URL || db.settings?.googleSheetUrl || "";
      if (sheetUrl && sheetUrl.startsWith("http")) {
        try {
          await fetch(sheetUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "addProject", data: newProject })
          });
        } catch (e) {
          console.error("Error writing to remote sheet:", e);
        }
      }

      res.json({ success: true, project: newProject });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API Route: Add Income Entry
  app.post("/api/income", async (req, res) => {
    try {
      const { date, contractorId, projectCode, description, amount, currency, creditReceived, paymentMethod, entryType } = req.body;
      if (!date || !projectCode || !description || amount === undefined) {
        return res.status(400).json({ error: "Date, Project Code, Description and Amount are required" });
      }

      const db = await readDb();
      const generatedId = `INC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newIncome = {
        id: generatedId,
        date,
        contractorId: contractorId || "",
        projectCode,
        description,
        amount: Number(amount),
        currency: currency || "AED",
        creditReceived: creditReceived !== undefined && creditReceived !== "" ? Number(creditReceived) : 0,
        paymentMethod: paymentMethod || "Cash",
        entryType: entryType || "Invoice"
      };

      db.income.push(newIncome);
      await writeDb(db);

      // Proxy to Google Sheets if configured
      const sheetUrl = process.env.GOOGLE_SHEET_WEB_APP_URL || db.settings?.googleSheetUrl || "";
      if (sheetUrl && sheetUrl.startsWith("http")) {
        try {
          await fetch(sheetUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "addIncome", data: newIncome })
          });
        } catch (e) {
          console.error("Error writing to remote sheet:", e);
        }
      }

      res.json({ success: true, income: newIncome });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API Route: Add Expense Entry
  app.post("/api/expenses", async (req, res) => {
    try {
      const { date, contractorId, projectCode, vendor, description, amount, currency, creditPaid, paymentMethod, entryType } = req.body;
      if (!date || !projectCode || !vendor || !description || amount === undefined) {
        return res.status(400).json({ error: "Date, Project Code, Vendor, Description and Amount are required" });
      }

      const db = await readDb();
      const generatedId = `EXP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newExpense = {
        id: generatedId,
        date,
        contractorId: contractorId || "",
        projectCode,
        vendor,
        description,
        amount: Number(amount),
        currency: currency || "AED",
        creditPaid: creditPaid !== undefined && creditPaid !== "" ? Number(creditPaid) : 0,
        paymentMethod: paymentMethod || "Cash",
        entryType: entryType || "Invoice"
      };

      db.expenses.push(newExpense);
      await writeDb(db);

      // Proxy to Google Sheets if configured
      const sheetUrl = process.env.GOOGLE_SHEET_WEB_APP_URL || db.settings?.googleSheetUrl || "";
      if (sheetUrl && sheetUrl.startsWith("http")) {
        try {
          await fetch(sheetUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "addExpense", data: newExpense })
          });
        } catch (e) {
          console.error("Error writing to remote sheet:", e);
        }
      }

      res.json({ success: true, expense: newExpense });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API Route: Edit Income Entry
  app.put("/api/income/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { date, contractorId, projectCode, description, amount, currency, creditReceived, paymentMethod, entryType } = req.body;
      
      const db = await readDb();
      const index = db.income.findIndex((item: any) => item.id === id);
      if (index === -1) {
        return res.status(404).json({ error: "Income entry not found" });
      }

      const updatedIncome = {
        ...db.income[index],
        date: date || db.income[index].date,
        contractorId: contractorId !== undefined ? contractorId : db.income[index].contractorId,
        projectCode: projectCode || db.income[index].projectCode,
        description: description || db.income[index].description,
        amount: amount !== undefined ? Number(amount) : db.income[index].amount,
        currency: currency || db.income[index].currency,
        creditReceived: creditReceived !== undefined ? Number(creditReceived) : db.income[index].creditReceived,
        paymentMethod: paymentMethod || db.income[index].paymentMethod || "Cash",
        entryType: entryType || db.income[index].entryType || "Invoice"
      };

      db.income[index] = updatedIncome;
      await writeDb(db);

      // Proxy to Google Sheets if configured
      const sheetUrl = process.env.GOOGLE_SHEET_WEB_APP_URL || db.settings?.googleSheetUrl || "";
      if (sheetUrl && sheetUrl.startsWith("http")) {
        try {
          await fetch(sheetUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "editIncome", data: updatedIncome })
          });
        } catch (e) {
          console.error("Error writing to remote sheet:", e);
        }
      }

      res.json({ success: true, income: updatedIncome });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API Route: Delete Income Entry
  app.delete("/api/income/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const db = await readDb();
      const index = db.income.findIndex((item: any) => item.id === id);
      if (index === -1) {
        return res.status(404).json({ error: "Income entry not found" });
      }

      db.income.splice(index, 1);
      await writeDb(db);

      // Proxy to Google Sheets if configured
      const sheetUrl = process.env.GOOGLE_SHEET_WEB_APP_URL || db.settings?.googleSheetUrl || "";
      if (sheetUrl && sheetUrl.startsWith("http")) {
        try {
          await fetch(sheetUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "deleteIncome", data: { id } })
          });
        } catch (e) {
          console.error("Error writing to remote sheet:", e);
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API Route: Edit Expense Entry
  app.put("/api/expenses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { date, contractorId, projectCode, vendor, description, amount, currency, creditPaid, paymentMethod, entryType } = req.body;
      
      const db = await readDb();
      const index = db.expenses.findIndex((item: any) => item.id === id);
      if (index === -1) {
        return res.status(404).json({ error: "Expense entry not found" });
      }

      const updatedExpense = {
        ...db.expenses[index],
        date: date || db.expenses[index].date,
        contractorId: contractorId !== undefined ? contractorId : db.expenses[index].contractorId,
        projectCode: projectCode || db.expenses[index].projectCode,
        vendor: vendor || db.expenses[index].vendor,
        description: description || db.expenses[index].description,
        amount: amount !== undefined ? Number(amount) : db.expenses[index].amount,
        currency: currency || db.expenses[index].currency,
        creditPaid: creditPaid !== undefined ? Number(creditPaid) : db.expenses[index].creditPaid,
        paymentMethod: paymentMethod || db.expenses[index].paymentMethod || "Cash",
        entryType: entryType || db.expenses[index].entryType || "Invoice"
      };

      db.expenses[index] = updatedExpense;
      await writeDb(db);

      // Proxy to Google Sheets if configured
      const sheetUrl = process.env.GOOGLE_SHEET_WEB_APP_URL || db.settings?.googleSheetUrl || "";
      if (sheetUrl && sheetUrl.startsWith("http")) {
        try {
          await fetch(sheetUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "editExpense", data: updatedExpense })
          });
        } catch (e) {
          console.error("Error writing to remote sheet:", e);
        }
      }

      res.json({ success: true, expense: updatedExpense });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API Route: Delete Expense Entry
  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const db = await readDb();
      const index = db.expenses.findIndex((item: any) => item.id === id);
      if (index === -1) {
        return res.status(404).json({ error: "Expense entry not found" });
      }

      db.expenses.splice(index, 1);
      await writeDb(db);

      // Proxy to Google Sheets if configured
      const sheetUrl = process.env.GOOGLE_SHEET_WEB_APP_URL || db.settings?.googleSheetUrl || "";
      if (sheetUrl && sheetUrl.startsWith("http")) {
        try {
          await fetch(sheetUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "deleteExpense", data: { id } })
          });
        } catch (e) {
          console.error("Error writing to remote sheet:", e);
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development vs static asset serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
