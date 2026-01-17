// server.ts (ou app.ts)
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import cors from 'cors';

const app = express();
const PORT = 3020;


app.use(cors());
// Créer le dossier uploads s'il n'existe pas
const uploadFolder = path.join(__dirname, 'uploads');
fs.ensureDirSync(uploadFolder);

// Rendre les fichiers accessibles via URL
app.use('/files', express.static(uploadFolder));

app.get('/api/files/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(uploadFolder, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Fichier introuvable' });
  }

  res.sendFile(filePath);
});

// Config Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadFolder);
  },
  filename: (req, file, cb) => {
    // nom de fichier unique : timestamp + nom original
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

// Filtrer les fichiers (ex: images seulement)
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Seules les images sont autorisées'));
  }
};

// Limites : 5 Mo max par fichier
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

// Routes
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Aucun fichier reçu' });
  }

  const fileUrl = `${req.protocol}://${req.get('host')}/files/${req.file.filename}`;

  res.status(201).json({
    message: 'Upload réussi',
    filename: req.file.filename,
    url: fileUrl
  });
});

// Upload simple
app.post('/upload-single', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier envoyé' });
  res.json({ message: 'Fichier uploadé avec succès', file: req.file });
});

// Upload multiple
app.post('/upload-multiple', upload.array('files', 5), (req, res) => {
  if (!req.files) return res.status(400).json({ error: 'Aucun fichier envoyé' });
  res.json({ message: 'Fichiers uploadés avec succès', files: req.files });
});

// Gestion des erreurs Multer
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    // Erreurs liées à Multer (ex: taille max)
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
