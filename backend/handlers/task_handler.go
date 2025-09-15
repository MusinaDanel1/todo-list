package handlers

import (
	"context"
	"time"

	"todo-list/backend/models"
	"todo-list/backend/services"
)

// TaskHandler — слой delivery (биндится в Wails).
type TaskHandler struct {
	svc *services.TaskService
}

func NewTaskHandler(svc *services.TaskService) *TaskHandler { return &TaskHandler{svc: svc} }

// DTOs, видимые фронту (Wails)
type CreateTaskReq struct {
	Title    string     `json:"title"`
	Priority string     `json:"priority"`
	DueAt    *time.Time `json:"due_at"`
}

type ListReq struct {
	Status    string `json:"status"`
	DateScope string `json:"date_scope"`
	SortBy    string `json:"sort_by"`
	SortOrder string `json:"sort_order"`
}

func (h *TaskHandler) CreateTask(req CreateTaskReq) (*models.Task, error) {
	return h.svc.CreateTask(context.Background(), req.Title, req.Priority, req.DueAt)
}

func (h *TaskHandler) DeleteTask(id int64) error {
	return h.svc.DeleteTask(context.Background(), id)
}

func (h *TaskHandler) SetDone(id int64, done bool) error {
	return h.svc.SetDone(context.Background(), id, done)
}

func (h *TaskHandler) List(req ListReq) ([]models.Task, error) {
	f := models.TaskFilter{
		Status:    req.Status,
		DateScope: req.DateScope,
		SortBy:    req.SortBy,
		SortOrder: req.SortOrder,
	}
	return h.svc.ListTasks(context.Background(), f)
}
