import express from 'express';
import app from './router/socket/index.js';
import main from './router/main/index.js';
import DB from './router/DB/index.js';
import cookieParser from 'cookie-parser';
app.use(cookieParser());
app.use(express.json());
app.use('/', main);
app.use('/DB', DB);

app.listen(3000);