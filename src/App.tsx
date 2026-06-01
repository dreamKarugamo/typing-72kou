import { useState, useEffect, useCallback, useRef } from "react";
import { seasonalData } from "./data";
import type { MainData } from "./types";
import { generateCandidates, matchInput } from "./Romantable";
import "./App.css";

export default function App() {
    const [state, setState] = useState<"start" | "playing" | "result">("start");
    const [questions, setQuestions] = useState<MainData[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [typed, setTyped] = useState(""); // 現在の単語で入力済みのローマ字
    const [candidates, setCandidates] = useState<string[]>([]); // 現在の単語の全ローマ字候補
    const [missCount, setMissCount] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [totalKeysPressed, setTotalKeysPressed] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [playedHistory, setPlayedHistory] = useState<MainData[]>([]);

    const typedRef = useRef<HTMLSpanElement>(null);
    const [offsetX, setOffsetX] = useState(0);
    const timerRef = useRef<number | null>(null);

    const clearTimer = () => {
        if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };


    // タイピング表示の横スクロールオフセット計算
    useEffect(() => {
        if (typedRef.current) {
            setOffsetX(-typedRef.current.offsetWidth);
        } else {
            setOffsetX(0);
        }
    }, [typed, currentIndex]);

    const startGame = () => {
        clearTimer();
        const shuffled = [...seasonalData];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setQuestions(shuffled);
        setCurrentIndex(0);
        setMissCount(0);
        setCorrectCount(0);
        setTotalKeysPressed(0);
        setTimeLeft(60);
        setPlayedHistory([shuffled[0]]);
        setState("playing");

        // 最初の問題の候補を生成
        const cands = generateCandidates(shuffled[0].reading);
        setCandidates(cands);
        setTyped("");
    };

    useEffect(() => {
        if (state === "playing") {
            timerRef.current = window.setInterval(() => {
                setTimeLeft((p) => {
                    if (p <= 1) {
                        clearTimer();
                        setState("result");
                        return 0;
                    }
                    return p - 1;
                });
            }, 1000);
        }
        return clearTimer;
    }, [state]);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (state !== "playing" || e.key.length !== 1) return;

            const newTyped = typed + e.key;
            const { isValid, matched } = matchInput(newTyped, candidates);

            if (!isValid) {
                // ミス
                setMissCount((m) => m + 1);
                return;
            }

            // 正打
            setCorrectCount((c) => c + 1);
            setTotalKeysPressed((t) => t + 1);

            if (matched !== null) {
                // 単語クリア → 次の問題へ
                const nxt = (currentIndex + 1) % questions.length;
                setQuestions((prev) => {
                    setPlayedHistory((hist) => [...hist, prev[nxt]]);
                    return prev;
                });
                setCurrentIndex(nxt);
                // 次の問題の候補を生成
                const nextCands = generateCandidates(questions[nxt].reading);
                setCandidates(nextCands);
                setTyped("");
            } else {
                // 途中まで一致 → 入力を蓄積
                setTyped(newTyped);
            }
        },
        [state, typed, candidates, currentIndex, questions],
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    // ---- 表示用：現在最も「進んでいる」候補を代表として選ぶ ----
    // typed をプレフィックスとして持つ候補の中で最短のものを表示代表にする
    const displayCandidate =
        candidates.find((c) => c.startsWith(typed)) ?? candidates[0] ?? "";

    if (state === "start") {
        return (
            <div className="ts-container">
                <div className="ts-card">
                    <h1 className="ts-title">
                        七十二候
                        <br />
                        タイピング
                    </h1>
                    <p className="ts-subtitle">六十秒の刹那、四季を綴る</p>
                    <button className="ts-button" onClick={startGame}>
                        スタート
                    </button>
                </div>
            </div>
        );
    }

    if (state === "playing") {
        const q = questions[currentIndex];
        const typedPart = displayCandidate.slice(0, typed.length);
        const targetChar = displayCandidate.slice(typed.length, typed.length + 1);
        const untypedPart = displayCandidate.slice(typed.length + 1);

        return (
            <div className="ts-container">
                <div className="ts-progress">
                    残り時間: {timeLeft}秒 | 正答: {correctCount}
                </div>
                <div className="ts-card">
                    <div className="ts-kanjiWord">{q.word}</div>
                    <div className="ts-yomi">{q.reading}</div>

                    <div className="ts-typingDisplayWrapper">
                        <div
                            className="ts-typingDisplayInner"
                            style={{ transform: `translateX(${offsetX}px)` }}
                        >
                            <span ref={typedRef} className="ts-typed">
                                {typedPart}
                            </span>
                            <span className="ts-target">{targetChar}</span>
                            <span className="ts-untyped">{untypedPart}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (state === "result") {
        const playedSeconds = 60 - timeLeft;

        const calculatedWPM =
            playedSeconds > 0
                ? Math.floor((totalKeysPressed / playedSeconds) * 60)
                : 0;

        const accuracy =
            correctCount + missCount > 0
                ? Math.floor((correctCount / (correctCount + missCount)) * 100)
                : 0;

        return (
            <div className="ts-container">
                <div className="ts-card">
                    <h2 className="ts-title">鑑定結果</h2>

                    <div className="ts-resultStats">
                        <div className="ts-statItem">
                            <span className="ts-statLabel">
                                WPM (打鍵数/分)
                            </span>
                            <span className="ts-statValue">
                                {calculatedWPM}
                            </span>
                        </div>
                        <div className="ts-statItem">
                            <span className="ts-statLabel">正確性</span>
                            <span className="ts-statValue">{accuracy}%</span>
                        </div>
                    </div>

                    <div
                        style={{
                            fontSize: "0.85rem",
                            color: "var(--color-text-sub)",
                            textAlign: "center",
                            margin: "15px 0",
                        }}
                    >
                        <span>正答キー: {totalKeysPressed}回</span>
                        <span style={{ marginLeft: "15px" }}>
                            ミスキー: {missCount}回
                        </span>
                    </div>

                    <div className="ts-resultListContainer">
                        <div className="ts-resultList">
                            <p
                                style={{
                                    color: "var(--color-text-sub)",
                                    marginBottom: "10px",
                                    textAlign: "center",
                                }}
                            >
                                あなたの打った候
                            </p>
                            {playedHistory.map((h, i) => (
                                <div key={i} className="ts-resultItem">
                                    <span className="ts-marker">◆</span>
                                    <strong>
                                        {h.during} {h.word}
                                    </strong>
                                    <span
                                        style={{
                                            marginLeft: "10px",
                                            fontSize: "0.9rem",
                                            color: "var(--color-text-sub)",
                                        }}
                                    >
                                        （{h.reading}）
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <button
                        className="ts-button"
                        onClick={() => setState("start")}
                    >
                        最初に戻る
                    </button>
                </div>
            </div>
        );
    }
    return null;
}