const passwordGestore = "12345";

// Riferimento al pulsante Accedi
function getLoginButton() {
    return document.querySelector('#loginSection button[onclick="checkPassword()"]');
}

// Funzione per controllare la password
function checkPassword() {
    const password = document.getElementById('passwordInput').value;
    if (password === passwordGestore) {
        alert('Accesso consentito');
        localStorage.setItem('loggedIn', 'true'); // Salva lo stato di login
        localStorage.setItem('adminLoggedIn', 'true'); // Nuova chiave richiesta
        document.getElementById('addDishForm').style.display = 'block';
        document.getElementById('passwordInput').style.display = 'none';
        document.getElementById('logoutButton').style.display = 'inline-block';
        const loginBtn = getLoginButton();
        if (loginBtn) { loginBtn.disabled = true; loginBtn.classList.add('btn-disabled'); }
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
    // Mantiene compatibilità con admin.html e applica nuova logica richiesta
    doLogout();
}

// Nuova funzione: resetta lo stato di login e UI senza ricaricare
function doLogout() {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('loggedIn');

    const loginBtn = getLoginButton();
    if (loginBtn) { loginBtn.disabled = false; loginBtn.classList.remove('btn-disabled'); }

    const addForm = document.getElementById('addDishForm');
    const pwdInput = document.getElementById('passwordInput');
    const logoutBtn = document.getElementById('logoutButton');

    if (addForm) addForm.style.display = 'none';
    if (pwdInput) pwdInput.style.display = 'inline-block';
    if (logoutBtn) logoutBtn.style.display = 'none';

    // Svuota le liste per mostrare solo la sezione di login
    ['admin-primi-list','admin-secondi-list','admin-poke-list','admin-insalatone-list']
      .forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = ''; });
}

// Al caricamento: applica stato del pulsante in base a adminLoggedIn
document.addEventListener('DOMContentLoaded', function () {
    const isLogged = (localStorage.getItem('adminLoggedIn') === 'true') || (localStorage.getItem('loggedIn') === 'true');
    const loginBtn = getLoginButton();
    if (loginBtn) {
        loginBtn.disabled = !!isLogged;
        loginBtn.classList.toggle('btn-disabled', !!isLogged);
    }
});
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
        // I nuovi piatti sono attivi di default
        body: JSON.stringify({ nome, descrizione, immagine, categoria, attivo: true })
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

// Visualizza i piatti e aggiunge pulsanti elimina/attiva-disattiva
        

menu.primi.forEach((piatto, index) => {
    const isActive = piatto.attivo !== false; // default attivo se mancante
    const toggleLabel = isActive ? 'Disattiva' : 'Attiva';
    const stateClass = isActive ? 'active' : 'inactive';
    primiList.innerHTML += `
        <li class="dish-item ${stateClass}">
            <img src="${piatto.immagine}" alt="${piatto.nome}">
            <span class="dish-name">${piatto.nome}</span>
            <button class="delete-button" onclick="deleteDish(${index}, 'primi')">X</button>
            <button class="toggle-button" onclick="toggleDish(${index}, 'primi', ${!isActive})">${toggleLabel}</button>
        </li>`;
});

menu.secondi.forEach((piatto, index) => {
    const isActive = piatto.attivo !== false;
    const toggleLabel = isActive ? 'Disattiva' : 'Attiva';
    const stateClass = isActive ? 'active' : 'inactive';
    secondiList.innerHTML += `
        <li class="dish-item ${stateClass}">
            <img src="${piatto.immagine}" alt="${piatto.nome}">
            <span class="dish-name">${piatto.nome}</span>
            <button class="delete-button" onclick="deleteDish(${index}, 'secondi')">X</button>
            <button class="toggle-button" onclick="toggleDish(${index}, 'secondi', ${!isActive})">${toggleLabel}</button>
        </li>`;
});

menu.poke.forEach((piatto, index) => {
    const isActive = piatto.attivo !== false;
    const toggleLabel = isActive ? 'Disattiva' : 'Attiva';
    const stateClass = isActive ? 'active' : 'inactive';
    pokeList.innerHTML += `
        <li class="dish-item ${stateClass}">
            <img src="${piatto.immagine}" alt="${piatto.nome}">
            <span class="dish-name">${piatto.nome}</span>
            <button class="delete-button" onclick="deleteDish(${index}, 'poke')">X</button>
            <button class="toggle-button" onclick="toggleDish(${index}, 'poke', ${!isActive})">${toggleLabel}</button>
        </li>`;
});

menu.insalatone.forEach((piatto, index) => {
    const isActive = piatto.attivo !== false;
    const toggleLabel = isActive ? 'Disattiva' : 'Attiva';
    const stateClass = isActive ? 'active' : 'inactive';
    insalatoneList.innerHTML += `
        <li class="dish-item ${stateClass}">
            <img src="${piatto.immagine}" alt="${piatto.nome}">
            <span class="dish-name">${piatto.nome}</span>
            <button class="delete-button" onclick="deleteDish(${index}, 'insalatone')">X</button>
            <button class="toggle-button" onclick="toggleDish(${index}, 'insalatone', ${!isActive})">${toggleLabel}</button>
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

// Funzione per attivare/disattivare un piatto
async function toggleDish(index, categoria, nuovoStato) {
    try {
        const response = await fetch(`/menu/${categoria}/${index}/attivo`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ attivo: Boolean(nuovoStato) })
        });

        if (response.ok) {
            renderAdminMenu(); // aggiorna la lista con lo stato aggiornato
        } else {
            alert("Errore durante l'aggiornamento dello stato del piatto.");
        }
    } catch (error) {
        console.error('Errore di connessione con il server:', error);
    }
}

// =============================
// Slideshow - Gestione in Admin
// =============================

async function loadSlidesAdmin(){
  try{
    const res = await fetch('/slideshow', { cache:'no-store' });
    if(!res.ok) return;
    const data = await res.json();
    const list = document.getElementById('slidesList');
    if(!list) return;
    list.innerHTML = '';
    (data.slides||[]).forEach(s=>{
      const li = document.createElement('li');
      li.className = 'admin-item';
      li.innerHTML = `
        <img src="${s.src}" alt="" class="thumb">
        <span class="title">${s.src}</span>
        <div class="actions">
          <button class="btn ${s.attivo===false?'btn-outline':''}" data-id="${s.id}" data-on="${s.attivo!==false}">
            ${s.attivo===false?'Attiva':'Disattiva'}
          </button>
          <button class="btn btn-outline danger" data-del="${s.id}">Elimina</button>
        </div>`;
      list.appendChild(li);
    });
    // toggle
    list.querySelectorAll('button[data-id]').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        const id = btn.getAttribute('data-id');
        const current = btn.getAttribute('data-on')==='true';
        await fetch(`/slideshow/${id}/attivo`, {
          method:'PATCH', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ attivo: !current })
        });
        loadSlidesAdmin();
      });
    });
    // delete
    list.querySelectorAll('button[data-del]').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        const id = btn.getAttribute('data-del');
        if(!confirm('Eliminare questa immagine dalla slideshow?')) return;
        await fetch(`/slideshow/${id}`, { method:'DELETE' });
        loadSlidesAdmin();
      });
    });
  }catch(e){
    console.warn('Impossibile caricare slideshow admin', e);
  }
}

document.getElementById('slideUrlForm')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const input = document.getElementById('slideUrlInput');
  const src = (input && input.value ? input.value.trim() : '');
  if(!src) return;
  const res = await fetch('/slideshow', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ src })
  });
  if(res.ok){ if(input) input.value=''; loadSlidesAdmin(); }
  else alert('Errore aggiunta URL');
});

document.getElementById('slideUploadForm')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const file = document.getElementById('slideFileInput')?.files?.[0];
  if(!file) return;
  const fd = new FormData();
  fd.append('image', file);
  const res = await fetch('/slideshow/upload', { method:'POST', body:fd });
  if(res.ok){ const inp = document.getElementById('slideFileInput'); if(inp) inp.value=''; loadSlidesAdmin(); }
  else alert('Errore upload');
});

document.addEventListener('DOMContentLoaded', ()=>{
  if(localStorage.getItem('adminLoggedIn')==='true') loadSlidesAdmin();
});

// ========== Slideshow Admin ==========
function detachLegacySlideshowHandlers() {
  const idsToReset = ['slideUrlForm', 'slideUploadForm'];
  idsToReset.forEach(id => {
    const node = document.getElementById(id);
    if (node && node.parentNode) {
      const clone = node.cloneNode(true);
      node.parentNode.replaceChild(clone, node);
    }
  });
  const reloadBtn = document.getElementById('reloadSlidesBtn');
  if (reloadBtn && reloadBtn.parentNode) {
    const reloadClone = reloadBtn.cloneNode(true);
    reloadBtn.parentNode.replaceChild(reloadClone, reloadBtn);
  }
}

function bindSlideUploadPreview(){
  const input = document.getElementById('slideFileInput');
  const img = document.getElementById('slidePreview');
  if (!input || !img) return;
  img.style.display = img.getAttribute('src') ? 'block' : 'none';
  input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    if(!file) { img.removeAttribute('src'); img.style.display = 'none'; return; }
    const reader = new FileReader();
    reader.onload = e => { img.src = e.target.result; img.style.display = 'block'; };
    reader.readAsDataURL(file);
  });
}

function resetSlidePreview() {
  const img = document.getElementById('slidePreview');
  const fileInput = document.getElementById('slideFileInput');
  if (fileInput) {
    fileInput.value = '';
  }
  if (img) {
    img.removeAttribute('src');
    img.style.display = 'none';
  }
}

async function renderSlidesAdmin(){
  const grid = document.getElementById('slidesGrid');
  if(!grid) return;
  grid.innerHTML = '<p>Caricamento…</p>';
  try{
    const res = await fetch('/slideshow', { cache:'no-store' });
    if(!res.ok) throw new Error('Bad response');
    const data = await res.json();
    grid.innerHTML = '';
    (data.slides||[]).forEach(s=>{
      const fit = s.fit === 'contain' ? 'contain' : 'cover';
      const card = document.createElement('div');
      card.className = 'slide-card';
      card.innerHTML = `
        <img class="thumb" src="${s.src}" alt="Slide" data-fit="${fit}">
        <div class="meta">
          <div class="slide-status ${s.attivo===false?'inactive':'active'}">
            ${s.attivo===false ? 'Disattivata' : 'Attiva'}
          </div>
          <div class="fit-control">
            <label>Adattamento immagine</label>
            <select class="fit-select" data-slide-id="${s.id}" data-current="${fit}">
              <option value="cover" ${fit==='cover'?'selected':''}>cover</option>
              <option value="contain" ${fit==='contain'?'selected':''}>contain</option>
            </select>
          </div>
          <div class="slide-actions">
            <button class="btn" data-toggle="${s.id}" data-on="${s.attivo!==false}">
              ${s.attivo===false ? 'Attiva' : 'Disattiva'}
            </button>
            <button class="btn btn-outline" data-del="${s.id}">Elimina</button>
          </div>
        </div>`;
      grid.appendChild(card);
    });
    // bind fit select
    grid.querySelectorAll('.fit-select').forEach(select=>{
      select.addEventListener('change', async ()=>{
        const id = select.getAttribute('data-slide-id');
        const value = select.value;
        if(!id) return;
        const fitValue = (value === 'contain') ? 'contain' : (value === 'cover' ? 'cover' : null);
        if(!fitValue){
          alert('Valore di adattamento non valido');
          select.value = select.getAttribute('data-current') || 'cover';
          return;
        }
        const resFit = await fetch(`/slideshow/${id}/fit`, {
          method:'PATCH',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ fit: fitValue })
        });
        if(resFit.ok){
          select.dataset.current = fitValue;
          renderSlidesAdmin();
        } else {
          alert('Errore aggiornamento adattamento immagine');
          select.value = select.getAttribute('data-current') || 'cover';
        }
      });
    });
    // bind toggle
    grid.querySelectorAll('button[data-toggle]').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        const id = btn.getAttribute('data-toggle');
        const current = btn.getAttribute('data-on')==='true';
        const resToggle = await fetch(`/slideshow/${id}/attivo`, {
          method:'PATCH',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ attivo: !current })
        });
        if(resToggle.ok) {
          renderSlidesAdmin();
        } else {
          alert('Errore aggiornamento stato');
        }
      });
    });
    // bind delete
    grid.querySelectorAll('button[data-del]').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        const id = btn.getAttribute('data-del');
        if(!confirm('Eliminare questa immagine dalla slideshow?')) return;
        const resDel = await fetch(`/slideshow/${id}`, { method:'DELETE' });
        if(resDel.ok) {
          renderSlidesAdmin();
        } else {
          alert('Errore eliminazione');
        }
      });
    });
  }catch(err){
    console.error('Errore slideshow admin', err);
    grid.innerHTML = '<p>Errore nel caricamento delle slide.</p>';
  }
}

function bindSlideshowForms(){
  const urlForm = document.getElementById('slideUrlForm');
  if(urlForm && !urlForm.dataset.slideshowBound){
    urlForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const input = document.getElementById('slideUrlInput');
      const src = input ? input.value.trim() : '';
      if(!src) return;
      const fitSelect = document.getElementById('slideFit');
      const fitValue = (fitSelect && fitSelect.value === 'contain') ? 'contain' : 'cover';
      const res = await fetch('/slideshow', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ src, fit: fitValue })
      });
      if(res.ok){
        if(input) input.value='';
        resetSlidePreview();
        renderSlidesAdmin();
        alert('Immagine aggiunta alla slideshow!');
      }
      else alert('Errore aggiunta URL');
    });
    urlForm.dataset.slideshowBound = 'true';
  }

  const uploadForm = document.getElementById('slideUploadForm');
  if(uploadForm && !uploadForm.dataset.slideshowBound){
    uploadForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const inputFile = document.getElementById('slideFileInput');
      const file = inputFile && inputFile.files ? inputFile.files[0] : null;
      if(!file) return;
      const fitSelect = document.getElementById('slideFit');
      const fitValue = (fitSelect && fitSelect.value === 'contain') ? 'contain' : 'cover';
      const fd = new FormData();
      fd.append('image', file);
      fd.append('fit', fitValue);
      const res = await fetch('/slideshow/upload', { method:'POST', body: fd });
      if(res.ok){
        resetSlidePreview();
        renderSlidesAdmin();
        alert('Immagine caricata con successo!');
      } else {
        alert('Errore upload');
      }
    });
    uploadForm.dataset.slideshowBound = 'true';
  }

  const reloadBtn = document.getElementById('reloadSlidesBtn');
  if(reloadBtn && !reloadBtn.dataset.slideshowBound){
    reloadBtn.addEventListener('click', renderSlidesAdmin);
    reloadBtn.dataset.slideshowBound = 'true';
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  detachLegacySlideshowHandlers();
  bindSlideUploadPreview();
  bindSlideshowForms();
  if(localStorage.getItem('adminLoggedIn')==='true'){
    renderSlidesAdmin();
  }
});
