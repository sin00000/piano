// 페이지 스크롤 완전 차단 (keyboard-scroll, drum-section은 CSS touch-action으로 허용)
document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });

// ══════════════════════════════════════════════════════════════════════════
// DATA
// ══════════════════════════════════════════════════════════════════════════

const WHITE_NOTES = [
    { label: 'Do',  note: 'C4',  freq: 261.63, semitone: 0  },
    { label: 'Re',  note: 'D4',  freq: 293.66, semitone: 2  },
    { label: 'Mi',  note: 'E4',  freq: 329.63, semitone: 4  },
    { label: 'Fa',  note: 'F4',  freq: 349.23, semitone: 5  },
    { label: 'Sol', note: 'G4',  freq: 392.00, semitone: 7  },
    { label: 'La',  note: 'A4',  freq: 440.00, semitone: 9  },
    { label: 'Si',  note: 'B4',  freq: 493.88, semitone: 11 },
    { label: 'Do',  note: 'C5',  freq: 523.25, semitone: 0  },
    { label: 'Re',  note: 'D5',  freq: 587.33, semitone: 2  },
    { label: 'Mi',  note: 'E5',  freq: 659.25, semitone: 4  },
    { label: 'Fa',  note: 'F5',  freq: 698.46, semitone: 5  },
    { label: 'Sol', note: 'G5',  freq: 783.99, semitone: 7  },
    { label: 'La',  note: 'A5',  freq: 880.00, semitone: 9  },
    { label: 'Si',  note: 'B5',  freq: 987.77, semitone: 11 },
];

// wOffset = center position in white-key units (0.5 = between key 0 and 1)
const BLACK_NOTES = [
    { label: 'C#', sub: 'D♭', note: 'C#4', freq: 277.18, semitone: 1,  wOffset: 0.5  },
    { label: 'D#', sub: 'E♭', note: 'D#4', freq: 311.13, semitone: 3,  wOffset: 1.5  },
    { label: 'F#', sub: 'G♭', note: 'F#4', freq: 369.99, semitone: 6,  wOffset: 3.5  },
    { label: 'G#', sub: 'A♭', note: 'G#4', freq: 415.30, semitone: 8,  wOffset: 4.5  },
    { label: 'A#', sub: 'B♭', note: 'A#4', freq: 466.16, semitone: 10, wOffset: 5.5  },
    { label: 'C#', sub: 'D♭', note: 'C#5', freq: 554.37, semitone: 1,  wOffset: 7.5  },
    { label: 'D#', sub: 'E♭', note: 'D#5', freq: 622.25, semitone: 3,  wOffset: 8.5  },
    { label: 'F#', sub: 'G♭', note: 'F#5', freq: 739.99, semitone: 6,  wOffset: 10.5 },
    { label: 'G#', sub: 'A♭', note: 'G#5', freq: 830.61, semitone: 8,  wOffset: 11.5 },
    { label: 'A#', sub: 'B♭', note: 'A#5', freq: 932.33, semitone: 10, wOffset: 12.5 },
];

const DRUMS = [
    { id: 'kick',    label: 'KICK',  sub: 'Bass',   color: '#ff3030' },
    { id: 'snare',   label: 'SNRE',  sub: 'Hit',    color: '#ff8800' },
    { id: 'hihat',   label: 'HHAT',  sub: 'Closed', color: '#ffdd00' },
    { id: 'clap',    label: 'CLAP',  sub: 'Hand',   color: '#33dd55' },
    { id: 'tom',     label: 'TOM',   sub: 'Mid',    color: '#00bbff' },
    { id: 'ride',    label: 'RIDE',  sub: 'Cymbal', color: '#4466ff' },
    { id: 'openhat', label: 'OPEN',  sub: 'Hi-Hat', color: '#aa33ff' },
    { id: 'crash',   label: 'CRSH',  sub: 'Cymbal', color: '#ff44aa' },
    { id: 'rim',     label: 'RIM',   sub: 'Shot',   color: '#88ff33' },
];

// ══════════════════════════════════════════════════════════════════════════
// AUDIO
// ══════════════════════════════════════════════════════════════════════════

let audioCtx = null;

function getAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window['webkitAudioContext'])();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

// ── Piano tone ─────────────────────────────────────────────────────────────

function playPianoNote(freq) {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator(), g1 = ctx.createGain();
    osc1.connect(g1); g1.connect(ctx.destination);
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);
    g1.gain.setValueAtTime(0.38, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    osc1.start(now); osc1.stop(now + 1.5);

    const osc2 = ctx.createOscillator(), g2 = ctx.createGain();
    osc2.connect(g2); g2.connect(ctx.destination);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, now);
    g2.gain.setValueAtTime(0.1, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.start(now); osc2.stop(now + 0.6);

    const osc3 = ctx.createOscillator(), g3 = ctx.createGain();
    osc3.connect(g3); g3.connect(ctx.destination);
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq, now);
    g3.gain.setValueAtTime(0.16, now);
    g3.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
    osc3.start(now); osc3.stop(now + 2.0);
}

// ── Drum synthesis helpers ─────────────────────────────────────────────────

function noiseBuffer(ctx, dur) {
    const len = Math.ceil(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    return src;
}

function playKick(ctx, t) {
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(0.001, t + 0.45);
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    osc.start(t); osc.stop(t + 0.45);

    const click = ctx.createOscillator(), cg = ctx.createGain();
    click.connect(cg); cg.connect(ctx.destination);
    click.frequency.setValueAtTime(900, t);
    cg.gain.setValueAtTime(0.5, t);
    cg.gain.exponentialRampToValueAtTime(0.001, t + 0.014);
    click.start(t); click.stop(t + 0.014);
}

function playSnare(ctx, t) {
    const noise = noiseBuffer(ctx, 0.25);
    const filter = ctx.createBiquadFilter(), ng = ctx.createGain();
    filter.type = 'bandpass'; filter.frequency.value = 3000; filter.Q.value = 0.6;
    noise.connect(filter); filter.connect(ng); ng.connect(ctx.destination);
    ng.gain.setValueAtTime(0.7, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    noise.start(t);

    const osc = ctx.createOscillator(), og = ctx.createGain();
    osc.connect(og); og.connect(ctx.destination);
    osc.type = 'triangle'; osc.frequency.setValueAtTime(220, t);
    og.gain.setValueAtTime(0.4, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.start(t); osc.stop(t + 0.1);
}

function playHihat(ctx, t, open = false) {
    const dur = open ? 0.35 : 0.065;
    const noise = noiseBuffer(ctx, dur);
    const filter = ctx.createBiquadFilter(), g = ctx.createGain();
    filter.type = 'highpass'; filter.frequency.value = 8000;
    noise.connect(filter); filter.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.45, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    noise.start(t);
}

function playClap(ctx, t) {
    for (let i = 0; i < 3; i++) {
        const ti = t + i * 0.013;
        const noise = noiseBuffer(ctx, 0.07);
        const filter = ctx.createBiquadFilter(), g = ctx.createGain();
        filter.type = 'bandpass'; filter.frequency.value = 2500;
        noise.connect(filter); filter.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0.65, ti);
        g.gain.exponentialRampToValueAtTime(0.001, ti + 0.07);
        noise.start(ti);
    }
}

function playTom(ctx, t) {
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.3);
    g.gain.setValueAtTime(0.85, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.start(t); osc.stop(t + 0.3);
}

function playRide(ctx, t) {
    [820, 1240, 1680, 2200].forEach(f => {
        const osc = ctx.createOscillator(), g = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.type = 'sine'; osc.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.09, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        osc.start(t); osc.stop(t + 0.6);
    });
}

function playCrash(ctx, t) {
    const noise = noiseBuffer(ctx, 1.2);
    const filter = ctx.createBiquadFilter(), g = ctx.createGain();
    filter.type = 'highpass'; filter.frequency.value = 5000;
    noise.connect(filter); filter.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
    noise.start(t);
}

function playRim(ctx, t) {
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = 'square'; osc.frequency.setValueAtTime(1200, t);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    osc.start(t); osc.stop(t + 0.03);

    const noise = noiseBuffer(ctx, 0.03);
    const f2 = ctx.createBiquadFilter(), g2 = ctx.createGain();
    f2.type = 'bandpass'; f2.frequency.value = 2000;
    noise.connect(f2); f2.connect(g2); g2.connect(ctx.destination);
    g2.gain.setValueAtTime(0.4, t);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    noise.start(t);
}

function playDrum(id, t, ctx) {
    switch (id) {
        case 'kick':    playKick(ctx, t);         break;
        case 'snare':   playSnare(ctx, t);        break;
        case 'hihat':   playHihat(ctx, t, false); break;
        case 'clap':    playClap(ctx, t);         break;
        case 'tom':     playTom(ctx, t);          break;
        case 'ride':    playRide(ctx, t);         break;
        case 'openhat': playHihat(ctx, t, true);  break;
        case 'crash':   playCrash(ctx, t);        break;
        case 'rim':     playRim(ctx, t);          break;
    }
}

// ══════════════════════════════════════════════════════════════════════════
// PIANO KEYBOARD LAYOUT
// ══════════════════════════════════════════════════════════════════════════

function noteColor(semitone) {
    return `hsl(${Math.round((semitone / 12) * 360)}, 100%, 58%)`;
}

// Compute piano key dimensions to fit both width AND height of the piano section
// Breakpoints mirror the CSS media queries
const vw = window.innerWidth;
const vh = window.innerHeight;
const IS_MOBILE      = vw < 768;
const IS_LANDSCAPE_S = !IS_MOBILE && vw < 900 && vh < 500; // 모바일 가로
const TOPBAR_H       = IS_LANDSCAPE_S ? 38 : IS_MOBILE ? 44 : 52;
const DRUM_W         = IS_MOBILE ? 0 : (IS_LANDSCAPE_S ? 220 : vw < 1024 ? 232 : 272);
const H_PADDING      = IS_MOBILE ? 16 : 32;         // piano-section 상하 패딩
const W_PADDING      = IS_MOBILE ? 20 : 28;         // 좌우 패딩

// 가로 기반 WK_W
const PIANO_AVAIL_W  = vw - DRUM_W - W_PADDING;
const WK_W_from_w    = Math.min(64, Math.max(38, PIANO_AVAIL_W / 14));

// 세로 기반 WK_W (피아노 섹션 높이 = 전체 높이의 45%~100% depending on layout)
const PIANO_AVAIL_H  = IS_MOBILE
    ? (vh - TOPBAR_H) * 0.44 - H_PADDING   // 모바일: 가용 높이의 ~44%
    : vh - TOPBAR_H - H_PADDING;            // 데스크탑: 전체 콘텐츠 높이
const WK_W_from_h    = Math.max(30, PIANO_AVAIL_H / 3.9);

// 가로·세로 중 더 작은 값 사용 (화면 밖으로 안 나가게)
const WK_W  = Math.min(WK_W_from_w, WK_W_from_h, 64);
const WK_GAP = 3;
const WK_H  = WK_W * 3.9;
const BK_W  = WK_W * 0.62;
const BK_H  = WK_H * 0.595;

// Push to CSS
const root = document.documentElement;
root.style.setProperty('--wk-w',   WK_W   + 'px');
root.style.setProperty('--wk-gap', WK_GAP + 'px');
root.style.setProperty('--wk-h',   WK_H   + 'px');
root.style.setProperty('--bk-w',   BK_W   + 'px');
root.style.setProperty('--bk-h',   BK_H   + 'px');

// 모바일에서 피아노 섹션 높이를 JS로 고정 (스크롤 방지)
if (IS_MOBILE) {
    document.querySelector('.piano-section').style.height =
        Math.round(WK_H + H_PADDING) + 'px';
}

function whiteLeft(i)       { return i * (WK_W + WK_GAP); }
function blackLeft(wOffset) {
    const n = Math.floor(wOffset);
    return n * (WK_W + WK_GAP) + WK_W + WK_GAP / 2 - BK_W / 2;
}

function addPianoEvents(el, freq) {
    function on(e) {
        e.preventDefault();
        el.classList.remove('release');
        el.classList.add('active');
        playPianoNote(freq);

        const rect = el.getBoundingClientRect();
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;
        const rip = document.createElement('span');
        rip.className = 'ripple';
        rip.style.left = (cx - rect.left - 4) + 'px';
        rip.style.top  = (cy - rect.top  - 4) + 'px';
        el.appendChild(rip);
        rip.addEventListener('animationend', () => rip.remove());
    }
    function off() {
        el.classList.remove('active');
        el.classList.add('release');
        setTimeout(() => el.classList.remove('release'), 700);
    }
    el.addEventListener('mousedown',  on);
    el.addEventListener('mouseup',    off);
    el.addEventListener('mouseleave', off);
    el.addEventListener('touchstart', on, { passive: false });
    el.addEventListener('touchend',   off);
    el.addEventListener('touchcancel',off);
}

// Build keyboard
const keyboard = document.getElementById('keyboard');
const TOTAL_W  = 14 * WK_W + 13 * WK_GAP;
keyboard.style.width  = TOTAL_W + 'px';
keyboard.style.height = WK_H   + 'px';

WHITE_NOTES.forEach((n, i) => {
    const el = document.createElement('div');
    el.className = 'key white-key';
    el.style.left = whiteLeft(i) + 'px';
    el.style.setProperty('--key-color', noteColor(n.semitone));
    el.innerHTML = `
        <div class="key-inner">
            <span class="key-label">${n.label}</span>
            <span class="key-note">${n.note}</span>
            <span class="key-freq">${n.freq}</span>
        </div>`;
    addPianoEvents(el, n.freq);
    keyboard.appendChild(el);
});

// Octave divider
const div = document.createElement('div');
div.className   = 'octave-divider';
div.style.left  = (whiteLeft(7) - WK_GAP / 2 - 1) + 'px';
div.style.height = WK_H + 'px';
keyboard.appendChild(div);

BLACK_NOTES.forEach(n => {
    const el = document.createElement('div');
    el.className = 'key black-key';
    el.style.left = blackLeft(n.wOffset) + 'px';
    el.style.setProperty('--key-color', noteColor(n.semitone));
    el.innerHTML = `
        <div class="key-inner bk-inner">
            <span class="key-label bk-label">${n.label}</span>
            <span class="bk-sub">${n.sub}</span>
        </div>`;
    addPianoEvents(el, n.freq);
    keyboard.appendChild(el);
});

// ══════════════════════════════════════════════════════════════════════════
// DRUM UI
// ══════════════════════════════════════════════════════════════════════════

// gridState[row][col] = drumId | null
const gridState = Array.from({ length: 3 }, () => Array(3).fill(null));

function getDrumById(id) { return DRUMS.find(d => d.id === id); }

function makeDrumBlock(drumId, forPalette = false) {
    const drum = getDrumById(drumId);
    const el = document.createElement('div');
    el.className = 'drum-block';
    el.style.setProperty('--drum-color', drum.color);
    el.dataset.drumId = drumId;
    el.innerHTML = `
        <div class="block-inner">
            <span class="block-label">${drum.label}</span>
            <span class="block-sub">${drum.sub}</span>
        </div>`;

    if (forPalette) {
        // Palette: click to preview sound; drag to place
        el.addEventListener('click', () => {
            playDrum(drumId, getAudioCtx().currentTime, getAudioCtx());
        });
    }
    return el;
}

function getCellEl(row, col) {
    return document.querySelector(`.beat-cell[data-row="${row}"][data-col="${col}"]`);
}

function renderCell(row, col) {
    const cell = getCellEl(row, col);
    // Remove existing block if any
    cell.querySelector('.drum-block')?.remove();
    cell.classList.remove('has-block');

    const drumId = gridState[row][col];
    if (drumId) {
        const block = makeDrumBlock(drumId);
        // Drag from grid = move
        block.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            startDrag(drumId, e, { row, col });
        });
        cell.classList.add('has-block');
        cell.appendChild(block);
    }
}

// Build beat grid (3×3)
const beatGridEl = document.getElementById('beatGrid');
for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
        const cell = document.createElement('div');
        cell.className = 'beat-cell';
        cell.dataset.row = r;
        cell.dataset.col = c;
        beatGridEl.appendChild(cell);
    }
}

// Build palette (3×3, one block per drum type)
const paletteEl = document.getElementById('drumPalette');
DRUMS.forEach(drum => {
    const block = makeDrumBlock(drum.id, true);
    block.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        startDrag(drum.id, e, null); // null = from palette (copy)
    });
    paletteEl.appendChild(block);
});

// ══════════════════════════════════════════════════════════════════════════
// DRAG & DROP  (Pointer Events – works on mouse and touch)
// ══════════════════════════════════════════════════════════════════════════

let dragState = null;
// dragState = { drumId, clone, fromGrid: {row,col}|null }

function startDrag(drumId, e, fromGrid) {
    e.preventDefault();
    getAudioCtx(); // warm up audio context

    const clone = makeDrumBlock(drumId);
    const SIZE  = 82; // clone size in px

    clone.classList.add('drag-clone');
    clone.style.width  = SIZE + 'px';
    clone.style.height = SIZE + 'px';
    document.body.appendChild(clone);

    dragState = { drumId, clone, fromGrid, size: SIZE };

    // If moving from grid, visually empty the source cell immediately
    if (fromGrid) {
        gridState[fromGrid.row][fromGrid.col] = null;
        renderCell(fromGrid.row, fromGrid.col);
    }

    moveDragClone(e);
    clone.setPointerCapture?.(e.pointerId);
}

function moveDragClone(e) {
    if (!dragState) return;
    const { clone, size } = dragState;
    clone.style.left = (e.clientX - size / 2) + 'px';
    clone.style.top  = (e.clientY - size / 2) + 'px';

    // Highlight drop target
    document.querySelectorAll('.beat-cell').forEach(c => c.classList.remove('drop-hover'));
    clone.style.visibility = 'hidden';
    const under = document.elementFromPoint(e.clientX, e.clientY);
    clone.style.visibility = '';
    under?.closest('.beat-cell')?.classList.add('drop-hover');
}

function endDrag(e) {
    if (!dragState) return;
    const { drumId, clone } = dragState;

    clone.style.visibility = 'hidden';
    const under = document.elementFromPoint(e.clientX, e.clientY);
    clone.style.visibility = '';
    clone.remove();

    const targetCell = under?.closest('.beat-cell');
    if (targetCell) {
        const row = parseInt(targetCell.dataset.row);
        const col = parseInt(targetCell.dataset.col);
        gridState[row][col] = drumId;
        renderCell(row, col);
    }

    document.querySelectorAll('.beat-cell').forEach(c => c.classList.remove('drop-hover'));
    dragState = null;
}

document.addEventListener('pointermove', moveDragClone);
document.addEventListener('pointerup',   endDrag);
document.addEventListener('pointercancel', () => {
    dragState?.clone.remove();
    dragState = null;
    document.querySelectorAll('.beat-cell').forEach(c => c.classList.remove('drop-hover'));
});

// ══════════════════════════════════════════════════════════════════════════
// SEQUENCER  — 6-step loop (3 downbeats + 3 off-beats)
//
//  Step layout per measure:
//    step 0  → col 0 downbeat   (강박)
//    step 1  → col 0 "and"      (엇박, 랜덤)
//    step 2  → col 1 downbeat
//    step 3  → col 1 "and"
//    step 4  → col 2 downbeat
//    step 5  → col 2 "and"
//
//  Timing:  downbeat→and gap = halfBeat*(1+swing)
//           and→downbeat gap = halfBeat*(1−swing)
//  Humanize: ±HUMANIZE seconds jitter on every hit
// ══════════════════════════════════════════════════════════════════════════

let isPlaying    = false;
let currentStep  = 0;          // 0–5
let nextStepTime = 0;
let seqTimer     = null;
let bpm          = 120;
let swing        = 0.33;       // 0 = straight, 0.66 = full swing
let syncLevel    = 0.35;       // probability of off-beat ("and") firing

const HUMANIZE   = 0.014;      // ±14 ms timing randomness (always on)

function halfBeat()       { return 60 / bpm / 2; }
function stepToCol(step)  { return Math.floor(step / 2); }  // 0,1→col0; 2,3→col1; 4,5→col2
function isAndStep(step)  { return step % 2 === 1; }

// How long to wait after scheduling this step before the next one
function stepGap(step) {
    const hb = halfBeat();
    // downbeat→and: stretched by swing; and→downbeat: shortened
    return isAndStep(step) ? hb * (1 - swing) : hb * (1 + swing);
}

function scheduleStep(step, t) {
    const ctx   = getAudioCtx();
    const col   = stepToCol(step);
    const isAnd = isAndStep(step);

    for (let row = 0; row < 3; row++) {
        const drumId = gridState[row][col];
        if (!drumId) continue;

        // Downbeats fire at 90%; "and" steps fire at syncLevel probability
        const prob = isAnd ? syncLevel : 0.9;
        if (Math.random() > prob) continue;

        // Humanize: random micro-timing offset
        const jitter   = (Math.random() * 2 - 1) * HUMANIZE;
        const fireTime = Math.max(ctx.currentTime + 0.001, t + jitter);

        playDrum(drumId, fireTime, ctx);

        const delay = Math.max(0, (fireTime - ctx.currentTime) * 1000);
        const r = row, c = col;
        setTimeout(() => flashCell(r, c), delay);
    }
}

function flashCell(row, col) {
    const block = getCellEl(row, col)?.querySelector('.drum-block');
    if (!block) return;
    block.classList.remove('drum-hit');
    void block.offsetWidth;
    block.classList.add('drum-hit');
    block.addEventListener('animationend', () => block.classList.remove('drum-hit'), { once: true });
}

function updatePlayhead(col) {
    document.querySelectorAll('.beat-cell').forEach(cell => {
        cell.classList.toggle('playing', parseInt(cell.dataset.col) === col);
    });
}

function scheduler() {
    const ctx = getAudioCtx();
    while (nextStepTime < ctx.currentTime + 0.12) {
        scheduleStep(currentStep, nextStepTime);

        // Move playhead on downbeats only (even steps)
        if (!isAndStep(currentStep)) {
            const col   = stepToCol(currentStep);
            const delay = Math.max(0, (nextStepTime - ctx.currentTime) * 1000);
            setTimeout(() => updatePlayhead(col), delay);
        }

        nextStepTime += stepGap(currentStep);
        currentStep   = (currentStep + 1) % 6;
    }
    seqTimer = setTimeout(scheduler, 20);
}

function startSeq() {
    const ctx = getAudioCtx();
    currentStep  = 0;
    nextStepTime = ctx.currentTime + 0.05;
    scheduler();
}

function stopSeq() {
    clearTimeout(seqTimer);
    seqTimer = null;
    updatePlayhead(-1);
}

// ── Controls ───────────────────────────────────────────────────────────────

const playBtn    = document.getElementById('playBtn');
const bpmSlider  = document.getElementById('bpmSlider');
const bpmDisplay = document.getElementById('bpmDisplay');
const swingSlider = document.getElementById('swingSlider');
const syncSlider  = document.getElementById('syncSlider');

playBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;
    playBtn.textContent = isPlaying ? '⏹' : '▶';
    playBtn.classList.toggle('active', isPlaying);
    isPlaying ? startSeq() : stopSeq();
});

bpmSlider.addEventListener('input', () => {
    bpm = parseInt(bpmSlider.value);
    bpmDisplay.textContent = bpm;
});

swingSlider.addEventListener('input', () => {
    swing = parseInt(swingSlider.value) / 100;
});

syncSlider.addEventListener('input', () => {
    syncLevel = parseInt(syncSlider.value) / 100;
});
