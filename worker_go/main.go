package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/redis/go-redis/v9"
)

func main() {
	redisAddr := os.Getenv("REDIS_URL")
	queueName := "analysis"

	// 2. Подключение к Redis
	rdb := redis.NewClient(&redis.Options{
		Addr: redisAddr,
	})

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Обработка сигналов завершения
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sigChan
		fmt.Println("\n[MAIN] Получен сигнал завершения, останавливаем воркер...")
		cancel()
	}()

	fmt.Printf("[MAIN] Воркер запущен. Очередь: %s, Redis: %s\n", queueName, redisAddr)

	// 3. Цикл обработки задач
	// BullMQ хранит активные задачи в Redis List: bull:<queueName>:wait
	bullQueueKey := fmt.Sprintf("bull:%s:wait", queueName)

	for {
		select {
		case <-ctx.Done():
			return
		default:
			// Используем BRPop для блокирующего чтения (ожидание задачи 5 секунд)
			// BRPOP возвращает [ключ, job_id]
			result, err := rdb.BRPop(ctx, 5*time.Second, bullQueueKey).Result()
			if err != nil {
				if err == redis.Nil {
					continue // Таймаут, просто пробуем снова
				}
				log.Printf("[ERROR] Ошибка чтения из Redis: %v", err)
				time.Sleep(2 * time.Second)
				continue
			}

			jobID := result[1]
			jobKey := fmt.Sprintf("bull:%s:%s", queueName, jobID)

			// Получаем данные задачи из Redis хеша
			jobData, err := rdb.HGetAll(ctx, jobKey).Result()
			if err != nil {
				log.Printf("[ERROR] Не удалось получить данные задачи %s: %v", jobID, err)
				continue
			}

			if len(jobData) == 0 {
				// Отладка: ищем похожие ключи в Redis
				log.Printf("[DEBUG] Job ID: %s, Job Key: %s", jobID, jobKey)

				// Пытаемся найти какие-то ключи по паттерну
				keys, err := rdb.Keys(ctx, fmt.Sprintf("bull:%s:job:*", queueName)).Result()
				if err == nil && len(keys) > 0 {
					log.Printf("[DEBUG] Найдены ключи: %v", keys[:min(len(keys), 3)])
				}

				log.Printf("[ERROR] Данные задачи %s не найдены в Redis", jobID)
				continue
			}

			// Отладка: выводим все поля задачи
			fmt.Printf("[DEBUG] Поля задачи %s: %v\n", jobID, jobData)

			// Парсим JSON из поля "data"
			var jobDataPayload struct {
				MatchID     string   `json:"id"`
				PGN         string   `json:"pgn"`
				InitialTime int      `json:"time_control"`
				Archetypes  []string `json:"archetypes"`
			}

			if dataStr, exists := jobData["data"]; exists {
				if err := json.Unmarshal([]byte(dataStr), &jobDataPayload); err != nil {
					log.Printf("[ERROR] Не удалось распарсить данные задачи: %v", err)
					continue
				}
			} else {
				log.Printf("[ERROR] Поле 'data' не найдено в задаче %s", jobID)
				continue
			}

			fmt.Printf("[MAIN] Получена задача %s для матча %s\n", jobID, jobDataPayload.MatchID)

			// 4. Запуск обработки из worker.go
			err = ProcessGame(
				jobDataPayload.MatchID,
				jobDataPayload.PGN,
				jobDataPayload.InitialTime,
				jobDataPayload.Archetypes,
			)

			if err != nil {
				log.Printf("[ERROR] Ошибка при обработке игры %s: %v", jobDataPayload.MatchID, err)
				// Здесь можно реализовать логику перемещения в bull:<queueName>:failed
			} else {
				fmt.Printf("[SUCCESS] Матч %s успешно обработан\n", jobDataPayload.MatchID)
			}
		}
	}
}
