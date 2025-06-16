let currentPair = null;
let cachedFiles = {}; // 파일 캐시

// 가중치 계산: 가까운 급수일수록 높은 가중치
function getWeightedLines(level) {
  const allLines = [];
  const selectedLevel = parseInt(level.replace(/[^0-9]/g, '')); // "준5" → 5 처리

  for (let l = selectedLevel; l <= 8; l++) {
    const fileLevel = l.toString();
    const content = cachedFiles[fileLevel];
    if (!content) continue;

    const lines = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && (line.includes('\t') || line.includes('  '))); // 탭 또는 다중 공백 포함된 줄

    // 가까운 급수일수록 높은 가중치
    const weight = 1 + (8 - l); // 8급: 1, 7급: 2, ..., 선택한 급수: 최고
    for (let i = 0; i < weight; i++) {
      allLines.push(...lines);
    }
  }
  return allLines;
}

async function showRandomHanja() {
  const level = document.getElementById('level').value;
  const hanjaBtn = document.getElementById('hanjaBtn');
  const hanjaDisplay = document.getElementById('hanjaDisplay');
  const meaningDisplay = document.getElementById('meaningDisplay');

  hanjaBtn.innerHTML = '<span class="loading"></span>한자 로딩...';
  hanjaBtn.disabled = true;

  try {
    const selected = parseInt(level.replace(/[^0-9]/g, ''));
    for (let l = selected; l <= 8; l++) {
      const fileLevel = l.toString();
      if (!cachedFiles[fileLevel]) {
        const response = await fetch(`character/${fileLevel}.txt`);
        if (response.ok) {
          const text = await response.text();
          cachedFiles[fileLevel] = text;
        }
      }
    }

    const lines = getWeightedLines(level);
    if (lines.length === 0) throw new Error('한자 데이터가 없습니다.');

    const randomLine = lines[Math.floor(Math.random() * lines.length)];
    const parts = randomLine.split(/\t+|\s{2,}/).filter(part => part.trim());
    if (parts.length < 2) throw new Error('형식 오류');

    const [hanja, meaning, reading] = parts;
    const combinedMeaning = reading ? `${meaning} (${reading})` : meaning;
    currentPair = { hanja, meaning: combinedMeaning };

    hanjaDisplay.className = 'hanja-text fade-in pulse';
    hanjaDisplay.textContent = hanja;

    meaningDisplay.className = 'meaning-text';
    meaningDisplay.textContent = '❓';

    document.getElementById('meaningBtn').disabled = false;
  } catch (error) {
    console.error('한자 로딩 오류:', error);
    alert(`한자 로딩 실패\n${error.message}`);
    hanjaDisplay.textContent = '❌';
    meaningDisplay.textContent = '오류';
  } finally {
    hanjaBtn.innerHTML = '🎲 한자 보기';
    hanjaBtn.disabled = false;
  }
}

function showMeaning() {
  if (currentPair) {
    const meaningDisplay = document.getElementById('meaningDisplay');
    meaningDisplay.className = 'meaning-text fade-in';
    meaningDisplay.textContent = currentPair.meaning;
    document.getElementById('meaningBtn').disabled = true;
  }
}


// 키보드 단축키
document.addEventListener('keydown', function(event) {
  if (event.code === 'Space') {
    event.preventDefault();
    if (!document.getElementById('hanjaBtn').disabled) showRandomHanja();
  } else if (event.code === 'Enter') {
    event.preventDefault();
    if (!document.getElementById('meaningBtn').disabled) showMeaning();
  }
});

window.addEventListener('load', function() {
  document.querySelector('.container').style.animation = 'fadeIn 0.8s ease-out';
});


