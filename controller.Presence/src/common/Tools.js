import { prcTimeout } from 'precision-timeout-interval';

export const wait = (time) => new Promise(r => setTimeout(()=>r(), time));
export const pWait = (time) => new Promise(r => prcTimeout(time, ()=>r()));

