
const $ = id => document.getElementById(id);

const creatures = [
  { id: "clown", name: "Clownfish", emoji: "🐠", rarity: "Common", description: "A tiny reef resident that lives among the swaying anemones.", x: 13, y: 30, speed: 7 },
  { id: "blue", name: "Blue Tang", emoji: "🐟", rarity: "Common", description: "A curious blue swimmer that loves exploring coral reefs.", x: 43, y: 22, speed: 9 },
  { id: "puffer", name: "Pufferfish", emoji: "🐡", rarity: "Uncommon", description: "A round little fish with a big personality.", x: 72, y: 58, speed: 6 },
  { id: "jelly", name: "Moon Jellyfish", emoji: "🪼", rarity: "Rare", description: "A graceful drifter that glows softly in the ocean.", x: 57, y: 45, speed: 11 },
  { id: "octopus", name: "Octopus", emoji: "🐙", rarity: "Rare", description: "An intelligent explorer and expert at camouflage.", x: 22, y: 66, speed: 8 },
  { id: "turtle", name: "Sea Turtle", emoji: "🐢", rarity: "Uncommon", description: "A peaceful ocean traveler that can journey thousands of miles.", x: 80, y: 25, speed: 12 },
  { id: "shark", name: "Reef Shark", emoji: "🦈", rarity: "Epic", description: "A graceful predator that helps keep the reef ecosystem balanced.", x: 34, y: 48, speed: 10 },
  { id: "dolphin", name: "Dolphin", emoji: "🐬", rarity: "Epic", description: "A playful, intelligent marine mammal that communicates with clicks and whistles.", x: 62, y: 72, speed: 8 }
];

const defaultData = {
  discovered: [],
  treasures: 0,
  maxDepth: 0,
  bestScore: 0,
  night: false
};

let data;
try {
  data = { ...defaultData, ...JSON.parse(localStorage.getItem("deepBlueSave") || "{}") };
} catch {
  data = { ...defaultData };
}

let depth = 0;
let gameActive = false;
let gameScore = 0;
let gameTime = 30;
let gameTimer = null;
let bubbleSpawner = null;
let toastTimer;

function save() {
  localStorage.setItem("deepBlueSave", JSON.stringify(data));
  updateStats();
}

function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("show"), 3200);
}

function updateStats() {
  $("speciesStat").textContent = data.discovered.length;
  $("treasureStat").textContent = data.treasures;
  $("depthStat").textContent = data.maxDepth + "m";
  $("aquariumCount").textContent = data.discovered.length;
  $("sideTreasure").textContent = data.treasures;
  $("gameBest").textContent = String(data.bestScore).padStart(3, "0");
}

function buildAquarium() {
  const container = $("aquariumCreatures");
  container.innerHTML = "";

  creatures.forEach(fish => {
    const button = document.createElement("button");
    button.className = "swimming-fish";
    button.textContent = fish.emoji;
    button.title = "Discover a sea creature";
    button.setAttribute("aria-label", "Discover " + fish.name);
    button.style.left = fish.x + "%";
    button.style.top = fish.y + "%";
    button.style.setProperty("--duration", fish.speed + "s");
    button.style.setProperty("--delay", (-fish.x / 10) + "s");
    button.addEventListener("click", () => discover(fish));
    container.appendChild(button);
  });
}

function discover(fish) {
  const firstTime = !data.discovered.includes(fish.id);

  if (firstTime) {
    data.discovered.push(fish.id);
    save();
    buildJournal();
    toast("✦ New discovery: " + fish.name + "!");
  }

  const info = $("creatureInfo");
  info.querySelector(".info-icon").textContent = fish.emoji;
  info.querySelector("strong").textContent = fish.name + " · " + fish.rarity;
  info.querySelector("p").textContent = fish.description;

  if (data.discovered.length === creatures.length && firstTime) {
    setTimeout(() => toast("🏆 Ocean naturalist! You discovered every species!"), 3500);
  }
}

function buildJournal() {
  const grid = $("journalGrid");
  grid.innerHTML = "";

  creatures.forEach(fish => {
    const unlocked = data.discovered.includes(fish.id);
    const card = document.createElement("div");
    card.className = "journal-card" + (unlocked ? "" : " locked");

    const emoji = document.createElement("span");
    emoji.className = "journal-emoji";
    emoji.textContent = fish.emoji;

    const name = document.createElement("h3");
    name.textContent = unlocked ? fish.name : "??? Unknown";

    const rarity = document.createElement("small");
    rarity.textContent = unlocked ? fish.rarity.toUpperCase() : "NOT YET DISCOVERED";

    card.append(emoji, name, rarity);
    grid.appendChild(card);
  });
}

function getZone(d) {
  if (d < 200) return {
    name: "Sunlit",
    creature: "🐠",
    message: "Sunbeams dance through the water. Colorful fish are everywhere.",
    background: "linear-gradient(#16758c,#0c425e)"
  };
  if (d < 500) return {
    name: "Twilight",
    creature: "🪼",
    message: "The sunlight begins to fade. Strange glowing creatures appear.",
    background: "linear-gradient(#123e68,#0a264b)"
  };
  if (d < 800) return {
    name: "Midnight",
    creature: "🦑",
    message: "It's almost completely dark. Tiny lights flicker in the distance.",
    background: "linear-gradient(#081b3b,#030e28)"
  };
  return {
    name: "Abyss",
    creature: "👁️",
    message: "The silent abyss. Very few explorers have ever seen this place.",
    background: "linear-gradient(#03091d,#010512)"
  };
}

function updateDive() {
  const zone = getZone(depth);
  $("depthDisplay").textContent = String(depth).padStart(3, "0") + " M";
  $("sideDepth").textContent = depth + " m";
  $("sideZone").textContent = zone.name;
  $("zoneLabel").textContent = zone.name.toUpperCase() + " ZONE";
  $("diveCreature").textContent = zone.creature;
  $("diveMessage").textContent = zone.message;
  $("diveWindow").style.background = zone.background;
  $("depthProgress").style.width = (depth / 1000 * 100) + "%";
  $("treasureHint").textContent = depth < 200
    ? "Try exploring deeper for rarer discoveries."
    : "There's something mysterious down here...";
}

$("descendBtn").addEventListener("click", () => {
  if (depth >= 1000) {
    toast("You've reached the deepest part of this expedition!");
    return;
  }
  depth = Math.min(1000, depth + 50);
  if (depth > data.maxDepth) {
    data.maxDepth = depth;
    save();
  }
  updateDive();
  if ([200,500,800,1000].includes(depth)) {
    toast("✦ Entering a new ocean zone!");
  }
});

$("surfaceBtn").addEventListener("click", () => {
  depth = Math.max(0, depth - 50);
  updateDive();
});

$("treasureBtn").addEventListener("click", () => {
  const chance = .18 + depth / 1000 * .55;
  if (Math.random() < chance) {
    data.treasures++;
    save();
    const treasures = [
      "An ancient golden coin 🪙",
      "A beautiful pearl 🦪",
      "A mysterious seashell 🐚",
      "A lost explorer's compass 🧭",
      "A sparkling ocean crystal 💎",
      "A forgotten treasure chest 🧰"
    ];
    toast("TREASURE FOUND! " + treasures[Math.floor(Math.random() * treasures.length)]);
  } else {
    toast("Nothing this time. The ocean still has secrets...");
  }
});

function makeAmbientBubble() {
  const bubble = document.createElement("div");
  bubble.className = "ambient-bubble";
  const size = Math.random() * 15 + 4;
  bubble.style.width = size + "px";
  bubble.style.height = size + "px";
  bubble.style.left = Math.random() * 100 + "%";
  bubble.style.animationDuration = (Math.random() * 9 + 8) + "s";
  $("bubbles").appendChild(bubble);
  bubble.addEventListener("animationend", () => bubble.remove());
}

setInterval(() => {
  if (!document.hidden && $("bubbles").childElementCount < 30) {
    makeAmbientBubble();
  }
}, 650);

function updateGameDisplay() {
  $("gameScore").textContent = String(gameScore).padStart(3, "0");
  $("gameTime").textContent = gameTime + "s";
}

function spawnGameBubble() {
  if (!gameActive) return;
  const area = $("gameArea");
  const bubble = document.createElement("button");
  bubble.className = "game-bubble";
  bubble.setAttribute("aria-label", "Pop bubble");

  const size = 30 + Math.random() * 65;
  const maxX = Math.max(0, area.clientWidth - size - 10);
  const maxY = Math.max(0, area.clientHeight - size - 10);
  bubble.style.width = size + "px";
  bubble.style.height = size + "px";
  bubble.style.left = (5 + Math.random() * maxX) + "px";
  bubble.style.top = (5 + Math.random() * maxY) + "px";

  bubble.addEventListener("click", () => {
    if (!gameActive || bubble.classList.contains("pop")) return;
    gameScore += Math.round(100 / size * 5);
    updateGameDisplay();
    bubble.classList.add("pop");
    setTimeout(() => bubble.remove(), 200);
  });

  area.appendChild(bubble);
  setTimeout(() => bubble.remove(), 2300);
}

function endGame() {
  gameActive = false;
  clearInterval(gameTimer);
  clearInterval(bubbleSpawner);

  if (gameScore > data.bestScore) {
    data.bestScore = gameScore;
    save();
    toast("✦ New high score!");
  }

  $("gameArea").innerHTML = `
    <div class="game-placeholder">
      <span>🫧</span>
      <h3>Nice and bubbly.</h3>
      <p>You scored ${gameScore} points. Ready for another round?</p>
      <button id="startGameBtn" class="btn primary">Play again →</button>
    </div>
  `;
  $("startGameBtn").addEventListener("click", startGame);
}

function startGame() {
  if (gameActive) return;
  gameActive = true;
  gameScore = 0;
  gameTime = 30;
  $("gameArea").innerHTML = "";
  updateGameDisplay();

  bubbleSpawner = setInterval(spawnGameBubble, 350);
  spawnGameBubble();

  gameTimer = setInterval(() => {
    gameTime--;
    updateGameDisplay();
    if (gameTime <= 0) endGame();
  }, 1000);
}

$("startGameBtn").addEventListener("click", startGame);

$("resetBtn").addEventListener("click", () => {
  if (!confirm("Reset all discoveries, treasures, and high scores?")) return;
  data = { ...defaultData };
  depth = 0;
  document.body.classList.remove("night");
  save();
  updateDive();
  buildJournal();
  toast("Your ocean journal has been reset.");
});

$("themeBtn").addEventListener("click", () => {
  data.night = !data.night;
  document.body.classList.toggle("night", data.night);
  $("themeBtn").textContent = data.night ? "☀" : "☾";
  save();
});

let audioContext = null;
let oceanSource = null;
let oceanGain = null;
let oceanPlaying = false;

function startOceanSound() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    toast("Your browser does not support ocean audio.");
    return;
  }

  audioContext = new AudioCtx();
  const length = audioContext.sampleRate * 3;
  const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
  const channel = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    channel[i] = (Math.random() * 2 - 1) * .2;
  }

  oceanSource = audioContext.createBufferSource();
  oceanSource.buffer = buffer;
  oceanSource.loop = true;

  const filter = audioContext.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 350;

  oceanGain = audioContext.createGain();
  oceanGain.gain.value = 0;
  oceanGain.gain.linearRampToValueAtTime(.5, audioContext.currentTime + 2);

  oceanSource.connect(filter);
  filter.connect(oceanGain);
  oceanGain.connect(audioContext.destination);
  oceanSource.start();

  oceanPlaying = true;
  $("soundBtn").textContent = "♪";
  toast("Ocean ambience enabled ♫");
}

function stopOceanSound() {
  if (audioContext) {
    oceanGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + .3);
    const oldContext = audioContext;
    setTimeout(() => oldContext.close(), 450);
  }
  audioContext = null;
  oceanPlaying = false;
  $("soundBtn").textContent = "♫";
  toast("Ocean ambience paused");
}

$("soundBtn").addEventListener("click", () => {
  if (oceanPlaying) stopOceanSound();
  else startOceanSound();
});

document.body.classList.toggle("night", data.night);
$("themeBtn").textContent = data.night ? "☀" : "☾";

buildAquarium();
buildJournal();
updateDive();
updateStats();
