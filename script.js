
// CONFIG

const API_URL = "https://project-1jes.onrender.com/api/tasks";


// NOTIFICATION SYSTEM

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  // Auto-dismiss after 4 seconds
  setTimeout(() => {
    notification.classList.add('hide');
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

 
// DOM ELEMENTS

const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");

const addTaskBtn = document.getElementById("addTaskBtn");
const titleInput = document.getElementById("title");
const descriptionInput = document.getElementById("description");
const priorityInput = document.getElementById("priority");
const dueDateInput = document.getElementById("due_date");
const categoryInput = document.getElementById("category");
const statusInput = document.getElementById("status");

const searchInput = document.getElementById("searchInput");
const sortTasks = document.getElementById("sortTasks");
const filterButtons = document.querySelectorAll(".filter-btn");

const totalTasksEl = document.getElementById("totalTasks");
const completedTasksEl = document.getElementById("completedTasks");
const pendingTasksEl = document.getElementById("pendingTasks");
const overdueTasksEl = document.getElementById("overdueTasks");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");

const themeToggle = document.getElementById("themeToggle");

// Delete Modal
const deleteModal = document.getElementById("deleteModal");
const cancelDelete = document.getElementById("cancelDelete");
const confirmDelete = document.getElementById("confirmDelete");

// Edit Modal
const editModal = document.getElementById("editModal");
const editTitle = document.getElementById("editTitle");
const editDescription = document.getElementById("editDescription");
const editPriority = document.getElementById("editPriority");
const editDueDate = document.getElementById("editDueDate");
const editCategory = document.getElementById("editCategory");
const editStatus = document.getElementById("editStatus");
const cancelEdit = document.getElementById("cancelEdit");
const saveEdit = document.getElementById("saveEdit");


// STATE

let currentFilter = "all";
let allTasks = [];
let deleteTaskId = null;
let editTaskId = null;
let isLoading = false;


// FETCH TASKS

async function fetchTasks() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    
    const tasks = await res.json();
    allTasks = tasks;
    applyFiltersAndRender();
    updateDashboard(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    taskList.innerHTML = `<p style="color:red;">⚠️ Failed to load tasks: ${error.message}</p>`;
    showNotification(`Failed to load tasks: ${error.message}`, 'error');
  }
}


// RENDER FLOW

function applyFiltersAndRender() {
  let tasks = [...allTasks];

  // Filter
  if (currentFilter === "active") tasks = tasks.filter(t => !t.completed);
  if (currentFilter === "completed") tasks = tasks.filter(t => t.completed);
  if (currentFilter === "overdue") tasks = tasks.filter(t => isOverdue(t));

  // Search
  const searchTerm = searchInput.value.trim().toLowerCase();
  if (searchTerm) {
    tasks = tasks.filter(t =>
      (t.title || "").toLowerCase().includes(searchTerm) ||
      (t.description || "").toLowerCase().includes(searchTerm) ||
      (t.category || "").toLowerCase().includes(searchTerm)
    );
  }

  // Sort
  tasks = sortTaskList(tasks);

  renderTasks(tasks);
}


// SORT TASKS

function sortTaskList(tasks) {
  const sortValue = sortTasks.value;
  return tasks.sort((a, b) => {
    switch (sortValue) {
      case "newest": return new Date(b.created_at) - new Date(a.created_at);
      case "oldest": return new Date(a.created_at) - new Date(b.created_at);
      case "priorityHigh": return priorityRank(b.priority) - priorityRank(a.priority);
      case "priorityLow": return priorityRank(a.priority) - priorityRank(b.priority);
      case "dueSoon": return dateValue(a.due_date) - dateValue(b.due_date);
      case "dueLate": return dateValue(b.due_date) - dateValue(a.due_date);
      default: return 0;
    }
  });
}

function priorityRank(priority) {
  const ranks = { Low: 1, Medium: 2, High: 3 };
  return ranks[priority] || 0;
}

function dateValue(date) {
  return date ? new Date(date).getTime() : Infinity;
}


// RENDER TASKS

function renderTasks(tasks) {
  if (!tasks.length) {
    taskList.innerHTML = "";
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  taskList.innerHTML = tasks.map(task => {
    const overdue = isOverdue(task);
    const dueToday = isDueToday(task);

    return `
      <div class="task-card ${task.completed ? "done-task" : ""}">
        <div class="task-top">
          <div>
            <h3 class="task-title">${escapeHTML(task.title)}</h3>
            <p class="task-desc">${escapeHTML(task.description || "No description")}</p>
          </div>
        </div>
        <div class="task-meta">
          <span class="badge ${task.priority.toLowerCase()}">${task.priority}</span>
          <span class="badge category">${task.category || "General"}</span>
          <span class="badge">${task.due_date ? `📅 ${formatDate(task.due_date)}` : "No Due Date"}</span>
          ${task.completed ? `<span class="badge completed">✅ Completed</span>` : ""}
          ${overdue && !task.completed ? `<span class="badge overdue">⏰ Overdue</span>` : ""}
          ${dueToday && !task.completed ? `<span class="badge today">📌 Due Today</span>` : ""}
        </div>
        <div class="actions">
          <button class="complete-btn" onclick="toggleComplete(${task.id}, ${task.completed})">
            ${task.completed ? "↩️ Undo" : "✓ Complete"}
          </button>
          <button class="edit-btn" onclick="openEditModal(${task.id})">✏️ Edit</button>
          <button class="delete-btn" onclick="openDeleteModal(${task.id})">🗑️ Delete</button>
        </div>
      </div>
    `;
  }).join("");
}


// HELPERS

function formatDate(dateString) {
  if (!dateString) return "No Date";
  try {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch (e) {
    return "Invalid Date";
  }
}

function isOverdue(task) {
  if (!task.due_date || task.completed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(task.due_date);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

function isDueToday(task) {
  if (!task.due_date || task.completed) return false;
  const today = new Date();
  const due = new Date(task.due_date);
  return today.toDateString() === due.toDateString();
}

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, match => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[match]);
}

function validateInput(value, fieldName, maxLength = 255) {
  if (typeof value !== "string") return false;
  if (value.trim().length === 0) return false;
  if (value.length > maxLength) return false;
  return true;
}


// ADD TASK

addTaskBtn.addEventListener("click", async () => {
  if (isLoading) {
    showNotification("Please wait, task is being added...", 'info');
    return;
  }

  const taskTitle = titleInput.value.trim();
  const taskDesc = descriptionInput.value.trim();

  // Validation
  if (!validateInput(taskTitle, "title")) {
    showNotification("Task title is required (max 255 characters)", 'error');
    return;
  }

  if (taskDesc.length > 1000) {
    showNotification("Description must be less than 1000 characters", 'error');
    return;
  }

  const task = {
    title: taskTitle,
    description: taskDesc,
    priority: priorityInput.value,
    due_date: dueDateInput.value || null,
    category: categoryInput.value,
    completed: statusInput.value === "completed"
  };

  isLoading = true;
  addTaskBtn.disabled = true;
  addTaskBtn.textContent = "⏳ Adding...";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task)
    });

    const data = await res.json();
    console.log("Add task response:", res.status, data);

    if (!res.ok) {
      throw new Error(data.error || `Server Error: ${res.status}`);
    }

    clearForm();
    await fetchTasks();
    showNotification(`✅ Task "${taskTitle}" added successfully!`, 'success');
  } catch (err) {
    console.error("Error adding task:", err);
    showNotification(`Failed to add task: ${err.message}`, 'error');
  } finally {
    isLoading = false;
    addTaskBtn.disabled = false;
    addTaskBtn.textContent = "+ Add Task";
  }
});

function clearForm() {
  titleInput.value = "";
  descriptionInput.value = "";
  priorityInput.value = "Low";
  dueDateInput.value = "";
  categoryInput.value = "Study";
  statusInput.value = "active";
}

// =========================
// TOGGLE COMPLETE
// =========================
async function toggleComplete(id, completed) {
  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !completed })
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || `Server Error: ${res.status}`);
    }

    const data = await res.json();
    console.log("Toggle complete:", res.status, data);
    await fetchTasks();
    showNotification(
      !completed ? "✅ Task marked as completed!" : "↩️ Task marked as incomplete",
      'success'
    );
  } catch (err) {
    console.error("Error toggling complete:", err);
    showNotification(`Failed to update task: ${err.message}`, 'error');
  }
}


// DELETE TASK

function openDeleteModal(id) {
  deleteTaskId = id;
  deleteModal.classList.remove("hidden");
}

cancelDelete.addEventListener("click", () => {
  deleteTaskId = null;
  deleteModal.classList.add("hidden");
});

confirmDelete.addEventListener("click", async () => {
  if (!deleteTaskId) return;

  confirmDelete.disabled = true;
  confirmDelete.textContent = "🗑️ Deleting...";

  try {
    const res = await fetch(`${API_URL}/${deleteTaskId}`, { 
      method: "DELETE" 
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Server Error: ${res.status}`);
    }

    console.log("Delete task successful");
    deleteTaskId = null;
    deleteModal.classList.add("hidden");
    await fetchTasks();
    showNotification("🗑️ Task deleted successfully!", 'success');
  } catch (err) {
    console.error("Error deleting task:", err);
    showNotification(`Failed to delete task: ${err.message}`, 'error');
  } finally {
    confirmDelete.disabled = false;
    confirmDelete.textContent = "🗑️ Delete";
  }
});


// EDIT TASK

function openEditModal(id) {
  const task = allTasks.find(t => t.id === id);
  if (!task) {
    showNotification("Task not found!", 'error');
    return;
  }

  editTaskId = id;
  editTitle.value = task.title || "";
  editDescription.value = task.description || "";
  editPriority.value = task.priority || "Low";
  editDueDate.value = task.due_date ? task.due_date.split("T")[0] : "";
  editCategory.value = task.category || "Study";
  editStatus.value = task.completed ? "completed" : "active";

  editModal.classList.remove("hidden");
}

cancelEdit.addEventListener("click", () => {
  editTaskId = null;
  editModal.classList.add("hidden");
});

saveEdit.addEventListener("click", async () => {
  if (!editTaskId) return;

  const updatedTitle = editTitle.value.trim();
  const updatedDesc = editDescription.value.trim();

  // Validation
  if (!validateInput(updatedTitle, "title")) {
    showNotification("Task title is required (max 255 characters)", 'error');
    return;
  }

  if (updatedDesc.length > 1000) {
    showNotification("Description must be less than 1000 characters", 'error');
    return;
  }

  const updatedTask = {
    title: updatedTitle,
    description: updatedDesc,
    priority: editPriority.value,
    due_date: editDueDate.value || null,
    category: editCategory.value,
    completed: editStatus.value === "completed"
  };

  saveEdit.disabled = true;
  saveEdit.textContent = "💾 Saving...";

  try {
    const res = await fetch(`${API_URL}/${editTaskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedTask)
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || `Server Error: ${res.status}`);
    }

    const data = await res.json();
    console.log("Edit task successful:", res.status, data);
    editTaskId = null;
    editModal.classList.add("hidden");
    await fetchTasks();
    showNotification("✅ Task updated successfully!", 'success');
  } catch (err) {
    console.error("Error editing task:", err);
    showNotification(`Failed to update task: ${err.message}`, 'error');
  } finally {
    saveEdit.disabled = false;
    saveEdit.textContent = "💾 Save Changes";
  }
});


// DASHBOARD

function updateDashboard(tasks) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const overdue = tasks.filter(isOverdue).length;

  totalTasksEl.textContent = total;
  completedTasksEl.textContent = completed;
  pendingTasksEl.textContent = pending;
  overdueTasksEl.textContent = overdue;

  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
  progressFill.style.width = `${progress}%`;
  progressText.textContent = `${progress}%`;
}


// SEARCH / FILTER / SORT

searchInput.addEventListener("input", applyFiltersAndRender);
sortTasks.addEventListener("change", applyFiltersAndRender);

filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelector(".filter-btn.active")?.classList.remove("active");
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    applyFiltersAndRender();
  });
});


// THEME TOGGLE

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("light");
  const isLight = document.body.classList.contains("light");
  localStorage.setItem("tickd-theme", isLight ? "light" : "dark");
  themeToggle.textContent = isLight ? "☀️" : "🌙";
});

function loadTheme() {
  const savedTheme = localStorage.getItem("tickd-theme");
  if (savedTheme === "light") document.body.classList.add("light");
  themeToggle.textContent = savedTheme === "light" ? "☀️" : "🌙";
}


// CLOSE MODALS ON OUTSIDE CLICK

window.addEventListener("click", e => {
  if (e.target === deleteModal) deleteModal.classList.add("hidden");
  if (e.target === editModal) editModal.classList.add("hidden");
});


// INITIALIZATION
loadTheme();
fetchTasks();