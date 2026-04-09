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

  const [recyclePoint, setRecyclePoint] = useState(() => {
    const saved = localStorage.getItem("recycle-point");
    return saved ? parseInt(saved) : 0;
  });

  // 업무 리스트 및 현재 활성화된 업무 상태
  const [taskList, setTaskList] = useState(() => {
    const saved = localStorage.getItem("todo-list");
    return saved ? JSON.parse(saved) : [];
  });
  const [taskInput, setTaskInput] = useState("");
  const [activeTaskId, setActiveTaskId] = useState(null);

  const activeTask = taskList.find((t) => t.id === activeTaskId);

  useEffect(() => {
    localStorage.setItem("recycle-point", recyclePoint.toString());
    localStorage.setItem("todo-list", JSON.stringify(taskList));
  }, [recyclePoint, taskList]);

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

  // 포켓몬 데이터 fetch 및 초기화 로직 (동일)
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
        const categorized = { S: [], A: [], B: [], C: [] };
        results.forEach((poke) => {
          const bst = poke.stats.reduce((sum, s) => sum + s.base_stat, 0);
          const data = {
            id: poke.id,
            name: poke.name.toUpperCase(),
            sprite: poke.sprites.front_default,
            bst,
          };
          if (bst >= 600) categorized.S.push(data);
          else if (bst >= 500) categorized.A.push(data);
          else if (bst >= 400) categorized.B.push(data);
          else categorized.C.push(data);
        });
        setAllPokemon(categorized);
        setTimeout(() => setIsLoading(false), 500);
      } catch (e) {
        alert("데이터 로딩 실패");
      }
    };
    fetchPokemonData();
  }, []);

  useEffect(() => {
    const inv = localStorage.getItem("pokemon-inventory");
    const tkt = localStorage.getItem("pokemon-tickets");
    if (inv) setInventory(JSON.parse(inv));
    if (tkt) setTicket(Number(tkt));
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("pokemon-inventory", JSON.stringify(inventory));
      localStorage.setItem("pokemon-tickets", ticket.toString());
    }
  }, [inventory, ticket, isLoading]);

  const discardPokemon = (index) => {
    const target = inventory[index];
    if (target.rank === "S") return alert("S급은 버릴 수 없습니다!");
    const points = { A: 3, B: 2, C: 1 };
    const p = points[target.rank];
    if (!window.confirm("카드를 버리고 포인트를 얻을까요?")) return;
    const newInv = [...inventory];
    newInv.splice(index, 1);
    setInventory(newInv);
    const nP = recyclePoint + p;
    if (nP >= 5) {
      setTicket((t) => t + 1);
      setRecyclePoint(nP - 5);
      alert("티켓 획득! 🎫");
    } else setRecyclePoint(nP);
  };

  const handleDraw = () => {
    if (ticket <= 0 || isSpinning || isLoading) return;
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
      if (r === "S") {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
      setInventory((prev) => [res, ...prev]); // 진화 로직 생략(공간상), 필요시 이전 코드 참고
      setIsSpinning(false);
    }, 1500);
  };

  if (isLoading)
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        {" "}
        로딩 중... {progress}%{" "}
      </div>
    );

  return (
    <div className="flex h-screen w-full bg-gray-50 text-gray-800 overflow-hidden">
      {showConfetti && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          🎉✨🎊
        </div>
      )}

      {/* 왼쪽: 업무 & 뽀모도로 */}
      <section className="w-1/3 border-r flex flex-col bg-white">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold mb-4 flex justify-between">
            업무 센터 <span className="text-blue-600">🎫 {ticket}</span>
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="할 일 입력..."
              className="flex-1 p-3 bg-gray-50 border rounded-xl outline-none"
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
          {taskList.map((task) => (
            <div
              key={task.id}
              onClick={() => setActiveTaskId(task.id)}
              className={`p-3 border rounded-xl cursor-pointer transition-all duration-500 ${
                activeTaskId === task.id
                  ? "border-indigo-500 bg-indigo-50 shadow-md scale-[1.02]"
                  : "bg-gray-50 hover:border-indigo-200"
              }`}
            >
              <span className="text-sm font-medium">
                {activeTaskId === task.id ? "🎯 " : ""}
                {task.text}
              </span>
            </div>
          ))}
        </div>
        <div className="p-6 bg-gray-50 border-t">
          <PomodoroTimer
            taskName={activeTask?.text}
            onTaskComplete={() => {
              setTicket((t) => t + 1);
              if (activeTaskId) {
                setTaskList((prev) =>
                  prev.filter((t) => t.id !== activeTaskId)
                );
                setActiveTaskId(null);
              }
            }}
          />
        </div>
      </section>

      {/* 중앙: 가챠 (기존과 동일) */}
      <section className="w-1/3 flex flex-col items-center justify-center p-6 bg-gray-50">
        <div className="w-64 h-80 bg-white border-4 rounded-3xl shadow-xl flex items-center justify-center overflow-hidden">
          {isSpinning ? (
            <div className="animate-spin text-4xl">🌀</div>
          ) : lastResult ? (
            <div className="text-center animate-bounce">
              <img src={lastResult.sprite} className="w-32 h-32 mx-auto" />
              <div
                className={`text-2xl font-black ${lastResult.color.replace(
                  "bg-",
                  "text-"
                )}`}
              >
                {lastResult.name}
              </div>
            </div>
          ) : (
            <div className="text-gray-300">티켓을 사용하세요</div>
          )}
        </div>
        <button
          onClick={handleDraw}
          className="mt-8 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold"
        >
          뽑기 실행
        </button>
      </section>

      {/* 오른쪽: 인벤토리 (기존과 동일) */}
      <section className="w-1/3 border-l p-6 overflow-y-auto bg-white">
        <h2 className="text-xl font-bold mb-4">
          인벤토리 ({inventory.length})
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {inventory.map((item, i) => (
            <div
              key={i}
              className={`relative aspect-square ${item.color} rounded-xl flex items-center justify-center group`}
            >
              <img
                src={item.sprite}
                className="w-full h-full object-contain [image-rendering:pixelated]"
              />
              <button
                onClick={() => discardPokemon(i)}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-white/20 rounded-full w-6 h-6"
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
