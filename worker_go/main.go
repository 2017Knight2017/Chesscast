package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/redis/go-redis/v9"
)

func main() {
	redisAddr := os.Getenv("REDIS_URL")
	queueName := "analysis"

	rdb := redis.NewClient(&redis.Options{
		Addr: redisAddr,
	})

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sigChan
		fmt.Println("\n[MAIN] Получен сигнал завершения, останавливаем воркер...")
		cancel()
	}()

	fmt.Printf("[MAIN] Воркер запущен. Очередь: %s, Redis: %s\n", queueName, redisAddr)

	bullQueueKey := fmt.Sprintf("bull:%s:wait", queueName)

	maxWorkers := 4
	sem := make(chan struct{}, maxWorkers)
	var wg sync.WaitGroup

	for {
		select {
		case <-ctx.Done():
			fmt.Println("[MAIN] Ожидание завершения активных задач...")
			wg.Wait()
			return
		default:
			result, err := rdb.BRPop(ctx, 5*time.Second, bullQueueKey).Result()
			if err != nil {
				if err == redis.Nil {
					continue
				}
				log.Printf("[ERROR] Ошибка чтения из Redis: %v", err)
				time.Sleep(2 * time.Second)
				continue
			}

			jobID := result[1]
			jobKey := fmt.Sprintf("bull:%s:%s", queueName, jobID)

			jobData, err := rdb.HGetAll(ctx, jobKey).Result()
			if err != nil {
				log.Printf("[ERROR] Не удалось получить данные задачи %s: %v", jobID, err)
				continue
			}

			if len(jobData) == 0 {
				log.Printf("[ERROR] Данные задачи %s не найдены в Redis", jobID)
				continue
			}

			type JobDataPayload struct {
				MatchID              string   `json:"id"`
				PGN                  string   `json:"pgn"`
				InitialTime          int      `json:"time_control"`
				ControlMove          *int     `json:"control_move"`
				TimeIncrement        int      `json:"time_increment"`
				BonusTimeMin         *int     `json:"bonus_time_min"`
				NextControlMoveAfter *int     `json:"next_control_move_after"`
				NewTimeIncrement     *int     `json:"new_time_increment"`
				Archetypes           []string `json:"archetypes"`
			}

			var jobDataPayload JobDataPayload

			if dataStr, exists := jobData["data"]; exists {
				if err := json.Unmarshal([]byte(dataStr), &jobDataPayload); err != nil {
					log.Printf("[ERROR] Не удалось распарсить данные задачи: %v", err)
					continue
				}
			} else {
				log.Printf("[ERROR] Поле 'data' не найдено в задаче %s", jobID)
				continue
			}

			fmt.Printf("[MAIN] Задача %s для матча %s передана в обработку\n", jobID, jobDataPayload.MatchID)
			fmt.Print(jobDataPayload)

			sem <- struct{}{}
			wg.Add(1)
			go func(payload JobDataPayload) {
				defer func() {
					<-sem
					wg.Done()
				}()

				err := ProcessGame(
					ctx,
					payload.MatchID,
					payload.PGN,
					payload.InitialTime,
					payload.ControlMove,
					payload.TimeIncrement,
					payload.BonusTimeMin,
					payload.NextControlMoveAfter,
					payload.NewTimeIncrement,
					payload.Archetypes,
				)

				if err != nil {
					log.Printf("[ERROR] Ошибка при обработке игры %s: %v", payload.MatchID, err)
				} else {
					fmt.Printf("[SUCCESS] Матч %s успешно обработан\n", payload.MatchID)
				}
			}(jobDataPayload)
		}
	}
}
