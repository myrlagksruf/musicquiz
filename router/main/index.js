import express from 'express';
import fs from 'fs';
import USER from '../class/USER.js';
const router = express.Router();
const userInfo = req => req.headers['x-forwarded-for'] || req.connection.remoteAddress;
router.get('/', async (req, res) => {
    let user = null;
    console.log(userInfo(req))
    if(req.cookies.id){
        user = USER.get(req.cookies.id);
        if(!user){
            user = new USER(userInfo(req));
            res.cookie('id', user.id);
            console.log(user.id);
        }
    } else {
        user = new USER(userInfo(req));
        res.cookie('id', user.id);
    }
    user.try = USER.maxTry;
    res.setHeader('Content-Type', 'text/html');
    const inp = fs.createReadStream('./view/index.html', {encoding:'utf-8'});
    inp.pipe(res);
}).get('/start', async (req, res) => {
    const user = USER.get(req.cookies.id);
    const obj = {status:'good'};
    if(!user){
        obj.status = 'fail';
    } else {
        obj.try = user.try;
        obj.score = user.score;
    }
    res.end(JSON.stringify(obj));
});

export default router;