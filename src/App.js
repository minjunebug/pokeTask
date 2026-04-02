// import "./styles.css";
import React, { useEffect, useState } from "react";

export default function App() {
  const [ticket, setTicket] = useState(5);
  const [inventory, setInventory] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const [allPokemon, setAllPokemon] = useState({ S: [], A: [], B: [], C: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const TOTAL_POKEMON = 151;
  const [showConfetti, setShowConfetti] = useState(false);

  const COOLDOWN_MINUTES = 10;

  // 칸별 마지막 업무 시간 관리
  const [lastWorkTimes, setLastWorkTimes] = useState(() => {
    const saved = localStorage.getItem("lastWorkTimes");
    return saved ? JSON.parse(saved) : [null, null, null, null];
  });

  const [workTimeLefts, setWorkTimeLefts] = useState([0, 0, 0, 0]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const cooldownMs = COOLDOWN_MINUTES * 60 * 1000;

      const newLefts = lastWorkTimes.map((lastTime) => {
        if (!lastTime) return 0;
        const diff = Math.ceil((cooldownMs - (now - lastTime)) / 1000);
        return diff > 0 ? diff : 0;
      });

      setWorkTimeLefts(newLefts);
    }, 1000);
    return () => clearInterval(timer);
  }, [lastWorkTimes]);

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
          const baseStatTotal = poke.stats.reduce(
            (sum, stat) => sum + stat.base_stat,
            0
          );
          const pokeData = {
            id: poke.id,
            name: poke.name.toUpperCase(),
            sprite: poke.sprites.front_default,
            bst: baseStatTotal,
          };
          if (baseStatTotal >= 600) categorized.S.push(pokeData);
          else if (baseStatTotal >= 500) categorized.A.push(pokeData);
          else if (baseStatTotal >= 400) categorized.B.push(pokeData);
          else categorized.C.push(pokeData);
        });
        setAllPokemon(categorized);
        setTimeout(() => setIsLoading(false), 500);
      } catch (error) {
        alert("인터넷 연결을 확인해보세요!");
      }
    };
    fetchPokemonData();
  }, []);

  useEffect(() => {
    const savedInventory = localStorage.getItem("pokemon-inventory");
    const savedTickets = localStorage.getItem("pokemon-tickets");
    if (savedInventory) setInventory(JSON.parse(savedInventory));
    if (savedTickets) setTicket(Number(savedTickets));
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("pokemon-inventory", JSON.stringify(inventory));
      localStorage.setItem("pokemon-tickets", ticket.toString());
    }
  }, [inventory, ticket, isLoading]);

  // ★ 수정 포인트: index 파라미터 추가
  const completeTask = (index, textarea) => {
    if (workTimeLefts[index] > 0) {
      const minutes = Math.floor(workTimeLefts[index] / 60);
      const seconds = workTimeLefts[index] % 60;
      return alert(
        `마음에 여유를 가져요. ${minutes}분 ${seconds}초 후에 완료 가능해요. 🔥`
      );
    }

    if (!textarea.value.trim()) return alert("업무 내용을 입력해주세요");

    const now = Date.now();
    const newTimes = [...lastWorkTimes];
    newTimes[index] = now;
    setTicket((prev) => prev + 1);
    setLastWorkTimes(newTimes);
    localStorage.setItem("lastWorkTimes", JSON.stringify(newTimes));

    textarea.value = "";
    alert(`${index + 1}번 업무 완료! 티켓 1장을 획득했습니다. 🎫`);
  };

  const handleDraw = () => {
    if (ticket <= 0) return alert("티켓이 부족합니다! 일 열심히 하세요ㅋ");
    if (isSpinning || isLoading) return;

    setIsSpinning(true);
    setTicket((prev) => prev - 1);
    setLastResult(null);

    setTimeout(() => {
      const chance = Math.random() * 100;
      let selectedRank =
        chance < 1 ? "S" : chance < 10 ? "A" : chance < 40 ? "B" : "C";
      let pool =
        allPokemon[selectedRank].length > 0
          ? allPokemon[selectedRank]
          : allPokemon["C"];
      const pokemon = pool[Math.floor(Math.random() * pool.length)];

      const colors = {
        S: "bg-yellow-400",
        A: "bg-purple-400",
        B: "bg-blue-400",
        C: "bg-gray-400",
      };
      const finalResult = {
        ...pokemon,
        rank: selectedRank,
        color: colors[selectedRank],
      };

      setLastResult(finalResult);
      if (selectedRank === "S") {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }

      setInventory((prev) => {
        const currentInventory = [finalResult, ...prev];
        const identicalPokemon = currentInventory.filter(
          (p) => p.name === finalResult.name
        );

        if (identicalPokemon.length >= 3 && finalResult.rank !== "S") {
          const nextRankMap = { C: "B", B: "A", A: "S" };
          const nextRank = nextRankMap[finalResult.rank];
          const evolvedPoke =
            allPokemon[nextRank][
              Math.floor(Math.random() * allPokemon[nextRank].length)
            ];
          const evolvedResult = {
            ...evolvedPoke,
            rank: nextRank,
            color: colors[nextRank],
          };

          let removeCount = 0;
          const filteredInventory = currentInventory.filter((p) => {
            if (p.name === finalResult.name && removeCount < 3) {
              removeCount++;
              return false;
            }
            return true;
          });
          alert(
            `🎊 [진화 성공!] ${finalResult.name} 3마리가 모여 [${nextRank}등급] ${evolvedResult.name}(으)로 진화했습니다!`
          );
          if (nextRank === "S") {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 5000);
          }
          return [evolvedResult, ...filteredInventory];
        }
        return currentInventory;
      });
      setIsSpinning(false);
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white">
        <div className="text-6xl mb-8 animate-bounce">📕</div>
        <h2 className="text-2xl font-black mb-2 text-gray-800">
          포켓몬 도감 동기화 중...
        </h2>
        <div className="w-64 h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner relative">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="mt-4 text-indigo-600 font-bold text-lg">
          {progress}%
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-gray-50 text-gray-800 font-sans">
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce text-4xl"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 2 + 1}s`,
                opacity: Math.random(),
              }}
            >
              {["🎉", "✨", "🎊", "⭐"][Math.floor(Math.random() * 4)]}
            </div>
          ))}
        </div>
      )}

      {/* 왼쪽: 업무 목록 */}
      <section className="w-1/3 border-r border-gray-200 p-6 overflow-y-auto bg-white">
        <h2 className="text-xl font-bold mb-6 flex justify-between items-center">
          🤸‍♀️업무 목록🏃‍♀️
          <span className="text-sm bg-blue-100 text-blue-600 px-3 py-1 rounded-full">
            티켓: {ticket}장
          </span>
        </h2>
        <div className="space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 border rounded-xl hover:shadow-sm bg-gray-50"
            >
              <textarea
                id={`task-${i}`}
                className="w-full h-20 p-2 text-sm bg-white border rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none mb-2"
                placeholder={`${i + 1}번 업무 내용을 입력하세요...`}
              />
              <button
                onClick={() =>
                  completeTask(i, document.getElementById(`task-${i}`))
                }
                disabled={workTimeLefts[i] > 0}
                className={`w-full py-3 rounded-xl font-bold transition-all ${
                  workTimeLefts[i] > 0
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg active:scale-95"
                }`}
              >
                {workTimeLefts[i] > 0
                  ? `${Math.floor(workTimeLefts[i] / 60)}분 ${
                      workTimeLefts[i] % 60
                    }초 대기`
                  : "업무 완료 및 티켓 받기"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 중앙: 뽑기 섹션 */}
      <section className="w-1/3 flex flex-col items-center justify-center p-6 bg-gray-50">
        <h2 className="text-xl font-bold mb-10 text-center">🎰 보상 뽑기</h2>
        <div className="w-64 h-80 bg-white border-4 border-gray-200 rounded-3xl shadow-xl flex items-center justify-center relative overflow-hidden">
          {isSpinning ? (
            <div className="text-center">
              <div className="animate-spin text-4xl">🌀</div>
              <p className="font-bold text-gray-500">어떤 게 나올까 ㅎ</p>
            </div>
          ) : lastResult ? (
            <div className="text-center animate-bounce">
              <img
                src={lastResult.sprite}
                alt={lastResult.name}
                className="w-40 h-40 mx-auto [image-rendering:pixelated]"
              />
              <div
                className={`text-4xl font-black ${lastResult.color.replace(
                  "bg-",
                  "text-"
                )} mb-1`}
              >
                {lastResult.name}
              </div>
              <p
                className={`text-xl font-bold ${lastResult.color.replace(
                  "bg-",
                  "text-"
                )}`}
              >
                ({lastResult.rank}등급 획득!)
              </p>
            </div>
          ) : (
            <div className="text-gray-300 text-sm italic">
              버튼을 눌러 가챠 시작
            </div>
          )}
        </div>
        <button
          onClick={handleDraw}
          disabled={isSpinning}
          className={`mt-10 px-12 py-5 ${
            isSpinning
              ? "bg-gray-400"
              : "bg-gradient-to-br from-indigo-600 to-blue-700"
          } text-white rounded-2xl font-black text-xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all active:scale-95`}
        >
          {isSpinning ? "뽑는 중..." : "🙏뽑기"}
        </button>
      </section>

      {/* 오른쪽: 인벤토리 */}
      <section className="w-1/3 border-l border-gray-200 p-6 overflow-y-auto bg-white shadow-inner">
        <h2 className="text-xl font-bold mb-6">
          🎒인벤토리{" "}
          <span className="text-sm bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-medium">
            총 {inventory.length}마리
          </span>
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {inventory.length === 0 && (
            <div className="col-span-3 text-center py-20 text-gray-400">
              아직 보상이 없습니다.
            </div>
          )}
          {inventory
            .sort((a, b) => a.rank.localeCompare(b.rank))
            .map((item, idx) => (
              <div
                key={idx}
                className={`relative aspect-square ${item.color} rounded-2xl shadow-sm flex items-center justify-center group hover:scale-105 transition-transform cursor-pointer overflow-hidden`}
              >
                {/* ★ 수정 포인트: 텍스트를 맨 위로 올리기 위해 z-20 추가 및 문구 강조 */}
                <span className="absolute inset-0 flex items-center justify-center text-white/50 text-8xl font-black z-10 pointer-events-none select-none">
                  {item.rank}
                </span>
                <img
                  src={item.sprite}
                  alt={item.name}
                  className="h-full aspect-square z-20 [image-rendering:pixelated] object-contain scale-125 relative"
                />
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30">
                  {item.name}
                </div>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
