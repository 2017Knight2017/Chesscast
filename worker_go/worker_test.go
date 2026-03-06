package main

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/joho/godotenv"
)

func TestProcessGame(t *testing.T) {
	_ = godotenv.Load()

	// Если .env нет, принудительно ставим дефолт для теста, чтобы не было ошибки "scheme"
	if os.Getenv("BACKEND_URL") == "" {
		os.Setenv("BACKEND_URL", "http://localhost:3000")
	}
	if os.Getenv("STOCKFISH_PATH") == "" {
		// Укажите свой реальный путь для тестов
		os.Setenv("STOCKFISH_PATH", "C:/Users/yaros/Downloads/stockfish-windows-x86-64-avx2/stockfish/stockfish-windows-x86-64-avx2.exe")
	}
	// 1. Подготовка данных
	pgn := `1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7`
	matchID := "test_match_001"
	initialTime := 600 // 10 минут
	archetypes := []string{"attacker", "pragmatic"}

	// 2. Имитация окружения (если нужно)
	// В данном случае мы просто вызываем функцию
	fmt.Println("Начинаем тест обработки игры...")

	err := ProcessGame(matchID, pgn, initialTime, archetypes)

	if err != nil {
		t.Errorf("Ошибка при обработке игры: %v", err)
	}
}

func TestReportAnalysis(t *testing.T) {
	// Создаем тестовый сервер, который заменяет ваш бэкенд
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Проверяем, что метод POST
		if r.Method != http.MethodPost {
			t.Errorf("Ожидался POST, пришел %s", r.Method)
		}
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status": "ok"}`))
	}))
	defer server.Close()

	// Временно подменяем URL бэкенда на URL тестового сервера
	os.Setenv("BACKEND_URL", server.URL)

	// Вызываем вашу функцию
	evals := []int{10, 20}
	durs := []float64{3.5, 4.2}
	notes := []string{"e4", "e5"}

	reportAnalysis("test-id", evals, durs, notes)
}
