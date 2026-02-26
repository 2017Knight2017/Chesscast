import pytest
import json
import os
from unittest.mock import MagicMock, patch
import chess.engine
from worker import get_durations

@pytest.fixture(autouse=True)
def setup_archetypes():
	data = {
		"aggressive": {
			"k": 0.005,
			"weights": [0.4, 0.3, 0.3],
			"sigma": 0.1
		},
		"passive": {
			"k": 0.002,
			"weights": [0.2, 0.2, 0.6],
			"sigma": 0.05
		}
	}
	with open("archetypes_mock.json", "w") as f:
		json.dump(data, f)
	yield
	if os.path.exists("archetypes_mock.json"):
		os.remove("archetypes_mock.json")


@pytest.fixture
def mock_engine():
	with patch("chess.engine.SimpleEngine.popen_uci") as mock_popen:
		mock_eng = MagicMock()
		mock_popen.return_value.__enter__.return_value = mock_eng
		
		mock_score = MagicMock()
		mock_score.relative.is_mate.return_value = False
		mock_score.relative.score.return_value = 50
		
		info_item = {"score": mock_score}
		mock_eng.analyse.return_value = [info_item, info_item, info_item]
		
		yield mock_eng


def test_get_durations_basic(mock_engine):
	"""Тест базовой работоспособности на короткой PGN строке"""
	pgn_str = "1. e4 e5 2. Nf3 Nc6" 
	initial_time = 600
	archetypes = ("aggressive", "passive")
		
	evals, durations, notation = get_durations(pgn_str, initial_time, archetypes, archetypes_path="archetypes_mock.json")
		
	# Проверки
	assert len(evals) == 4
	assert len(durations) == 4
	assert len(notation) == 4
	assert all(isinstance(d, float) for d in durations)
	assert all(d > 0 for d in durations)
	assert sum(durations) < initial_time


def test_get_durations_empty_pgn(mock_engine):
	"""Тест с пустой партией"""
	pgn_str = "*" 
	evals, durations, notation = get_durations(pgn_str, 100, ("aggressive", "aggressive"), archetypes_path="archetypes_mock.json")
		
	assert len(evals) == 0
	assert len(durations) == 0
	assert len(notation) == 0


def test_time_management_limits(mock_engine):
	"""Проверка, что финальное время не превышает остаток и не меньше лимита"""
	pgn_str = "1. e4"
	initial_time = 10
	archetypes = ("aggressive", "aggressive")
		
	evals, durations, notation = get_durations(pgn_str, initial_time, archetypes, archetypes_path="archetypes_mock.json")
		
	assert durations[0] >= 3
	assert durations[0] <= max(1, initial_time - 5)


@pytest.mark.parametrize("archetype_pair", [
	("aggressive", "aggressive"),
	("passive", "passive"),
])
def test_different_archetypes(mock_engine, archetype_pair):
	"""Проверка работы с разными архетипами из конфига"""
	pgn_str = "1. d4 d5"
	evals, durations, notation = get_durations(pgn_str, 1000, archetype_pair, archetypes_path="archetypes_mock.json")
	assert len(durations) == 2
		

def test_real_game(mock_engine):
	"""Тест на реальной партии (Капабланка - Алехин, Гавана 1927)"""
	pgn_str = (
		"""[Event "Capablanca - Alekhine World Championship Match"]
[Site "Buenos Aires ARG"]
[Date "1927.09.16"]
[EventDate "?"]
[Round "1"]
[Result "0-1"]
[White "Jose Raul Capablanca"]
[Black "Alexander Alekhine"]
[ECO "C01"]
[WhiteElo "?"]
[BlackElo "?"]
[PlyCount "86"]

1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. exd5 exd5 5. Bd3 Nc6
6. Ne2 Nge7 7. O-O Bf5 8. Bxf5 Nxf5 9. Qd3 Qd7 10. Nd1 O-O
11. Ne3 Nxe3 12. Bxe3 Rfe8 13. Nf4 Bd6 14. Rfe1 Nb4 15. Qb3 Qf5
16. Rac1 Nxc2 17. Rxc2 Qxf4 18. g3 Qf5 19. Rce2 b6 20. Qb5 h5
21. h4 Re4 22. Bd2 Rxd4 23. Bc3 Rd3 24. Be5 Rd8 25. Bxd6 Rxd6
26. Re5 Qf3 27. Rxh5 Qxh5 28. Re8+ Kh7 29. Qxd3+ Qg6 30. Qd1 Re6
31. Ra8 Re5 32. Rxa7 c5 33. Rd7 Qe6 34. Qd3+ g6 35. Rd8 d4
36. a4 Re1+ 37. Kg2 Qc6+ 38. f3 Re3 39. Qd1 Qe6 40. g4 Re2+
41. Kh3 Qe3 42. Qh1 Qf4 43. h5 Rf2 0-1"""
	)
	initial_time = 7200
	archetypes = ("passive", "aggressive")
	evals, durations, notation = get_durations(pgn_str, initial_time, archetypes, archetypes_path="archetypes_mock.json")
	print(f"{evals = }\n{durations = }\n{notation = }")
	input()
	
	assert True
		