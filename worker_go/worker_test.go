package main

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/joho/godotenv"
)

func TestProcessGame(t *testing.T) {
	_ = godotenv.Load()

	if os.Getenv("BACKEND_URL") == "" {
		os.Setenv("BACKEND_URL", "http://localhost:3000")
	}

	pgn := `1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7`
	matchID := "test_match_001"
	initialTime := 600
	controlMove := 40
	timeIncrement := 0
	isRepeatable := false
	bonusTimeMin := 30
	nextControlAfter := 16
	newIncrement := 30
	archetypes := []string{"attacker", "pragmatic"}

	fmt.Println("Начинаем тест обработки игры...")

	ctx := context.Background()
	err := ProcessGame(ctx, matchID, pgn, initialTime, controlMove, timeIncrement, isRepeatable, bonusTimeMin, nextControlAfter, newIncrement, archetypes)

	if err != nil {
		t.Errorf("Ошибка при обработке игры: %v", err)
	}
}

func TestReportAnalysis(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Errorf("Ожидался POST, пришел %s", r.Method)
		}
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status": "ok"}`))
	}))
	defer server.Close()

	os.Setenv("BACKEND_URL", server.URL)

	evals := []int{10, 20}
	durs := []float64{3.5, 4.2}
	notes := []string{"e4", "e5"}
	outcome := "1/2-1/2"

	reportAnalysis("test-id", evals, durs, notes, outcome)
}
