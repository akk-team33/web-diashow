let images = [];
let currentIndex = 0;
let currentScale = 1.0;
let hideTimer;
let mouseOverButtons = false;

const HIDE_DELAY = 2000;

const docTile      = document.title;
const canvas       = document.getElementById("canvas");
const stage        = document.getElementById("stage");
const image        = document.getElementById("image");
const indexSpan    = document.getElementById("index");
const fileSpan     = document.getElementById("file");
const scaleSpan    = document.getElementById("scale");
const btnContainer = document.getElementById("buttons");

const btnFirst     = document.getElementById("first");
const btnPrev      = document.getElementById("prev");
const btnNext      = document.getElementById("next");
const btnLast      = document.getElementById("last");
const btnPlus      = document.getElementById("plus");
const btnMinus     = document.getElementById("minus");

const scales = [0.125, 0.177, 0.250, 0.354, 0.500, 0.707, 1.000, 1.414, 2.000, 2.828, 4.000, 5.657, 8.000];

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

function showImage(index) {
    if (0 < images.length) {
        currentIndex = index;
        indexSpan.textContent = (index + 1) + "/" + images.length;
        showImageByURL(images[index]);
    }
}

function showImageByURL(url) {
    image.src = url;
    image.alt = url;
    fileSpan.textContent = url;
    document.title = url + " - " + docTile;
}

function fitWidthScale() {
    return canvas.clientWidth / image.naturalWidth;
}

function fitHeightScale() {
    return canvas.clientHeight / image.naturalHeight;
}

function fitViewScale() {
    return Math.min(fitWidthScale(), fitHeightScale());
}

function overViewScale() {
    return Math.max(fitWidthScale(), fitHeightScale());
}

function toggleScale(scale) {
    return (currentScale === 1.0) ? fitViewScale() : 1.0;
}

function prevScale(scale) {
    return scales.findLast(n => n < scale) ?? scale;
}

function nextScale(scale) {
    return scales.find(n => n > scale) ?? scale;
}

function getSize(scale) {
    return {
        width:  Math.round(image.naturalWidth  * scale),
        height: Math.round(image.naturalHeight * scale)
    };
}

function scrollImage(canvasAnchorPoint, stageAnchorPoint) {
    canvas.scrollLeft = Math.max(0, stageAnchorPoint.x - canvasAnchorPoint.x);
    canvas.scrollTop  = Math.max(0, stageAnchorPoint.y - canvasAnchorPoint.y);
}

function canvasCenterPoint() {
    return {
        x : Math.round(canvas.clientWidth / 2.0),
        y : Math.round(canvas.clientHeight / 2.0)
    };
}

function newStageAnchorPoint(oldScale, newScale, canvasAnchorPoint) {
    const oldStageAnchorPoint = {
        x : canvasAnchorPoint.x + canvas.scrollLeft,
        y : canvasAnchorPoint.y + canvas.scrollTop
    };

    const oldScaleX = Math.max(oldScale, fitWidthScale());
    const oldScaleY = Math.max(oldScale, fitHeightScale());
    const newScaleX = Math.max(newScale, fitWidthScale());
    const newScaleY = Math.max(newScale, fitHeightScale());

    const virtualStageAnchorPoint = {
        x : Math.round((oldStageAnchorPoint.x * newScaleX) / oldScaleX),
        y : Math.round((oldStageAnchorPoint.y * newScaleY) / oldScaleY)
    };

    // see CSS: #stage { min-width: 100%; min-height: 100%; ... }
    return {
        x : Math.max(canvasAnchorPoint.x, virtualStageAnchorPoint.x),
        y : Math.max(canvasAnchorPoint.y, virtualStageAnchorPoint.y)
    };
}

function setScale(scale, canvasAnchorPoint) {
    const stageAnchorPoint = newStageAnchorPoint(currentScale, scale, canvasAnchorPoint);
    currentScale = scale;
    scaleSpan.textContent = Math.round(scale * 100) + "%";

    const size = getSize(scale);

    image.style.width  = size.width  + "px";
    image.style.height = size.height + "px";

    scrollImage(canvasAnchorPoint, stageAnchorPoint);
}

function onKeyDown(event) {
    let handled = true;

    switch (event.key) {
        // ---------------- Navigation (main) ----------------
        case "Home":     firstImage(); break;
        case "PageUp":   prevImage();  break;
        case "PageDown": lastImage();  break;
        case "End":      lastImage();  break;

        // ---------------- Navigation (alternative) ----------------
        case " ":         event.shiftKey ? lastImage() : nextImage();  break;
        case "Backspace": event.shiftKey ? firstImage() : prevImage(); break;

        // ---------------- Zoom / View ----------------
        case "+": zoomIn(); break;
        case "-": zoomOut(); break;
        case "#": zoomToggleView(); break;
        case "*": zoomOverView(); break;

        // ---------------- Controls ----------------
        case "i": showControls(); break;

        default: handled = false;
    }

    if (handled) {
        event.preventDefault(); // important on Space/Backspace
        showControls();
    }
}

function firstImage()     { showImage(0); }
function lastImage()      { showImage(images.length - 1); }
function nextImage()      { showImage(Math.min(images.length - 1, currentIndex + 1)); }
function prevImage()      { showImage(Math.max(0, currentIndex - 1)); }

function zoomIn()         { setScale(nextScale(currentScale), canvasCenterPoint()); }
function zoomOut()        { setScale(prevScale(currentScale), canvasCenterPoint()); }
function zoomNatural()    { setScale(1.0, canvasCenterPoint()); }
function zoomFitView()    { setScale(fitViewScale(), canvasCenterPoint()); }
function zoomToggleView() { setScale(toggleScale(), canvasCenterPoint()); }
function zoomOverView()   { setScale(overViewScale(), canvasCenterPoint()); }

image.addEventListener("load", zoomFitView);

canvas.addEventListener("click", event => {
    const point = {
        x : event.offsetX,
        y : event.offsetY
    };
    setScale(toggleScale(), point);
});

btnContainer.addEventListener("mouseenter", () => {
    mouseOverButtons = true;
    clearTimeout(hideTimer);
    btnContainer.classList.remove("hidden");
});
btnContainer.addEventListener("mouseleave", () => {
    mouseOverButtons = false;
    scheduleHide();
});

btnFirst.addEventListener("click", firstImage);
btnLast.addEventListener("click", lastImage);
btnNext.addEventListener("click", nextImage);
btnPrev.addEventListener("click", prevImage);
btnPlus.addEventListener("click", zoomIn);
btnMinus.addEventListener("click", zoomOut);

document.addEventListener("mousemove", showControls);
document.addEventListener("keydown", onKeyDown);

// more initial operations ...
showControls();
