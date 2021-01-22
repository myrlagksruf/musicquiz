import MDB from 'mongodb';
import assert, { fail } from 'assert';
import CIR from './DB.config.js';
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
    const arr = new Set();
    arr.add('title');
    arr.add('songs');
    arr.add('href');
    arr.add('conTags');
    arr.add('fileName');
    arr.add('name');
    arr.add('length');
    const db = client.db(dbName);
    const col = db.collection('musicCollection');
    const count = await col.countDocuments();
    router.get('/randomsong', async (req, res) => {
        const obj = await (await col.find().skip(Math.floor(Math.random() * count)).limit(1)).next();
        const resArr = obj.songs.filter(v => v.length > 500000);
        const audio = resArr[Math.floor(Math.random() * resArr.length)];
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Content-Type', 'audio/mpeg');
        sendSong(db, res, audio.fileId);
    }).get('/', async (req, res) => {
        try{
            const title = req.query.title;
            const name = req.query.name;
            const s = parseInt(isNaN(req.query.s) ? 0 : req.query.s);
            const l = parseInt(isNaN(req.query.l) ? 0 : req.query.l);
            const q = {};
            const view = {
                _id:0,
                title:1,
                songs: 1
            };
            if(title){
                q.title = {
                    "$regex" : title,
                    "$options": "i"
                };
            }
            if(name){
                q.songs = {
                    "$elemMatch": {
                        name: {
                            "$regex" : name,
                            "$options" : "i"
                        }
                    }
                };
                view.songs = {
                    "$elemMatch": {
                        name: {
                            "$regex" : name,
                            "$options" : "i"
                        }
                    }
                };
            }
            
            let obj = null;
            if(l === 0){
                obj = await col.find(q, {projection: view}).skip(s);
            } else {
                obj = await (await col.find(q, {projection: view})).skip(s).limit(l);
            }
            const data = { data : [], status: 'success'};
            while(true){
                const d = await obj.next();
                if(!d) break;
                data.data.push(d);
            }
            res.json(data);
            col.ag
        } catch(err){
            console.error(err);
            res.json({ status : 'failed' });
        }
    }).get('/file/:title/:name', async (req, res) => {
        const title = decodeURIComponent(req.params.title);
        const name = decodeURIComponent(req.params.name);
        if(title && name){
            const obj = await col.findOne({"songs.fileName": `${title}/${name}`}, {projection : {
                _id: 0,
                songs:{
                    "$elemMatch": {
                        fileName: `${title}/${name}`
                    }
                }
            }});
            res.setHeader('Content-Encoding', 'gzip');
            res.setHeader('Content-Type', 'audio/mpeg');
            sendSong(db, res, obj.songs[0].fileId);
        } else {
            res.end(null);
        }
    });
});
export default router;