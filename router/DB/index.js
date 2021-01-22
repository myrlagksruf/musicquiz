import MDB from 'mongodb';
import assert from 'assert';
import CIR from './DB.config.js';
import USER from '../class/USER.js';
import express from 'express';
const router = express.Router();
const { MongoClient, GridFSBucket } = MDB;
const { dbName, url } = CIR;
const sendSong = (db, res, id) => {
    const bucket = new GridFSBucket(db, {
        chunkSizeBytes: 1024,
        bucketName: 'songs'
    });
    const stream = bucket.openDownloadStream(id).pipe(res);
    stream.on('finish', () => {
        console.log(`${id} completely sended!!!`);
    });
};
MongoClient.connect(url, { useUnifiedTopology: true }, async (err, client) => {
    assert.strictEqual(null, err);
    const db = client.db(dbName);
    const col = db.collection('musicCollection');
    const count = await col.countDocuments({"songs.length":{$gt:500000}});
    router.get('/randomsong', async (req, res) => {
        const obj = await (await col.find({"songs.length":{$gt:500000}}).skip(Math.floor(Math.random() * count)).limit(1)).next();
        if(!USER.set(req.cookies.id, obj.title)){
            res.end('x');
            return false;
        }
        const resArr = obj.songs.filter(v => v.length > 500000);
        const audio = resArr[Math.floor(Math.random() * resArr.length)];
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Content-Type', 'audio/mpeg');
        sendSong(db, res, audio.fileId);
    });

    router.post('/search', async (req, res) => {
        const user = USER.get(req.cookies.id);
        const obj = {status:'good'};
        if(!user){
            obj.status = 'fail';
        } else {
            const data = await col.find({title:{$regex:req.body.query, $options:'i'}}).project({title:1}).toArray();
            obj.data = data.map(v => v.title);
        }
        res.end(JSON.stringify(obj))
    }).post('/answer', async (req, res) => {
        const user = USER.get(req.cookies.id);
        const obj = { status:'good', correct:false };
        if(!user){
            obj.status = 'fail';
        } else {
            user.try--;
            obj.try = user.try;
            console.log(req.body.query, user.ans);
            if(req.body.query === user.ans){
                obj.data = user.ans;
                user.ans = '';
                user.score++;
                obj.score = user.score;
                obj.correct = true;
            } else if(user.try === 0){
                obj.data = user.ans;
                user.ans = '';
            } 
        }
        res.end(JSON.stringify(obj));
    });
});

export default router;