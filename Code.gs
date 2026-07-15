/**
 * Thulir Design and QS Services (TDQS) Financial Tracker
 * Google Apps Script Backend (Code.gs)
 * 
 * Instructions:
 * 1. Create a Google Sheet.
 * 2. Open Extensions > Apps Script.
 * 3. Replace any code in Code.gs with this code, and click Save.
 * 4. In the same project, create an HTML file named exactly "Index" and paste the Index.html content into it.
 * 5. Click "Deploy" > "New deployment".
 * 6. Under "Select type", click the gear icon and choose "Web app".
 * 7. Set "Execute as" to "Me", and "Who has access" to "Anyone" (or "Anyone with Google account").
 * 8. Click Deploy, copy the Web App URL, and access the application!
 */

// Serve the Index.html page as a web app
function doGet(e) {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('TDQS Financial Tracker')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Fetch all financial tracker data across all 4 sheets
function getAllData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Initialize sheets with headers and sample data if they do not exist or are empty
  checkAndInitializeSheets(ss);
  
  var contractors = getSheetDataAsObjects(ss.getSheetByName("Contractors"));
  var projects = getSheetDataAsObjects(ss.getSheetByName("Projects"));
  var income = getSheetDataAsObjects(ss.getSheetByName("Income"));
  var expenses = getSheetDataAsObjects(ss.getSheetByName("Expenses"));
  
  return {
    contractors: contractors,
    projects: projects,
    income: income,
    expenses: expenses
  };
}

// Append a new row to a specific sheet
function appendRow(sheetName, data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      var headers = getHeadersForSheet(sheetName);
      sheet.appendRow(headers);
    }
    
    var rowData = convertObjectToRow(sheetName, data);
    sheet.appendRow(rowData);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

// Update an existing row in a specific sheet matched by ID / Code
function updateRow(sheetName, id, data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error("Sheet not found: " + sheetName);
    
    var range = sheet.getDataRange();
    var values = range.getValues();
    if (values.length <= 1) throw new Error("No data found to update");
    
    var idColIndex = getIdColumnIndex(sheetName);
    var foundRowIndex = -1;
    
    for (var i = 1; i < values.length; i++) {
      if (values[i][idColIndex].toString() === id.toString()) {
        foundRowIndex = i + 1; // 1-indexed for sheets
        break;
      }
    }
    
    if (foundRowIndex === -1) {
      throw new Error("Row with ID " + id + " not found in " + sheetName);
    }
    
    var rowData = convertObjectToRow(sheetName, data);
    var headers = values[0];
    
    // Set cell values individually to maintain formatting and correct column positions
    for (var j = 0; j < headers.length; j++) {
      sheet.getRange(foundRowIndex, j + 1).setValue(rowData[j]);
    }
    
    return { success: true };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

// Delete an existing row from a specific sheet matched by ID / Code
function deleteRow(sheetName, id) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error("Sheet not found: " + sheetName);
    
    var range = sheet.getDataRange();
    var values = range.getValues();
    if (values.length <= 1) throw new Error("No data found to delete");
    
    var idColIndex = getIdColumnIndex(sheetName);
    var foundRowIndex = -1;
    
    for (var i = 1; i < values.length; i++) {
      if (values[i][idColIndex].toString() === id.toString()) {
        foundRowIndex = i + 1; // 1-indexed for sheets
        break;
      }
    }
    
    if (foundRowIndex === -1) {
      throw new Error("Row with ID " + id + " not found in " + sheetName);
    }
    
    sheet.deleteRow(foundRowIndex);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

// Generate PDF invoice or statement directly from Google Sheet data using SpreadsheetApp
function generatePDF(options) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var tempSheetName = "Statement_Export_Temp";
    var oldTemp = ss.getSheetByName(tempSheetName);
    if (oldTemp) ss.deleteSheet(oldTemp);
    
    var tempSheet = ss.insertSheet(tempSheetName);
    
    // Set column widths
    tempSheet.setColumnWidth(1, 100); // Date
    tempSheet.setColumnWidth(2, 120); // Project
    tempSheet.setColumnWidth(3, 100); // Vendor
    tempSheet.setColumnWidth(4, 200); // Description
    tempSheet.setColumnWidth(5, 100); // Amount (AED)
    tempSheet.setColumnWidth(6, 100); // Amount (INR)
    tempSheet.setColumnWidth(7, 100); // Status
    
    // Title Block
    tempSheet.getRange("A1:G1").merge().setValue("THULIR DESIGN AND QS SERVICES (TDQS)")
      .setFontWeight("bold").setFontSize(16).setHorizontalAlignment("center").setBackground("#10b981").setFontColor("#ffffff");
    tempSheet.getRange("A2:G2").merge().setValue("FINANCIAL TRACKING STATEMENT")
      .setFontWeight("bold").setFontSize(12).setHorizontalAlignment("center").setFontColor("#374151");
    
    // Filter parameters info
    tempSheet.getRange("A4").setValue("Contractor ID:").setFontWeight("bold");
    tempSheet.getRange("B4").setValue(options.contractorId || "All Contractors");
    tempSheet.getRange("D4").setValue("Project Code:").setFontWeight("bold");
    tempSheet.getRange("E4").setValue(options.projectCode || "All Projects");
    
    tempSheet.getRange("A5").setValue("Export Date:").setFontWeight("bold");
    tempSheet.getRange("B5").setValue(Utilities.formatDate(new Date(), "GMT+4", "dd MMM yyyy"));
    
    // Setup Statement Table
    var startRow = 7;
    tempSheet.getRange(startRow, 1, 1, 7).setValues([[
      "Date", "Project Code", "Vendor / Party", "Description", "Amount (AED)", "Amount (INR)", "Status"
    ]]).setFontWeight("bold").setBackground("#374151").setFontColor("#ffffff").setHorizontalAlignment("center");
    
    // Gather all matching data
    var contractors = getSheetDataAsObjects(ss.getSheetByName("Contractors"));
    var income = getSheetDataAsObjects(ss.getSheetByName("Income"));
    var expenses = getSheetDataAsObjects(ss.getSheetByName("Expenses"));
    
    var filteredData = [];
    
    // Append matching Income (Invoices raised)
    income.forEach(function(item) {
      if (options.contractorId && item.contractorId !== options.contractorId) return;
      if (options.projectCode && item.projectCode !== options.projectCode) return;
      
      var isPending = (Number(item.amount) || 0) > (Number(item.creditReceived) || 0);
      filteredData.push({
        date: item.date,
        projectCode: item.projectCode,
        party: "TDQS (Income)",
        description: item.description,
        amountAED: item.currency === "AED" ? item.amount : 0,
        amountINR: item.currency === "INR" ? item.amount : 0,
        status: isPending ? "Pending" : "Fully Paid",
        type: "Income"
      });
    });
    
    // Append matching Expenses
    expenses.forEach(function(item) {
      if (options.contractorId && item.contractorId !== options.contractorId) return;
      if (options.projectCode && item.projectCode !== options.projectCode) return;
      
      var isPending = (Number(item.amount) || 0) > (Number(item.creditPaid) || 0);
      filteredData.push({
        date: item.date,
        projectCode: item.projectCode,
        party: item.vendor || "External Vendor",
        description: item.description,
        amountAED: item.currency === "AED" ? item.amount : 0,
        amountINR: item.currency === "INR" ? item.amount : 0,
        status: isPending ? "Pending" : "Settled",
        type: "Expense"
      });
    });
    
    // Sort combined data by date chronologically
    filteredData.sort(function(a, b) {
      return new Date(a.date) - new Date(b.date);
    });
    
    var currentRow = startRow + 1;
    var totalAED = 0;
    var totalINR = 0;
    
    filteredData.forEach(function(row) {
      tempSheet.getRange(currentRow, 1, 1, 7).setValues([[
        row.date,
        row.projectCode,
        row.party,
        row.description,
        row.amountAED || "-",
        row.amountINR || "-",
        row.status
      ]]);
      
      // Right align currency values
      tempSheet.getRange(currentRow, 5, 1, 2).setHorizontalAlignment("right");
      
      // Styling for pending states
      if (row.status === "Pending") {
        tempSheet.getRange(currentRow, 7).setFontColor("#dc2626").setFontWeight("bold");
      } else {
        tempSheet.getRange(currentRow, 7).setFontColor("#16a34a");
      }
      
      totalAED += Number(row.amountAED) || 0;
      totalINR += Number(row.amountINR) || 0;
      currentRow++;
    });
    
    // Summary Row
    tempSheet.getRange(currentRow, 1, 1, 4).merge().setValue("Total Cumulative Invoice Value").setFontWeight("bold").setHorizontalAlignment("right");
    tempSheet.getRange(currentRow, 5).setValue(totalAED).setFontWeight("bold").setHorizontalAlignment("right");
    tempSheet.getRange(currentRow, 6).setValue(totalINR).setFontWeight("bold").setHorizontalAlignment("right");
    tempSheet.getRange(currentRow, 1, 1, 7).setBackground("#f3f4f6");
    
    // Make cell borders clean and elegant
    var fullRange = tempSheet.getRange(startRow, 1, (currentRow - startRow) + 1, 7);
    fullRange.setBorder(true, true, true, true, true, true, "#e5e7eb", SpreadsheetApp.BorderStyle.SOLID);
    
    SpreadsheetApp.flush();
    
    // Create PDF Blob
    var pdfBlob = tempSheet.getAs('application/pdf');
    var base64Pdf = Utilities.base64Encode(pdfBlob.getBytes());
    
    // Delete temp sheet to keep active workbook pristine
    ss.deleteSheet(tempSheet);
    
    return {
      success: true,
      base64Data: base64Pdf,
      fileName: "TDQS_Statement_" + (options.contractorId || "All") + ".pdf"
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

// INTERNAL UTILITY FUNCTIONS
function getHeadersForSheet(sheetName) {
  if (sheetName === "Contractors") {
    return ["Contractor ID", "Contractor Name", "Account Number", "Contact Number", "Status", "Opening Balance"];
  } else if (sheetName === "Projects") {
    return ["Project Code", "Project Name", "Contractor ID", "Status"];
  } else if (sheetName === "Income") {
    return ["ID", "Date", "Contractor ID", "Project Code", "Description", "Amount", "Currency", "Credit Received", "Payment Method", "Entry Type"];
  } else if (sheetName === "Expenses") {
    return ["ID", "Date", "Contractor ID", "Project Code", "Vendor", "Description", "Amount", "Currency", "Credit Paid", "Payment Method", "Entry Type"];
  }
  return [];
}

function getIdColumnIndex(sheetName) {
  if (sheetName === "Contractors") return 0; // Contractor ID is column 1 (0-indexed)
  if (sheetName === "Projects") return 0; // Project Code is column 1 (0-indexed)
  return 0; // ID is column 1 (0-indexed) for Income and Expenses
}

function toCamelCase(str) {
  if (str === "Contractor ID") return "id";
  if (str === "Contractor Name") return "name";
  if (str === "Account Number") return "accountNumber";
  if (str === "Contact Number") return "contactNumber";
  if (str === "Status") return "status";
  if (str === "Opening Balance") return "openingBalance";
  
  if (str === "Project Code") return "code";
  if (str === "Project Name") return "name";
  
  if (str === "ID") return "id";
  if (str === "Date") return "date";
  if (str === "Description") return "description";
  if (str === "Amount") return "amount";
  if (str === "Currency") return "currency";
  if (str === "Credit Received") return "creditReceived";
  if (str === "Credit Paid") return "creditPaid";
  if (str === "Payment Method") return "paymentMethod";
  if (str === "Entry Type") return "entryType";
  if (str === "Vendor") return "vendor";
  
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
    return index === 0 ? word.toLowerCase() : word.toUpperCase();
  }).replace(/\s+/g, '');
}

function convertObjectToRow(sheetName, obj) {
  var headers = getHeadersForSheet(sheetName);
  var row = [];
  for (var i = 0; i < headers.length; i++) {
    var key = toCamelCase(headers[i]);
    var val = obj[key];
    if (val === undefined || val === null) {
      val = "";
    }
    row.push(val);
  }
  return row;
}

function getSheetDataAsObjects(sheet) {
  if (!sheet) return [];
  
  var range = sheet.getDataRange();
  var values = range.getValues();
  if (values.length <= 1) return []; // Header row only
  
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
    if (hasData) {
      objects.push(obj);
    }
  }
  return objects;
}

function formatDateString(date) {
  var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var day = date.getDate();
  var month = months[date.getMonth()];
  var year = date.getFullYear();
  return (day < 10 ? '0' : '') + day + ' ' + month + ' ' + year;
}

// Pre-populate with beautiful default data on initial setup of the spreadsheet
function checkAndInitializeSheets(ss) {
  var sheetsToInit = ["Contractors", "Projects", "Income", "Expenses"];
  sheetsToInit.forEach(function(name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(getHeadersForSheet(name));
      populateSampleData(sheet, name);
    } else if (sheet.getDataRange().getValues().length <= 1) {
      populateSampleData(sheet, name);
    }
  });
}

function populateSampleData(sheet, name) {
  var sampleContractors = [
    ["C001", "Al Ghanim International", "AE82 0260 0010 1561 6092 501", "+971 55 667 6720", "Active", 0],
    ["C002", "DNB Construction", "AE82 0260 0010 1561 6092 501", "+971 55 667 6720", "Active", 0],
    ["C003", "Naresco International", "AE82 0260 0010 1561 6092 501", "+971 55 667 6720", "Active", 0]
  ];
  
  var sampleProjects = [
    ["R1089", "Development of Cycle Track", "C001", "Active"],
    ["PR-D8839", "JAFZA DP WORLD Bridge 01", "C001", "Active"],
    ["PJ060", "Dubai South Residential", "C002", "Active"],
    ["PJ061", "JVT04KMRA008", "C002", "Active"],
    ["PJ067", "Proposed Residential Building DIP", "C002", "Active"],
    ["IND 1 & 2", "Indigo 1 & 2", "C003", "Active"],
    ["25hours", "25hours Heimat", "C003", "Active"],
    ["Rixos", "Rixos Financial Center Road", "C003", "Active"]
  ];
  
  var sampleIncome = [
    ["INC-1", "09 Oct 2025", "C001", "R1089", "TDQS/INV/2025-10/001", 24167, "AED", 24167, "Cash", "Invoice"],
    ["INC-2", "28 Nov 2025", "C001", "R1089", "Account Transfer towards Invoice 1", 9667, "AED", 14500, "Cash", "Invoice"],
    ["INC-3", "14 Feb 2026", "C001", "R1089", "TDQS/INV/2026-01/001", 7250, "AED", 7250, "Cash", "Invoice"],
    ["INC-4", "10 Apr 2026", "C001", "R1089", "Account Transfer towards Invoice 2", 7250, "AED", 0, "Cash", "Invoice"],
    ["INC-5", "08 Jun 2026", "C001", "PR-D8839", "TDQS-INV-2606-ALG_001", 18500, "AED", 18500, "Cash", "Invoice"],
    ["INC-6", "21 Jun 2026", "C001", "PR-D8839", "TDQS-INV-2606-ALG_002", 15000, "AED", 33500, "Cash", "Invoice"],
    ["INC-7", "21 Jun 2026", "C001", "PR-D8839", "TDQS-INV-2606-ALG_003", 450, "AED", 33950, "Cash", "Invoice"],
    ["INC-8", "06 Jul 2026", "C001", "R1089", "TDQS-INV-2607-ALG_001", 1650, "AED", 35600, "Cash", "Invoice"],
    ["INC-9", "10 Jul 2026", "C001", "PR-D8839", "Cheque towards 2606-ALG_001", 18500, "AED", 17100, "Cash", "Invoice"],
    ["INC-10", "09 Dec 2025", "C002", "PJ060", "TDQS/INV/2025-12-001", 6494, "AED", 0, "Cash", "Invoice"],
    ["INC-11", "13 Jan 2026", "C002", "PJ060", "Cash Payment", 6494, "AED", 6494, "Cash", "Invoice"],
    ["INC-12", "04 Mar 2026", "C002", "PJ061", "TDQS/INV/DNB002", 1549, "AED", 1549, "Cash", "Invoice"],
    ["INC-13", "10 Mar 2026", "C002", "PJ060", "TDQS/INV/DNB003", 2307, "AED", 2307, "Cash", "Invoice"],
    ["INC-14", "30 Mar 2026", "C002", "PJ061", "TDQS/INV/DNB004", 874, "AED", 870, "Cash", "Invoice"],
    ["INC-15", "10 Apr 2026", "C002", "PJ060", "TDQS/INV/DNB005", 1384, "AED", 1384, "Cash", "Invoice"],
    ["INC-16", "08 Jun 2026", "C002", "PJ067", "TDQS-INV-2606-DNB_001", 1532.74, "AED", 1532.74, "Cash", "Invoice"],
    ["INC-17", "06 Jul 2026", "C002", "PJ061", "TDQS-INV-2607-DNB_001", 1423, "AED", 1423, "Cash", "Invoice"],
    ["INC-18", "06 Jul 2026", "C002", "PJ061", "TDQS-INV-2607-DNB_001", 854, "AED", 854, "Cash", "Invoice"],
    ["INC-19", "30 Apr 2026", "C003", "IND 1 & 2", "TDQS-INV-2604-NAS_001", 6300, "AED", 6300, "Cash", "Invoice"],
    ["INC-20", "20 May 2026", "C003", "IND 1 & 2", "TDQS-INV-2605-NAS_002", 3600, "AED", 3600, "Cash", "Invoice"],
    ["INC-21", "03 Jul 2026", "C003", "25hours", "TDQS-INV-2607-NAS_002", 2970, "AED", 2970, "Cash", "Invoice"],
    ["INC-22", "03 Jul 2026", "C003", "Rixos", "TDQS-INV-2607-NAS_001", 6210, "AED", 0, "Cash", "Invoice"]
  ];
  
  var sampleExpenses = [
    ["EXP-1", "17 Dec 2025", "C001", "R1089", "Influx", "Account Transfer towards Invoice 1", 13475, "AED", 13475, "Cash", "Invoice"],
    ["EXP-2", "30 Mar 2026", "C001", "R1089", "Influx", "Account Transfer towards Invoice 2", 4675, "AED", 2500, "Cash", "Invoice"],
    ["EXP-3", "30 Mar 2026", "C001", "R1089", "Influx", "Account Transfer towards Invoice 2", 2175, "AED", 345, "Cash", "Invoice"],
    ["EXP-4", "08 Jun 2026", "C001", "PR-D8839", "Irumam", "TDQS-INV-2606-ALG_001", 9225, "AED", 0, "Cash", "Invoice"],
    ["EXP-5", "21 Jun 2026", "C001", "PR-D8839", "Irumam", "TDQS-INV-2606-ALG_002", 11025, "AED", 0, "Cash", "Invoice"],
    ["EXP-6", "10 Jul 2026", "C001", "R1089", "Influx", "TDQS-INV-2607-ALG_001", 825, "AED", 0, "Cash", "Invoice"],
    ["EXP-7", "16 Jan 2026", "C002", "PJ060", "Influx", "Account Transfer towards Invoice 1", 5845, "AED", 5845, "Cash", "Invoice"],
    ["EXP-8", "30 Mar 2026", "C002", "PJ060", "Influx", "Account Transfer towards Invoice 3", 2076, "AED", 2076, "Cash", "Invoice"],
    ["EXP-9", "30 Mar 2026", "C002", "PJ061", "Abdul", "Account Transfer towards Invoice 2", 930, "AED", 930, "Cash", "Invoice"],
    ["EXP-10", "30 Mar 2026", "C002", "PJ061", "Abdul", "Account Transfer towards Invoice 4", 524, "AED", 180, "Cash", "Invoice"],
    ["EXP-11", "10 Apr 2026", "C002", "PJ060", "Influx", "Account Transfer towards Invoice 5", 1246, "AED", 1246, "Cash", "Invoice"],
    ["EXP-12", "08 Jun 2026", "C002", "PJ067", "HARI", "TDQS-INV-2606-DNB_001", 802.7, "AED", 802.7, "Cash", "Invoice"],
    ["EXP-13", "30 Apr 2026", "C003", "IND 1 & 2", "Hari & Friends", "TDQS-INV-2604-NAS_001", 5600, "AED", 5600, "Cash", "Invoice"],
    ["EXP-14", "20 May 2026", "C003", "IND 1 & 2", "Hari & Friends", "TDQS-INV-2605-NAS_002", 3200, "AED", 3200, "Cash", "Invoice"],
    ["EXP-15", "03 Jul 2026", "C003", "25hours", "Puvi Rebar", "TDQS-INV-2607-NAS_002", 2129, "AED", 2129, "Cash", "Invoice"],
    ["EXP-16", "03 Jul 2026", "C003", "Rixos", "Puvi Rebar", "TDQS-INV-2607-NAS_001", 1018, "AED", 1018, "Cash", "Invoice"]
  ];
  
  if (name === "Contractors") {
    sampleContractors.forEach(function(row) { sheet.appendRow(row); });
  } else if (name === "Projects") {
    sampleProjects.forEach(function(row) { sheet.appendRow(row); });
  } else if (name === "Income") {
    sampleIncome.forEach(function(row) { sheet.appendRow(row); });
  } else if (name === "Expenses") {
    sampleExpenses.forEach(function(row) { sheet.appendRow(row); });
  }
}
