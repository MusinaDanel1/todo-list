package services

import (
	"todo-list/backend/models"
	"todo-list/backend/repositories"
)

type TaskService struct{}

func NewTaskService() *TaskService {
	return &TaskService{}
}

func (s *TaskService) GetAllTasks() ([]models.Task, error) {
	return repositories.GetAllTasks()
}

func (s *TaskService) CreateTaskFromModel(task models.Task) (models.Task, error) {
	id, err := repositories.CreateTask(task)
	if err != nil {
		return models.Task{}, err
	}
	task.ID = id
	return task, nil
}

func (s *TaskService) UpdateTask(task models.Task) (models.Task, error) {
	if err := repositories.UpdateTask(task); err != nil {
		return models.Task{}, err
	}
	return task, nil
}

func (s *TaskService) DeleteTask(id int) error {
	return repositories.DeleteTask(id)
}

func (s *TaskService) ToggleTaskStatus(id int) error {
	return repositories.ToggleTask(id)
}

func (s *TaskService) GetTaskByID(id int) (models.Task, error) {
	return repositories.GetTaskByID(id)
}
