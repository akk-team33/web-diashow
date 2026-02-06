let images = [];
let currentIndex = 0;
let scale = 1.0;
let hideTimer;

const SCALE_STEP = 0.1;
const SCALE_MIN = 0.1;
const SCALE_MAX = 5.0;


// Elemente
const imgElement = document.getElementById("image");
const fileSpan = document.getElementById("file");
const scaleSpan = document.getElementById("scale");

const btnFirst = document.getElementById("first");
const btnPrev  = document.getElementById("prev");
const btnNext  = document.getElementById("next");
const btnLast  = document.getElementById("last");

const btnPlus  = document.getElementById("plus");
const btnMinus = document.getElementById("minus");

const btnContainer = document.getElementById("buttons");

// JSON laden
fetch("dia-show.json")
    .then(response => {
        if (!response.ok) {
            throw new Error("JSON konnte nicht geladen werden");
        }
        return response.json();
    })
    .then(data => {
        images = data;

        if (images.length > 0) {
            showImage(0); // erstes Bild anzeigen
        }
    })
    .catch(error => {
        console.error("Fehler:", error);
    });

// Anzeige-Funktion
function showImage(index) {
    currentIndex = index;
    imgElement.src = images[index];
    imgElement.alt = images[index];
    fileSpan.textContent = images[index];

    // Bild vollständig laden, um natürliche Größe zu kennen
    imgElement.onload = () => {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const imgWidth = imgElement.naturalWidth;
        const imgHeight = imgElement.naturalHeight;

        // Maßstab berechnen, um Bild komplett einzupassen
        const scaleX = viewportWidth / imgWidth;
        const scaleY = viewportHeight / imgHeight;

        scale = Math.min(scaleX, scaleY, 1.0); // nicht größer als 100%
        applyScale();
    }
}

function showControls() {
    btnContainer.classList.remove("hidden");

    // Timer zurücksetzen
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
        btnContainer.classList.add("hidden");
    }, 2000); // Buttons verschwinden nach 2 Sekunden ohne Mausbewegung
}

function firstImage() {
     if (images.length > 0) {
         showImage(0);
     }
 }

 function lastImage() {
     if (images.length > 0) {
         showImage(images.length - 1);
     }
 }

 function nextImage() {
     if (currentIndex < images.length - 1) {
         showImage(currentIndex + 1);
     }
 }

 function prevImage() {
     if (currentIndex > 0) {
         showImage(currentIndex - 1);
     }
 }

function applyScale() {
    imgElement.style.transform = `scale(${scale})`;
    imgElement.style.transformOrigin = "center center";

    scaleSpan.textContent = Math.round(scale * 100) + "%";
}

 function zoomIn() {
     scale = Math.min(scale + SCALE_STEP, SCALE_MAX);
     applyScale();
 }

 function zoomOut() {
     scale = Math.max(scale - SCALE_STEP, SCALE_MIN);
     applyScale();
 }

// Buttons
btnFirst.addEventListener("click", firstImage);
btnLast.addEventListener("click", lastImage);
btnNext.addEventListener("click", nextImage);
btnPrev.addEventListener("click", prevImage);
btnPlus.addEventListener("click", zoomIn);
btnMinus.addEventListener("click", zoomOut);

// Mausbewegung im gesamten Dokument überwachen
document.addEventListener("mousemove", showControls);
document.addEventListener("keydown", (event) => {

    // Nur reagieren, wenn Bilder geladen sind
    if (images.length === 0) return;

    switch (event.key) {
        case "ArrowLeft":
            if (event.shiftKey) {
                firstImage();
            } else {
                prevImage();
            }
            event.preventDefault();
            break;

        case "ArrowRight":
            if (event.shiftKey) {
                lastImage();
            } else {
                nextImage();
            }
            event.preventDefault();
            break;

        case "+":
            zoomIn();
            event.preventDefault();
            break;

        case "-":
            zoomOut();
            event.preventDefault();
            break;
    }
});

// Initial: Buttons sichtbar, Timer starten
showControls();

