// ---------------------------
// Variablen & DOM-Elemente
// ---------------------------
let images = [];
let currentIndex = 0;
let scale = 1.0;
let hideTimer;
let mouseOverButtons = false;

const SCALE_STEP = 0.1;
const SCALE_MIN = 0.1;
const SCALE_MAX = 5.0;
const HIDE_DELAY = 2000; // Buttons verschwinden nach 2s Inaktivität

// Elemente
const imgElement   = document.getElementById("image");
const fileSpan     = document.getElementById("file");
const scaleSpan    = document.getElementById("scale");
const btnContainer = document.getElementById("buttons");

const btnFirst = document.getElementById("first");
const btnPrev  = document.getElementById("prev");
const btnNext  = document.getElementById("next");
const btnLast  = document.getElementById("last");
const btnPlus  = document.getElementById("plus");
const btnMinus = document.getElementById("minus");

// ---------------------------
// JSON laden
// ---------------------------
fetch("dia-show.json")
    .then(resp => {
        if (!resp.ok) throw new Error("JSON konnte nicht geladen werden");
        return resp.json();
    })
    .then(data => {
        images = data;
        if (images.length) showImage(0);
    })
    .catch(err => console.error("Fehler:", err));

// ---------------------------
// Bildanzeige
// ---------------------------
function showImage(index) {
    if (!images.length) return;
    currentIndex = index;
    imgElement.src = images[index];
    imgElement.alt = images[index];
    fileSpan.textContent = images[index];

    imgElement.onload = () => {
        const viewportWidth  = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const imgWidth  = imgElement.naturalWidth;
        const imgHeight = imgElement.naturalHeight;

        // Fit-to-Viewport
        const scaleX = viewportWidth / imgWidth;
        const scaleY = viewportHeight / imgHeight;
        scale = Math.min(scaleX, scaleY, 1.0);

        applyScale();
    };
}

// ---------------------------
// Zoom & Anzeige
// ---------------------------
function applyScale() {
    imgElement.style.transform = `scale(${scale})`;
    imgElement.style.transformOrigin = "center center";
    scaleSpan.textContent = Math.round(scale * 100) + "%";
}

function zoomIn()  { scale = Math.min(scale + SCALE_STEP, SCALE_MAX); applyScale(); }
function zoomOut() { scale = Math.max(scale - SCALE_STEP, SCALE_MIN); applyScale(); }

// ---------------------------
// Navigation
// ---------------------------
function firstImage() { if (images.length) showImage(0); }
function lastImage()  { if (images.length) showImage(images.length - 1); }
function nextImage()  { if (currentIndex < images.length - 1) showImage(currentIndex + 1); }
function prevImage()  { if (currentIndex > 0) showImage(currentIndex - 1); }

// Buttons
btnFirst.addEventListener("click", firstImage);
btnLast.addEventListener("click", lastImage);
btnNext.addEventListener("click", nextImage);
btnPrev.addEventListener("click", prevImage);
btnPlus.addEventListener("click", zoomIn);
btnMinus.addEventListener("click", zoomOut);

// ---------------------------
// Tastatursteuerung
// ---------------------------
document.addEventListener("keydown", e => {
    if (!images.length) return;

    let handled = true;

    switch (e.key) {
        case "ArrowLeft":  e.shiftKey ? firstImage() : prevImage(); break;
        case "ArrowRight": e.shiftKey ? lastImage()  : nextImage(); break;
        case "+": case "=": zoomIn(); break;
        case "-": zoomOut(); break;
        default: handled = false;
    }

    if (handled) {
        e.preventDefault();
        showControls(); // Buttons sichtbar machen, Timer zurücksetzen
    }
});

// ---------------------------
// Smart Controls (Auto-Hide)
// ---------------------------
function scheduleHide() {
    clearTimeout(hideTimer);
    if (!mouseOverButtons) {
        hideTimer = setTimeout(() => btnContainer.classList.add("hidden"), HIDE_DELAY);
    }
}

function showControls() {
    btnContainer.classList.remove("hidden");
    scheduleHide();
}

// Mausbewegung
document.addEventListener("mousemove", showControls);

// Maus über Buttons
btnContainer.addEventListener("mouseenter", () => {
    mouseOverButtons = true;
    clearTimeout(hideTimer);
    btnContainer.classList.remove("hidden");
});
btnContainer.addEventListener("mouseleave", () => {
    mouseOverButtons = false;
    scheduleHide();
});

// Initial
showControls();
