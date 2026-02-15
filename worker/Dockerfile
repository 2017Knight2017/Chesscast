FROM python:3.14-slim

RUN apt-get update && apt-get install -y --no-install-recommends stockfish && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Установка зависимостей
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Запуск вашего скрипта (например, worker.py)
CMD ["python", "-u", "worker.py"]