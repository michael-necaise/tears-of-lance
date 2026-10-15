const MAX_OWNED = 69;
const SAVE_KEY = 'tearsOfLance_v9';

const books = [
  {
    id: 'carry-me',
    name: 'Carry Me, Dad',
    description: 'A tender story of a father carrying his son through life\'s mountains and valleys. Written for Owen.',
    baseTps: 1,
    owned: 1,
    cost: 25,
    unlocked: true,
    amazon: 'https://www.amazon.com/Carry-Dad-Lance-Wade-Fresquez/dp/B0CMR7W1TC'
  },
  {
    id: 'maya',
    name: 'Through Maya\'s Eyes',
    description: 'Maya the blind chocolate lab sees the strength and beauty in all her friends. A story of inclusion.',
    baseTps: 2,
    owned: 0,
    cost: 100,
    unlocked: false,
    amazon: 'https://www.amazon.com/Through-Mayas-Eyes-Lance-Fresquez/dp/B0DPH4ZR4Q'
  },
  {
    id: 'walk-with-me',
    name: 'Walk with Me',
    description: 'A heartfelt journey of walking side by side through life\'s paths, moments, and challenges. Another story that hits right in the feels.',
    baseTps: 4,
    owned: 0,
    cost: 750,
    unlocked: false,
    amazon: 'https://a.co/d/0aWb3Vop'
  }
];

const upgrades = [
  {
    id: 'tissues',
    name: 'Premium Tissues',
    description: 'Better absorption. +1 auto clicker power.',
    cost: 50,
    effect: () => { state.clickPower += 1; },
    owned: 0
  },
  {
    id: 'emotional',
    name: 'Emotional Depth',
    description: 'The stories hit harder. +3 base TPS to all books.',
    cost: 500,
    effect: () => { books.forEach(b => b.baseTps += 3); },
    owned: 0
  },
  {
    id: 'reread',
    name: 'Reread Power',
    description: 'Each book generates 25% more tears.',
    cost: 250,
    effect: () => { state.multiplier *= 1.25; },
    owned: 0
  },
  {
    id: 'momentum',
    name: 'Trail Momentum',
    description: 'Pick up speed on the trail. +50% all tear production.',
    cost: 1500,
    effect: () => { state.multiplier *= 1.5; },
    owned: 0
  },
  {
    id: 'clippy',
    name: 'Clippy the Bookmark',
    description: '"It looks like you\'re trying to generate tears." Clippy holds your place and boosts all production by 10%.',
    cost: 1000,
    effect: () => { state.multiplier *= 1.1; },
    owned: 0
  }
];

let state = {
  tears: 0,
  clickPower: 1,
  multiplier: 1,
  spruceUnlocked: false,
  sprucePower: 1,
  lastSave: Date.now()
};

let summitShown = false;
let lastBuyTime = 0;
const BUY_COOLDOWN = 150;

const cryMessages = [
  "That's the good cry...",
  "Owen would understand.",
  "These stories hit different.",
  "Carry me through this feeling.",
  "Maya sees the beauty in the tears too.",
  "Walk with me through the feels.",
  "Spruce power activated!",
  "A father's love is powerful.",
  "Strength in vulnerability.",
  "More tears incoming...",
  "Clippy is watching your progress..."
];

const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qb', 'Qc', 'Qd', 'Qe', 'Qf', 'Qg', 'Qh', 'Qi', 'Qj', 'Qk'];

function load() {
  const saved = localStorage.getItem(SAVE_KEY);
  if (saved) {
    const data = JSON.parse(saved);
    state = { ...state, ...data.state };
    books.forEach((b, i) => {
      if (data.books && data.books[i]) Object.assign(b, data.books[i]);
    });
    upgrades.forEach((u, i) => {
      if (data.upgrades && data.upgrades[i]) Object.assign(u, data.upgrades[i]);
    });
  }
}

function save() {
  localStorage.setItem(SAVE_KEY, JSON.stringify({
    state,
    books: books.map(b => ({ owned: b.owned, unlocked: b.unlocked, baseTps: b.baseTps, cost: b.cost })),
    upgrades: upgrades.map(u => ({ owned: u.owned, cost: u.cost }))
  }));
}

function format(num) {
  num = Number(num) || 0;
  if (num < 1000) return Math.floor(num).toLocaleString();

  let tier = Math.floor(Math.log10(num) / 3);
  if (tier >= SUFFIXES.length) tier = SUFFIXES.length - 1;

  const suffix = SUFFIXES[tier];
  const scaled = num / Math.pow(1000, tier);
  return scaled.toFixed(2) + suffix;
}

function updateSprucePower() {
  if (state.tears >= 5000) {
    state.spruceUnlocked = true;
    const thousands = Math.floor(state.tears / 1000);
    state.sprucePower = Math.min(10, 1 + (thousands * 0.005));
  } else {
    state.spruceUnlocked = false;
    state.sprucePower = 1;
  }
}

function calculateTps() {
  const bookTps = books.reduce((sum, b) => sum + (b.owned * b.baseTps * state.multiplier), 0);
  const autoClickTps = state.clickPower * state.multiplier;
  return (bookTps + autoClickTps) * state.sprucePower;
}

function everythingMaxed() {
  const booksMaxed = books.every(b => b.owned >= MAX_OWNED);
  const upgradesMaxed = upgrades.every(u => u.owned >= MAX_OWNED);
  return booksMaxed && upgradesMaxed;
}

function showSummitPopup() {
  const modal = document.getElementById('summitModal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

function render() {
  document.getElementById('tears').textContent = format(state.tears);
  document.getElementById('tps').textContent = format(calculateTps());
  document.getElementById('clickPower').textContent = state.clickPower;

  const spruceEl = document.getElementById('sprucePower');
  if (state.spruceUnlocked) {
    spruceEl.textContent = state.sprucePower.toFixed(2) + 'x';
    spruceEl.parentElement.querySelector('.label').textContent = 'Spruce Power';
  } else {
    spruceEl.textContent = 'Locked';
  }

  if (everythingMaxed() && !summitShown) {
    summitShown = true;
    setTimeout(showSummitPopup, 100);
  }

  const booksEl = document.getElementById('booksList');
  booksEl.innerHTML = books.map(b => {
    const atMax = b.owned >= MAX_OWNED;
    return `
    <div class="book">
      <div class="book-info">
        <div class="book-name">${b.name} ${b.owned ? `(x${b.owned}${atMax ? ' MAX' : ''})` : ''}</div>
        <div class="book-desc">${b.description}</div>
        ${b.amazon ? `<a href="${b.amazon}" target="_blank" style="font-size:0.85rem;color:var(--accent);">Get the real book →</a>` : ''}
      </div>
      <div class="book-stats">
        ${b.unlocked ? `
          <div>${format(b.owned * b.baseTps * state.multiplier * state.sprucePower)} tears/sec</div>
          ${!atMax ? `<button class="buy-btn" data-type="book" data-id="${b.id}" ${state.tears < b.cost ? 'disabled' : ''}>Buy for ${format(b.cost)} 💧</button>` : '<div>Maxed (69)</div>'}
        ` : `<div style="color:var(--muted)">Unlock at ${format(b.cost)} tears</div>`}
      </div>
    </div>
  `;}).join('');

  const shopEl = document.getElementById('shopList');
  shopEl.innerHTML = upgrades.map(u => {
    const atMax = u.owned >= MAX_OWNED;
    return `
    <div class="upgrade">
      <div class="upgrade-info">
        <div class="upgrade-name">${u.name} ${u.owned ? `(x${u.owned}${atMax ? ' MAX' : ''})` : ''}</div>
        <div class="upgrade-desc">${u.description}</div>
      </div>
      <div class="upgrade-cost">
        ${!atMax ? `<button class="buy-btn" data-type="upgrade" data-id="${u.id}" ${state.tears < u.cost ? 'disabled' : ''}>Buy for ${format(u.cost)} 💧</button>` : '<div>Maxed (69)</div>'}
      </div>
    </div>
  `;}).join('');

  document.querySelectorAll('.buy-btn').forEach(btn => {
    btn.addEventListener('click', handleBuy);
  });
}

function handleBuy(e) {
  e.preventDefault();
  const now = Date.now();
  if (now - lastBuyTime < BUY_COOLDOWN) return;
  lastBuyTime = now;

  const type = e.target.dataset.type;
  const id = e.target.dataset.id;
  if (type === 'book') buyBook(id);
  if (type === 'upgrade') buyUpgrade(id);
}

function buyBook(id) {
  const book = books.find(b => b.id === id);
  if (!book || state.tears < book.cost || book.owned >= MAX_OWNED) return;
  state.tears -= book.cost;
  book.owned += 1;
  book.cost = Math.floor(book.cost * 1.6);
  book.unlocked = true;
  save();
  render();
}

function buyUpgrade(id) {
  const up = upgrades.find(u => u.id === id);
  if (!up || state.tears < up.cost || up.owned >= MAX_OWNED) return;
  state.tears -= up.cost;
  up.owned += 1;
  up.effect();
  up.cost = Math.floor(up.cost * 1.9);
  save();
  render();
}

function cry() {
  state.tears += state.clickPower;
  const msg = cryMessages[Math.floor(Math.random() * cryMessages.length)];
  document.getElementById('cryMessage').textContent = msg;
  setTimeout(() => { document.getElementById('cryMessage').textContent = ''; }, 2000);
  updateSprucePower();
  save();
  render();
}

function resetProgress() {
  if (!confirm('Reset all progress? This cannot be undone.')) return;

  state = {
    tears: 0,
    clickPower: 1,
    multiplier: 1,
    spruceUnlocked: false,
    sprucePower: 1,
    lastSave: Date.now()
  };
  summitShown = false;

  books[0].owned = 1;
  books[0].cost = 25;
  books[0].unlocked = true;
  books[0].baseTps = 1;

  books[1].owned = 0;
  books[1].cost = 100;
  books[1].unlocked = false;
  books[1].baseTps = 2;

  books[2].owned = 0;
  books[2].cost = 750;
  books[2].unlocked = false;
  books[2].baseTps = 4;

  upgrades.forEach(u => {
    u.owned = 0;
    if (u.id === 'tissues') u.cost = 50;
    if (u.id === 'reread') u.cost = 250;
    if (u.id === 'emotional') u.cost = 500;
    if (u.id === 'momentum') u.cost = 1500;
    if (u.id === 'clippy') u.cost = 1000;
  });

  localStorage.removeItem(SAVE_KEY);
  const modal = document.getElementById('summitModal');
  if (modal) modal.style.display = 'none';
  updateSprucePower();
  render();
}

function tick() {
  const tps = calculateTps();
  state.tears += tps / 10;
  if (state.tears >= 100 && !books[1].unlocked) {
    books[1].unlocked = true;
  }
  if (state.tears >= 750 && !books[2].unlocked) {
    books[2].unlocked = true;
  }
  updateSprucePower();
  render();
  if (Math.random() < 0.05) save();
}

document.getElementById('cryButton').addEventListener('click', cry);
document.getElementById('resetButton').addEventListener('click', resetProgress);

const closeBtn = document.getElementById('closeSummit');
if (closeBtn) {
  closeBtn.addEventListener('click', () => {
    document.getElementById('summitModal').style.display = 'none';
  });
}

load();
updateSprucePower();
render();
setInterval(tick, 100);
setInterval(save, 5000);
