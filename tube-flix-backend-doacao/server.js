require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB conectado"))
  .catch(err => console.error("Erro ao conectar:", err.message));

const User = mongoose.model('User', new mongoose.Schema({
  email: String,
  password: String
}));

const Filme = mongoose.model('Filme', new mongoose.Schema({
  title: String,
  genre: String,
  rating: Number,
  type: String
}));

const Comentario = mongoose.model('Comentario', new mongoose.Schema({
  filmeId: String,
  texto: String,
  data: { type: Date, default: Date.now }
}));

const Doacao = mongoose.model('Doacao', new mongoose.Schema({
  nome: String,
  email: String,
  valor: Number,
  data: { type: Date, default: Date.now }
}));

const JWT_SECRET = process.env.JWT_SECRET || 'segredo';

function auth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).send("Token não enviado");
  try {
    const data = jwt.verify(token, JWT_SECRET);
    req.user = data;
    next();
  } catch {
    res.status(403).send("Token inválido");
  }
}

// Rotas principais
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).send("Usuário já existe");
  await User.create({ email, password });
  res.send("Usuário registrado");
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, password });
  if (!user) return res.status(400).send("Credenciais inválidas");
  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

app.get('/api/filmes', async (req, res) => {
  const filmes = await Filme.find();
  res.json(filmes);
});

app.post('/api/filmes', auth, async (req, res) => {
  const { title, genre, rating, type } = req.body;
  await Filme.create({ title, genre, rating, type });
  res.send("Filme adicionado");
});

app.get('/api/comentarios/:filmeId', async (req, res) => {
  const comentarios = await Comentario.find({ filmeId: req.params.filmeId });
  res.json(comentarios);
});

app.post('/api/comentarios', async (req, res) => {
  const { filmeId, texto } = req.body;
  await Comentario.create({ filmeId, texto });
  res.send("Comentário salvo");
});

// Rota para registrar doações
app.post('/api/doacao', async (req, res) => {
  const { nome, email, valor } = req.body;
  if (!nome || !email || !valor) return res.status(400).send("Dados incompletos");
  await Doacao.create({ nome, email, valor });
  res.send("Doação registrada com sucesso");
});

app.get("/", (req, res) => res.send("API TUBE-FLIX online"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor rodando na porta", PORT));