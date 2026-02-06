import redis
import json
import time
from sqlalchemy import create_engine, text
from db_url import DB_URL


# Подключение к Redis
# В Docker используй хост 'redis', локально — 'localhost'
r = redis.Redis(host='localhost', port=6379, decode_responses=True)

def simulate_chess_calc(pgn):
    """
    Твоя функция симуляции. 
    Принимает PGN, возвращает список секунд на каждый ход.
    """
    print(f"--- Начало обработки PGN ---")
    # Имитируем сложный расчет (например, анализ движком)
    time.sleep(2) 
    
    # Допустим, мы распарсили PGN и для каждого хода решили, 
    # сколько он длился в реальности.
    # В реальности тут будет твой скрипт.
    mock_durations = [10, 15, 8, 20, 5, 30] 
    return mock_durations


engine = create_engine(DB_URL)

def save_match_data(match_id, moves_json):
    with engine.connect() as conn:
        # Обновляем запись, которую создал NestJS
        query = text("UPDATE \"Match\" SET \"movesData\" = :data, status = 'ready' WHERE id = :id")
        conn.execute(query, {"data": json.dumps(moves_json), "id": match_id})
        conn.commit()

def main():
    print("Worker запущен и ждет задач в очереди 'chess_tasks_queue'...")
    
    while True:
        # blpop — блокирующее чтение. 
        # Если очередь пуста, скрипт ждет здесь. 0 — ждать вечно.
        task_data = r.blpop("chess_tasks_queue", timeout=0)
        
        # task_data[0] - имя очереди, task_data[1] - само сообщение
        queue_name, message = task_data
        
        try:
            data = json.loads(message)
            match_id = data.get('id')
            pgn = data.get('pgn')
            
            print(f"Получена задача для матча {match_id}")
            
            # 1. Считаем времена
            durations = simulate_chess_calc(pgn)
            
            # 2. Формируем результат
            result = {
                "match_id": match_id,
                "durations": durations,
                "status": "ready"
            }
            
            # 3. Здесь должен быть код записи в PostgreSQL (через библиотеку psycopg2 или SQLAlchemy)
            print(f"Результат для {match_id}: {durations}")
            print(f"Данные успешно сохранены в БД. Матч готов к трансляции.")
            
        except Exception as e:
            print(f"Ошибка при обработке задачи: {e}")

if __name__ == "__main__":
    main()