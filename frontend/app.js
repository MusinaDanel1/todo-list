// Импорты
import 'wailsjs/runtime';
import * as API from 'wailsjs/go/handlers/TaskHandler';

// Утилиты
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const B = () => API;

// Вспомогательные функции
function showToast(msg, type="info") {
  const host = $("#toastHost");
  if (!host) {
    console.error('Toast host not found');
    return;
  }
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  if (type === "error") {
    el.style.borderColor = "color-mix(in oklab, var(--danger) 35%, var(--hairline))";
  }
  host.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

// Функции для модального окна
function closeCreateModal() {
  $("#createModal")?.classList.add("hidden");
}

// Простая функция создания задачи
async function callCreate({title, body, priority, due_at}) {
  console.log('🔄 callCreate started with:', { title, body, priority, due_at });
  
  const fn = B().CreateTask;
  if (!fn) {
    console.error('❌ CreateTask function not found');
    throw new Error('CreateTask function not available');
  }
  
  return fn({
    title: title,
    body: body || '',
    priority: priority || 'medium',
    due_at: due_at || null
  });
}

// Обработчик отправки формы
$("#createForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  console.log('🎯 Form submitted');

  // Получаем кнопку сохранения
  const saveButton = $("#createSave");
  if (!saveButton) {
    console.error('❌ Save button not found');
    return;
  }

  // Собираем данные формы
  const title = $("#c_title")?.value?.trim();
  const body = $("#c_body")?.value?.trim();
  const due = $("#c_due")?.value;
  const priority = $("#c_priority")?.value;

  console.log('📝 Form data:', { title, body, due, priority });

  // Валидация
  if (!title) {
    showToast("Введите заголовок", "error");
    $("#c_title")?.focus();
    return;
  }

  // Блокируем кнопку
  saveButton.disabled = true;
  saveButton.textContent = "Добавление…";

  try {
    // Вызываем API
    const result = await callCreate({
      title,
      body,
      priority,
      due_at: due ? new Date(due).toISOString() : null
    });

    console.log('✅ Task created:', result);
    
    // Закрываем модальное окно и обновляем список
    closeCreateModal();
    showToast("Задача добавлена");
    await fetchAll();
    
    // Выбираем новую задачу
    const last = state.all.reduce((m,t)=> t.id>m.id ? t : m, state.all[0] || null);
    if (last) {
      state.selectedId = last.id;
    }
    
    render();
  } catch (error) {
    console.error('💥 Error creating task:', error);
    showToast("Не удалось добавить задачу", "error");
  } finally {
    // Разблокируем кнопку
    saveButton.disabled = false;
    saveButton.textContent = "Добавить";
  }
});