import express from 'express';
import fs from 'fs';
const router = express.Router();
router.get('/', async (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    const inp = fs.createReadStream('./view/main.html', {encoding:'utf-8'});
    inp.pipe(res);
});

export default router;