package db

import (
	"fmt"
	"log"
	"os"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

var DB *sqlx.DB

func InitDB() {
	connStr := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		getEnv("DB_HOST", "localhost"),
		getEnv("DB_PORT", "5432"),
		getEnv("DB_USER", "todo_user"),
		getEnv("DB_PASSWORD", "todo_pass"),
		getEnv("DB_NAME", "todo_list"),
	)

	var err error
	DB, err = sqlx.Connect("postgres", connStr)
	if err != nil {
		log.Fatalf("Не удалось подключиться к базе: %v", err)
	}

	fmt.Println("✅ Подключение к базе успешно")
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
