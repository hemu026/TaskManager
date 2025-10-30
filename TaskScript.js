// ✅ Complete Task Manager Script (Search + Sort + Reminders)
(function () {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  const titleInput = $('#taskTitle');
  const descInput = $('#taskDesc');
  const dateInput = $('#taskDate');
  const addBtn = $('#addTaskBtn');
  const filters = $$('.filter-btn');
  const listContainer = $('.task-list');
  const searchInput = $('#searchInput');
  const sortSelect = $('#sortSelect');

  const STORAGE_KEY = 'taskmanager_final_v1';

  function loadTasks() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  function saveTasks(tasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  // Escape HTML
  function escapeHtml(str = '') {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Filter + Search + Sort
  function getFilteredTasks() {
    const tasks = loadTasks();
    const activeFilter = document.querySelector('.filter-btn.active');
    const filter = activeFilter ? activeFilter.dataset.filter : 'all';
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const sortValue = sortSelect ? sortSelect.value : 'none';

    let filtered = tasks;

    if (filter === 'pending') filtered = filtered.filter((t) => !t.completed);
    if (filter === 'completed') filtered = filtered.filter((t) => t.completed);

    if (searchTerm)
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(searchTerm) ||
          (t.desc && t.desc.toLowerCase().includes(searchTerm))
      );

    if (sortValue === 'date-asc')
      filtered.sort((a, b) => new Date(a.due || 0) - new Date(b.due || 0));
    else if (sortValue === 'date-desc')
      filtered.sort((a, b) => new Date(b.due || 0) - new Date(a.due || 0));
    else if (sortValue === 'title-az')
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    else if (sortValue === 'title-za')
      filtered.sort((a, b) => b.title.localeCompare(a.title));

    return filtered;
  }

  // Render UI
  function renderTasks() {
    const list = getFilteredTasks();
    listContainer.innerHTML = '';

    if (list.length === 0) {
      listContainer.innerHTML = '<p class="empty">No matching tasks</p>';
      return;
    }

    list.forEach((task) => {
      const item = document.createElement('div');
      item.className = 'task-item';
      if (task.completed) item.classList.add('completed');

      // Deadline colors
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(now.getDate() + 1);
      const due = task.due ? new Date(task.due) : null;

      if (!task.completed && due) {
        if (due < now) item.classList.add('overdue');
        else if (due <= tomorrow) item.classList.add('due-soon');
      }

      item.innerHTML = `
        <div class="task-left">
          <input type="checkbox" class="check" ${task.completed ? 'checked' : ''} data-id="${task.id}">
          <div class="task-info">
            <h3>${escapeHtml(task.title)}</h3>
            <p>${escapeHtml(task.desc || '')}</p>
            <small>Due: ${task.due || 'No date'}</small>
          </div>
        </div>
        <div class="task-actions">
          <button class="edit" data-id="${task.id}">✏️</button>
          <button class="delete" data-id="${task.id}">🗑️</button>
        </div>
      `;
      listContainer.appendChild(item);
    });
  }

  // CRUD
  function addTask(title, desc, due) {
    if (!title.trim()) {
      alert('Please enter a task title');
      return;
    }
    const tasks = loadTasks();
    tasks.push({
      id: 't' + Date.now(),
      title,
      desc,
      due,
      completed: false,
    });
    saveTasks(tasks);
    renderTasks();
    checkReminders();
    titleInput.value = '';
    descInput.value = '';
    dateInput.value = '';
  }

  function deleteTask(id) {
    let tasks = loadTasks();
    tasks = tasks.filter((t) => t.id !== id);
    saveTasks(tasks);
    renderTasks();
  }

  function toggleComplete(id, done) {
    const tasks = loadTasks();
    const t = tasks.find((x) => x.id === id);
    if (t) t.completed = done;
    saveTasks(tasks);
    renderTasks();
  }

  function editTask(id) {
    const tasks = loadTasks();
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    titleInput.value = t.title;
    descInput.value = t.desc;
    dateInput.value = t.due;
    deleteTask(id);
    titleInput.focus();
  }

  // Notifications
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

  function checkReminders() {
    if (!('Notification' in window)) return;

    const tasks = loadTasks();
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);

    const upcoming = tasks.filter((t) => {
      if (!t.due) return false;
      const dueDate = new Date(t.due);
      return !t.completed && dueDate >= now && dueDate <= tomorrow;
    });

    if (upcoming.length > 0 && Notification.permission === 'granted') {
      new Notification('🔔 Task Reminder', {
        body: `${upcoming.length} task(s) are due soon!`,
      });
    }
  }

  // Events
  addBtn.addEventListener('click', () => {
    addTask(titleInput.value, descInput.value, dateInput.value);
  });

  listContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete')) deleteTask(e.target.dataset.id);
    if (e.target.classList.contains('edit')) editTask(e.target.dataset.id);
    if (e.target.classList.contains('check'))
      toggleComplete(e.target.dataset.id, e.target.checked);
  });

  filters.forEach((btn) => {
    btn.addEventListener('click', () => {
      filters.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderTasks();
    });
  });

  if (searchInput)
    searchInput.addEventListener('input', () => {
      renderTasks();
    });

  if (sortSelect)
    sortSelect.addEventListener('change', () => {
      renderTasks();
    });

  renderTasks();
  checkReminders();
})();
