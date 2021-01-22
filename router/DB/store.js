import MDB from 'mongodb';
import zlib from 'zlib';
import fs from 'fs';
import fsPro from 'fs/promises';
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import CIR from './DB.config.js';
const { dbName, baseUrl } = CIR;
const { MongoClient, GridFSBucket, ObjectID } = MDB;
const toGzip = (url, db, name) => new Promise(async (res, rej) => {
    const bucket = new GridFSBucket(db, {
        chunkSizeBytes: 1024,
        bucketName: 'songs'
    });
    const up = bucket.openUploadStream(name);
    const inp = fs.createReadStream(url);
    const gzip = zlib.createGzip({
        level:9
    });
    const stream = inp.pipe(gzip).pipe(up);
    stream.on('error', rej);
    stream.on('finish', () => {
        console.log(up.id);
        res({fileId:up.id, fileName: name})
    });
});
MongoClient.connect(url, { useUnifiedTopology: true }, async (err, client) => {
    assert.strictEqual(null, err);
    console.log('Connected successfully to server');
    const db = client.db(dbName);
    const col = db.collection('musicCollection');

    fildAdd:{
        break fildAdd;
        const filelist = JSON.parse(await fsPro.readFile('./nes/filelist.json', {encoding:'utf-8'}));
        const dir = await fsPro.opendir(`./${baseUrl}`);
        let x = await dir.read();
        first :while(x){
            if(x.isDirectory()){
                const cursor = await col.find({title:x.name}).toArray();
                const dir2 = await fsPro.readdir(`./${baseUrl}/${x.name}`);
                if(cursor.length === dir2.length) {
                    x = await dir.read();
                    continue;
                }
                const response = await fetch(filelist[x.name]);
                const txt = await response.text();
                const window = new JSDOM(txt).window;
                const document = window.document;
                const map = [...document.querySelectorAll('p[align="left"] > a')].map(v => v.innerHTML.trim());
                for(let y of dir2){
                    const cursor = await col.find({title:x.name, name: y}).toArray();
                    if(cursor.length > 1) {
                        console.log(cursor);
                        break first;
                    } else if(cursor.length === 1) continue;
                    const { fileId, fileName } = await toGzip(`./${baseUrl}/${x.name}/${y}`, db, `${x.name}/${y}`);
                    if(map.every(v => v)){
                        const obj = {
                            title: x.name,
                            name:y,
                            fileId,
                            fileName,
                            href:filelist[x.name],
                            conTags:map
                        };
                        await col.insertOne(obj);
                        console.log(`title : ${obj.title}\nname : ${obj.name}\nid : ${obj.fileId}`);
                    } else{
                        console.log(`${x.name}에서 오류 발생 ${map.join(', ')}`);
                        break first;
                    }
                }
            }
            x = await dir.read();
        }
        dir.close();
    }
    await client.close();
    console.log(`client successfully close`);
});