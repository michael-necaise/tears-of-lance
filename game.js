const books = [
  {
    id: 'carry-me',
    name: 'Carry Me, Dad',
    description: 'A tender story of a father carrying his son through life\'s mountains and valleys. Written for Owen.',
    baseTps: 0.5,
    owned: 1,
    cost: 0,
    unlocked: true,
    amazon: 'https://www.amazon.com/Carry-Dad-Lance-Wade-Fresquez/dp/B0CMR7W1TC'
  },
  {
    id: 'maya',
    name: 'Through Maya\'s Eyes',
    description: 'Maya the blind chocolate lab sees the strength and beauty in all her friends. A story of inclusion.',
    baseTps: 1.2,
    owned: 0,
    cost: 50,
    unlocked: false,
    amazon: 'https://www.amazon.com/Through-Mayas-Eyes-Lance-Fresquez/dp/B0DPH4ZR4Q'
  }
];

const upgrades = [
  {
    id: 'tissues',
    name: 'Premium Tissues',
    description: 'Better absorption. +1 click power.',
    cost: 25,
    effect: () => { state.clickPower += 1; },
    owned: 0
  },
  {
    id: 'reread',
    name: 'Reread Power',
    description: 'Each book generates 25% more tears.',
    cost: 100,
    effect: () => { state.multiplier *= 1.25; },
    owned: 0
  },
  {
    id: 'emotional',
    name: 'Emotional Depth',
    description: 'The stories hit harder. +0.5 base TPS to all books.',
    cost: 200,
    effect: () => { books.forEach(b => b.baseTps += 0.5); },
    owned: 0
  }
];

let state = {
  tears: 0,
  clickPower: 1,
  multiplier: 1,
  lastSave: Date.now()
};

const cryMessages = [
  "That's the good cry...",
  "Owen would understand.",
  "These stories hit different.",
  "Carry me through this feeling.",
  "Maya sees the beauty in the tears too.",
  "A father's love is powerful.",
  "Strength in vulnerability.",
  "More tears incoming..."
];

function load() {
  const saved = localStorage.getItem('tearsOfLance');
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
  localStorage.setItem('tearsOfLance', JSON.stringify({
    state,
    books: books.map(b => ({ owned: b.owned, unlocked: b.unlocked, baseTps: b.baseTps })),
    upgrades: upgrades.map(u => ({ owned: u.owned, cost: u.cost }))
  }));
}

function format(num) {
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return Math.floor(num).toLocaleString();
}

function calculateTps() {
  return books.reduce((sum, b) => sum + (b.owned * b.baseTps * state.multiplier), 0);
}

function render() {
  document.getElementById('tears').textContent = format(state.tears);
  document.getElementById('tps').textContent = calculateTps().toFixed(2);
  document.getElementById('clickPower').textContent = state.clickPower;

  const booksEl = document.getElementById('booksList');
  booksEl.innerHTML = books.map(b => `
    <div class="book">
      <div class="book-info">
        <div class="book-name">${b.name} ${b.owned ? `(x${b.owned})` : ''}</div>
        <div class="book-desc">${b.description}</div>
        ${b.amazon ? `<a href="${b.amazon}" target="_blank" style="font-size:0.85rem;color:var(--accent);">Get the real book →</a>` : ''}
      </div>
      <div class="book-stats">
        ${b.unlocked ? `
          <div>${(b.owned * b.baseTps * state.multiplier).toFixed(2)} tears/sec</div>
          ${b.cost > 0 ? `<button class="buy-btn" onclick="buyBook('${b.id}')" ${state.tears < b.cost ? 'disabled' : ''}>Buy for ${format(b.cost)} 💧</button>` : '<div>Starting book</div>'}
        ` : `<div style="color:var(--muted)">Unlock at ${format(b.cost)} tears</div>`}
      </div>
    </div>
  `).join('');

  const shopEl = document.getElementById('shopList');
  shopEl.innerHTML = upgrades.map(u => `
    <div class="upgrade">
      <div class="upgrade-info">
        <div class="upgrade-name">${u.name} ${u.owned ? `(x${u.owned})` : ''}</div>
        <div class="upgrade-desc">${u.description}</div>
      </div>
      <div class="upgrade-cost">
        <button class="buy-btn" onclick="buyUpgrade('${u.id}')" ${state.tears < u.cost ? 'disabled' : ''}>Buy for ${format(u.cost)} 💧</button>
      </div>
    </div>
  `).join('');
}

function buyBook(id) {
  const book = books.find(b => b.id === id);
  if (!book || state.tears < book.cost) return;
  state.tears -= book.cost;
  book.owned += 1;
  book.cost = Math.floor(book.cost * 1.5);
  book.unlocked = true;
  save();
  render();
}

function buyUpgrade(id) {
  const up = upgrades.find(u => u.id === id);
  if (!up || state.tears < up.cost) return;
  state.tears -= up.cost;
  up.owned += 1;
  up.effect();
  up.cost = Math.floor(up.cost * 1.8);
  save();
  render();
}

function cry() {
  state.tears += state.clickPower;
  const msg = cryMessages[Math.floor(Math.random() * cryMessages.length)];
  document.getElementById('cryMessage').textContent = msg;
  setTimeout(() => { document.getElementById('cryMessage').textContent = ''; }, 2000);
  save();
  render();
}

function tick() {
  state.tears += calculateTps() / 10; // 100ms interval
  if (state.tears >= 50 && !books[1].unlocked) {
    books[1].unlocked = true;
  }
  render();
  if (Math.random() < 0.05) save(); // occasional auto-save
}

document.getElementById('cryButton').addEventListener('click', cry);

load();
render();
setInterval(tick, 100);
setInterval(save, 5000);

// Unlock Maya when enough tears
setInterval(() => {
  if (state.tears >= books[1].cost && !books[1].unlocked) {
    books[1].unlocked = true;
    render();
  }
}, 1000);
