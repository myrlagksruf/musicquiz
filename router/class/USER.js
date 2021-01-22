import crypto from 'crypto';
export default class USER{
    static maxTry = 3;
    static maxNum = 20;
    static users = new Map();
    static banList = new Map();
    static time = 1000 * 60 * 30;
    static banTime = 1000 * 60 * 1;
    constructor(name){
        if(USER.banList.get(name)) return false;
        const id = crypto.createHash('sha256').update(`Han${name}${Date.now()}`).digest('base64');
        const obj = {
            id,
            name,
            num:0,
            try:USER.maxTry,
            ans:'',
            score:0,
            set:setInterval(() => {
                if(obj.num > USER.maxNum){
                    console.log(obj);
                    USER.delete(obj.id);
                    USER.ban(obj.name);
                    return false;
                }
                obj.num = 0;
            }, 1000),
            setT:setTimeout(() => {
                USER.delete(obj.id);
            }, USER.time),
        };
        Object.assign(this, obj)
        USER.users.set(name, obj);
        USER.users.set(id, obj);
    }
    static ban(name){
        if(this.banList.get(name)) return false;
        const obj = {
            name,
            setT:setTimeout(() => {
                this.banList.delete(name);
            }, this.banTime)
        };
        this.banList.set(name, obj);
        return true;
    }
    static set(id, ans){
        const obj = this.get(id);
        if(!obj) return false;
        obj.ans = ans;
        console.log(ans);
        return true;
    }
    static get(id){
        const obj = this.users.get(id);
        if(!obj) return null;
        clearTimeout(obj.setT);
        obj.setT = setTimeout(() => {
            this.delete(id);
        }, this.time);
        obj.num++;
        return obj;
    }
    static delete(id){
        const obj = this.get(id);
        if(!obj) return false;
        this.users.delete(obj.id);
        this.users.delete(obj.name);
        clearInterval(obj.set);
        clearTimeout(obj.setT);
        return true;
    }
}