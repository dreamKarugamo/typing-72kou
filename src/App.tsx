import { useState, useEffect, useCallback, useRef } from 'react';
import { seasonalData } from './data';
import type { MainData } from './types';
import './App.css';

export default function App() {
    const [state, setState] = useState<'start' | 'playing' | 'result'>('start');
    const [questions, setQuestions] = useState<MainData[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [inputIndex, setInputIndex] = useState(0);
    const [missCount, setMissCount] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
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

    useEffect(() => {
        if (typedRef.current) {
            setOffsetX(-typedRef.current.offsetWidth);
        } else {
            setOffsetX(0);
        }
    }, [inputIndex, currentIndex]);

    const startGame = () => {
        clearTimer();
        const shuffled = [...seasonalData];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        setQuestions(shuffled);
        setCurrentIndex(0);
        setInputIndex(0);
        setMissCount(0);
        setCorrectCount(0);
        setTimeLeft(60);
        setPlayedHistory([shuffled[0]]);
        setState('playing');
    };

    useEffect(() => {
        if (state === 'playing') {
            timerRef.current = window.setInterval(() => {
                setTimeLeft((p) => {
                    if (p <= 1) {
                        clearTimer();
                        setState('result');
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

            const q = questions[currentIndex];
            const typingStr = q.typing;
            const target = typingStr[inputIndex];

            let isCorrect = false;
            let advance = 1;

            // 入力揺れ吸収 (tsu/tu, shi/si等)
            if (e.key === target) isCorrect = true;
            else if (
                target === "h" &&
                typingStr[inputIndex - 1] === "s" &&
                e.key === typingStr[inputIndex + 1]
            ) {
                isCorrect = true;
                advance = 2;
            } else if (
                target === "s" &&
                typingStr[inputIndex - 1] === "t" &&
                e.key === typingStr[inputIndex + 1]
            ) {
                isCorrect = true;
                advance = 2;
            } else if (
                target === "h" &&
                typingStr[inputIndex - 1] === "c" &&
                e.key === typingStr[inputIndex + 1]
            ) {
                isCorrect = true;
                advance = 2;
            } else if (
                target === "f" &&
                e.key === "h" &&
                typingStr[inputIndex + 1] === "u"
            )
                isCorrect = true;

            if (isCorrect) {
                setCorrectCount((c) => c + 1);
                const nextIdx = inputIndex + advance;
                if (nextIdx < typingStr.length) {
                    setInputIndex(nextIdx);
                } else {
                    const nxt = (currentIndex + 1) % questions.length;
                    setPlayedHistory((prev) => [...prev, questions[nxt]]);
                    setCurrentIndex(nxt);
                    setInputIndex(0);
                }
            } else {
                setMissCount((m) => m + 1);
            }
        },
        [state, questions, currentIndex, inputIndex],
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    if (state === "start") {
        return (
            <div className="ts-container">
                <div className="ts-card">
                    <h1 className="ts-title">七十二候<br />タイピング</h1>
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
                                {q.typing.substring(0, inputIndex)}
                            </span>
                            <span className="ts-target">
                                {q.typing.substring(inputIndex, inputIndex + 1)}
                            </span>
                            <span className="ts-untyped">
                                {q.typing.substring(inputIndex + 1)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (state === "result") {
        return (
            <div className="ts-container">
                <div className="ts-card">
                    <h2 className="ts-title">鑑定結果</h2>
                        <div className="ts-resultStats">
                            <div className="ts-statItem">
                                <span className="ts-statLabel">WPM</span>
                            <span className="ts-statValue">
                                {Math.floor(correctCount / 5)}
                            </span>
                        </div>
                        <div className="ts-statItem">
                            <span className="ts-statLabel">正確性</span>
                            <span className="ts-statValue">
                                {correctCount + missCount > 0
                                    ? Math.floor(
                                        (correctCount /
                                              (correctCount + missCount)) * 100
                                    ): 0}
                                %
                            </span>
                        </div>
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
