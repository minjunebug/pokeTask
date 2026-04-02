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
            name: poke.name.toUpperCase(), // 이름 대문자로
            sprite: poke.sprites.front_default, // 앞모습 이미지
            bst: baseStatTotal, // 종족값 합계
          };

          if (baseStatTotal >= 600) categorized.S.push(pokeData); // 전설급
          else if (baseStatTotal >= 500)
            categorized.A.push(pokeData); // 최종진화급
          else if (baseStatTotal >= 400)
            categorized.B.push(pokeData); // 중간진화급
          else categorized.C.push(pokeData);
        });

        setAllPokemon(categorized);
        setTimeout(() => setIsLoading(false), 500);
      } catch (error) {
        console.log("포켓몬 데이터 가져오기 실패", error);
        alert("인터넷 연결을 확인해보세요!");
      }
    };

    fetchPokemonData();
  }, []);

  useEffect(() => {
    const savedInventory = localStorage.getItem("pokemon-inventory");
    const savedTickets = localStorage.getItem("pokemon-tickets");

    if (savedInventory) {
      setInventory(JSON.parse(savedInventory)); // 문자열을 다시 배열로 변환
    }
    if (savedTickets) {
      setTicket(Number(savedTickets)); // 문자열을 다시 숫자로 변환
    }
  }, []);

  // 2. [저장하기] 티켓이나 인벤토리가 바뀔 때마다 자동으로 실행
  useEffect(() => {
    // 데이터가 아직 로딩 중일 때는 저장하지 않도록 방어 로직
    if (!isLoading) {
      localStorage.setItem("pokemon-inventory", JSON.stringify(inventory));
      localStorage.setItem("pokemon-tickets", ticket.toString());
    }
  }, [inventory, ticket, isLoading]);

  const completeTask = (e) => {
    const card = e.target.closest("div");
    const textarea = card.querySelector("textarea");

    if (!textarea.value.trim()) return alert("업무 내용을 입력해주세요");

    setTicket((prev) => prev + 1);
    textarea.value = "";
    alert("업무 완료! 티켓 1장을 획득했습니다. 🎫");
  };

  const handleDraw = () => {
    if (ticket <= 0) return alert("티켓이 부족합니다! 일 열심히 하세요ㅋ");
    if (isSpinning || isLoading) return;

    setIsSpinning(true);
    setTicket((prev) => prev - 1);
    setLastResult(null);

    setTimeout(() => {
      // 1. 등급 결정 (확률 로직)
      const chance = Math.random() * 100;
      let selectedRank;
      if (chance < 1) selectedRank = "S";
      else if (chance < 10) selectedRank = "A";
      else if (chance < 40) selectedRank = "B";
      else selectedRank = "C";

      // 2. 해당 등급에서 랜덤 포켓몬 선택
      let pool = allPokemon[selectedRank];
      // 만약 해당 등급에 포켓몬이 없으면 C급으로 폴백(안전장치)
      if (pool.length === 0) {
        selectedRank = "C";
        pool = allPokemon["C"];
      }

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

      // 3. 중앙 결과창 업데이트 및 S급 당첨 꽃가루
      setLastResult(finalResult);
      if (selectedRank === "S") {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }

      // 4. 인벤토리 업데이트 및 자동 합체(진화) 엔진
      setInventory((prev) => {
        const currentInventory = [finalResult, ...prev];

        // 중복 검사 (이름 기준)
        const identicalPokemon = currentInventory.filter(
          (p) => p.name === finalResult.name
        );

        // [진화 조건] 동일 3마리 & S등급 미만
        if (identicalPokemon.length >= 3 && finalResult.rank !== "S") {
          const nextRankMap = { C: "B", B: "A", A: "S" };
          const nextRank = nextRankMap[finalResult.rank];
          const upgradePool = allPokemon[nextRank];
          const evolvedPoke =
            upgradePool[Math.floor(Math.random() * upgradePool.length)];

          const evolvedResult = {
            ...evolvedPoke,
            rank: nextRank,
            color: colors[nextRank],
          };

          // 기존 동일 포켓몬 3마리 제거
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

          // 진화해서 S급이 된 경우에도 꽃가루!
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
        {/* 포켓볼 흔들리는 애니메이션 효과 느낌 */}
        <div className="text-6xl mb-8 animate-bounce">📕</div>

        <h2 className="text-2xl font-black mb-2 text-gray-800">
          포켓몬 도감 동기화 중...
        </h2>
        <p className="text-gray-400 mb-8 font-medium">
          데이터를 분석하여 등급을 분류하고 있습니다.
        </p>

        {/* 프로그레스 바 바깥쪽 */}
        <div className="w-64 h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner relative">
          {/* 실제 채워지는 바 */}
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 퍼센트 텍스트 */}
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
      <section className="w-1/3 border-r border-gray-200 p-6 overflow-y-auto bg-white">
        <h2 className="text-xl font-bold mb-6 flex justify-between items-center">
          🤸‍♀️업무 목록🏃‍♀️
          <span className="text-sm bg-blue-100 text-blue-600 px-3 py-1 rounded-full">
            티켓: {ticket}장
          </span>
        </h2>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 border rounded-xl hover:shadow-sm transit show-sm"
            >
              <textarea
                className="w-full h-20 p-2 text-sm bg-gray-50 border-none focus:ring-0 resize-none"
                placeholder="오늘 완료할 마케팅 업무는?"
              />
              <button
                onClick={completeTask}
                className="mt-2 w-full py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-black"
              >
                업무 완료 (티켓 +1)
              </button>
            </div>
          ))}
        </div>
      </section>

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

      <section className="w-1/3 border-l border-gray-200 p-6 overflow-y-auto bg-white shadow-inner">
        <h2 className="text-xl font-bold mb-6">
          🎒인벤토리
          <span className="text-sm bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-medium">
            총 {inventory.length}마리
          </span>
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {inventory.length === 0 && (
            <div className="col-span-3 text-center py-20 text-gray-400">
              아직 획득한 보상이 없습니다.
            </div>
          )}
          {inventory
            .sort((a, b) => a.rank.localeCompare(b.rank))
            .map((item, idx) => (
              <div
                key={idx}
                className={`relative aspect-square ${item.color} rounded-2xl shadow-sm flex items-center justify-center group hover:scale-105 transition-transform cursor-pointer overflow-hidden animate-slide-in`}
                onClick={() =>
                  alert(`[${item.rank}등급] ${item.name}\n종족값: ${item.bst}`)
                }
              >
                <img
                  src={item.sprite}
                  alt={item.name}
                  className="h-full aspect-square z-10 [image-rendering:pixelated] object-contain scale-125"
                />
                <span className="absolute inset-0 flex items-center justify-center text-white/30 text-5xl font-black z-0">
                  {item.rank}
                </span>

                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                  {item.name}
                </div>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
