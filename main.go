package main

import (
	"embed"
	"log"
	"todo-list/backend/db"
	"todo-list/backend/handlers"
	"todo-list/backend/repositories"
	"todo-list/backend/services"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
)

var assets embed.FS

func main() {
	database := db.MustOpen()
	repo := repositories.NewPGTaskRepository(database)
	svc := services.NewTaskService(repo)
	h := handlers.NewTaskHandler(svc)

	if err := wails.Run(&options.App{
		Title:  "ToDo List",
		Width:  1100,
		Height: 720,
		Assets: assets,
		Bind: []interface{}{
			h,
		},
	}); err != nil {
		log.Fatal(err)
	}
}
