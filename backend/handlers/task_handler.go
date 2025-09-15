package handlers

import (
	"context"
	"time"

	"todo-list/backend/models"
	"todo-list/backend/services"
)

type TaskHandler struct {
	svc *services.TaskService
}

func NewTaskHandler(svc *services.TaskService) *TaskHandler { return &TaskHandler{svc: svc} }

type CreateTaskReq struct {
	Title    string     `json:"title"`
	Body     string     `json:"body"`
	Priority string     `json:"priority"`
	DueAt    *time.Time `json:"due_at"`
}

type ListReq struct {
	Status    string `json:"status"`
	DateScope string `json:"date_scope"`
	SortBy    string `json:"sort_by"`
	SortOrder string `json:"sort_order"`
}

type TaskInput struct {
	Title    string `json:"title"`
	Body     string `json:"body"`
	Priority string `json:"priority"`
	DueAt    string `json:"due_at,omitempty"`
}

func (h *TaskHandler) CreateTask(input TaskInput) (*models.Task, error) {
	var dueAt *time.Time
	if input.DueAt != "" {
		if t, err := time.Parse(time.RFC3339, input.DueAt); err == nil {
			dueAt = &t
		}
	}

	return h.svc.CreateTask(context.Background(), input.Title, input.Body, input.Priority, dueAt)
}

func (h *TaskHandler) DeleteTask(id int64) error {
	return h.svc.DeleteTask(context.Background(), id)
}

func (h *TaskHandler) SetDone(id int64, done bool) error {
	return h.svc.SetDone(context.Background(), id, done)
}

func (h *TaskHandler) List() ([]models.Task, error) {
	f := models.TaskFilter{
		Status:    "all",
		DateScope: "all",
		SortBy:    "created_at",
		SortOrder: "desc",
	}
	return h.svc.ListTasks(context.Background(), f)
}
