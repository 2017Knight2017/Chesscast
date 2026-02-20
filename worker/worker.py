import asyncio
import json
import math
import random
import chess, chess.engine, chess.pgn
import os
import requests
from bullmq import Worker
from io import StringIO


def get_durations(pgn: str, initial_time: int, archetypes: tuple[str, str]) -> list[float]:
	pgn_io = StringIO(pgn)
	game = chess.pgn.read_game(pgn_io)
	
	notation = [move.uci() for move in game.mainline_moves()]
	board = chess.Board()
	durations = []
	evaluations = []
	moves_played = 0
	time_left = initial_time
	
	for move in game.mainline_moves():
		fen = board.fen()
		
		with open("archetypes.json") as data_file:
			data = json.load(data_file)
			bias_white = {
				"k": data[archetypes[0]]["k"],
				"w1": data[archetypes[0]]["weights"][0],
				"w2": data[archetypes[0]]["weights"][1],
				"w3": data[archetypes[0]]["weights"][2],
				"sigma": data[archetypes[0]]["sigma"]
			}
			bias_black = {
				"k": data[archetypes[1]]["k"],
				"w1": data[archetypes[1]]["weights"][0],
				"w2": data[archetypes[1]]["weights"][1],
				"w3": data[archetypes[1]]["weights"][2],
				"sigma": data[archetypes[1]]["sigma"]
			}

		evaluation, move_time = calculate_move_time(
			time_left,
			moves_played,
			fen,
			bias_white if board.turn == chess.WHITE else bias_black
		)
		print(evaluation)
		evaluations.append(evaluation)
		durations.append(move_time)
		
		time_left -= move_time
		if time_left < 0:
			time_left = 0
		moves_played += 1
		print(f"Ход {moves_played}")
		board.push(move)
	
	return evaluations, durations, notation


def normalize_evaluations(info_list: list[chess.engine.InfoDict], mate_ceiling=30000):
	cp_values = []
		
	mate_stats = {
		"winning_lines": 0,
		"losing_lines": 0,
		"closest_win": float('inf'),
		"closest_loss": float('inf')
	}

	if not info_list:
		return [0], mate_stats

	for i, info in enumerate(info_list):
		score_obj = info["score"].relative
		
		if score_obj.is_mate():
			moves_to_mate = score_obj.mate()
			
			if moves_to_mate > 0:
				val = mate_ceiling - (moves_to_mate * 100)
				
				mate_stats["winning_lines"] += 1
				mate_stats["closest_win"] = min(mate_stats["closest_win"], moves_to_mate)
				
			else:
				abs_moves = abs(moves_to_mate)
				val = -mate_ceiling + (abs_moves * 100)
				
				mate_stats["losing_lines"] += 1
				mate_stats["closest_loss"] = min(mate_stats["closest_loss"], abs_moves)
		
		else:
			val = score_obj.score()
			if val is None: val = 0 
			
			val = max(min(val, 1500), -1500)

		cp_values.append(val)

	while len(cp_values) < 3:
		last_val = cp_values[-1] if cp_values else 0
		padding = last_val - 100 if last_val > -29000 else last_val
		cp_values.append(padding)

	return cp_values, mate_stats
	

def calculate_move_time(
		time_left_sec: float,
		moves_played: int,
		fen: str,
		bias: tuple[float, float, float, float, float],
		control_move=40,
		engine_depth=12,
	) -> tuple[float, float]:
		
		board = chess.Board(fen)
			
		moves_to_control = control_move - moves_played
		if moves_to_control <= 0:
			moves_to_control = 16

		conservatism_factor = 4
		base_time = time_left_sec / (moves_to_control + conservatism_factor)

		with chess.engine.SimpleEngine.popen_uci("../usr/games/stockfish") as eng:
			info = eng.analyse(board, chess.engine.Limit(depth=engine_depth), multipv=3)

		vals, stats = normalize_evaluations(info)

		e1, e2 = vals[0], vals[1]

		delta = abs(e1 - e2)
		uncertainty_factor = 1 - math.tanh(bias["k"] * delta)

		if stats["winning_lines"] >= 2:
			uncertainty_factor *= 0.1 

		if stats["closest_win"] == 1:
			uncertainty_factor = 0

		sharpness_factor = abs(e1 - (sum(vals))/3) / 100
		tactics = sum(1 for move in board.legal_moves if board.is_capture(move))

		for move in board.legal_moves:
			board.push(move)
			if board.is_check():
				tactics += 1
			board.pop()

		tactics_factor = tactics / board.legal_moves.count()

		complexity = bias["w1"] * uncertainty_factor + bias["w2"] * sharpness_factor + bias["w3"] * tactics_factor
		complexity_mult = 0.5 + (complexity * 2.0)

		panic_factor = 1.0
		if moves_to_control <= 3 and time_left_sec < 180:
			panic_factor = 0.3

		calculated_time = base_time * complexity_mult * panic_factor * random.lognormvariate(0, bias["sigma"])

		max_allowed = time_left_sec - 5
		if max_allowed < 1:
			max_allowed = 1

		min_allowed = 3

		final_time = max(min_allowed, min(calculated_time, max_allowed))

		return e1 if board.turn == chess.WHITE else e1 * -1, final_time


def report_analysis(match_id: str, evaluations: list[int], durations: list[float], notation: list[str]):
	url = f"{os.getenv('BACKEND_URL')}/matches/{match_id}/report"
	print(evaluations)
	payload = {
		"evaluations": evaluations,
		"durations": list(map(lambda x: int(x * 1000), durations)),
		"notation": notation
	}
	try:
		response = requests.post(url, json=payload, timeout=5)
		response.raise_for_status()
		return response.json()
	except requests.exceptions.RequestException as e:
		print(f"Ошибка при связи с бэкендом: {e}")
		return None

async def process_job(job, job_token):
	print(f"Обработка задачи {job.id}")

	loop = asyncio.get_event_loop()

	try:
		match_id = job.data.get('id')
		pgn = job.data.get('pgn')
		archetypes = job.data.get('archetypes')
		print(f"Получена задача для матча {match_id}")
		evaluations, durations, notation = await loop.run_in_executor(None, get_durations, pgn, 1000, archetypes)
		report_analysis(match_id, evaluations, durations, notation)
		
	except Exception as e:
		print(f"Ошибка при обработке задачи: {e}")

async def main():
	redis_opts = {"host":"redis", "port":6379}

	worker = Worker("analysis", process_job, {"connection": redis_opts, "concurrency": 1})
	try:
		await asyncio.Future() 
	except (KeyboardInterrupt, asyncio.CancelledError):
		print("Воркер останавливается...")
	finally:
		await worker.close()

if __name__ == "__main__":
	asyncio.run(main())