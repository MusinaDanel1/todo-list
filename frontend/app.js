import { GetTasks, AddTask } from "./wailsjs/go/handlers/TaskHandler.js";

document.addEventListener("DOMContentLoaded", () => {
  const taskList = document.getElementById("taskList");
  const addBtn = document.getElementById("addTaskBtn");

  async function loadTasks() {
    const tasks = await GetTasks();
    taskList.innerHTML = "";
    tasks.forEach(task => {
      const li = document.createElement("li");
      li.className = "task-item";
      li.innerHTML = `
        <span>${task.title} – ${task.priority} (due: ${task.due_date?.split("T")[0] || "—"})</span>
      `;
      taskList.appendChild(li);
    });
  }

  addBtn.addEventListener("click", async () => {
    const task = {
      title: document.getElementById("title").value,
      description: document.getElementById("description").value,
      due_date: document.getElementById("dueDate").value,
      priority: document.getElementById("priority").value,
      status: "pending"
    };
    await AddTask(task);
    await loadTasks();
  });

  loadTasks();
});

async function loadTasks() {
  const tasks = await GetTasks();
  taskList.innerHTML = "";

  tasks.forEach(task => {
    const li = document.createElement("li");
    li.className = "task-item";
    if (task.status === "done") li.classList.add("completed");

    li.innerHTML = `
      <span>${task.title} – ${task.priority} (due: ${task.due_date?.split("T")[0] || "—"})</span>
      <button class="complete-btn">✔</button>
      <button class="delete-btn">✖</button>
    `;

    li.querySelector(".complete-btn").addEventListener("click", async () => {
      task.status = task.status === "done" ? "pending" : "done";
      await AddTask(task); 
      await loadTasks();
    });

    li.querySelector(".delete-btn").addEventListener("click", async () => {
      await DeleteTask(task.id); 
      await loadTasks();
    });

    taskList.appendChild(li);
  });
}

