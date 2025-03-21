let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let budgets = JSON.parse(localStorage.getItem("budgets")) || {};

const expenseNameInput = document.getElementById("expense-name");
const expenseAmountInput = document.getElementById("expense-amount");
const expenseCategorySelect = document.getElementById("expense-category");
const expenseDateInput = document.getElementById("expense-date");
const expenseTable = document.getElementById("expense-table");
const categoryFilter = document.getElementById("category-filter");
const sortBySelect = document.getElementById("sort-by");
const totalAmountElement = document.getElementById("total-amount");
const topCategoryElement = document.getElementById("top-category");
const lastUpdatedElement = document.getElementById("last-updated");
const budgetProgressContainer = document.getElementById("budget-progress-container");

document.addEventListener("DOMContentLoaded", function() {
  const today = new Date().toISOString().split('T')[0];
  if (expenseDateInput) {
    expenseDateInput.value = today;
  }
  
  initTabs();
  
  initChartTypes();
  
  if (categoryFilter) {
    categoryFilter.addEventListener("change", filterAndSortExpenses);
  }
  
  if (sortBySelect) {
    sortBySelect.addEventListener("change", filterAndSortExpenses);
  }
  
  renderExpenses();
  updateChart();
  updateDashboardSummary();
  renderBudgetProgress();
});

function addExpense() {
  const name = expenseNameInput.value.trim();
  const amount = expenseAmountInput.value;
  const category = expenseCategorySelect.value;
  const date = expenseDateInput.value || new Date().toISOString().split('T')[0];

  if (!name || !amount) {
    showNotification("Please enter a valid name and amount!", "error");
    return;
  }

  const expense = { 
    id: Date.now(),
    name, 
    amount: Number(amount), 
    category,
    date
  };
  
  expenses.push(expense);
  saveExpenses();

  expenseNameInput.value = "";
  expenseAmountInput.value = "";

  renderExpenses();
  updateChart();
  updateDashboardSummary();
  renderBudgetProgress();
  
  showNotification("Expense added successfully!", "success");
}

function renderExpenses() {
  const filteredExpenses = filterAndSortExpenses();
  
  expenseTable.innerHTML = "";

  if (filteredExpenses.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `<td colspan="5" class="empty-message">No expenses found. Add some expenses to get started!</td>`;
    expenseTable.appendChild(emptyRow);
    return;
  }

  filteredExpenses.forEach((expense) => {
    const row = document.createElement("tr");
    
    const formattedDate = formatDate(expense.date);
    
    row.innerHTML = `
      <td>${expense.name}</td>
      <td>$${expense.amount.toFixed(2)}</td>
      <td>${expense.category}</td>
      <td>${formattedDate}</td>
      <td class="action-cell">
        <button class="edit-btn" onclick="editExpense(${expense.id})">
          <i class="fas fa-edit"></i>
        </button>
        <button class="delete-btn" onclick="deleteExpense(${expense.id})">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    expenseTable.appendChild(row);
  });
}

function filterAndSortExpenses() {
  let filtered = [...expenses];
  
  const selectedCategory = categoryFilter ? categoryFilter.value : "All";
  if (selectedCategory !== "All") {
    filtered = filtered.filter(expense => expense.category === selectedCategory);
  }
  
  const sortOption = sortBySelect ? sortBySelect.value : "date-desc";
  
  switch (sortOption) {
    case "date-desc":
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
      break;
    case "date-asc":
      filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
      break;
    case "amount-desc":
      filtered.sort((a, b) => b.amount - a.amount);
      break;
    case "amount-asc":
      filtered.sort((a, b) => a.amount - b.amount);
      break;
  }
  
  return filtered;
}

function editExpense(id) {
  const expense = expenses.find(exp => exp.id === id);
  if (!expense) return;
  
  const modal = document.createElement("div");
  modal.className = "modal";
  
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close-btn">&times;</span>
      <h2>Edit Expense</h2>
      <div class="form-group">
        <label for="edit-name">Expense Name</label>
        <input type="text" id="edit-name" value="${expense.name}">
      </div>
      <div class="form-group">
        <label for="edit-amount">Amount</label>
        <input type="number" id="edit-amount" value="${expense.amount}">
      </div>
      <div class="form-group">
        <label for="edit-category">Category</label>
        <select id="edit-category">
          ${getCategoryOptions(expense.category)}
        </select>
      </div>
      <div class="form-group">
        <label for="edit-date">Date</label>
        <input type="date" id="edit-date" value="${expense.date}">
      </div>
      <button id="save-edit-btn">Save Changes</button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const closeBtn = modal.querySelector(".close-btn");
  closeBtn.addEventListener("click", () => {
    document.body.removeChild(modal);
  });
  
  const saveBtn = modal.querySelector("#save-edit-btn");
  saveBtn.addEventListener("click", () => {
    const newName = modal.querySelector("#edit-name").value.trim();
    const newAmount = modal.querySelector("#edit-amount").value;
    const newCategory = modal.querySelector("#edit-category").value;
    const newDate = modal.querySelector("#edit-date").value;
    
    if (!newName || !newAmount) {
      showNotification("Please enter a valid name and amount!", "error");
      return;
    }
    
    expense.name = newName;
    expense.amount = Number(newAmount);
    expense.category = newCategory;
    expense.date = newDate;
    
    saveExpenses();
    
    renderExpenses();
    updateChart();
    updateDashboardSummary();
    renderBudgetProgress();
    
    document.body.removeChild(modal);
    
    showNotification("Expense updated successfully!", "success");
  });
}

function deleteExpense(id) {
  if (confirm("Are you sure you want to delete this expense?")) {
    expenses = expenses.filter(expense => expense.id !== id);
    saveExpenses();
    
    renderExpenses();
    updateChart();
    updateDashboardSummary();
    renderBudgetProgress();
    
    showNotification("Expense deleted successfully!", "success");
  }
}

function updateChart() {
  const activeChartBtn = document.querySelector(".chart-type-btn.active");
  const chartType = activeChartBtn ? activeChartBtn.dataset.chart : "pie";
  
  switch (chartType) {
    case "pie":
      createPieChart();
      break;
    case "bar":
      createBarChart();
      break;
    case "line":
      createLineChart();
      break;
    default:
      createPieChart();
  }
}

function createPieChart() {
  const categories = {};
  const categoryColors = {
    Food: "#FF6384",
    Housing: "#36A2EB",
    Transportation: "#FFCE56",
    Entertainment: "#4BC0C0",
    Shopping: "#9966FF",
    Utilities: "#FF9F40",
    Healthcare: "#C9CBCF",
    Others: "#7C8A9A"
  };
  
  expenses.forEach((expense) => {
    if (!categories[expense.category]) {
      categories[expense.category] = 0;
    }
    categories[expense.category] += expense.amount;
  });
  
  const ctx = document.getElementById("expense-chart").getContext("2d");
  
  if (window.expenseChart) window.expenseChart.destroy();
  
  window.expenseChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: Object.keys(categories),
      datasets: [
        {
          data: Object.values(categories),
          backgroundColor: Object.keys(categories).map(cat => categoryColors[cat] || "#7C8A9A"),
          borderWidth: 1
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: {
            color: "#f9fafb"
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: $${value.toFixed(2)} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

function createBarChart() {
  const monthlyData = {};
  
  expenses.forEach(expense => {
    const date = new Date(expense.date);
    const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
    
    if (!monthlyData[monthYear]) {
      monthlyData[monthYear] = 0;
    }
    
    monthlyData[monthYear] += expense.amount;
  });
  
  const sortedMonths = Object.keys(monthlyData).sort();
  
  const labels = sortedMonths.map(monthYear => {
    const [year, month] = monthYear.split('-');
    return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  });
  
  const data = sortedMonths.map(month => monthlyData[month]);
  
  const ctx = document.getElementById("expense-chart").getContext("2d");
  
  if (window.expenseChart) window.expenseChart.destroy();
  
  window.expenseChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Monthly Expenses",
          data: data,
          backgroundColor: "#6366f1",
          borderColor: "#4f46e5",
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: "#f9fafb",
            callback: function(value) {
              return '$' + value;
            }
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)"
          }
        },
        x: {
          ticks: {
            color: "#f9fafb"
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)"
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: "#f9fafb"
          }
        }
      }
    }
  });
}

function createLineChart() {
  const categories = [...new Set(expenses.map(expense => expense.category))];
  const dateMap = {};
  
  expenses.forEach(expense => {
    if (!dateMap[expense.date]) {
      dateMap[expense.date] = {};
      categories.forEach(cat => {
        dateMap[expense.date][cat] = 0;
      });
    }
    
    dateMap[expense.date][expense.category] += expense.amount;
  });
  
  const sortedDates = Object.keys(dateMap).sort();
  
  const datasets = categories.map((category, index) => {
    const colors = [
      "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", 
      "#9966FF", "#FF9F40", "#C9CBCF", "#7C8A9A"
    ];
    
    return {
      label: category,
      data: sortedDates.map(date => dateMap[date][category]),
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length] + "33",
      tension: 0.3,
      fill: false
    };
  });
  
  const ctx = document.getElementById("expense-chart").getContext("2d");
  
  if (window.expenseChart) window.expenseChart.destroy();
  
  window.expenseChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: sortedDates.map(date => formatDate(date)),
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: "#f9fafb",
            callback: function(value) {
              return '$' + value;
            }
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)"
          }
        },
        x: {
          ticks: {
            color: "#f9fafb"
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)"
          }
        }
      },
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: "#f9fafb"
          }
        }
      }
    }
  });
}

function setBudget() {
  const category = document.getElementById("budget-category").value;
  const amount = document.getElementById("budget-amount").value;
  
  if (!amount || isNaN(amount) || amount <= 0) {
    showNotification("Please enter a valid budget amount!", "error");
    return;
  }
  
  budgets[category] = Number(amount);
  localStorage.setItem("budgets", JSON.stringify(budgets));
  
  document.getElementById("budget-amount").value = "";
  
  renderBudgetProgress();
  showNotification(`Budget for ${category} set to $${amount}!`, "success");
}

function renderBudgetProgress() {
  if (!budgetProgressContainer) return;
  
  budgetProgressContainer.innerHTML = "";
  
  if (Object.keys(budgets).length === 0) {
    budgetProgressContainer.innerHTML = `
      <div class="empty-message">
        No budgets set. Set a budget for a category to track your spending.
      </div>
    `;
    return;
  }
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyExpenses = {};
  
  expenses.forEach(expense => {
    const expenseDate = new Date(expense.date);
    if (expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear) {
      if (!monthlyExpenses[expense.category]) {
        monthlyExpenses[expense.category] = 0;
      }
      monthlyExpenses[expense.category] += expense.amount;
    }
  });
  
  Object.keys(budgets).forEach(category => {
    const budget = budgets[category];
    const spent = monthlyExpenses[category] || 0;
    const percentage = Math.min((spent / budget) * 100, 100);
    
    let statusClass = "safe";
    if (percentage >= 90) {
      statusClass = "danger";
    } else if (percentage >= 70) {
      statusClass = "warning";
    }
    
    const budgetItem = document.createElement("div");
    budgetItem.className = "budget-item";
    budgetItem.innerHTML = `
      <div class="budget-info">
        <div>${category}</div>
        <div>$${spent.toFixed(2)} / $${budget.toFixed(2)}</div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill ${statusClass}" style="width: ${percentage}%"></div>
      </div>
    `;
    
    budgetProgressContainer.appendChild(budgetItem);
  });
}

function updateDashboardSummary() {
  if (!totalAmountElement || !topCategoryElement || !lastUpdatedElement) return;
  
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  totalAmountElement.textContent = `$${total.toFixed(2)}`;
  
  const categoryTotals = {};
  expenses.forEach(expense => {
    if (!categoryTotals[expense.category]) {
      categoryTotals[expense.category] = 0;
    }
    categoryTotals[expense.category] += expense.amount;
  });
  
  let topCategory = "None";
  let topAmount = 0;
  
  Object.keys(categoryTotals).forEach(category => {
    if (categoryTotals[category] > topAmount) {
      topAmount = categoryTotals[category];
      topCategory = category;
    }
  });
  
  topCategoryElement.textContent = topCategory;
  
  const now = new Date();
  lastUpdatedElement.textContent = now.toLocaleDateString() + " " + now.toLocaleTimeString();
}

function exportCSV() {
  if (expenses.length === 0) {
    showNotification("No expenses to export!", "error");
    return;
  }
  
  let csvContent = "Name,Amount,Category,Date\n";
  
  expenses.forEach(expense => {
    csvContent += `"${expense.name}",${expense.amount},"${expense.category}","${expense.date}"\n`;
  });
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  link.setAttribute("href", url);
  link.setAttribute("download", `expenses_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.display = "none";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showNotification("Expenses exported successfully!", "success");
}

function clearAllData() {
  if (confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
    expenses = [];
    budgets = {};
    localStorage.removeItem("expenses");
    localStorage.removeItem("budgets");
    
    renderExpenses();
    updateChart();
    updateDashboardSummary();
    renderBudgetProgress();
    
    showNotification("All data cleared successfully!", "success");
  }
}

function initTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");
  
  tabButtons.forEach(button => {
    button.addEventListener("click", () => {
      tabButtons.forEach(btn => btn.classList.remove("active"));
      tabPanes.forEach(pane => pane.classList.remove("active"));
      
      button.classList.add("active");
      const tabId = button.dataset.tab;
      document.getElementById(`${tabId}-tab`).classList.add("active");
      
      if (tabId === "chart") {
        updateChart();
      }
    });
  });
}

function initChartTypes() {
  const chartTypeButtons = document.querySelectorAll(".chart-type-btn");
  
  chartTypeButtons.forEach(button => {
    button.addEventListener("click", () => {
      chartTypeButtons.forEach(btn => btn.classList.remove("active"));
      
      button.classList.add("active");
      
      updateChart();
    });
  });
}

function getCategoryOptions(selectedCategory) {
  const categories = [
    "Food", "Housing", "Transportation", "Entertainment", 
    "Shopping", "Utilities", "Healthcare", "Others"
  ];
  
  return categories.map(category => 
    `<option value="${category}" ${category === selectedCategory ? 'selected' : ''}>${category}</option>`
  ).join('');
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function showNotification(message, type) {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
      <span>${message}</span>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add("show");
  }, 10);
  
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

function saveExpenses() {
  localStorage.setItem("expenses", JSON.stringify(expenses));
}

const style = document.createElement("style");
style.textContent = `
  .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal-content {
    background: rgba(30, 41, 59, 0.95);
    padding: 25px;
    border-radius: 12px;
    width: 90%;
    max-width: 500px;
    position: relative;
    color: #f9fafb;
  }
  
  .close-btn {
    position: absolute;
    top: 15px;
    right: 15px;
    font-size: 24px;
    cursor: pointer;
    color: #f9fafb;
  }
  
  .modal h2 {
    margin-bottom: 20px;
    text-align: center;
  }
  
  .modal .form-group {
    margin-bottom: 15px;
  }
  
  .modal button {
    background: #6366f1;
    color: white;
    padding: 12px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    width: 100%;
    margin-top: 10px;
    font-weight: 500;
  }
  
  .notification {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    background: rgba(30, 41, 59, 0.9);
    color: white;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transform: translateY(100px);
    opacity: 0;
    transition: all 0.3s ease;
    z-index: 1000;
  }
  
  .notification.show {
    transform: translateY(0);
    opacity: 1;
  }
  
  .notification-content {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .notification.success i {
    color: #10b981;
  }
  
  .notification.error i {
    color: #ef4444;
  }
  
  .empty-message {
    text-align: center;
    padding: 20px;
    color: rgba(255, 255, 255, 0.7);
    font-style: italic;
  }
`;

document.head.appendChild(style);
