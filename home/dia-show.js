let images = [];
let currentIndex = 0;
let currentScale = 1.0;
let hideTimer;
let mouseOverButtons = false;

const HIDE_DELAY = 2000;

const docTitle     = document.title;
const canvas       = document.getElementById("canvas");
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
// JSON file by URL-Parameter
// ---------------------------
const urlParams = new URLSearchParams(window.location.search);
const jsonFile = urlParams.get("images") || "dia-show.json"; // Fallback auf Standard

fileSpan.textContent = jsonFile; // direkt anzeigen, bevor es geladen wird

fetch(jsonFile)
    .then(resp => {
        if (!resp.ok) throw new Error("JSON konnte nicht geladen werden: " + resp.statusText);
        return resp.json();
    })
    .then(data => {
        images = data;
        if (images.length) showImage(0);
    })
    .catch(err => {
        console.error("Fehler beim Laden der JSON-Datei:", err);
        indexSpan.textContent = "0/0";
        fileSpan.textContent = jsonFile + " (failed)";
    });

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
        canvas.focus({ preventScroll: true });
    }
}

function showImageByURL(url) {
    image.src = url;
    image.alt = url;
    fileSpan.textContent = url;
    document.title = url + " - " + docTitle;
}

function fitWidthScale() {
    if (!image.naturalWidth) return currentScale;
    return canvas.clientWidth / image.naturalWidth;
}

function fitHeightScale() {
    return canvas.clientHeight / image.naturalHeight;
}

function fitInsideScale() {
    return Math.min(fitWidthScale(), fitHeightScale());
}

function fitOutsideScale() {
    return Math.max(fitWidthScale(), fitHeightScale());
}

function toggleScale() {
    return (currentScale === 1.0) ? fitInsideScale() : 1.0;
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

function scrollImage(canvasAnchorPoint, imgAnchorPoint) {
    const maxX = Math.max(0, image.clientWidth  - canvas.clientWidth);
    const maxY = Math.max(0, image.clientHeight - canvas.clientHeight);
    canvas.scrollLeft = Math.min(maxX, Math.max(0, imgAnchorPoint.x - canvasAnchorPoint.x));
    canvas.scrollTop  = Math.min(maxY, Math.max(0, imgAnchorPoint.y - canvasAnchorPoint.y));
}

function canvasCenterPoint() {
    return {
        x : Math.round(canvas.clientWidth / 2.0),
        y : Math.round(canvas.clientHeight / 2.0)
    };
}

function getImageOffsetInCanvas() {
    const offsetX = Math.max(0, (canvas.clientWidth  - image.clientWidth)  / 2);
    const offsetY = Math.max(0, (canvas.clientHeight - image.clientHeight) / 2);

    return { x: offsetX, y: offsetY };
}

function newImgAnchorPoint(oldScale, newScale, canvasAnchorPoint) {
    const offset = getImageOffsetInCanvas();
    const oldImgAnchorPoint = {
        x: canvas.scrollLeft + canvasAnchorPoint.x - offset.x,
        y: canvas.scrollTop  + canvasAnchorPoint.y - offset.y
    };

    return {
        x: Math.round(oldImgAnchorPoint.x * newScale / oldScale),
        y: Math.round(oldImgAnchorPoint.y * newScale / oldScale)
    };
}

function setScale(scale, canvasAnchorPoint = canvasCenterPoint()) {
    const imgAnchorPoint = newImgAnchorPoint(currentScale, scale, canvasAnchorPoint);
    currentScale = scale;
    scaleSpan.textContent = Math.round(scale * 100) + "%";

    const size = getSize(scale);

    image.style.width  = size.width  + "px";
    image.style.height = size.height + "px";

    scrollImage(canvasAnchorPoint, imgAnchorPoint);
}

function onKeyDown(event) {
    let handled = true;

    switch (event.key) {
        // ---------------- Navigation (main) ----------------
        case "Home":     firstImage(); break;
        case "PageUp":   prevImage();  break;
        case "PageDown": nextImage();  break;
        case "End":      lastImage();  break;

        // ---------------- Navigation (alternative) ----------------
        case " ":         event.shiftKey ? lastImage() : nextImage();  break;
        case "Backspace": event.shiftKey ? firstImage() : prevImage(); break;

        // ---------------- Zoom / View ----------------
        case "+": zoomIn(); break;
        case "-": zoomOut(); break;
        case "#": zoomToggleView(); break;
        case "*": zoomOutside(); break;

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

function zoomIn()         { setScale(nextScale(currentScale)); }
function zoomOut()        { setScale(prevScale(currentScale)); }
function zoomNatural()    { setScale(1.0); }
function zoomInside()     { setScale(fitInsideScale()); }
function zoomToggleView() { setScale(toggleScale()); }
function zoomOutside()    { setScale(fitOutsideScale()); }

image.addEventListener("load", zoomInside);

image.addEventListener("click", event => {
    const rect = canvas.getBoundingClientRect();
    const point = {
        x : event.clientX - rect.left,
        y : event.clientY - rect.top
    };
    setScale(toggleScale(), point);
});

canvas.addEventListener("mousedown", () => {
    canvas.focus({ preventScroll: true });
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
