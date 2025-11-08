
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

        // Mostra solo i piatti con attivo: true (o senza campo attivo)
        const filteredMenu = {
            primi: (menu.primi || []).filter(p => p.attivo !== false),
            secondi: (menu.secondi || []).filter(p => p.attivo !== false),
            poke: (menu.poke || []).filter(p => p.attivo !== false),
            insalatone: (menu.insalatone || []).filter(p => p.attivo !== false)
        };
        // Salva per uso nella lightbox
        window.filteredMenu = filteredMenu;

       const primiList = document.getElementById('primi-list');
       const secondiList = document.getElementById('secondi-list');
       const pokeList = document.getElementById('poke-list');
       const insalatoneList = document.getElementById('insalatone-list');

        primiList.innerHTML = '';
	secondiList.innerHTML = '';
	pokeList.innerHTML = '';
	insalatoneList.innerHTML = '';

        filteredMenu.primi.forEach((piatto, index) => {
    primiList.innerHTML += `<li onclick="openLightbox(${index}, 'primi')">
        <img src="${piatto.immagine}" alt="${piatto.nome}">
        <span>${piatto.nome}</span>
    </li>`;
});

filteredMenu.secondi.forEach((piatto, index) => {
    secondiList.innerHTML += `<li onclick="openLightbox(${index}, 'secondi')">
        <img src="${piatto.immagine}" alt="${piatto.nome}">
        <span>${piatto.nome}</span>
    </li>`;
});

filteredMenu.poke.forEach((piatto, index) => {
    pokeList.innerHTML += `<li onclick="openLightbox(${index}, 'poke')">
        <img src="${piatto.immagine}" alt="${piatto.nome}">
        <span>${piatto.nome}</span>
    </li>`;
});

filteredMenu.insalatone.forEach((piatto, index) => {
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

    const menu = window.filteredMenu || { primi: [], secondi: [], poke: [], insalatone: [] };
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
let slides = [];
let slideInterval;

async function mergeDynamicSlides() {
    const container = document.getElementById('slideshowContainer');
    if (!container) return;

    const prevBtn = container.querySelector('.prev-slide');
    const nextBtn = container.querySelector('.next-slide');

    // Rimuovi eventuali slide esistenti prima di ricostruire
    container.querySelectorAll('.slide').forEach(slide => slide.remove());

    let data = { slides: [] };
    try {
        const res = await fetch('/slideshow', { cache: 'no-store' });
        if (res.ok) data = await res.json();
    } catch (e) {
        console.warn('Slideshow fetch skipped', e);
    }

    const slidesData = (data.slides || []).filter(s => s?.src && s.attivo !== false);
    const anchor = prevBtn || nextBtn || null;

    slidesData.forEach(s => {
        const fitValue = s.fit === 'contain' ? 'contain' : 'cover';
        const slideNode = document.createElement('div');
        slideNode.className = 'slide';
        slideNode.dataset.fit = fitValue;

        const img = document.createElement('img');
        img.className = 'slide-img';
        img.src = s.src;
        img.alt = 'Slide';
        img.dataset.fit = fitValue;

        slideNode.appendChild(img);

        if (anchor) {
            container.insertBefore(slideNode, anchor);
        } else {
            container.appendChild(slideNode);
        }
    });

    slides = container.querySelectorAll('.slide');
}

function showSlide(idx) {
    if (!slides || !slides.length) return;
    if (idx >= slides.length) slideIndex = 0;
    if (idx < 0) slideIndex = slides.length - 1;
    slides.forEach(sl => sl.classList.remove('active'));
    slides[slideIndex].classList.add('active');
}

function changeSlide(n) {
    if (!slides || !slides.length) return;
    clearInterval(slideInterval);
    slideIndex += n;
    showSlide(slideIndex);
    slideInterval = setInterval(() => changeSlide(1), 4000);
}

function startSlideshow() {
    if (!slides || !slides.length) return;
    slides.forEach((sl, i) => sl.classList.toggle('active', i === 0));
    slideIndex = 0;
    if (slideInterval) clearInterval(slideInterval);
    slideInterval = setInterval(() => changeSlide(1), 4000);
}

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('slideshowContainer');
    if (container) {
        slides = container.querySelectorAll('.slide');
        await mergeDynamicSlides();
        startSlideshow();
        // esponi per i bottoni
        window.changeSlide = changeSlide;
    }
});

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
