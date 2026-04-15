package main

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math"
	"math/rand"
	"net/http"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"time"

	"github.com/notnil/chess"
)

type Archetype struct {
	K       float64   `json:"k"`
	Weights []float64 `json:"weights"`
	Sigma   float64   `json:"sigma"`
}

type Bias struct {
	K     float64
	W1    float64
	W2    float64
	W3    float64
	Sigma float64
}

var archetypesCache map[string]Archetype

type ReportPayload struct {
	Evaluations   []int    `json:"evaluations"`
	TimeRemaining []int    `json:"timeRemaining"`
	Notation      []string `json:"notation"`
	Outcome       string   `json:"outcome"`
}

type MateStats struct {
	WinningLines int
	LosingLines  int
	ClosestWin   int
	ClosestLoss  int
}

type MatchData struct {
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

var logger *log.Logger

const VIRTUAL_CONTROL = 40
const VIRTUAL_MOVES_TILL_END = 15

func init() {
	logFile, err := os.OpenFile("worker.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to open log file: %v\n", err)
		logger = log.New(os.Stdout, "[WORKER] ", log.LstdFlags|log.Lshortfile)
	} else {
		logger = log.New(logFile, "[WORKER] ", log.LstdFlags|log.Lshortfile)
	}

	logger.Println("=== Worker started ===")
	loadArchetypes("archetypes.json")
}

func loadArchetypes(path string) {
	data, err := os.ReadFile(path)
	if err != nil {
		logger.Printf("Warning: failed to load %s: %v", path, err)
		return
	}
	err = json.Unmarshal(data, &archetypesCache)
	if err != nil {
		logger.Fatalf("Failed to parse archetypes: %v", err)
	}
	logger.Printf("Archetypes loaded successfully (total: %d)", len(archetypesCache))
}

func getBias(name string) Bias {
	arch, ok := archetypesCache[name]
	if !ok {
		return Bias{K: 1.0, W1: 1.0, W2: 1.0, W3: 1.0, Sigma: 0.5}
	}
	return Bias{
		K:     arch.K,
		W1:    arch.Weights[0],
		W2:    arch.Weights[1],
		W3:    arch.Weights[2],
		Sigma: arch.Sigma,
	}
}

func getAbsoluteMax(initialTimeSec, timeLeftSec float64) float64 {
	limitByInitial := initialTimeSec * 0.15
	if initialTimeSec < 300 {
		limitByInitial = initialTimeSec * 0.25
	}

	limitByCurrent := timeLeftSec * 0.4

	hardCeiling := 2400.0

	absMax := math.Min(limitByInitial, limitByCurrent)
	absMax = math.Min(absMax, hardCeiling)

	jitter := 0.95 + (rand.Float64() * 0.1)

	return absMax * jitter
}

func ProcessGame(
	ctx context.Context,
	matchID string,
	pgn string,
	initialTime int,
	controlMoveSrc *int,
	timeIncrement int,
	bonusTimeMinSrc *int,
	nextControlAfterSrc *int,
	newIncrementSrc *int,
	archNames []string,
) error {
	var controlMove, bonusTimeMin, newIncrement, nextControlAfter int
	if controlMoveSrc != nil && bonusTimeMinSrc != nil && newIncrementSrc != nil {
		controlMove = *controlMoveSrc
		bonusTimeMin = *bonusTimeMinSrc
		newIncrement = *newIncrementSrc
	} else {
		controlMove = 0
		bonusTimeMin = 0
		newIncrement = 0
	}
	if nextControlAfterSrc != nil {
		nextControlAfter = *nextControlAfterSrc
	} else {
		nextControlAfter = 0
	}

	logger.Printf("Processing match %s with archetypes %v", matchID, archNames)

	biasWhite := getBias(archNames[0])
	biasBlack := getBias(archNames[1])

	scanner := chess.NewScanner(strings.NewReader(pgn))
	if !scanner.Scan() {
		return fmt.Errorf("failed to read PGN or file is empty")
	}

	game := scanner.Next()
	board := chess.NewGame(chess.UseNotation(chess.AlgebraicNotation{}))
	moves := game.Moves()

	timesRemaining := make([]int, 0, len(moves))
	evaluations := make([]int, 0, len(moves))
	notation := make([]string, 0, len(moves))
	isRepeatable := nextControlAfter != 0

	clocks := map[chess.Color]float64{
		chess.White: float64(initialTime),
		chess.Black: float64(initialTime),
	}

	lastComplexities := map[chess.Color]float64{
		chess.White: 1.0,
		chess.Black: 1.0,
	}

	nextControlForPlayer := map[chess.Color]int{
		chess.White: controlMove * 2,
		chess.Black: controlMove * 2,
	}

	currentIncrement := float64(timeIncrement)
	movesPlayed := 0
	openingTill := rand.Intn(8) + 10
	isControlMoveReached := false

	engPath := "/usr/games/stockfish"
	eng, err := NewLongLivedEngine(ctx, engPath)
	if err != nil {
		return fmt.Errorf("failed to start engine: %v", err)
	}
	defer eng.Close()

	logger.Printf("Processing %d half-moves. Engine path: %s", len(moves), engPath)

	for _, move := range moves {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		currentPlayer := board.Position().Turn()
		moveText := chess.AlgebraicNotation{}.Encode(board.Position(), move)
		notation = append(notation, moveText)

		var movesToControl int
		if controlMove == 0 || (isControlMoveReached && !isRepeatable) {
			plannedTotalMoves := VIRTUAL_CONTROL
			movesToControl = max(VIRTUAL_MOVES_TILL_END, plannedTotalMoves-(movesPlayed/2))
		} else {
			movesToControl = (nextControlForPlayer[currentPlayer] - movesPlayed) / 2
			if movesToControl <= 0 {
				movesToControl = 1
			}
		}

		var eval int
		var moveTime float64
		var complexityMult float64
		var err error

		fen := board.Position().String()
		currentBias := biasWhite
		if currentPlayer == chess.Black {
			currentBias = biasBlack
		}

		eval, moveTime, complexityMult, err = calculateMoveTimeWithEngine(
			ctx, eng, clocks[currentPlayer], movesToControl, fen,
			currentBias, lastComplexities[currentPlayer], math.Min(float64(initialTime)*0.025, clocks[currentPlayer]*0.05),
			getAbsoluteMax(float64(initialTime), clocks[currentPlayer]),
		)
		if err != nil {
			return err
		}

		if movesPlayed < openingTill {
			moveTime *= 0.05
		}

		evaluations = append(evaluations, eval)
		lastComplexities[currentPlayer] = complexityMult

		clocks[currentPlayer] -= moveTime
		clocks[currentPlayer] += currentIncrement

		if clocks[currentPlayer] < 0 {
			clocks[currentPlayer] = 0
		}

		if controlMove > 0 && (movesPlayed+1) == nextControlForPlayer[currentPlayer] {
			clocks[currentPlayer] += float64(bonusTimeMin * 60)

			if isRepeatable {
				nextControlForPlayer[currentPlayer] += nextControlAfter * 2
			} else {
				isControlMoveReached = true
			}

			currentIncrement = float64(newIncrement)
		}

		timeRemainingMs := int(clocks[currentPlayer] * 1000)
		timesRemaining = append(timesRemaining, timeRemainingMs)

		movesPlayed++
		board.Move(move)
	}

	reportAnalysis(matchID, evaluations, timesRemaining, notation, string(game.Outcome()))
	logger.Printf("Match %s processed: %d half-moves", matchID, len(evaluations))
	return nil
}

func parseEngineOutput(output string) ([]int, MateStats) {
	lines := strings.Split(output, "\n")
	cpValues := []int{}
	stats := MateStats{ClosestWin: math.MaxInt32, ClosestLoss: math.MaxInt32}
	mateCeiling := 30000

	maxDepth := 0
	multipvLines := make(map[int][]int)

	for _, line := range lines {
		if strings.Contains(line, "info") && strings.Contains(line, "score") {
			parts := strings.Fields(line)
			depth := 0
			multipv := 1
			score := 0
			scoreKind := ""

			for i, p := range parts {
				switch p {
				case "depth":
					if i+1 < len(parts) {
						depth, _ = strconv.Atoi(parts[i+1])
					}
				case "multipv":
					if i+1 < len(parts) {
						multipv, _ = strconv.Atoi(parts[i+1])
					}
				case "score":
					if i+2 < len(parts) {
						scoreKind = parts[i+1]
						score, _ = strconv.Atoi(parts[i+2])
					}
				}
			}

			if depth > maxDepth {
				maxDepth = depth
			}

			if scoreKind != "" {
				var cpVal int
				switch scoreKind {
				case "mate":
					if score > 0 {
						cpVal = mateCeiling - (score * 100)
						stats.WinningLines++
						if score < stats.ClosestWin {
							stats.ClosestWin = score
						}
					} else {
						absScore := int(math.Abs(float64(score)))
						cpVal = -mateCeiling + (absScore * 100)
						stats.LosingLines++
						if absScore < stats.ClosestLoss {
							stats.ClosestLoss = absScore
						}
					}
				case "cp":
					cpVal = score
					if cpVal > 1500 {
						cpVal = 1500
					}
					if cpVal < -1500 {
						cpVal = -1500
					}
				}

				if multipvLines[multipv] == nil {
					multipvLines[multipv] = make([]int, 0)
				}
				multipvLines[multipv] = append(multipvLines[multipv], cpVal)
			}
		}
	}

	for multipv := 1; multipv <= 3; multipv++ {
		if scores, ok := multipvLines[multipv]; ok && len(scores) > 0 {
			cpValues = append(cpValues, scores[len(scores)-1])
		}
	}

	for len(cpValues) < 3 {
		lastVal := 0
		if len(cpValues) > 0 {
			lastVal = cpValues[len(cpValues)-1]
		}
		padding := lastVal
		if lastVal > -29000 {
			padding -= 100
		}
		cpValues = append(cpValues, padding)
	}

	return cpValues, stats
}

type LongLivedEngine struct {
	cmd     *exec.Cmd
	stdin   io.WriteCloser
	stdout  io.ReadCloser
	reader  *bufio.Reader
	running bool
}

func NewLongLivedEngine(ctx context.Context, path string) (*LongLivedEngine, error) {
	logger.Printf("Creating engine: %s", path)
	cmd := exec.CommandContext(ctx, path)

	stdin, err := cmd.StdinPipe()
	if err != nil {
		return nil, err
	}

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, err
	}

	logger.Println("Starting engine...")
	err = cmd.Start()
	if err != nil {
		return nil, err
	}

	eng := &LongLivedEngine{
		cmd:     cmd,
		stdin:   stdin,
		stdout:  stdout,
		reader:  bufio.NewReader(stdout),
		running: true,
	}

	fmt.Fprintln(eng.stdin, "uci")

	if err := eng.waitFor(ctx, "uciok", 5*time.Second); err != nil {
		eng.Close()
		return nil, err
	}

	fmt.Fprintf(eng.stdin, "setoption name MultiPV value 3\n")

	logger.Println("Engine initialized successfully")
	return eng, nil
}

func (eng *LongLivedEngine) Close() error {
	eng.running = false
	fmt.Fprintln(eng.stdin, "quit")
	eng.stdin.Close()
	eng.stdout.Close()
	return eng.cmd.Wait()
}

func (eng *LongLivedEngine) readLineWithTimeout(ctx context.Context, timeout time.Duration) (string, error) {
	done := make(chan string, 1)
	errChan := make(chan error, 1)

	go func() {
		line, err := eng.reader.ReadString('\n')
		if err != nil {
			errChan <- err
		} else {
			done <- strings.TrimSpace(line)
		}
	}()

	select {
	case <-ctx.Done():
		return "", ctx.Err()
	case line := <-done:
		return line, nil
	case err := <-errChan:
		return "", err
	case <-time.After(timeout):
		return "", fmt.Errorf("timeout reading from engine")
	}
}

func (eng *LongLivedEngine) waitFor(ctx context.Context, marker string, timeout time.Duration) error {
	deadline := time.Now().Add(timeout)

	for {
		remaining := time.Until(deadline)
		if remaining <= 0 {
			return fmt.Errorf("timeout waiting for %s", marker)
		}

		line, err := eng.readLineWithTimeout(ctx, remaining)
		if err != nil {
			return err
		}

		if strings.Contains(line, marker) {
			return nil
		}
	}
}

func (eng *LongLivedEngine) analyzePosition(ctx context.Context, fen string) ([]int, MateStats, error) {
	fmt.Fprintf(eng.stdin, "position fen %s\n", fen)
	fmt.Fprintln(eng.stdin, "go depth 16")

	var lines []string
	deadline := time.Now().Add(15 * time.Second)

	for {
		remaining := time.Until(deadline)
		if remaining <= 0 {
			return nil, MateStats{}, fmt.Errorf("timeout waiting for bestmove")
		}

		line, err := eng.readLineWithTimeout(ctx, remaining)
		if err != nil {
			return nil, MateStats{}, err
		}

		lines = append(lines, line)
		if strings.Contains(line, "bestmove") {
			vals, stats := parseEngineOutput(strings.Join(lines, "\n"))
			return vals, stats, nil
		}
	}
}

func calculateMoveTimeWithEngine(ctx context.Context, eng *LongLivedEngine, timeLeftSec float64, movesToControl int, fen string, bias Bias, lastComplexity float64, targetMoveTime float64, absoluteMax float64) (int, float64, float64, error) {
	survival_base := timeLeftSec / float64(movesToControl+4)
	baseTime := targetMoveTime
	if targetMoveTime > timeLeftSec*0.15 {
		ratio := min(1.0, (timeLeftSec*0.15)/targetMoveTime)
		baseTime = (targetMoveTime * ratio) + (survival_base * (1 - ratio))
	}

	vals, stats, err := eng.analyzePosition(ctx, fen)
	if err != nil {
		return 0, 0, 0, err
	}

	e1, e2 := float64(vals[0]), float64(vals[1])
	delta := math.Abs(e1 - e2)
	uncertaintyFactor := 1.0 - math.Tanh(bias.K*delta)

	if stats.WinningLines >= 2 {
		uncertaintyFactor *= 0.1
	}
	if stats.ClosestWin == 1 {
		uncertaintyFactor = 0
	}

	sumVals := float64(vals[0] + vals[1] + vals[2])
	sharpnessFactor := math.Abs(e1-(sumVals/3.0)) / 100.0

	fenFunc, err := chess.FEN(fen)
	if err != nil {
		return 0, 0, 0, fmt.Errorf("failed to parse FEN: %v", err)
	}

	game := chess.NewGame(fenFunc)

	evalRet := vals[0]
	if game.Position().Turn() == chess.Black {
		evalRet = -evalRet
	}

	validMoves := game.ValidMoves()
	if len(validMoves) == 1 {
		return evalRet, 4.0 + rand.Float64()*2.0, 0.0, nil
	}

	tactics := 0
	for _, m := range validMoves {
		if m.HasTag(chess.Capture) || m.HasTag(chess.Check) {
			tactics++
		}
	}

	tacticsFactor := 0.0
	if len(validMoves) > 0 {
		tacticsFactor = float64(tactics) / float64(len(validMoves))
	}

	complexity := bias.W1*uncertaintyFactor + bias.W2*sharpnessFactor + bias.W3*tacticsFactor
	complexityMult := 0.2 + math.Pow(complexity*2.5, 1.8)
	finalComplexity := complexityMult*0.8 + lastComplexity*0.2

	panicFactor := 1.0
	if movesToControl <= 3 && timeLeftSec < 180 {
		panicFactor = 0.3
	}

	logNorm := math.Exp(rand.NormFloat64() * bias.Sigma)

	calculatedTime := baseTime * finalComplexity * panicFactor * logNorm
	finalTime := math.Max(3.0, math.Min(calculatedTime, absoluteMax))
	finalTime = math.Min(finalTime, timeLeftSec-0.5)
	if finalTime < 0.1 {
		finalTime = 0.1
	}

	return evalRet, finalTime, complexityMult, nil
}

func reportAnalysis(matchID string, evaluations []int, timesRemaining []int, notation []string, outcome string) {
	url := fmt.Sprintf("%s/matches/%s/report", os.Getenv("BACKEND_URL"), matchID)
	logger.Printf("Sending report for match %s to URL: %s", matchID, url)

	if outcome == "*" {
		outcome = "1/2-1/2"
	}

	payload := ReportPayload{
		Evaluations:   evaluations,
		TimeRemaining: timesRemaining,
		Notation:      notation,
		Outcome:       outcome,
	}

	data, err := json.Marshal(payload)
	if err != nil {
		logger.Printf("Marshaling error: %v", err)
		return
	}

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Post(url, "application/json", bytes.NewBuffer(data))
	if err != nil {
		logger.Printf("Failed to communicate with backend: %v", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		logger.Printf("Backend returned error: %s", resp.Status)
	} else {
		logger.Printf("Report sent successfully! (%d half-moves processed)", len(evaluations))
	}
}
