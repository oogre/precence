import dotenv from 'dotenv';

const {
    ROBT_HOST,
    ROBT_LOG,
    OSC_HOST_OUT,
    OSC_HOST_IN,
    TITLE
} = dotenv.config().parsed;

export default {
  window : {
    title: TITLE,
  },
  osc : {
    in : {
      host : OSC_HOST_IN.split(":")[0],
      port : parseInt(OSC_HOST_IN.split(":")[1]),
    },
    out : {
      host : OSC_HOST_OUT.split(":")[0],
      port : parseInt(OSC_HOST_OUT.split(":")[1]),
    }
  },
  robot : {
    name : "Vertical",
    host : ROBT_HOST.split(":")[0],
    port : parseInt(ROBT_HOST.split(":")[1]),
    maxPos : 980,
    maxSpeed : 0x64,
    log : parseInt(ROBT_LOG)
  }
};
