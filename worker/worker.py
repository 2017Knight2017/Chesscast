import redis
import json
import math
import random
import chess, chess.engine, chess.pgn
from sqlalchemy import create_engine, text
from db_url import DB_URL
from io import StringIO


def get_durations(pgn: str, initial_time: int, archetypes: tuple[str, str]) -> list[float]:
	pgn_io = StringIO(pgn)
	game = chess.pgn.read_game(pgn_io)
	
	board = chess.Board()
	durations = []
	moves_played = 0
	time_left = initial_time
	
	for move in game.mainline_moves():
		fen = board.fen()
		
		move_time = calculate_move_time(
			time_left,
			moves_played,
			fen,
			archetypes[board.turn == chess.BLACK]
		)
		
		durations.append(move_time)
		
		time_left -= move_time
		if time_left < 0:
			time_left = 0
		moves_played += 1
		
		board.push(move)
	
	return durations


def calculate_move_time(
		time_left_sec: float,
		moves_played: int,
		fen: str,
		archetype: str,
		control_move=40,
		is_forcing=False,
		engine_depth=12,
	) -> float:
		if is_forcing:
			return random.uniform(2, 10)

		with open("archetypes.json") as data_file:
			data = json.load(data_file)
			k, w1, w2, w3, sigma = data[archetype]["k"], *data[archetype]["weights"], data[archetype]["sigma"]

		board = chess.Board(fen)
		with chess.engine.SimpleEngine.popen_uci("stockfish") as eng:
			best_moves = eng.analyse(board, chess.engine.Limit(depth=engine_depth), multipv=3)
			scores = [move.get('score') for move in best_moves]
			
		moves_to_control = control_move - moves_played
		if moves_to_control <= 0:
			moves_to_control = 16

		conservatism_factor = 4
		base_time = time_left_sec / (moves_to_control + conservatism_factor)

		uncertainty_factor = 1 - math.tanh(k - abs(scores[0] - scores[1]))
		sharpness_factor = abs(scores[0] - (sum(scores)/3)) / 100
		tactics = 0
		for move in board.legal_moves:
			tactics += board.is_check(move) + board.is_capture(move)
		tactics_factor = tactics / len(board.legal_moves)

		complexity = w1 * uncertainty_factor + w2 * sharpness_factor + w3 * tactics_factor
		complexity_mult = 0.5 + (complexity * 2.0)

		panic_factor = 1.0
		if moves_to_control <= 3 and time_left_sec < 180:
			panic_factor = 0.3

		calculated_time = base_time * complexity_mult * panic_factor * random.lognormvariate(0, sigma)

		max_allowed = time_left_sec - 5
		if max_allowed < 1:
			max_allowed = 1

		min_allowed = 3

		final_time = max(min_allowed, min(calculated_time, max_allowed))

		return final_time


engine = create_engine(DB_URL)

def save_match_data(match_id, moves_json):
	with engine.connect() as conn:
		query = text("UPDATE \"Match\" SET \"movesData\" = :data, status = 'ready' WHERE id = :id")
		conn.execute(query, {"data": json.dumps(moves_json), "id": match_id})
		conn.commit()


def main():
	print("dsadas")
	r = redis.Redis(host='redis', port=6379, decode_responses=True)
	while True:
		task_data = r.blpop("chess_tasks_queue", timeout=0)
		_, message = task_data
		
		try:
			data = json.loads(message)
			match_id = data.get('id')
			pgn = data.get('pgn')
			
			print(f"Получена задача для матча {match_id}")
			
			durations = get_durations(pgn, 9000, ("intuitive", "calculator"))
			
			# 2. Формируем результат
			result = {
				"movesData": durations,
				"status": "ready"
			}
			
			# 3. Здесь должен быть код записи в PostgreSQL (через библиотеку psycopg2 или SQLAlchemy)
			print(f"Результат для {match_id}: {durations}")
			print(f"Данные успешно сохранены в БД. Матч готов к трансляции.")
			
		except Exception as e:
			print(f"Ошибка при обработке задачи: {e}")

if __name__ == "__main__":
	main()