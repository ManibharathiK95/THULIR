/**
 * Thulir Design and QS Services (TDQS) Financial Tracker
 * Google Apps Script Backend (Code.gs)
 * 
 * Instructions:
 * 1. Create a Google Sheet named "TDQS Financial Tracker".
 * 2. Create 4 tabs named exactly: "Contractors", "Projects", "Income", and "Expenses".
 * 3. Set up the column headers as specified below:
 *    - "Contractors" tab headers in Row 1: Contractor ID, Contractor Name, Account Number, Contact Number, Status
 *    - "Projects" tab headers in Row 1: Project Code, Project Name, Contractor ID, Status
 *    - "Income" tab headers in Row 1: Date, Contractor ID, Project Code, Description, Amount, Currency, Credit Received
 *    - "Expenses" tab headers in Row 1: Date, Contractor ID, Project Code, Vendor, Description, Amount, Currency, Credit Paid
 * 4. Open Extensions > Apps Script, replace any code in Code.gs with this code, and click Save.
 * 5. Click "Deploy" > "New deployment".
 * 6. Under "Select type", click the gear icon and choose "Web app".
 * 7. Set "Execute as" to "Me", and "Who has access" to "Anyone" (or "Anyone with Google account").
 * 8. Click Deploy, copy the Web App URL, and paste it into the TDQS App under the "Google Sheet Sync" tab!
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
  
  var result = {
    contractors: contractors,
    projects: projects,
    income: income,
    expenses: expenses
  };
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheetDataAsObjects(sheet) {
  if (!sheet) return [];
  
  var range = sheet.getDataRange();
  var values = range.getValues();
  if (values.length <= 1) return []; // Only header row or empty
  
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
        // Formatting dates as strings for transfer stability
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

function handleAddContractor(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Contractors");
  if (!sheet) {
    sheet = ss.insertSheet("Contractors");
    sheet.appendRow(["Contractor ID", "Contractor Name", "Account Number", "Contact Number", "Status"]);
  }
  
  sheet.appendRow([
    data.id,
    data.name,
    data.accountNumber || "",
    data.contactNumber || "",
    data.status || "Active"
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleAddProject(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Projects");
  if (!sheet) {
    sheet = ss.insertSheet("Projects");
    sheet.appendRow(["Project Code", "Project Name", "Contractor ID", "Status"]);
  }
  
  sheet.appendRow([
    data.code,
    data.name,
    data.contractorId,
    data.status || "Active"
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleAddIncome(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Income");
  if (!sheet) {
    sheet = ss.insertSheet("Income");
    sheet.appendRow(["Date", "Contractor ID", "Project Code", "Description", "Amount", "Currency", "Credit Received"]);
  }
  
  sheet.appendRow([
    data.date,
    data.contractorId,
    data.projectCode,
    data.description,
    Number(data.amount),
    data.currency || "AED",
    data.creditReceived !== undefined ? Number(data.creditReceived) : ""
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleAddExpense(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Expenses");
  if (!sheet) {
    sheet = ss.insertSheet("Expenses");
    sheet.appendRow(["Date", "Contractor ID", "Project Code", "Vendor", "Description", "Amount", "Currency", "Credit Paid"]);
  }
  
  sheet.appendRow([
    data.date,
    data.contractorId,
    data.projectCode,
    data.vendor,
    data.description,
    Number(data.amount),
    data.currency || "AED",
    data.creditPaid !== undefined ? Number(data.creditPaid) : ""
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Helpers
function toCamelCase(str) {
  // Convert "Contractor Name" -> "contractorName"
  // Convert "Project Code" -> "projectCode"
  // Convert "Credit Received" -> "creditReceived"
  // Convert "Contractor ID" -> "contractorId" (special case)
  if (str === "Contractor ID") return "contractorId";
  if (str === "Project Code") return "projectCode";
  if (str === "Credit Received") return "creditReceived";
  if (str === "Credit Paid") return "creditPaid";
  
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
    return index === 0 ? word.toLowerCase() : word.toUpperCase();
  }).replace(/\s+/g, '');
}

function formatDateString(date) {
  var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var day = date.getDate();
  var month = months[date.getMonth()];
  var year = date.getFullYear();
  return (day < 10 ? '0' : '') + day + ' ' + month + ' ' + year;
}
