import fetch from 'node-fetch';
import fs from 'fs/promises';
import { JSDOM } from 'jsdom';
const numTxt = '../data/num.txt';
const url = page => `https://bbs.ruliweb.com/game/search?platform=&genre=&service=&ordering=ranking_a&search_key=&page=${page}`;
const setTimepro = (fun, delay) => new Promise((res, rej) => {
    const setT = setTimeout(() => {
        fun();
        res(setT);
    }, delay);
    return setT;
});
const getNum = num => `${parseInt(num) + 10000}`.slice(1);

const gameParse = async game => {
    try{
        const response = await fetch(game.link);
        const data = await response.text();
        const window = new JSDOM(data).window;
        const document = window.document;
        try{
        
            if(document.querySelector('#error')) {
                const txt = document.querySelector('#error').textContent.trim();
                if(txt.indexOf('게시판이 없습니다.') !== -1){
                    return {name:game.name, link:game.link, error: '게시판이 없음'};
                } else {
                    return {name:game.name, link:game.link, error: '알 수 없는 오류'};
                }
            } 
            const infoTable = document.querySelector('.game_info_table tbody');
            const labels = [...infoTable.querySelectorAll('.item_label')].map(v => v.textContent.trim());
            const values = [...infoTable.querySelectorAll('.item_value')].map(v => v.textContent.trim());
            const obj = { '게임명': game.name };
            for(let i = 0; i < labels.length; i++){
                obj[labels[i]] = values[i];
            }
            return obj;
        } catch(err){
            console.error(err);
            if(document.querySelector('.ruliweb_icon')){
                return {name:game.name, link:game.link, error: '게시판 잘못됨.'};
            } else {
                return {name:game.name, link:game.link, error: '알 수 없는 오류'};
            }
        }
    } catch(err){
        console.error(err);
        await setTimepro(() => console.log(`${game.name}에서 오류. 10초 기다림...`), 10000);
        return await gameParse(game);
    }
};
const pageParse = async num => {
    try{
        const response = await fetch(url(num));
        const data = await response.text();
        const window = new JSDOM(data).window;
        const document = window.document;
        const lists = document.querySelectorAll('.game_info_list');
        if(lists.length === 0){
            console.log('dataparse 완료');
            return false;
        }
        const games = [];
        const result = [];
        for(let v of lists){
            games.push({
                name:v.querySelector('.name').textContent.trim(),
                link:v.querySelector('.community').href
            });
        }
        for(let v of games){
            const data = await gameParse(v);
            if(data.게임명){
                result.push(data);
            } else {
                if(data?.error){
                    if(data.error === '알 수 없는 오류'){
                        return false;
                    }
                    console.log(data);
                    continue;
                }
                throw `${v.name}에서 오류남.`;
            }
        }
        await fs.writeFile(`../data/page${getNum(num)}.json`, JSON.stringify(result), {encoding:'utf-8'});
        await fs.writeFile(numTxt, `${parseInt(num) + 1}`, {encoding:'utf-8'});
    } catch(err){
        console.error(err);
        await setTimepro(() => console.log(`${num}에서 오류. 10초 기다림...`), 10000);
        const check = await pageParse(num);
        if(!check) return false;
    }
    return true;
};
(async()=>{
    let num = parseInt(await fs.readFile(numTxt, {encoding:'utf-8'}));
    while(true){
        const check = await pageParse(num);
        if(!check) return false;
        console.log(`page${getNum(num)}`);
        num++;
    }
})();
