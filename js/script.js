// ===============================
// Rubric-Exact script.js (strict 9 consecutive days)
// ===============================
const APOD_FEED = 'https://cdn.jsdelivr.net/gh/GCA-Classroom/apod/data.json';

const els = {
  start: document.getElementById('startDate'),
  end: document.getElementById('endDate'),
  btn: document.getElementById('getImageBtn'),
  gallery: document.getElementById('gallery'),
  status: document.getElementById('status'),
  factBar: document.getElementById('factBar'),
  modal: document.getElementById('modal'),
  modalClose: document.getElementById('modalClose'),
  modalMedia: document.getElementById('modalMedia'),
  modalTitle: document.getElementById('modalTitle'),
  modalDate: document.getElementById('modalDate'),
  modalExpl: document.getElementById('modalExpl'),
};

let DATA = [];       // asc by date
let MIN_DATE = null; // yyyy-mm-dd
let MAX_DATE = null; // yyyy-mm-dd

const FACTS = [
  "A day on Venus is longer than its year.",
  "Neutron stars can spin 600 times per second.",
  "Olympus Mons on Mars is ~3× Everest.",
  "Jupiter’s Great Red Spot is at least 350 years old.",
  "There are more trees on Earth than stars in the Milky Way.",
  "On Mercury, some sunsets make the Sun appear to reverse.",
  "Saturn would float in a bathtub big enough to hold it.",
  "Europa may hide an ocean larger than Earth’s.",
  "The Sun is 99.86% of the solar system’s mass.",
  "Spacesuits are basically tiny spacecraft."
];

// dates
const fmt   = d => d.toISOString().slice(0,10);
const parse = s => new Date(s + "T00:00:00");
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };

// youtube
function youTubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
  } catch {}
  return null;
}
const youTubeThumb = url => {
  const id = youTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : 'img/NASA-Logo-Large.jpg';
};

// ui
function showRandomFact(){ els.factBar.textContent = `Did you know? ${FACTS[Math.floor(Math.random()*FACTS.length)]}`; }
function setStatus(html){ els.status.innerHTML = html; }
function clearStatus(){ els.status.innerHTML = ""; }

// build exact 9-day calendar window
function nineDayWindowFrom(startStr){
  const start = parse(startStr);
  const days = [];
  for (let i=0;i<9;i++) days.push(fmt(addDays(start, i)));
  return days;
}

// clamp so start..start+8 stays within coverage
function clampStartForStrictNine(startStr){
  const latestStart = fmt(addDays(parse(MAX_DATE), -8));
  if (startStr < MIN_DATE) return MIN_DATE;
  if (startStr > latestStart) return latestStart;
  return startStr;
}

// render strict 9 with placeholders
function renderStrict(startStr){
  const s = clampStartForStrictNine(startStr);
  els.start.value = s;
  els.end.value = fmt(addDays(parse(s), 8));

  const days = nineDayWindowFrom(s);
  const byDate = new Map(DATA.map(x => [x.date, x]));

  els.gallery.innerHTML = "";
  let missing = 0;

  days.forEach(d=>{
    const item = byDate.get(d);
    if (item) els.gallery.appendChild(buildCard(item));
    else { missing++; els.gallery.appendChild(buildMissingCard(d)); }
  });

  const note = missing
    ? `Showing 9 consecutive days (${days[0]} → ${days[8]}). ${missing} ${missing===1?'date is':'dates are'} missing in the mirror feed.`
    : `Showing 9 consecutive days (${days[0]} → ${days[8]}).`;
  setStatus(`<p class="note">${note} Dataset coverage: ${MIN_DATE} → ${MAX_DATE}.</p>`);
}

// cards
function buildCard(item){
  const card = document.createElement('article');
  card.className = 'gallery-item';
  card.tabIndex = 0;

  const wrap = document.createElement('div');
  wrap.className = 'thumb-wrap';

  if (item.media_type === 'image'){
    const img = document.createElement('img');
    img.src = item.url;
    img.alt = item.title || "Astronomy Picture";
    wrap.appendChild(img);
  } else {
    const img = document.createElement('img');
    img.src = youTubeThumb(item.url);
    img.alt = (item.title || "APOD video") + " (video)";
    const badge = document.createElement('span');
    badge.className = 'play-badge';
    badge.textContent = '▶';
    wrap.appendChild(img);
    wrap.appendChild(badge);
  }

  const title = document.createElement('h3');
  title.className = 'card-title';
  title.textContent = item.title || 'Untitled';

  const date = document.createElement('p');
  date.className = 'card-date';
  date.textContent = new Date(item.date).toLocaleDateString(undefined, { year:'numeric', month:'long', day:'numeric' });

  card.appendChild(wrap);
  card.appendChild(title);
  card.appendChild(date);

  const open = () => openModal(item);
  card.addEventListener('click', open);
  card.addEventListener('keypress', e => { if (e.key==='Enter' || e.key===' '){ e.preventDefault(); open(); } });

  return card;
}

function buildMissingCard(dateStr){
  const card = document.createElement('article');
  card.className = 'gallery-item missing';
  const box = document.createElement('div');
  box.className = 'missing-box';
  box.textContent = "No APOD entry in mirror feed";
  const title = document.createElement('h3');
  title.className = 'card-title';
  title.textContent = '—';
  const date = document.createElement('p');
  date.className = 'card-date';
  date.textContent = new Date(dateStr).toLocaleDateString(undefined, { year:'numeric', month:'long', day:'numeric' });

  card.appendChild(box);
  card.appendChild(title);
  card.appendChild(date);
  return card;
}

// modal (no iframe for videos)
function openModal(item){
  els.modalMedia.innerHTML = '';
  if (item.media_type === 'image'){
    const img = document.createElement('img');
    img.src = item.hdurl || item.url;
    img.alt = item.title || "Astronomy Picture";
    els.modalMedia.appendChild(img);
  } else {
    const img = document.createElement('img');
    img.src = youTubeThumb(item.url);
    img.alt = (item.title || "APOD video") + " thumbnail";
    const link = document.createElement('a');
    link.href = item.url; link.target = '_blank'; link.rel = 'noopener';
    link.className = 'video-link-btn'; link.textContent = 'Watch on YouTube';
    els.modalMedia.appendChild(img);
    els.modalMedia.appendChild(link);
  }
  els.modalTitle.textContent = item.title || 'APOD';
  els.modalDate.textContent = new Date(item.date).toLocaleDateString(undefined, { year:'numeric', month:'long', day:'numeric' });
  els.modalExpl.textContent = item.explanation || '';

  els.modal.setAttribute('aria-hidden','false');
  document.body.classList.add('no-scroll');
}
function closeModal(){
  els.modal.setAttribute('aria-hidden','true');
  document.body.classList.remove('no-scroll');
  els.modalMedia.innerHTML = '';
}

// events
function onFetchClick(){
  if (!els.start.value) return;
  renderStrict(els.start.value);
}

async function bootstrap(){
  setStatus('<p class="loading">🔄 Loading space photos…</p>');
  try{
    const res = await fetch(APOD_FEED, { cache: 'no-store' });
    const json = await res.json();
    DATA = json
      .filter(x => x && x.date && (x.url || x.hdurl))
      .sort((a,b) => (a.date < b.date ? -1 : 1));
  } catch {
    setStatus('<p class="error">Could not load APOD data. Please refresh.</p>');
    return;
  }

  MIN_DATE = DATA[0].date;
  MAX_DATE = DATA[DATA.length-1].date;

  // inputs constrained to coverage
  els.start.min = els.end.min = MIN_DATE;
  els.start.max = els.end.max = MAX_DATE;

  showRandomFact();

  // default to last 9 consecutive calendar days within coverage (placeholders if needed)
  const lastStart = fmt(addDays(parse(MAX_DATE), -8));
  els.start.value = lastStart;
  els.end.value   = MAX_DATE;

  clearStatus();
  renderStrict(lastStart);

  // wire
  els.btn.addEventListener('click', onFetchClick);
  els.modalClose.addEventListener('click', closeModal);
  els.modal.addEventListener('click', e => { if (e.target.hasAttribute('data-close-modal')) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key==='Escape' && els.modal.getAttribute('aria-hidden')==='false') closeModal(); });

  // show coverage note
  setStatus(`<p class="note">Data coverage: ${MIN_DATE} → ${MAX_DATE}. Pick a start date; the app will show the next 9 consecutive calendar days.</p>`);
}

document.addEventListener('DOMContentLoaded', bootstrap);
