// ── Note data ──────────────────────────────────────────────────────────────

const WHITE_NOTES = [
    // Octave 4
    { label: 'Do',  note: 'C4',  freq: 261.63, semitone: 0  },
    { label: 'Re',  note: 'D4',  freq: 293.66, semitone: 2  },
    { label: 'Mi',  note: 'E4',  freq: 329.63, semitone: 4  },
    { label: 'Fa',  note: 'F4',  freq: 349.23, semitone: 5  },
    { label: 'Sol', note: 'G4',  freq: 392.00, semitone: 7  },
    { label: 'La',  note: 'A4',  freq: 440.00, semitone: 9  },
    { label: 'Si',  note: 'B4',  freq: 493.88, semitone: 11 },
    // Octave 5
    { label: 'Do',  note: 'C5',  freq: 523.25, semitone: 0  },
    { label: 'Re',  note: 'D5',  freq: 587.33, semitone: 2  },
    { label: 'Mi',  note: 'E5',  freq: 659.25, semitone: 4  },
    { label: 'Fa',  note: 'F5',  freq: 698.46, semitone: 5  },
    { label: 'Sol', note: 'G5',  freq: 783.99, semitone: 7  },
    { label: 'La',  note: 'A5',  freq: 880.00, semitone: 9  },
    { label: 'Si',  note: 'B5',  freq: 987.77, semitone: 11 },
];

// wOffset = position between white keys (0.5 = between key 0 and key 1, etc.)
const BLACK_NOTES = [
    // Octave 4
    { label: 'C#', sub: 'D♭', note: 'C#4', freq: 277.18, semitone: 1,  wOffset: 0.5  },
    { label: 'D#', sub: 'E♭', note: 'D#4', freq: 311.13, semitone: 3,  wOffset: 1.5  },
    { label: 'F#', sub: 'G♭', note: 'F#4', freq: 369.99, semitone: 6,  wOffset: 3.5  },
    { label: 'G#', sub: 'A♭', note: 'G#4', freq: 415.30, semitone: 8,  wOffset: 4.5  },
    { label: 'A#', sub: 'B♭', note: 'A#4', freq: 466.16, semitone: 10, wOffset: 5.5  },
    // Octave 5
    { label: 'C#', sub: 'D♭', note: 'C#5', freq: 554.37, semitone: 1,  wOffset: 7.5  },
    { label: 'D#', sub: 'E♭', note: 'D#5', freq: 622.25, semitone: 3,  wOffset: 8.5  },
    { label: 'F#', sub: 'G♭', note: 'F#5', freq: 739.99, semitone: 6,  wOffset: 10.5 },
    { label: 'G#', sub: 'A♭', note: 'G#5', freq: 830.61, semitone: 8,  wOffset: 11.5 },
    { label: 'A#', sub: 'B♭', note: 'A#5', freq: 932.33, semitone: 10, wOffset: 12.5 },
];

// ── Color ──────────────────────────────────────────────────────────────────

function noteColor(semitone) {
    const hue = Math.round((semitone / 12) * 360);
    return `hsl(${hue}, 100%, 58%)`;
}

// ── Audio ──────────────────────────────────────────────────────────────────

let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window['webkitAudioContext'])();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

function playNote(freq) {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Main body tone (triangle)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);
    gain1.gain.setValueAtTime(0.38, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    osc1.start(now);
    osc1.stop(now + 1.5);

    // Attack shimmer (sine, 2nd harmonic)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, now);
    gain2.gain.setValueAtTime(0.12, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc2.start(now);
    osc2.stop(now + 0.7);

    // Sub warmth (sine, fundamental)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq, now);
    gain3.gain.setValueAtTime(0.18, now);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
    osc3.start(now);
    osc3.stop(now + 2.0);
}

// ── Key interaction ────────────────────────────────────────────────────────

function addKeyEvents(el, freq) {
    function activate(e) {
        e.preventDefault();
        el.classList.remove('release');
        el.classList.add('active');
        playNote(freq);

        // Ripple
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

    function deactivate() {
        el.classList.remove('active');
        el.classList.add('release');
        setTimeout(() => el.classList.remove('release'), 700);
    }

    el.addEventListener('mousedown',  activate);
    el.addEventListener('mouseup',    deactivate);
    el.addEventListener('mouseleave', deactivate);
    el.addEventListener('touchstart', activate,    { passive: false });
    el.addEventListener('touchend',   deactivate);
    el.addEventListener('touchcancel',deactivate);
}

// ── Layout ─────────────────────────────────────────────────────────────────

const keyboard = document.getElementById('keyboard');

// Compute dimensions in JS (clamp to viewport)
const WK_W   = Math.min(64, Math.max(40, (window.innerWidth - 40) / 14));
const WK_GAP = 3;
const WK_H   = WK_W * 3.9;
const BK_W   = WK_W * 0.62;
const BK_H   = WK_H * 0.595;

// Sync back to CSS for all var() references in style.css
const root = document.documentElement;
root.style.setProperty('--wk-w',   WK_W   + 'px');
root.style.setProperty('--wk-gap', WK_GAP + 'px');
root.style.setProperty('--wk-h',   WK_H   + 'px');
root.style.setProperty('--bk-w',   BK_W   + 'px');
root.style.setProperty('--bk-h',   BK_H   + 'px');

const TOTAL_W = 14 * WK_W + 13 * WK_GAP;

keyboard.style.width  = TOTAL_W + 'px';
keyboard.style.height = WK_H + 'px';

function whiteLeft(index) {
    return index * (WK_W + WK_GAP);
}

// Black key: centered in the gap between white key n and n+1
function blackLeft(wOffset) {
    const n = Math.floor(wOffset);
    const center = n * (WK_W + WK_GAP) + WK_W + WK_GAP / 2;
    return center - BK_W / 2;
}

// ── Build white keys ───────────────────────────────────────────────────────

WHITE_NOTES.forEach((note, i) => {
    const color = noteColor(note.semitone);
    const el = document.createElement('div');
    el.className = 'key white-key';
    el.style.left = whiteLeft(i) + 'px';
    el.style.setProperty('--key-color', color);

    el.innerHTML = `
        <div class="key-inner">
            <span class="key-label">${note.label}</span>
            <span class="key-note">${note.note}</span>
            <span class="key-freq">${note.freq}</span>
        </div>
    `;

    addKeyEvents(el, note.freq);
    keyboard.appendChild(el);
});

// ── Octave divider ─────────────────────────────────────────────────────────

const divider = document.createElement('div');
divider.className = 'octave-divider';
divider.style.left   = (whiteLeft(7) - WK_GAP / 2 - 1) + 'px';
divider.style.height = WK_H + 'px';
keyboard.appendChild(divider);

// ── Build black keys ───────────────────────────────────────────────────────

BLACK_NOTES.forEach((note) => {
    const color = noteColor(note.semitone);
    const el = document.createElement('div');
    el.className = 'key black-key';
    el.style.left = blackLeft(note.wOffset) + 'px';
    el.style.setProperty('--key-color', color);

    el.innerHTML = `
        <div class="key-inner bk-inner">
            <span class="key-label bk-label">${note.label}</span>
            <span class="bk-sub">${note.sub}</span>
        </div>
    `;

    addKeyEvents(el, note.freq);
    keyboard.appendChild(el);
});
