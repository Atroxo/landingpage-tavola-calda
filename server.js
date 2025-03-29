const express = require('express');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const app = express();
const PORT = process.env.PORT || 3000;
const menuFilePath = path.join(__dirname, 'data/menu-data.json');

app.use(express.json());
app.use(express.static('public'));

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
    menuData[categoria].push({ nome, descrizione, immagine });
    fs.writeFileSync('./data/menu-data.json', JSON.stringify(menuData, null, 2));
    res.sendStatus(200);
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

app.listen(PORT, () => {
    console.log(`Server in esecuzione su http://localhost:${PORT}`);
});
