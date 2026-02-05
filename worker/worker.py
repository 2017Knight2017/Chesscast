import redis
import time

# Имя хоста 'redis' совпадает с именем сервиса в docker-compose
r = redis.Redis(host='redis', port=6379, decode_responses=True)

print("Worker started. Waiting for tasks...")

while True:
    # Пример: просто пишем в консоль раз в 10 секунд
    print("Worker is alive and checking Redis...")
    time.sleep(10)