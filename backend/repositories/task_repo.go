package repositories

import (
	"todo-list/backend/db"
	"todo-list/backend/models"
)

func GetAllTasks() ([]models.Task, error) {
	tasks := []models.Task{}
	err := db.DB.Select(&tasks, "SELECT * FROM tasks ORDER BY created_at DESC")
	return tasks, err
}

func CreateTask(task models.Task) (int, error) {
	var id int
	err := db.DB.QueryRow(
		`INSERT INTO tasks (title, description, status, priority, due_date)
		 VALUES ($1, $2, $3, $4, $5) RETURNING id`,
		task.Title, task.Description, task.Status, task.Priority, task.DueDate,
	).Scan(&id)
	return id, err
}

func GetTaskByID(id int) (models.Task, error) {
	var t models.Task
	err := db.DB.Get(&t, "SELECT * FROM tasks WHERE id=$1", id)
	return t, err
}

func UpdateTask(task models.Task) error {
	_, err := db.DB.Exec(
		`UPDATE tasks
		 SET title=$1,
		     description=$2,
		     status=$3,
		     priority=$4,
		     due_date=$5,
		     updated_at = NOW()
		 WHERE id=$6`,
		task.Title, task.Description, task.Status, task.Priority, task.DueDate, task.ID,
	)
	return err
}

func DeleteTask(id int) error {
	_, err := db.DB.Exec("DELETE FROM tasks WHERE id=$1", id)
	return err
}

func ToggleTask(id int) error {
	_, err := db.DB.Exec(
		`UPDATE tasks
		 SET status = CASE WHEN status = 'completed' THEN 'active' ELSE 'completed' END,
		     updated_at = NOW()
		 WHERE id = $1`, id,
	)
	return err
}
