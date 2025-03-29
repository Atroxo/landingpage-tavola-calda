
    document.addEventListener("DOMContentLoaded", function() {
        const currentDate = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById("current-date").textContent = currentDate.toLocaleDateString('it-IT', options);
    });

// Forza l'aggiornamento del menù con cache disattivata
async function renderPublicMenu() {
    try {
        const response = await fetch('/menu', {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache'
            }
        });
        if (!response.ok) throw new Error('Errore nel caricamento del menù');

        const menu = await response.json();

       const primiList = document.getElementById('primi-list');
       const secondiList = document.getElementById('secondi-list');
       const pokeList = document.getElementById('poke-list');
       const insalatoneList = document.getElementById('insalatone-list');

        primiList.innerHTML = '';
	secondiList.innerHTML = '';
	pokeList.innerHTML = '';
	insalatoneList.innerHTML = '';

        menu.primi.forEach((piatto, index) => {
    primiList.innerHTML += `<li onclick="openLightbox(${index}, 'primi')">
        <img src="${piatto.immagine}" alt="${piatto.nome}">
        <span>${piatto.nome}</span>
    </li>`;
});

menu.secondi.forEach((piatto, index) => {
    secondiList.innerHTML += `<li onclick="openLightbox(${index}, 'secondi')">
        <img src="${piatto.immagine}" alt="${piatto.nome}">
        <span>${piatto.nome}</span>
    </li>`;
});

menu.poke.forEach((piatto, index) => {
    pokeList.innerHTML += `<li onclick="openLightbox(${index}, 'poke')">
        <img src="${piatto.immagine}" alt="${piatto.nome}">
        <span>${piatto.nome}</span>
    </li>`;
});

menu.insalatone.forEach((piatto, index) => {
    insalatoneList.innerHTML += `<li onclick="openLightbox(${index}, 'insalatone')">
        <img src="${piatto.immagine}" alt="${piatto.nome}">
        <span>${piatto.nome}</span>
    </li>`;
});

        // Attiva la tab attiva di default
        openTab(document.querySelector('.tab-link.active'), 'primi');
    } catch (error) {
        console.error('Errore durante il caricamento del menù:', error);
    }
}

// Funzione per cambiare tab (aggiornata)
function openTab(event, tabName) {
    const tabContents = document.querySelectorAll('.tab-content');
    const tabLinks = document.querySelectorAll('.tab-link');

    tabContents.forEach(content => content.style.display = 'none');
    tabLinks.forEach(link => link.classList.remove('active'));

    // Mostra la tab selezionata
    document.getElementById(tabName).style.display = 'block';

    // Se event non è nullo, applica la classe 'active'
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    } else {
        // Attiva la prima tab come fallback
        const defaultTab = document.querySelector(`[onclick="openTab(event, '${tabName}')"]`);
        if (defaultTab) defaultTab.classList.add('active');
    }
}


// Funzione per aprire la lightbox
function openLightbox(index, categoria) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxDescription = document.getElementById('lightbox-description');

    fetch('/menu')
        .then(response => response.json())
        .then(menu => {
            let piatto;
            if (categoria === 'primi') {
                piatto = menu.primi[index];
            } else if (categoria === 'secondi') {
                piatto = menu.secondi[index];
            } else if (categoria === 'poke') {
                piatto = menu.poke[index];
            } else if (categoria === 'insalatone') {
                piatto = menu.insalatone[index];
            }
            
            if (piatto) {
                lightboxImg.src = piatto.immagine;
                lightboxTitle.textContent = piatto.nome;
                lightboxDescription.textContent = piatto.descrizione;
                lightbox.style.display = 'flex';
            } else {
                console.error('Piatto non trovato nella categoria:', categoria);
            }
        })
        .catch(error => console.error('Errore nel caricamento del menù:', error));
}

// Funzione per chiudere la lightbox
function closeLightbox() {
    document.getElementById('lightbox').style.display = 'none';
}

/* JS per chiudere la lightbox cliccando fuori dal contenuto */
document.addEventListener('DOMContentLoaded', function () {
    const lightbox = document.querySelector('.lightbox');
    const lightboxContent = document.querySelector('.lightbox-content');

    lightbox.addEventListener('click', function (event) {
        if (!lightboxContent.contains(event.target)) {
            lightbox.style.display = 'none';
        }
    });
});

// Esegui il rendering del menù iniziale
renderPublicMenu();

// Funzione per aprire e chiudere il popup di chat
function toggleWhatsAppChat() {
    const popup = document.getElementById('whatsappPopup');
    popup.style.display = (popup.style.display === 'block') ? 'none' : 'block';
}

// Funzionamento modulo di contatto
document.querySelector('#contatti form').addEventListener('submit', async function (event) {
    event.preventDefault(); // Evita il comportamento predefinito del form

    // Raccolta dei dati dal form esistente
    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const messaggio = document.getElementById('messaggio').value.trim();

    // Messaggio di errore o conferma
    const formMessage = document.createElement('p');
    formMessage.style.textAlign = 'center';

    // Validazione base
    if (!nome || !email || !messaggio) {
        formMessage.textContent = 'Tutti i campi sono obbligatori.';
        formMessage.style.color = 'red';
        this.appendChild(formMessage);
        return;
    }

    try {
        const response = await fetch('/send-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, messaggio })
        });

        if (response.ok) {
            formMessage.textContent = 'Messaggio inviato con successo!';
            formMessage.style.color = 'green';
            this.reset();
        } else {
            throw new Error('Errore durante l\'invio.');
        }
    } catch (error) {
        formMessage.textContent = 'Errore durante l\'invio del messaggio.';
        formMessage.style.color = 'red';
    }

    // Aggiungi il messaggio di feedback al form
    this.appendChild(formMessage);
});

let slideIndex = 0;
let slides;
let slideInterval;

document.addEventListener("DOMContentLoaded", function () {
    slides = document.querySelectorAll(".slide");
    slides.forEach(slide => {
        slide.style.opacity = '0';
        slide.style.display = 'none';
    });

    showSlide(slideIndex);
    slideInterval = setInterval(() => changeSlide(1), 4000);
});

function showSlide(index) {
    slides.forEach(slide => {
        slide.style.opacity = '0';
        slide.style.display = 'none';
    });

    if (index >= slides.length) slideIndex = 0;
    if (index < 0) slideIndex = slides.length - 1;

    slides[slideIndex].style.display = "block";
    setTimeout(() => {
        slides[slideIndex].style.opacity = "1";
    }, 50); // fade-in morbido
}

function changeSlide(n) {
    clearInterval(slideInterval);
    slideIndex += n;
    showSlide(slideIndex);
    slideInterval = setInterval(() => changeSlide(1), 4000);
}

document.addEventListener("DOMContentLoaded", function() {
    const popup = document.getElementById('popup-ad');

    // mostra il popup dopo 1 secondo dall'apertura
    setTimeout(() => {
        popup.style.display = 'flex';
    }, 1000);
});

// chiude il popup solo se si clicca fuori dal contenuto
function closePopup(event) {
    if(event.target.id === 'popup-ad') {
        document.getElementById('popup-ad').style.display = 'none';
    }
}

// Funzione che apre direttamente WhatsApp (stesso codice già presente nel pulsante WhatsApp)
function openWhatsAppChat() {
    const numeroWhatsApp = "+393408669454"; // metti qui il numero WhatsApp corretto
    window.open(`https://wa.me/${numeroWhatsApp}`, '_blank');
    
    // dopo aver cliccato il CTA, chiude il popup
    document.getElementById('popup-ad').style.display = 'none';
}