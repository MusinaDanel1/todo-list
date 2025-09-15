package main

import (
	"embed"
	"log"
	"todo-list/backend/db"
	"todo-list/backend/handlers"
	"todo-list/backend/services"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
)

var assets embed.FS

func main() {
	db.InitDB()

	taskService := services.NewTaskService()
	taskHandler := handlers.NewTaskHandler(taskService)

	err := wails.Run(&options.App{
		Title:  "Todo List",
		Width:  900,
		Height: 700,
		Assets: assets,
		Bind: []interface{}{
			taskHandler,
		},
	})

	if err != nil {
		log.Fatal(err)
	}
}
