const USERS_SHEET = 'Users';
const TASKS_SHEET = 'Tasks';
const userProps = PropertiesService.getUserProperties();

// Load page
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Simple To-Do Task Manager');
}

// Signup
function signupUser(email, password) {
  if (!email || !password) return "Email and password are required.";
  if (!email.includes("@") || !email.includes(".")) return "Invalid email format.";
  if (password.length < 8) return "Password must be at least 8 characters.";

  const sheet = SpreadsheetApp.getActive().getSheetByName(USERS_SHEET);
  const users = sheet.getDataRange().getValues();
  for (let i = 1; i < users.length; i++) {
    if (users[i][0] === email) return "Email already registered.";
  }

  const userId = Utilities.getUuid();
  sheet.appendRow([email, password, userId]);

  // 🧼 Clear any lingering user session
  PropertiesService.getUserProperties().deleteProperty("userId");

  return "OK";
}



// Login
function loginUserWithEmail(email, password) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(USERS_SHEET);
  const users = sheet.getDataRange().getValues();
  for (let i = 1; i < users.length; i++) {
    if (users[i][0] === email && users[i][1] === password) {
      userProps.setProperty("userId", users[i][2]);
      return { status: "OK", email: email };
    }
  }
  return { status: "FAIL", message: "Invalid email or password." };
}

// Add Task
function addTask(task) {
  const userId = userProps.getProperty("userId");
  if (!userId) return;
  const sheet = SpreadsheetApp.getActive().getSheetByName(TASKS_SHEET);
  sheet.appendRow([userId, task, "incomplete", new Date()]);
}

// Get Tasks
function getTasksWithStatus() {
  const userId = userProps.getProperty("userId");
  if (!userId) return [];

  const sheet = SpreadsheetApp.getActive().getSheetByName(TASKS_SHEET);
  const data = sheet.getDataRange().getValues();

  return data
    .filter((row, i) => i > 0 && row[0] === userId)
    .map(row => ({ task: row[1], status: row[2] }));
}


// Delete Task by Index
function deleteTask(taskIndex) {
  const userId = userProps.getProperty("userId");
  const sheet = SpreadsheetApp.getActive().getSheetByName(TASKS_SHEET);
  const data = sheet.getDataRange().getValues();

  let userTasks = [];
  let rowIndex = -1;
  let count = -1;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      count++;
      if (count === taskIndex) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  if (rowIndex !== -1) sheet.deleteRow(rowIndex);
}
function clearSession() {
  PropertiesService.getUserProperties().deleteProperty("userId");
}
// ✅ Marks a task as complete (status: "done")
function completeTask(index) {
  const userId = userProps.getProperty("userId");
  const sheet = SpreadsheetApp.getActive().getSheetByName(TASKS_SHEET);
  const data = sheet.getDataRange().getValues();

  let count = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId && data[i][2] === "incomplete") {
      count++;
      if (count === index) {
        sheet.getRange(i + 1, 3).setValue("done");
        break;
      }
    }
  }
}

// ✅ Clears all completed tasks for the logged-in user
function clearAllDoneTasks() {
  const userId = userProps.getProperty("userId");
  const sheet = SpreadsheetApp.getActive().getSheetByName(TASKS_SHEET);
  const data = sheet.getDataRange().getValues();

  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === userId && data[i][2] === "done") {
      sheet.deleteRow(i + 1);
    }
  }
}
