let images = [];
let currentIndex = 0;
let currentScale = 1.0;
let hideTimer;
let mouseOverButtons = false;

const HIDE_DELAY = 2000;

const docTile      = document.title;
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

function fullWidthScale() {
    return canvas.clientWidth / image.naturalWidth;
}

function fullHeightScale() {
    return canvas.clientHeight / image.naturalHeight;
}

function fullViewScale() {
    return Math.min(fullWidthScale(), fullHeightScale());
}

function overViewScale() {
    return Math.max(fullWidthScale(), fullHeightScale());
}

function toggleScale(scale) {
    return (currentScale === 1.0) ? fullViewScale() : 1.0;
}

function prevScale(scale) {
    return scales.findLast(n => n < scale) ?? scale;
}

function nextScale(scale) {
    return scales.find(n => n > scale) ?? scale;
}

function getDimension(scale) {
    return {
        width:  Math.round(image.naturalWidth  * scale),
        height: Math.round(image.naturalHeight * scale)
    };
}

function centerImage() {
    const scrollX = Math.max(0, (image.clientWidth  - canvas.clientWidth)  / 2);
    const scrollY = Math.max(0, (image.clientHeight - canvas.clientHeight) / 2);

    canvas.scrollLeft = scrollX;
    canvas.scrollTop  = scrollY;
}

function setScale(scale) {
    currentScale = scale;
    scaleSpan.textContent = Math.round(scale * 100) + "%";

    const dim = getDimension(scale);

    image.style.width  = dim.width  + "px";
    image.style.height = dim.height + "px";

    centerImage();
}

function onKeyDown(event) {
    let handled = true;
    switch (event.key) {
        case "ArrowLeft":  event.shiftKey ? firstImage() : prevImage(); break;
        case "ArrowRight": event.shiftKey ? lastImage()  : nextImage(); break;
        case "+": zoomIn(); break;
        case "-": zoomOut(); break;
        case "#": zoomToggleView(); break;
        case "*": zoomOverView(); break;
        case "i": showControls(); break;
        default: handled = false;
    }
    if (handled) {
        event.preventDefault();
        showControls();
    }
}

function onResize() {
    if (!image.naturalWidth) return;

    const fitScale = fullViewScale();

    if (currentScale <= fitScale) {
        setScale(fitScale);
    } else {
        centerImage();
    }
}

function firstImage()     { showImage(0); }
function lastImage()      { showImage(images.length - 1); }
function nextImage()      { showImage(Math.min(images.length - 1, currentIndex + 1)); }
function prevImage()      { showImage(Math.max(0, currentIndex - 1)); }

function zoomIn()         { setScale(nextScale(currentScale)); }
function zoomOut()        { setScale(prevScale(currentScale)); }
function zoomNatural()    { setScale(1.0); }
function zoomFullView()   { setScale(fullViewScale()); }
function zoomToggleView() { setScale(toggleScale()); }
function zoomOverView()   { setScale(overViewScale()); }

image.addEventListener("load", zoomFullView);

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

window.addEventListener("resize", onResize);

// more initial operations ...
showControls();
