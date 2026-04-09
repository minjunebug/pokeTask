import React, { useEffect, useState } from "react";
import PomodoroTimer from "./PomodoroTimer";

export default function App() {
  const [ticket, setTicket] = useState(5);
  const [inventory, setInventory] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [allPokemon, setAllPokemon] = useState({ S: [], A: [], B: [], C: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const TOTAL_POKEMON = 151;

  // 재활용 포인트
  const [recyclePoint, setRecyclePoint] = useState(() => {
    const saved = localStorage.getItem("recycle-point");
    return saved ? parseInt(saved) : 0;
  });

  // 업무 리스트 상태
  const [taskList, setTaskList] = useState(() => {
    const saved = localStorage.getItem("todo-list");
    return saved ? JSON.parse(saved) : [];
  });
  const [taskInput, setTaskInput] = useState("");
  const [activeTaskId, setActiveTaskId] = useState(null);
  const activeTask = taskList.find((t) => t.id === activeTaskId);

  // 로컬스토리지 저장
  useEffect(() => {
    localStorage.setItem("recycle-point", recyclePoint.toString());
    localStorage.setItem("todo-list", JSON.stringify(taskList));
  }, [recyclePoint, taskList]);

  // 업무 추가/삭제/완료 로직
  const addTask = () => {
    if (!taskInput.trim()) return alert("업무 내용을 입력해주세요!");
    const newTask = { id: Date.now(), text: taskInput };
    setTaskList([...taskList, newTask]);
    setTaskInput("");
  };

  const deleteTask = (id) => {
    setTaskList(taskList.filter((task) => task.id !== id));
    if (activeTaskId === id) setActiveTaskId(null);
  };

  const handleTaskComplete = () => {
    setTicket((t) => t + 1);
    if (activeTaskId) {
      setTaskList((prev) => prev.filter((t) => t.id !== activeTaskId));
      setActiveTaskId(null);
      alert("🎉 업무 완료! 티켓 1장을 획득했습니다!");
    }
  };

  // 포켓몬 데이터 로딩 (기존 로직 유지)
  useEffect(() => {
    const fetchPokemonData = async () => {
      try {
        let loadedCount = 0;
        const promises = Array.from({ length: 151 }, (_, i) =>
          fetch(`https://pokeapi.co/api/v2/pokemon/${i + 1}`)
            .then((res) => res.json())
            .then((poke) => {
              loadedCount++;
              setProgress(Math.round((loadedCount / TOTAL_POKEMON) * 100));
              return poke;
            })
        );
        const results = await Promise.all(promises);
        const cat = { S: [], A: [], B: [], C: [] };
        results.forEach((poke) => {
          const bst = poke.stats.reduce((sum, s) => sum + s.base_stat, 0);
          const data = {
            id: poke.id,
            name: poke.name.toUpperCase(),
            sprite: poke.sprites.front_default,
            bst,
          };
          if (bst >= 600) cat.S.push(data);
          else if (bst >= 500) cat.A.push(data);
          else if (bst >= 400) cat.B.push(data);
          else cat.C.push(data);
        });
        setAllPokemon(cat);
        setTimeout(() => setIsLoading(false), 500);
      } catch (e) {
        alert("데이터를 불러오는데 실패했습니다.");
      }
    };
    fetchPokemonData();
  }, []);

  // 인벤토리 저장/불러오기
  useEffect(() => {
    const savedInv = localStorage.getItem("pokemon-inventory");
    const savedTkt = localStorage.getItem("pokemon-tickets");
    if (savedInv) setInventory(JSON.parse(savedInv));
    if (savedTkt) setTicket(Number(savedTkt));
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("pokemon-inventory", JSON.stringify(inventory));
      localStorage.setItem("pokemon-tickets", ticket.toString());
    }
  }, [inventory, ticket, isLoading]);

  // 가챠 로직
  const handleDraw = () => {
    if (ticket <= 0 || isSpinning) return alert("티켓이 부족합니다!");
    setIsSpinning(true);
    setTicket((t) => t - 1);
    setLastResult(null);
    setTimeout(() => {
      const c = Math.random() * 100;
      let r = c < 1 ? "S" : c < 10 ? "A" : c < 40 ? "B" : "C";
      let pool = allPokemon[r].length > 0 ? allPokemon[r] : allPokemon["C"];
      const p = pool[Math.floor(Math.random() * pool.length)];
      const cls = {
        S: "bg-yellow-400",
        A: "bg-purple-400",
        B: "bg-blue-400",
        C: "bg-gray-400",
      };
      const res = { ...p, rank: r, color: cls[r] };
      setLastResult(res);
      setInventory((prev) => [res, ...prev]);
      if (r === "S") {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
      setIsSpinning(false);
    }, 1500);
  };

  // 1. 로딩 화면 복구
  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white">
        <div className="text-6xl mb-8 animate-bounce">📕</div>
        <h2 className="text-2xl font-black mb-2 text-gray-800">
          도감 동기화 중... {progress}%
        </h2>
        <div className="w-64 h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-gray-50 text-gray-800 font-sans overflow-hidden">
      {showConfetti && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center text-4xl">
          ✨✨✨
        </div>
      )}

      {/* 1. 왼쪽: 업무 센터 (반응형 대응) */}
      <section className="w-full md:w-1/3 border-r border-gray-200 flex flex-col bg-white overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold mb-4 flex justify-between items-center">
            🚀 업무 센터
            <span className="text-sm bg-blue-100 text-blue-600 px-3 py-1 rounded-full font-bold">
              티켓: {ticket}장
            </span>
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="새로운 업무 입력..."
              className="flex-1 p-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button
              onClick={addTask}
              className="px-4 bg-indigo-600 text-white rounded-xl font-bold"
            >
              추가
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <p className="text-[10px] font-bold text-gray-400 ml-2 mb-2 uppercase">
            할 일 목록 (클릭하여 선택)
          </p>
          {taskList.map((task) => (
            <div
              key={task.id}
              onClick={() => setActiveTaskId(task.id)}
              className={`group flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all duration-500 ${
                activeTaskId === task.id
                  ? "border-indigo-500 bg-indigo-50 shadow-md"
                  : "bg-gray-50 border-gray-100 hover:border-indigo-200"
              }`}
            >
              <span
                className={`text-sm font-medium ${
                  activeTaskId === task.id
                    ? "text-indigo-700 font-bold"
                    : "text-gray-700"
                }`}
              >
                {activeTaskId === task.id ? "🎯 " : ""}
                {task.text}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTask(task.id);
                }}
                className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="p-6 bg-gray-50 border-t">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase">
              Pomodoro Timer
            </p>
          </div>
          <PomodoroTimer
            taskName={activeTask?.text}
            onTaskComplete={handleTaskComplete}
          />
        </div>
      </section>

      {/* 2. 중앙: 보상 뽑기 */}
      <section className="w-full md:w-1/3 flex flex-col items-center justify-center p-6 bg-gray-50 border-b md:border-b-0">
        <h2 className="text-xl font-bold mb-10">🎰 보상 뽑기</h2>
        <div className="w-64 h-80 bg-white border-4 border-gray-200 rounded-[2.5rem] shadow-xl flex items-center justify-center relative overflow-hidden">
          {isSpinning ? (
            <div className="text-center animate-pulse">
              <div className="text-4xl mb-2">🌀</div>
              <p className="font-bold text-gray-400">수색 중...</p>
            </div>
          ) : lastResult ? (
            <div className="text-center animate-bounce">
              <img
                src={lastResult.sprite}
                className="w-40 h-40 mx-auto [image-rendering:pixelated]"
                alt="poke"
              />
              <div
                className={`text-3xl font-black ${lastResult.color.replace(
                  "bg-",
                  "text-"
                )}`}
              >
                {lastResult.name}
              </div>
              <p className="font-bold text-gray-400">
                ({lastResult.rank} RANK)
              </p>
            </div>
          ) : (
            <div className="text-gray-300 italic text-center leading-tight">
              티켓을 사용해
              <br />
              포켓몬을 수색하세요
            </div>
          )}
        </div>
        <button
          onClick={handleDraw}
          disabled={isSpinning}
          className={`mt-10 px-12 py-5 ${
            isSpinning
              ? "bg-gray-400"
              : "bg-indigo-600 shadow-lg hover:bg-indigo-700"
          } text-white rounded-2xl font-black text-xl active:scale-95 transition-all`}
        >
          {isSpinning ? "추첨 중" : "🙏 뽑기 시작"}
        </button>
      </section>

      {/* 3. 오른쪽: 도감 */}
      <section className="w-full md:w-1/3 border-l border-gray-200 p-6 overflow-y-auto bg-white">
        <h2 className="text-xl font-bold mb-6 flex justify-between items-center">
          🎒 도감
          <div className="flex items-center bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
            <span className="text-[10px] font-bold text-orange-400 mr-2">
              P
            </span>
            <span className="text-sm font-black text-orange-600">
              {recyclePoint}/5
            </span>
          </div>
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {inventory.map((item, idx) => (
            <div
              key={idx}
              className={`relative aspect-square ${item.color} rounded-2xl shadow-sm flex items-center justify-center group hover:scale-105 transition-all cursor-pointer overflow-hidden`}
            >
              <span className="absolute inset-0 flex items-center justify-center text-white/40 text-6xl font-black z-10 pointer-events-none">
                {item.rank}
              </span>
              <img
                src={item.sprite}
                className="h-full aspect-square z-20 object-contain relative [image-rendering:pixelated]"
                alt="poke"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const points = { A: 3, B: 2, C: 1 };
                  if (item.rank === "S")
                    return alert("S급은 소중히 간직하세요!");
                  if (
                    window.confirm(
                      `${item.name}을(를) 재활용하여 포인트를 얻을까요?`
                    )
                  ) {
                    const newInv = [...inventory];
                    newInv.splice(idx, 1);
                    setInventory(newInv);
                    const nP = recyclePoint + points[item.rank];
                    if (nP >= 5) {
                      setTicket((t) => t + 1);
                      setRecyclePoint(nP - 5);
                      alert("티켓 1장 교환 완료!");
                    } else {
                      setRecyclePoint(nP);
                    }
                  }
                }}
                className="absolute top-2 right-2 bg-white/20 hover:bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all z-30"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
