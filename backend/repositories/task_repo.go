package repositories

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"todo-list/backend/models"

	_ "github.com/jackc/pgx/v5/stdlib"
)

type TaskRepository interface {
	Create(ctx context.Context, t *models.Task) (int64, error)
	Get(ctx context.Context, id int64) (*models.Task, error)
	Delete(ctx context.Context, id int64) error
	SetDone(ctx context.Context, id int64, done bool) error
	List(ctx context.Context, f models.TaskFilter) ([]models.Task, error)
}

type PGTaskRepository struct {
	DB *sql.DB
}

func NewPGTaskRepository(db *sql.DB) *PGTaskRepository { return &PGTaskRepository{DB: db} }

func (r *PGTaskRepository) Create(ctx context.Context, t *models.Task) (int64, error) {
	row := r.DB.QueryRowContext(ctx, `
		INSERT INTO tasks (title, body, done, priority, due_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, created_at, updated_at
	`, t.Title, t.Body, t.Done, string(t.Priority), t.DueAt)
	if err := row.Scan(&t.ID, &t.CreatedAt, &t.UpdatedAt); err != nil {
		return 0, err
	}
	return t.ID, nil
}

func (r *PGTaskRepository) Get(ctx context.Context, id int64) (*models.Task, error) {
	var t models.Task
	var pr string
	var due sql.NullTime

	err := r.DB.QueryRowContext(ctx, `
		SELECT id, title, body, done, priority, due_at, created_at, updated_at
		FROM tasks WHERE id=$1
	`, id).Scan(&t.ID, &t.Title, &t.Body, &t.Done, &pr, &due, &t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		return nil, err
	}
	if due.Valid {
		t.DueAt = &due.Time
	}
	t.Priority = models.Priority(pr)
	return &t, nil
}

func (r *PGTaskRepository) Delete(ctx context.Context, id int64) error {
	_, err := r.DB.ExecContext(ctx, `DELETE FROM tasks WHERE id=$1`, id)
	return err
}

func (r *PGTaskRepository) SetDone(ctx context.Context, id int64, done bool) error {
	_, err := r.DB.ExecContext(ctx, `UPDATE tasks SET done=$1, updated_at=NOW() WHERE id=$2`, done, id)
	return err
}

func (r *PGTaskRepository) List(ctx context.Context, f models.TaskFilter) ([]models.Task, error) {
	clauses := []string{"1=1"}
	args := []any{}
	i := 1

	// status
	switch f.Status {
	case "active":
		clauses = append(clauses, "done=false")
	case "completed":
		clauses = append(clauses, "done=true")
	}

	// date scope
	now := f.Now
	if now.IsZero() {
		now = time.Now()
	}
	startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	// конец недели — до следующего понедельника (или текущего +7д)
	weekEnd := startOfDay.AddDate(0, 0, int(7-startOfDay.Weekday()))
	if f.DateScope == "today" {
		clauses = append(clauses, fmt.Sprintf("due_at IS NOT NULL AND due_at >= $%d AND due_at < $%d", i, i+1))
		args = append(args, startOfDay, startOfDay.Add(24*time.Hour))
		i += 2
	} else if f.DateScope == "week" {
		clauses = append(clauses, fmt.Sprintf("due_at IS NOT NULL AND due_at >= $%d AND due_at < $%d", i, i+1))
		args = append(args, startOfDay, weekEnd)
		i += 2
	} else if f.DateScope == "overdue" {
		clauses = append(clauses, fmt.Sprintf("due_at IS NOT NULL AND due_at < $%d AND done=false", i))
		args = append(args, now)
		i++
	}

	// sorting
	var sortCol string
	switch f.SortBy {
	case "due_at":
		sortCol = "due_at NULLS LAST"
	case "priority":
		// сортировка по приоритету в иерархическом порядке
		sortCol = "CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END"
	default:
		sortCol = "created_at"
	}
	order := strings.ToUpper(f.SortOrder)
	if order != "ASC" && order != "DESC" {
		order = "DESC"
	}

	query := fmt.Sprintf(`
		SELECT id, title, body, done, priority, due_at, created_at, updated_at
		FROM tasks
		WHERE %s
		ORDER BY %s %s, id DESC
	`, strings.Join(clauses, " AND "), sortCol, order)

	rows, err := r.DB.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []models.Task
	for rows.Next() {
		var t models.Task
		var pr string
		var due sql.NullTime
		if err := rows.Scan(&t.ID, &t.Title, &t.Body, &t.Done, &pr, &due, &t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, err
		}
		if due.Valid {
			t.DueAt = &due.Time
		}
		t.Priority = models.Priority(pr)
		out = append(out, t)
	}
	return out, rows.Err()
}
