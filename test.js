import express from 'express';
import main from './router/main/index.js';
import DB from './router/DB/index.js';
const app = express();
app.use(express.json());
app.use('/', main);
app.use('/DB', DB);

app.listen(3000);