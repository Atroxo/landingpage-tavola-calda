const passwordGestore = "12345";

// Funzione per controllare la password
function checkPassword() {
    const password = document.getElementById('passwordInput').value;
    if (password === passwordGestore) {
        alert('Accesso consentito');
        localStorage.setItem('loggedIn', 'true'); // Salva lo stato di login
        document.getElementById('addDishForm').style.display = 'block';
        document.getElementById('passwordInput').style.display = 'none';
        document.getElementById('logoutButton').style.display = 'inline-block';
        renderAdminMenu(); // Carica la lista dei piatti al login
    } else {
        alert('Password errata!');
    }
}

// Controlla lo stato di login al caricamento della pagina
document.addEventListener('DOMContentLoaded', function () {
    const isLoggedIn = localStorage.getItem('loggedIn') === 'true';

    if (isLoggedIn) {
        document.getElementById('logoutButton').style.display = 'inline-block';
        document.getElementById('addDishForm').style.display = 'block';
        document.getElementById('passwordInput').style.display = 'none';
        renderAdminMenu(); // Mostra il menù se già loggato
    }
});

// Funzione per il logout
function logout() {
    localStorage.removeItem('loggedIn'); // Rimuove lo stato di login
    window.location.reload(); // Ricarica la pagina
}
// Aggiunta di un piatto con selezione della categoria e immagine di default

document.getElementById('addDishForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    
    const nome = document.getElementById('dishName').value.trim();
    const descrizione = document.getElementById('dishDescription').value.trim();
    const fileInput = document.getElementById('dishImageFile').files[0];
    const urlInput = document.getElementById('dishImageURL').value.trim();
    const categoria = document.getElementById('dishCategory').value; // Ora prende dal menu a tendina
    let immagine = urlInput;

    // Immagini predefinite per ogni categoria
    const immaginiPredefinite = {
        primi: '/images/default-primi.jpg',
        secondi: '/images/default-secondi.jpg',
        poke: '/images/default-poke.jpg',
        insalatone: '/images/default-insalatone.jpg'
    };

    // Validazione del nome e descrizione
    if (!nome || !descrizione) {
        alert('Compila tutti i campi richiesti.');
        return;
    }

    // Se non è stato selezionato alcun file o URL immagine, usa l'immagine predefinita
    if (!immagine && immaginiPredefinite[categoria]) {
        immagine = immaginiPredefinite[categoria];
    }

    // Se è stato caricato un file immagine
    if (fileInput) {
        const formData = new FormData();
        formData.append('image', fileInput);

        try {
            const uploadResponse = await fetch('/upload-image', {
                method: 'POST',
                body: formData
            });
            const uploadResult = await uploadResponse.json();
            immagine = uploadResult.filePath;
        } catch (error) {
            console.error("Errore durante il caricamento dell'immagine:", error);
        }
    }

    // Controllo URL immagine locale
    if (urlInput.startsWith('/images/')) {
        immagine = urlInput;
    } else if (urlInput && !urlInput.startsWith('http')) {
        alert('URL immagine non valido. Deve iniziare con /images/ o un URL completo.');
        return;
    }

    // Invio dei dati al server con selezione della categoria
    const response = await fetch('/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, descrizione, immagine, categoria })
    });

    if (response.ok) {
        alert('Piatto aggiunto con successo!');
        window.location.reload(); // Ricarica la pagina per aggiornare i dati
    } else {
        alert('Errore durante il salvataggio.');
    }
});

// Funzione per caricare e visualizzare i piatti in admin.html
async function renderAdminMenu() {
    try {
        const response = await fetch('/menu');
        const menu = await response.json();
        
        const primiList = document.getElementById('admin-primi-list');
	const secondiList = document.getElementById('admin-secondi-list');
	const pokeList = document.getElementById('admin-poke-list');
	const insalatoneList = document.getElementById('admin-insalatone-list');

	primiList.innerHTML = '';
	secondiList.innerHTML = '';
	pokeList.innerHTML = '';
	insalatoneList.innerHTML = '';

// Visualizza i piatti e aggiunge il pulsante di eliminazione
        

menu.primi.forEach((piatto, index) => {
    primiList.innerHTML += `
        <li>
            <img src="${piatto.immagine}" alt="${piatto.nome}">
            <span>${piatto.nome}</span>
            <button class="delete-button" onclick="deleteDish(${index}, 'primi')">X</button>
        </li>`;
});

menu.secondi.forEach((piatto, index) => {
    secondiList.innerHTML += `
        <li>
            <img src="${piatto.immagine}" alt="${piatto.nome}">
            <span>${piatto.nome}</span>
            <button class="delete-button" onclick="deleteDish(${index}, 'secondi')">X</button>
        </li>`;
});

menu.poke.forEach((piatto, index) => {
    pokeList.innerHTML += `
        <li>
            <img src="${piatto.immagine}" alt="${piatto.nome}">
            <span>${piatto.nome}</span>
            <button class="delete-button" onclick="deleteDish(${index}, 'poke')">X</button>
        </li>`;
});

menu.insalatone.forEach((piatto, index) => {
    insalatoneList.innerHTML += `
        <li>
            <img src="${piatto.immagine}" alt="${piatto.nome}">
            <span>${piatto.nome}</span>
            <button class="delete-button" onclick="deleteDish(${index}, 'insalatone')">X</button>
        </li>`;
});

    } catch (error) {
        console.error('Errore durante il caricamento del menù:', error);
    }
}

// Funzione per eliminare un piatto
async function deleteDish(index, categoria) {
    const conferma = confirm("Sei sicuro di voler eliminare questo piatto?");
    if (!conferma) return;

    try {
        const response = await fetch(`/menu/${categoria}/${index}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Piatto eliminato con successo!');
            renderAdminMenu();  // Aggiorna la lista dopo l'eliminazione
        } else {
            alert("Errore durante l'eliminazione del piatto.");
        }
    } catch (error) {
        console.error('Errore di connessione con il server:', error);
    }
}