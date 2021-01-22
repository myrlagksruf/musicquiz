import fetch from 'node-fetch';
import fs from 'fs';
import fsPro from 'fs/promises';
import { JSDOM } from 'jsdom';
const testUrl = "https://vgmsite.com/soundtracks/fire-emblem-the-best-vol.-1/nbknsjly/101-Opening%20Title%20~%20Demo.mp3";
const baseUrl = 'https://downloads.khinsider.com/game-soundtracks/nintendo-nes';
const setTimePro = async (time, fun = () => {}) => {
    return new Promise((res, rej) => {
        setTimeout(res, time);
    }).then(fun);
};
const textObj = {
    qAElig: "Æ",
    Aacute: "A",
    Acirc: "A",
    Agrave: "A",
    Aring: "A",
    Atilde: "A",
    Auml: "A",
    Ccedil: "C" ,
    ETH: "Ð",
    Eacute: "E",
    Ecirc: "E",
    Egrave: "E",
    Euml: "E",
    Iacute: "I",
    Icirc: "I",
    Igrave: "I",
    Iuml: "I",
    Ntilde: "N",
    Oacute: "O",
    Ocirc: "O",
    Ograve: "O",
    Oslash: "Ø",
    Otilde: "O",
    Ouml: "O",
    THORN: "Þ",
    Uacute: "U",
    Ucirc: "U",
    Ugrave: "U",
    Uuml: "U",
    Yacute: "Y",
    aacute: "a",
    acirc: "a",
    acute: "´",
    aelig: "æ",
    agrave: "a",
    amp: "&",
    aring: "a",
    atilde: "a",
    auml: "a",
    brvbar: "|",
    ccedil: "c",
    cedil: "¸",
    cent: "￠",
    copy: "ⓒ",
    curren: "¤",
    deg: "°",
    divide: "÷",
    eacute: "e",
    ecirc: "e",
    egrave: "e",
    eth: "ð",
    euml: "e",
    frac12: "½",
    frac14: "¼",
    frac34: "¾",
    gt: ">",
    iacute: "i",
    icirc: "i",
    iexcl: "¡",
    igrave: "i",
    iquest: "¿",
    iuml: "i",
    laquo: "≪",
    lt: "<",
    micro: "μ",
    middot: "·",
    nbsp: "",
    not: "￢",
    ntilde: "n",
    oacute: "o",
    ocirc: "o",
    ograve: "o",
    ordf: "ª",
    ordm: "º",
    oslash: "ø",
    otilde: "o",
    ouml: "o",
    para: "¶",
    plusmn: "±",
    pound: "￡",
    quot: '"',
    raquo: "≫",
    reg: "?",
    sect: "§",
    shy: "­",
    sup1: "¹",
    sup2: "²",
    sup3: "³",
    szlig: "ß",
    thorn: "þ",
    times: "×",
    uacute: "u",
    ucirc: "u",
    ugrave: "u",
    uml: "¨",
    uuml: "u",
    yacute: "y",
    yen: "￥",
    yuml: "y",
};


const download = async (url, des) => {
    try{
        const response = await fetch(url, {
            method:'GET',
            headers:{
                Connection:'keep-alive',
                Referer:url
            }
        });
        const pro = new Promise((res, rej) => {
            const dest = fs.createWriteStream(des);
            response.body.pipe(dest);
            response.body.on('end', res);
            dest.on('error', rej);
        });
        await pro;
    }catch(err){
        console.error(err);
    }
}

const downloadSite = async (title, url) => {
    try{
        const response = await fetch(url);
        const data = await response.text();
        const window = new JSDOM(data).window;
        const document = window.document;
        const dir = await fsPro.readdir(`./nes/${title}`);
        const list = [...document.querySelectorAll('.playlistDownloadSong > a')].map(v => `https://downloads.khinsider.com${v.href}`).slice(dir.length);
        for(const link of list){
            const response = await fetch(link);
            const data = await response.text();
            const window = new JSDOM(data).window;
            const document = window.document;
            const mp3 = document.querySelector('.songDownloadLink').parentElement.href;
            const mp3Arr = mp3.split('/');
            const mp3Title = makeTitle(decodeURIComponent(decodeURIComponent(mp3Arr[mp3Arr.length - 1])));
            await download(mp3, `./nes/${title}/${mp3Title}`);
            console.log(`title : ${title}, number : ${mp3Title}`);
        }
    }catch(err){
        console.error(err);
    }
}
const makeTitle = title => {
    let data = title.replace(/\&[a-zA-Z]*?\;/g, a => textObj[a.slice(1, a.length - 1)]);
    data = data.replace(/\:/g, '∶');
    data = data.replace(/\*/g, '＊');
    return data;
}
const main = async () => {
    try{
        let workArr = [fsPro.readFile('./nes/filelist.json', {encoding:'utf-8'}), fsPro.readFile('./nes/start.txt', {encoding:'utf-8'})];
        workArr = await Promise.all(workArr);
        const filelist = JSON.parse(workArr[0]);
        const start = workArr[1].trim();
        let arr = Object.keys(filelist);
        arr = arr.slice(arr.indexOf(start));
        for(let data of arr){
            await downloadSite(data, filelist[data]);
            await fsPro.writeFile('./nes/start.txt', data, {encoding:'utf-8'});
        }
    } catch(err){
        console.error(err);
    }
};
main()

// const mekeFoder = async () => {
//     const res = await fetch(baseUrl);
//     const data = await res.text();
//     const window = new JSDOM(data).window;
//     const document = window.document;
//     const all = document.querySelectorAll('p > a');
//     all.forEach(v => {
//         const title =  makeTitle(v.innerHTML.trim());
//         if(!fs.existsSync(`./nes/${title}`)){
//             fs.mkdirSync(`./nes/${title}`);
//         }
//     });
// }

// const makeJSON = async () => {
//     const res = await fetch(baseUrl);
//     const data = await res.text();
//     const window = new JSDOM(data).window;
//     const document = window.document;
//     const all = document.querySelectorAll('p > a');
//     const result = {};
//     all.forEach(v => {
//         const title =  makeTitle(v.innerHTML.trim());
//         result[title] = v.href;
//     });
//     const dest = fs.createWriteStream('./nes/filelist.json');
//     dest.write(JSON.stringify(result), 'utf-8');
//     dest.on('error', err => console.error(err));
//     console.log(39);
// }