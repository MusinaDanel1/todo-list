package handlers

import (
	"todo-list/backend/models"
	"todo-list/backend/services"
)

type TaskHandler struct {
	svc *services.TaskService
}

func NewTaskHandler(svc *services.TaskService) *TaskHandler {
	return &TaskHandler{svc: svc}
}

func (h *TaskHandler) GetTasks() ([]models.Task, error) {
	return h.svc.GetAllTasks()
}

func (h *TaskHandler) AddTask(task models.Task) (models.Task, error) {
	return h.svc.CreateTaskFromModel(task)
}

func (h *TaskHandler) UpdateTask(task models.Task) (models.Task, error) {
	return h.svc.UpdateTask(task)
}

func (h *TaskHandler) DeleteTask(id int) error {
	return h.svc.DeleteTask(id)
}

func (h *TaskHandler) ToggleTask(id int) error {
	return h.svc.ToggleTaskStatus(id)
}

func (h *TaskHandler) GetTask(id int) (models.Task, error) {
	return h.svc.GetTaskByID(id)
}
