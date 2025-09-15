package services

import (
	"context"
	"errors"
	"strings"
	"time"

	"todo-list/backend/models"
	"todo-list/backend/repositories"
)

type TaskService struct {
	repo repositories.TaskRepository
}

func NewTaskService(repo repositories.TaskRepository) *TaskService {
	return &TaskService{repo: repo}
}

func (s *TaskService) CreateTask(ctx context.Context, title string, priority string, dueAt *time.Time) (*models.Task, error) {
	title = strings.TrimSpace(title)
	if title == "" {
		return nil, errors.New("title is required")
	}
	p := models.Priority(priority)
	if p != models.PriorityLow && p != models.PriorityMedium && p != models.PriorityHigh {
		p = models.PriorityMedium
	}
	t := &models.Task{
		Title:    title,
		Done:     false,
		Priority: p,
		DueAt:    dueAt,
	}
	if _, err := s.repo.Create(ctx, t); err != nil {
		return nil, err
	}
	return t, nil
}

func (s *TaskService) DeleteTask(ctx context.Context, id int64) error {
	return s.repo.Delete(ctx, id)
}

func (s *TaskService) SetDone(ctx context.Context, id int64, done bool) error {
	return s.repo.SetDone(ctx, id, done)
}

func (s *TaskService) ListTasks(ctx context.Context, f models.TaskFilter) ([]models.Task, error) {
	// значения по умолчанию
	if f.Status == "" {
		f.Status = "all"
	}
	if f.DateScope == "" {
		f.DateScope = "all"
	}
	if f.SortBy == "" {
		f.SortBy = "created_at"
	}
	if f.SortOrder == "" {
		f.SortOrder = "desc"
	}
	if f.Now.IsZero() {
		f.Now = time.Now()
	}
	return s.repo.List(ctx, f)
}
