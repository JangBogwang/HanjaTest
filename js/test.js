    const urlParams = new URLSearchParams(window.location.search);
    const level = urlParams.get('level');

    const LEVEL_ORDER = ['8', '7', '6', '준5', '5'];

    let questions = [];
    let current = 0;
    let timer = null;
    let timeLeft = 15;
    let score = 0;

    function shuffle(array) {
      return array.sort(() => Math.random() - 0.5);
    }

    function getWeightedLevels(selectedLevel) {
      const index = LEVEL_ORDER.indexOf(selectedLevel);
      const levels = LEVEL_ORDER.slice(0, index + 1);
      return levels.reverse().map((lv, i) => ({ level: lv, weight: i + 1 }));
    }

    function weightedRandomPick(weightedLevels) {
      const pool = [];
      weightedLevels.forEach(entry => {
        for (let i = 0; i < entry.weight; i++) {
          pool.push(entry.level);
        }
      });
      return pool[Math.floor(Math.random() * pool.length)];
    }

    async function loadTxt(path) {
      const res = await fetch(path);
      const text = await res.text();
      return text.trim().split('\n').map(line => {
        const [q, a] = line.split('\t');
        return { question: q.trim(), meaning: a.trim() };
      });
    }

    async function loadQuestions() {
      const weightedLevels = getWeightedLevels(level);

      const allHanja = [];
      const allWord = [];

      for (const { level: lv } of weightedLevels) {
        const hanjaData = await loadTxt(`character/${lv}.txt`);
        const wordData = await loadTxt(`word/${lv}.txt`);
        allHanja.push({ level: lv, data: hanjaData });
        allWord.push({ level: lv, data: wordData });
      }

      const hanjaQs = [];
      while (hanjaQs.length < 5) {
        const lv = weightedRandomPick(weightedLevels);
        const group = allHanja.find(g => g.level === lv);
        const item = shuffle(group.data).find(x => !hanjaQs.find(q => q.question === x.question));
        if (item) {
          const choices = shuffle([
            item.meaning,
            ...shuffle(group.data.filter(x => x.question !== item.question)).slice(0, 3).map(x => x.meaning)
          ]);
          hanjaQs.push({ type: 'character', question: item.question, answer: item.meaning, options: choices });
        }
      }

      const wordQs = [];
      while (wordQs.length < 5) {
        const lv = weightedRandomPick(weightedLevels);
        const group = allWord.find(g => g.level === lv);
        const item = shuffle(group.data).find(x => !wordQs.find(q => q.question === x.question));
        if (item) {
          const choices = shuffle([
            item.meaning,
            ...shuffle(group.data.filter(x => x.question !== item.question)).slice(0, 3).map(x => x.meaning)
          ]);
          wordQs.push({ type: 'word', question: item.question, answer: item.meaning, options: choices });
        }
      }

      questions = shuffle([...hanjaQs, ...wordQs]);
      nextQuestion();
    }

    function startTimer() {
      timeLeft = 15;
      document.getElementById('time-left').textContent = timeLeft;
      timer = setInterval(() => {
        timeLeft--;
        document.getElementById('time-left').textContent = timeLeft;
        if (timeLeft <= 0) {
          clearInterval(timer);
          current++;
          nextQuestion();
        }
      }, 1000);
    }

    function nextQuestion() {
      if (timer) clearInterval(timer);

      if (current >= questions.length) {
        showResult();
        return;
      }

      const q = questions[current];
      document.getElementById('question-type').textContent =
        q.type === 'character' ? "한자의 뜻을 고르세요" : "단어의 의미를 고르세요";
      document.getElementById('question-content').textContent = q.question;

      const choicesDiv = document.getElementById('choices');
      choicesDiv.innerHTML = "";

      q.options.forEach(option => {
        const btn = document.createElement("button");
        btn.className = "btn-secondary";
        btn.textContent = option;
        btn.onclick = () => {
          if (option === q.answer) score += 10;
          current++;
          nextQuestion();
        };
        choicesDiv.appendChild(btn);
      });

      startTimer();
    }

    function showResult() {
      const modal = document.getElementById('result-modal');
      const scoreText = document.getElementById('final-score');
      const resultImage = document.getElementById('result-image');

      // 여기서 점수는 전역에서 누적된 값(score)을 그대로 사용
      scoreText.textContent = `당신의 점수는 ${score} / 100입니다.`;

      if (score >= 80) {
        resultImage.src = 'image/happy.png';
      } else if (score < 50) {
        resultImage.src = 'image/angry.png';
      } else {
        resultImage.src = 'image/copybaru.png';
      }

      modal.classList.remove('hidden');
    }


    window.onload = () => {
      loadQuestions();
    };