package models

import "time"

type Priority string

const (
	PriorityLow    Priority = "low"
	PriorityMedium Priority = "medium"
	PriorityHigh   Priority = "high"
)

type Task struct {
	ID        int64      `json:"id"`
	Title     string     `json:"title"`
	Done      bool       `json:"done"`
	Priority  Priority   `json:"priority"`
	DueAt     *time.Time `json:"due_at,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

type TaskFilter struct {
	Status    string    // all | active | completed
	DateScope string    // all | today | week | overdue
	SortBy    string    // created_at | due_at | priority
	SortOrder string    // asc | desc
	Now       time.Time // для детерминированных выборок/тестов
}
