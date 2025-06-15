import React, { useState, useEffect, useRef } from "react";
import "./App.css";

function App() {
  const WORK_DEFAULT = 25 * 60;
  const SHORT_DEFAULT = 5 * 60;
  const LONG_DEFAULT = 15 * 60;

  const [durations, setDurations] = useState({
    work: WORK_DEFAULT,
    short: SHORT_DEFAULT,
    long: LONG_DEFAULT,
  });

  const [timeLeft, setTimeLeft] = useState(WORK_DEFAULT);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState("work");
  const [sessions, setSessions] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const intervalRef = useRef(null);
  const audioRef = useRef(new Audio("/ding.mp3"));

  // Map internal mode to display label
  const modeLabels = {
    work: "Pomodoro",
    short: "Short Break",
    long: "Long Break",
  };

  // Load saved state
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("pomodoroState"));
    if (saved) {
      setDurations(saved.durations);
      setTimeLeft(saved.timeLeft);
      setMode(saved.mode);
      setSessions(saved.sessions);
    }
  }, []);

  // Save state
  useEffect(() => {
    localStorage.setItem(
      "pomodoroState",
      JSON.stringify({ durations, timeLeft, mode, sessions })
    );
  }, [durations, timeLeft, mode, sessions]);

  // Run timer
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            handleSessionEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  useEffect(() => {
    document.body.className = `${mode}-mode`;
  }, [mode]);

  function formatTime(seconds) {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  function handleSessionEnd() {
    if (soundEnabled) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }

    if (mode === "work") {
      const nextSessions = sessions + 1;
      setSessions(nextSessions);
      if (nextSessions % 4 === 0) {
        switchMode("long");
      } else {
        switchMode("short");
      }
    } else {
      switchMode("work");
    }

    setIsRunning(false);
  }

  function switchMode(newMode) {
    setMode(newMode);
    setTimeLeft(durations[newMode]);
    setIsRunning(false);
  }

  function handleDurationChange(type, minutes) {
    const updated = { ...durations, [type]: minutes * 60 };
    setDurations(updated);
    if (mode === type) {
      setTimeLeft(minutes * 60);
    }
  }

  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const progress = 1 - timeLeft / durations[mode];
  const offset = circumference * progress;

  return (
    <div className="App">
      <h1>{modeLabels[mode]} Timer</h1>

      <div className="mode-switch">
        {["work", "short", "long"].map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={mode === m ? "active" : ""}
          >
            {modeLabels[m]}
          </button>
        ))}
      </div>

      <div className="timer-container">
        <svg className="circle-timer" width="220" height="220">
          <circle
            r={radius}
            cx="110"
            cy="110"
            fill="none"
            stroke="#eee"
            strokeWidth="10"
          />
          <circle
            r={radius}
            cx="110"
            cy="110"
            fill="none"
            stroke="#fff"
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="time-display">{formatTime(timeLeft)}</div>
      </div>

      <div className="controls">
        <button onClick={() => setIsRunning((r) => !r)}>
          {isRunning ? "Pause" : "Start"}
        </button>
        <button onClick={() => {
          switchMode("work");
          setSessions(0);
        }}>Reset</button>
        <button onClick={() => setSoundEnabled((s) => !s)}>
          Sound: {soundEnabled ? "On" : "Off"}
        </button>
      </div>

      <div className="custom-durations">
        <label>
          Pomodoro (min):
          <input
            type="number"
            value={durations.work / 60}
            onChange={(e) => handleDurationChange("work", +e.target.value)}
          />
        </label>
        <label>
          Short Break:
          <input
            type="number"
            value={durations.short / 60}
            onChange={(e) => handleDurationChange("short", +e.target.value)}
          />
        </label>
        <label>
          Long Break:
          <input
            type="number"
            value={durations.long / 60}
            onChange={(e) => handleDurationChange("long", +e.target.value)}
          />
        </label>
      </div>

      <div className="session-dots">
        {Array.from({ length: sessions % 4 }).map((_, i) => (
          <span key={i}>🍅</span>
        ))}
      </div>
    </div>
  );
}

export default App;
