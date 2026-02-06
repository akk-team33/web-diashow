let images = [];
let currentIndex = 0;

const imgElement = document.getElementById("image");
const fileSpan = document.getElementById("file");

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

function showImage(index) {
    currentIndex = index;
    imgElement.src = images[index];
    imgElement.alt = images[index];
    fileSpan.textContent = images[index];
}
