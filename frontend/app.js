// Импорты
import 'wailsjs/runtime';
import * as API from 'wailsjs/go/handlers/TaskHandler';

// ОТЛАДКА: проверяем что импортировалось
console.log('🔍 API imported:', API);
console.log('🔍 Available API methods:', Object.keys(API || {}));

// Утилиты
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

// Глобальное состояние
let state = {
  all: [],
  selectedId: null,
  filter: 'all',
  priority: null,
  sortBy: 'created_at',
  sortOrder: 'desc'
};

// Вспомогательные функции
function showToast(msg, type = "info") {
  const host = $("#toastHost");
  if (!host) {
    console.error('Toast host not found');
    alert(msg); // fallback
    return;
  }
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  if (type === "error") {
    el.style.borderColor = "color-mix(in oklab, var(--danger) 35%, var(--hairline))";
  }
  host.appendChild(el);
  setTimeout(() => {
    if (el.parentNode) {
      el.remove();
    }
  }, 2500);
}

// Функции для модального окна
function closeCreateModal() {
  const modal = $("#createModal");
  if (modal) {
    modal.classList.add("hidden");
  }
}

function openCreateModal() {
  const modal = $("#createModal");
  if (modal) {
    modal.classList.remove("hidden");
    // Фокус на заголовок
    const titleInput = $("#c_title");
    if (titleInput) {
      setTimeout(() => titleInput.focus(), 100);
    }
  }
}

// API функции - ИСПРАВЛЕННЫЕ под реальные методы
async function callCreate({title, body, priority, due_at}) {
  console.log('🔄 callCreate started with:', { title, body, priority, due_at });
  
  if (!API?.CreateTask) {
    console.error('❌ CreateTask function not found');
    throw new Error('CreateTask function not available');
  }
  
  // API.CreateTask ожидает объект TaskInput, а не отдельные параметры
  const taskInput = {
    title: title,
    body: body || '',
    priority: priority || 'medium',
    due_at: due_at || null,
    completed: false
  };
  
  try {
    console.log('📤 Calling CreateTask with TaskInput object:', taskInput);
    return await API.CreateTask(taskInput);
  } catch (error) {
    console.error('❌ CreateTask error:', error);
    throw error;
  }
}

async function fetchAll() {
  try {
    if (!API?.List) {
      throw new Error('List API не найден');
    }
    
    console.log('📤 Calling List()...');
    const tasks = await API.List();
    state.all = Array.isArray(tasks) ? tasks : [];
    console.log('📋 Loaded tasks:', state.all.length, state.all);
  } catch (error) {
    console.error('❌ Error fetching tasks:', error);
    state.all = [];
    showToast('Ошибка загрузки задач: ' + error.message, 'error');
  }
}

async function deleteTask(id) {
  try {
    if (!API?.DeleteTask) {
      throw new Error('DeleteTask API не найден');
    }
    
    console.log('📤 Calling DeleteTask with id:', id);
    await API.DeleteTask(id);
    await fetchAll();
    if (state.selectedId === id) {
      state.selectedId = null;
    }
    render();
    showToast('Задача удалена');
  } catch (error) {
    console.error('❌ Error deleting task:', error);
    showToast('Ошибка удаления задачи: ' + error.message, 'error');
  }
}

async function toggleTask(id) {
  try {
    const task = state.all.find(t => t.id === id);
    if (!task) return;
    
    if (!API?.SetDone) {
      throw new Error('SetDone API не найден');
    }
    
    // API.SetDone скорее всего принимает id и boolean
    console.log('📤 Calling SetDone with:', id, !task.completed);
    await API.SetDone(id, !task.completed);
    
    await fetchAll();
    render();
    showToast(task.completed ? 'Задача возобновлена' : 'Задача выполнена');
  } catch (error) {
    console.error('❌ Error toggling task:', error);
    showToast('Ошибка обновления задачи: ' + error.message, 'error');
  }
}

// Рендеринг
function render() {
  renderTaskList();
  renderDetail();
  updateCounts();
}

function renderTaskList() {
  const container = $("#taskList");
  if (!container) return;

  if (state.all.length === 0) {
    container.innerHTML = '<div class="empty">Нет задач</div>';
    return;
  }

  const filtered = getFilteredTasks();
  const sorted = sortTasks(filtered);

  container.innerHTML = sorted.map(task => `
    <div class="note-item ${task.id === state.selectedId ? 'active' : ''} ${task.completed ? 'completed' : ''}" 
         data-id="${task.id}">
      <div class="note-preview">
        <h3 class="note-title">${escapeHtml(task.title)}</h3>
        <div class="note-meta">
          <span class="dot dot-${task.priority}"></span>
          ${task.due_at ? formatDate(task.due_at) : ''}
        </div>
      </div>
    </div>
  `).join('');
}

function renderDetail() {
  const emptyEl = $("#detailEmpty");
  const cardEl = $("#detailCard");
  
  if (!emptyEl || !cardEl) return;

  const task = state.all.find(t => t.id === state.selectedId);
  
  if (!task) {
    emptyEl.hidden = false;
    cardEl.hidden = true;
    return;
  }

  emptyEl.hidden = true;
  cardEl.hidden = false;

  // Заполняем данные
  const title = $("#detailTitle");
  const body = $("#detailBody");
  const due = $("#detailDue");
  const priority = $("#detailPriority");
  const created = $("#detailCreatedAt");
  const toggleBtn = $("#detailToggleDone");

  if (title) title.textContent = task.title;
  if (body) body.textContent = task.body || 'Нет описания';
  if (due) due.textContent = task.due_at ? formatDate(task.due_at) : '—';
  if (priority) priority.textContent = getPriorityText(task.priority);
  if (created) created.textContent = formatDate(task.created_at);
  if (toggleBtn) {
    toggleBtn.textContent = task.completed ? 'Отметить как не выполнено' : 'Отметить как выполнено';
  }
}

function getFilteredTasks() {
  let filtered = state.all;

  // Фильтр по времени
  if (state.filter === 'today') {
    const today = new Date().toDateString();
    filtered = filtered.filter(t => t.due_at && new Date(t.due_at).toDateString() === today);
  } else if (state.filter === 'week') {
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    filtered = filtered.filter(t => t.due_at && new Date(t.due_at) <= weekFromNow);
  } else if (state.filter === 'overdue') {
    const now = new Date();
    filtered = filtered.filter(t => t.due_at && new Date(t.due_at) < now && !t.completed);
  } else if (state.filter === 'completed') {
    filtered = filtered.filter(t => t.completed);
  }

  // Фильтр по приоритету
  if (state.priority) {
    filtered = filtered.filter(t => t.priority === state.priority);
  }

  return filtered;
}

function sortTasks(tasks) {
  return tasks.sort((a, b) => {
    let aVal = a[state.sortBy];
    let bVal = b[state.sortBy];
    
    if (state.sortBy === 'priority') {
      const priorities = { high: 3, medium: 2, low: 1 };
      aVal = priorities[a.priority] || 0;
      bVal = priorities[b.priority] || 0;
    }
    
    if (aVal < bVal) return state.sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return state.sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
}

function updateCounts() {
  const counts = {
    all: state.all.length,
    today: state.all.filter(t => {
      if (!t.due_at) return false;
      const today = new Date().toDateString();
      return new Date(t.due_at).toDateString() === today;
    }).length,
    week: state.all.filter(t => {
      if (!t.due_at) return false;
      const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      return new Date(t.due_at) <= weekFromNow;
    }).length,
    overdue: state.all.filter(t => {
      if (!t.due_at || t.completed) return false;
      return new Date(t.due_at) < new Date();
    }).length,
    completed: state.all.filter(t => t.completed).length
  };

  Object.entries(counts).forEach(([key, count]) => {
    const el = $(`#count${key.charAt(0).toUpperCase() + key.slice(1)}`);
    if (el) el.textContent = count;
  });
}

// Утилиты
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('ru-RU');
}

function getPriorityText(priority) {
  const map = { high: 'Высокий', medium: 'Средний', low: 'Низкий' };
  return map[priority] || priority;
}

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 DOM loaded, initializing...');

  // Кнопка "Новая задача"
  const newTaskBtn = $("#newTaskBtn");
  if (newTaskBtn) {
    newTaskBtn.addEventListener("click", openCreateModal);
    console.log('✅ New task button initialized');
  }

  // Форма создания задачи
  const createForm = $("#createForm");
  if (createForm) {
    createForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      console.log('🎯 Form submitted');

      const saveButton = $("#createSave");
      const title = $("#c_title")?.value?.trim();
      const body = $("#c_body")?.value?.trim();
      const due = $("#c_due")?.value;
      const priority = $("#c_priority")?.value;

      console.log('📝 Form data:', { title, body, due, priority });

      if (!title) {
        showToast("Введите заголовок", "error");
        $("#c_title")?.focus();
        return;
      }

      // Блокируем кнопку
      if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = "Добавление…";
      }

      try {
        const result = await callCreate({
          title,
          body,
          priority,
          due_at: due ? new Date(due).toISOString() : null
        });

        console.log('✅ Task created:', result);
        
        closeCreateModal();
        createForm.reset();
        showToast("Задача добавлена");
        await fetchAll();
        
        // Выбираем новую задачу
        if (result && result.id) {
          state.selectedId = result.id;
        } else if (state.all.length > 0) {
          const lastTask = state.all.reduce((max, task) => 
            task.id > max.id ? task : max, state.all[0]
          );
          state.selectedId = lastTask.id;
        }
        
        render();
      } catch (error) {
        console.error('💥 Error creating task:', error);
        showToast("Не удалось добавить задачу: " + error.message, "error");
      } finally {
        if (saveButton) {
          saveButton.disabled = false;
          saveButton.textContent = "Добавить";
        }
      }
    });
    console.log('✅ Create form initialized');
  }

  // Кнопка отмены создания
  const cancelBtn = $("#createCancel");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", (e) => {
      e.preventDefault();
      closeCreateModal();
      $("#createForm")?.reset();
    });
    console.log('✅ Cancel button initialized');
  }

  // Клик по задаче в списке
  const taskList = $("#taskList");
  if (taskList) {
    taskList.addEventListener("click", (e) => {
      const noteItem = e.target.closest('.note-item');
      if (noteItem) {
        const id = parseInt(noteItem.dataset.id);
        state.selectedId = id;
        render();
      }
    });
    console.log('✅ Task list clicks initialized');
  }

  // Кнопки в детальном просмотре
  const toggleBtn = $("#detailToggleDone");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      if (state.selectedId) {
        toggleTask(state.selectedId);
      }
    });
  }

  const deleteBtn = $("#detailDelete");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      if (state.selectedId && confirm('Удалить задачу?')) {
        deleteTask(state.selectedId);
      }
    });
  }

  // Фильтры в сайдбаре
  $$('[data-filter]').forEach(btn => {
    btn.addEventListener("click", () => {
      $$('.nav-item[data-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.filter = btn.dataset.filter;
      state.priority = null;
      $$('.nav-item[data-priority]').forEach(b => b.classList.remove('active'));
      render();
    });
  });

  $$('[data-priority]').forEach(btn => {
    btn.addEventListener("click", () => {
      $$('.nav-item[data-priority]').forEach(b => b.classList.remove('active'));
      if (state.priority === btn.dataset.priority) {
        state.priority = null;
      } else {
        btn.classList.add('active');
        state.priority = btn.dataset.priority;
      }
      render();
    });
  });

  // Сортировка
  const sortBy = $("#sort_by");
  const sortOrder = $("#sort_order");
  if (sortBy) {
    sortBy.addEventListener("change", () => {
      state.sortBy = sortBy.value;
      render();
    });
  }
  if (sortOrder) {
    sortOrder.addEventListener("change", () => {
      state.sortOrder = sortOrder.value;
      render();
    });
  }

  // Кнопка обновления
  const reloadBtn = $("#reload");
  if (reloadBtn) {
    reloadBtn.addEventListener("click", async () => {
      reloadBtn.disabled = true;
      reloadBtn.textContent = "Обновление...";
      try {
        await fetchAll();
        render();
        showToast("Список обновлен");
      } finally {
        reloadBtn.disabled = false;
        reloadBtn.textContent = "Обновить";
      }
    });
  }

  // Закрытие модалки по ESC и клику вне
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const modal = $("#createModal");
      if (modal && !modal.classList.contains("hidden")) {
        closeCreateModal();
      }
    }
  });

  const modal = $("#createModal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeCreateModal();
      }
    });
  }

  // Загружаем данные при старте
  console.log('🔄 Loading initial data...');
  fetchAll().then(() => {
    render();
    console.log('✅ App initialized successfully!');
  }).catch(err => {
    console.error('❌ Failed to load initial data:', err);
    showToast('Ошибка загрузки данных', 'error');
  });
});