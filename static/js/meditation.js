const phases = [
    { label: "Inhale",  audio: "inhale.mp3",  duration: 4, scale: 1.6 },
    { label: "Hold",    audio: "hold.mp3",     duration: 4, scale: 1.6 },
    { label: "Exhale",  audio: "exhale.mp3",   duration: 4, scale: 1.0 },
    { label: "Hold",    audio: "hold.mp3",     duration: 4, scale: 1.0 },
];

const SESSION_DURATION = 5 * 60;

let running = false;
let phaseTimeout = null;
let countdownInterval = null;
let bellTimeout = null;
let secondsLeft = SESSION_DURATION;

// --- Audio playback ---
const clips = ["session_start.mp3", "inhale.mp3", "hold.mp3", "exhale.mp3", "session_end.mp3"];
const audioElements = {};

function unlockAudio() {
    // Pre-load all clips during user tap to unlock iOS audio restrictions
    clips.forEach(clip => {
        const audio = new Audio(`/static/audio/${clip}`);
        audio.load();
        audioElements[clip] = audio;
    });
}

function playClip(filename, onDone) {
    const audio = audioElements[filename] || new Audio(`/static/audio/${filename}`);
    audio.currentTime = 0;
    if (onDone) audio.onended = onDone;
    audio.play().catch(() => {});
}

// --- Ambient Music ---
let audioCtx = null;
let masterGain = null;
let allOscillators = [];

function startAmbientMusic() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    allOscillators = [];

    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.22, audioCtx.currentTime + 6);
    masterGain.connect(audioCtx.destination);

    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(500, audioCtx.currentTime);
    filter.Q.setValueAtTime(0.4, audioCtx.currentTime);
    filter.connect(masterGain);

    const filterLFO = audioCtx.createOscillator();
    const filterLFOGain = audioCtx.createGain();
    filterLFO.frequency.setValueAtTime(0.025, audioCtx.currentTime);
    filterLFOGain.gain.setValueAtTime(150, audioCtx.currentTime);
    filterLFO.connect(filterLFOGain);
    filterLFOGain.connect(filter.frequency);
    filterLFO.start();
    allOscillators.push(filterLFO);

    const delay1 = audioCtx.createDelay(3);
    delay1.delayTime.setValueAtTime(0.9, audioCtx.currentTime);
    const delayFb1 = audioCtx.createGain();
    delayFb1.gain.setValueAtTime(0.22, audioCtx.currentTime);
    delay1.connect(delayFb1);
    delayFb1.connect(delay1);
    delayFb1.connect(filter);

    const delay2 = audioCtx.createDelay(3);
    delay2.delayTime.setValueAtTime(1.4, audioCtx.currentTime);
    const delayFb2 = audioCtx.createGain();
    delayFb2.gain.setValueAtTime(0.16, audioCtx.currentTime);
    delay2.connect(delayFb2);
    delayFb2.connect(delay2);
    delayFb2.connect(filter);

    const droneFreqs = [108, 144, 216, 288, 324];
    const droneVols  = [0.55, 0.25, 0.18, 0.12, 0.08];

    droneFreqs.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        osc.detune.setValueAtTime(i * 2 - 4, audioCtx.currentTime);
        gain.gain.setValueAtTime(droneVols[i], audioCtx.currentTime);

        const lfo = audioCtx.createOscillator();
        const lfoGain = audioCtx.createGain();
        lfo.frequency.setValueAtTime(0.04 + i * 0.008, audioCtx.currentTime);
        lfoGain.gain.setValueAtTime(droneVols[i] * 0.25, audioCtx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        lfo.start();
        allOscillators.push(lfo);

        osc.connect(gain);
        gain.connect(filter);
        gain.connect(delay1);
        gain.connect(delay2);
        osc.start();
        allOscillators.push(osc);
    });

    scheduleBell();
}

function scheduleBell() {
    if (!running || !audioCtx) return;
    const bellFreqs = [432, 528, 396, 639];
    const freq = bellFreqs[Math.floor(Math.random() * bellFreqs.length)];

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.07, audioCtx.currentTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 5);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(audioCtx.currentTime + 5.1);

    bellTimeout = setTimeout(scheduleBell, (10 + Math.random() * 8) * 1000);
}

function stopAmbientMusic() {
    if (!audioCtx) return;
    clearTimeout(bellTimeout);
    if (masterGain) {
        masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 2);
    }
    setTimeout(() => {
        allOscillators.forEach(o => { try { o.stop(); } catch (_) {} });
        allOscillators = [];
        audioCtx.close();
        audioCtx = null;
        masterGain = null;
    }, 2200);
}

// --- Session ---
function startBreathing() {
    unlockAudio();
    running = true;
    secondsLeft = SESSION_DURATION;
    document.getElementById("startBtn").style.display = "none";
    document.getElementById("stopBtn").style.display = "inline-block";
    document.getElementById("phase-info").textContent = "";
    startAmbientMusic();
    showBanner("Ronova your new session starts now");
    playClip("session_start.mp3", () => runPhase(0));
    startCountdown();
}

function stopBreathing() {
    running = false;
    clearTimeout(phaseTimeout);
    clearTimeout(bellTimeout);
    clearInterval(countdownInterval);
    stopAmbientMusic();
    const circle = document.getElementById("circle");
    circle.style.transform = "scale(1)";
    circle.style.transition = "transform 0.5s ease";
    document.getElementById("label").textContent = "Press Start";
    document.getElementById("phase-info").textContent = "Inhale 4s → Hold 4s → Exhale 4s → Hold 4s";
    document.getElementById("countdown").textContent = "";
    document.getElementById("session-banner").style.display = "none";
    document.getElementById("startBtn").style.display = "inline-block";
    document.getElementById("stopBtn").style.display = "none";
}

function runPhase(index) {
    if (!running) return;
    const phase = phases[index % phases.length];
    const circle = document.getElementById("circle");
    document.getElementById("label").textContent = phase.label;
    circle.style.transition = `transform ${phase.duration}s ease`;
    circle.style.transform = `scale(${phase.scale})`;
    setTimeout(() => playClip(phase.audio), 300);
    phaseTimeout = setTimeout(() => runPhase(index + 1), phase.duration * 1000);
}

function startCountdown() {
    updateCountdownDisplay();
    countdownInterval = setInterval(() => {
        secondsLeft--;
        updateCountdownDisplay();
        if (secondsLeft <= 0) {
            clearInterval(countdownInterval);
            endSession();
        }
    }, 1000);
}

function updateCountdownDisplay() {
    const m = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
    const s = (secondsLeft % 60).toString().padStart(2, "0");
    document.getElementById("countdown").textContent = `${m}:${s}`;
}

function endSession() {
    clearTimeout(phaseTimeout);
    document.getElementById("label").textContent = "";
    const circle = document.getElementById("circle");
    circle.style.transform = "scale(1)";
    showBanner("Thank you for turning my intentions into reality and guiding me toward my highest potential");
    playClip("session_end.mp3", () => {
        if (!running) return;
        secondsLeft = SESSION_DURATION;
        showBanner("Ronova your new session starts now");
        playClip("session_start.mp3", () => runPhase(0));
        startCountdown();
    });
}

function showBanner(message) {
    const banner = document.getElementById("session-banner");
    banner.textContent = message;
    banner.style.display = "block";
    banner.classList.remove("fade-out");
    void banner.offsetWidth;
    banner.classList.add("fade-out");
}
