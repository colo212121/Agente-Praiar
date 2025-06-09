import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { elAgente } from './agent.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'No message provided' });
  }

  try {
    const respuesta = await elAgente.run(message);
    res.json({ response: respuesta });
  } catch (error) {
    console.error('Error en el agente:', error);
    res.status(500).json({ error: 'Error procesando la respuesta del agente' });
  }
});

app.listen(PORT, () => {
  console.log(`🧠 Backend escuchando en http://localhost:${PORT}`);
});