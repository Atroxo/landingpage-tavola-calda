const express = require('express');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const app = express();
const PORT = process.env.PORT || 3000;
const menuFilePath = path.join(__dirname, 'data/menu-data.json');
// Slideshow storage path
const slideshowPath = path.join(__dirname, 'data', 'slideshow.json');
const dataDir = path.join(__dirname, 'data');
const publicDir = path.join(__dirname, 'public');
const publicImagesDir = path.join(publicDir, 'images');
const publicUploadsDir = path.join(publicDir, 'uploads');

app.use(express.json());
app.use(express.static('public'));
ensureSlideshowFile();

// Configurazione per salvare le immagini caricate
const storage = multer.diskStorage({
    destination: 'public/images',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Endpoint per il caricamento dell'immagine
app.post('/upload-image', upload.single('image'), (req, res) => {
    res.json({ filePath: `/images/${req.file.filename}` });
});

// Endpoint per ottenere il menù
app.get('/menu', (req, res) => {
    const menuData = fs.readFileSync('./data/menu-data.json', 'utf8');
    res.setHeader('Cache-Control', 'no-store');
    res.json(JSON.parse(menuData));
});

// Endpoint per aggiungere un piatto
app.post('/menu', (req, res) => {
    const { nome, descrizione, immagine, categoria } = req.body;
    const menuData = JSON.parse(fs.readFileSync('./data/menu-data.json'));
    // Nuovi piatti sono attivi di default
    menuData[categoria].push({ nome, descrizione, immagine, attivo: true });
    fs.writeFileSync('./data/menu-data.json', JSON.stringify(menuData, null, 2));
    res.sendStatus(200);
});

// Endpoint per aggiornare lo stato attivo/disattivo di un piatto
app.put('/menu/:categoria/:index/attivo', (req, res) => {
    const { categoria, index } = req.params;
    const { attivo } = req.body || {};

    if (typeof attivo !== 'boolean') {
        return res.status(400).send("Parametro 'attivo' mancante o non valido.");
    }

    const menuData = JSON.parse(fs.readFileSync(menuFilePath));
    if (!menuData[categoria] || !menuData[categoria][index]) {
        return res.status(404).send('Piatto non trovato.');
    }

    menuData[categoria][index].attivo = attivo;
    fs.writeFileSync(menuFilePath, JSON.stringify(menuData, null, 2));
    res.status(200).json(menuData[categoria][index]);
});

// Endpoint per eliminare un piatto
app.delete('/menu/:categoria/:index', (req, res) => {
    const { categoria, index } = req.params;
    const menuData = JSON.parse(fs.readFileSync(menuFilePath));

    if (!menuData[categoria] || !menuData[categoria][index]) {
        return res.status(404).send('Piatto non trovato.');
    }

    // Rimuove il piatto dalla lista
    menuData[categoria].splice(index, 1);

    fs.writeFileSync(menuFilePath, JSON.stringify(menuData, null, 2));
    res.status(200).send('Piatto eliminato con successo!');
});

// Configura Nodemailer per l'invio delle email
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
    }
});

// Endpoint per l'invio dei messaggi dal form
app.post('/send-message', async (req, res) => {
    const { nome, email, messaggio } = req.body;

    if (!nome || !email || !messaggio) {
        return res.status(400).send('Tutti i campi sono obbligatori.');
    }

    const mailOptions = {
        from: email,
        to: 'atroce90@gmail.com',
        subject: `Nuovo Messaggio da ${nome}`,
        text: `Nome: ${nome}\nEmail: ${email}\nMessaggio:\n${messaggio}`
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).send('Messaggio inviato con successo!');
    } catch (error) {
        console.error('Errore durante l\'invio dell\'email:', error);
        res.status(500).send('Errore durante l\'invio del messaggio.');
    }
});

// =========================
// Slideshow utilities/routes
// =========================

function isValidFit(value) {
    return value === 'cover' || value === 'contain';
}

function sanitizeFit(value) {
    return isValidFit(value) ? value : 'cover';
}

function ensureSlideshowFile() {
    try {
        fs.mkdirSync(dataDir, { recursive: true });
        if (!fs.existsSync(slideshowPath)) {
            fs.writeFileSync(slideshowPath, JSON.stringify({ slides: [] }, null, 2), 'utf8');
            return;
        }
        const raw = fs.readFileSync(slideshowPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.slides)) {
            throw new Error('Invalid slideshow structure');
        }
    } catch (err) {
        try {
            fs.writeFileSync(slideshowPath, JSON.stringify({ slides: [] }, null, 2), 'utf8');
        } catch { }
    }
}

function readSlideshow() {
    ensureSlideshowFile();
    try {
        const parsed = JSON.parse(fs.readFileSync(slideshowPath, 'utf8'));
        if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.slides)) {
            return { slides: [] };
        }
        parsed.slides = parsed.slides.map(s => ({
            ...s,
            fit: sanitizeFit(s?.fit)
        }));
        return parsed;
    } catch {
        return { slides: [] };
    }
}

function normalizeSlideCollection(slides) {
    const cleaned = [];
    for (const slide of slides || []) {
        if (!slide || typeof slide.src !== 'string') continue;
        const trimmedSrc = slide.src.trim();
        if (!trimmedSrc) continue;
        cleaned.push({
            ...slide,
            src: trimmedSrc,
            fit: sanitizeFit(slide.fit),
        });
    }
    cleaned.sort((a, b) => {
        const ao = typeof a.order === 'number' ? a.order : 0;
        const bo = typeof b.order === 'number' ? b.order : 0;
        return ao - bo;
    });
    cleaned.forEach((slide, idx) => {
        slide.order = idx + 1;
    });
    return cleaned;
}

function writeSlideshow(data) {
    ensureSlideshowFile();
    const slides = Array.isArray(data?.slides) ? data.slides : [];
    const normalized = normalizeSlideCollection(slides);
    fs.writeFileSync(slideshowPath, JSON.stringify({ slides: normalized }, null, 2), 'utf8');
}

function generateSlideId(slides) {
    const existingIds = new Set((slides || []).map(s => s.id));
    let offset = 0;
    let candidate;
    do {
        candidate = 's' + (Date.now() + offset);
        offset += 1;
    } while (existingIds.has(candidate));
    return candidate;
}

function getNextOrder(slides) {
    let maxOrder = 0;
    for (const slide of slides || []) {
        if (typeof slide.order === 'number' && Number.isFinite(slide.order) && slide.order > maxOrder) {
            maxOrder = slide.order;
        }
    }
    return maxOrder + 1;
}

function createSlide(slides, { src, attivo = true, fit }) {
    const collection = slides || [];
    const slide = {
        id: generateSlideId(collection),
        src,
        attivo,
        order: getNextOrder(collection),
        fit: sanitizeFit(fit),
    };
    collection.push(slide);
    return slide;
}

// GET /slideshow -> ritorna tutte le slide ordinate per order (default 0)
app.get('/slideshow', (req, res) => {
    const data = readSlideshow();
    const slides = (data.slides || [])
        .slice()
        .sort((a, b) => {
            const ao = typeof a.order === 'number' ? a.order : 0;
            const bo = typeof b.order === 'number' ? b.order : 0;
            return ao - bo;
        });
    res.json({ slides });
});

// POST /slideshow (JSON {src, attivo?})
app.post('/slideshow', (req, res) => {
    const { src, attivo, fit } = req.body || {};
    if (!src || typeof src !== 'string') {
        return res.status(400).json({ error: 'src is required' });
    }
    const data = readSlideshow();
    const slides = data.slides || [];
    const newSlide = createSlide(slides, {
        src,
        attivo: attivo === false ? false : true,
        fit: isValidFit(fit) ? fit : 'cover',
    });
    data.slides = slides;
    writeSlideshow(data);
    res.status(201).json(newSlide);
});

// POST /slideshow/upload (multipart image) -> salva file e crea slide con src /uploads/<filename>
app.post('/slideshow/upload', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'file mancante' });
    // Il multer configurato salva in public/images: spostiamo in public/uploads mantenendo lo stesso filename
    try {
        fs.mkdirSync(publicUploadsDir, { recursive: true });
    } catch { }
    const srcPath = path.join(publicImagesDir, req.file.filename);
    const destPath = path.join(publicUploadsDir, req.file.filename);
    try {
        fs.renameSync(srcPath, destPath);
    } catch (e) {
        // Se rename fallisce, prova a copiare come fallback
        try {
            fs.copyFileSync(srcPath, destPath);
            fs.unlinkSync(srcPath);
        } catch (e2) {
            return res.status(500).json({ error: 'salvataggio upload non riuscito' });
        }
    }

    const fitValue = isValidFit(req.body?.fit) ? req.body.fit : 'cover';
    const data = readSlideshow();
    const slides = data.slides || [];
    const newSlide = createSlide(slides, { src: `/uploads/${req.file.filename}`, attivo: true, fit: fitValue });
    data.slides = slides;
    writeSlideshow(data);
    res.status(201).json(newSlide);
});

// PATCH /slideshow/:id/attivo -> aggiorna flag attivo
app.patch('/slideshow/:id/attivo', (req, res) => {
    const { id } = req.params;
    const { attivo } = req.body || {};
    if (typeof attivo !== 'boolean') {
        return res.status(400).json({ error: "Parametro 'attivo' non valido" });
    }
    const data = readSlideshow();
    const idx = (data.slides || []).findIndex(s => s.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Slide non trovata' });
    data.slides[idx].attivo = attivo;
    writeSlideshow(data);
    res.json(data.slides[idx]);
});

// PATCH /slideshow/:id/fit -> aggiorna modalità di adattamento
app.patch('/slideshow/:id/fit', (req, res) => {
    const { id } = req.params;
    const { fit } = req.body || {};
    if (!isValidFit(fit)) {
        return res.status(400).json({ error: 'invalid fit' });
    }
    const data = readSlideshow();
    const slides = data.slides || [];
    const idx = slides.findIndex(s => s.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Slide non trovata' });
    slides[idx].fit = fit;
    data.slides = slides;
    writeSlideshow(data);
    res.json(slides[idx]);
});

// DELETE /slideshow/:id -> elimina slide
app.delete('/slideshow/:id', (req, res) => {
    const { id } = req.params;
    const data = readSlideshow();
    const slides = data.slides || [];
    const index = slides.findIndex(s => s.id === id);
    if (index === -1) return res.status(404).json({ error: 'Slide non trovata' });
    const [removed] = slides.splice(index, 1);
    data.slides = slides;
    writeSlideshow(data);

    if (removed?.src && typeof removed.src === 'string' && removed.src.startsWith('/uploads/')) {
        const relativePath = removed.src.replace(/^\//, '');
        if (relativePath.startsWith('uploads/')) {
            const absolutePath = path.join(publicDir, relativePath);
            try {
                fs.unlinkSync(absolutePath);
            } catch (err) {
                if (err.code !== 'ENOENT') {
                    console.error('Errore durante l\'eliminazione del file upload:', err);
                }
            }
        }
    }
    res.status(204).send();
});

app.listen(PORT, () => {
    console.log(`Server in esecuzione su http://localhost:${PORT}`);
});
