import dotenv from 'dotenv';

const {
    CTRL_NAME,
    CTRL_LOG,
    DMX_HOST,
    DMX_LOG,
    ROBT_X_LOG,
    ROBT_X_HOST,
    ROBT_X_TIMEOUT,
    ROBT_X_MAX_SPEED,
    ROBT_X_REVERSE_CTRL,
    ROBT_X_AUTOCONNECT,
    ROBT_Y_LOG,
    ROBT_Y_HOST,
    ROBT_Y_TIMEOUT,
    ROBT_Y_MAX_SPEED,
    ROBT_Y_REVERSE_CTRL,
    ROBT_Y_AUTOCONNECT,
    TITLE,
    TIMELINE_DURATION,
    TIMELINE_REC_FILE,
    UI_WIDTH,
    UI_HEIGHT,
    CAME_HOST,
    CAME_LOG,
    CAME_PAN_MAX_SPEED,
    CAME_TILT_MAX_SPEED,
    CAME_PAN_REVERSE_CTRL,
    CAME_TILT_REVERSE_CTRL,
    CAME_AUTOCONNECT,
    OBS_HOST,
    OBS_LOG,
    TIMELINE_LOG,
    PLAYER_HOST,
    PLAYER_LOG
} = dotenv.config().parsed;

export default {
  window : {
    title: TITLE,
    width: parseInt(UI_WIDTH),
    height: parseInt(UI_HEIGHT) 
  },
  CONTROLLER : {
    name : CTRL_NAME,
    log : parseInt(CTRL_LOG)
  },
  ROBOTS : [{
    name : "Horizontal",
    host : ROBT_X_HOST.split(":")[0],
    port : parseInt(ROBT_X_HOST.split(":")[1]),
    maxPos : 2775,
    maxSpeed : Math.floor(0x64 * parseFloat(ROBT_X_MAX_SPEED)),
    reverseCtrl : 1 == parseInt(ROBT_X_REVERSE_CTRL)? -1 : 1,
    log : parseInt(ROBT_X_LOG),
    timeout : parseInt(ROBT_X_TIMEOUT),
    autoConnect : ROBT_X_AUTOCONNECT
  },{
    name : "Vertical",
    host : ROBT_Y_HOST.split(":")[0],
    port : parseInt(ROBT_Y_HOST.split(":")[1]),
    maxPos : 980,
    maxSpeed : Math.floor(0x64 * parseFloat(ROBT_Y_MAX_SPEED)),
    reverseCtrl : 1 == parseInt(ROBT_Y_REVERSE_CTRL)? -1 : 1,
    log : parseInt(ROBT_Y_LOG),
    timeout : parseInt(ROBT_Y_TIMEOUT),
    autoConnect : ROBT_Y_AUTOCONNECT
  }],
  CAMERA : {
    name : "AW-UE100",
    host : CAME_HOST.split(":")[0],
    port : parseInt(CAME_HOST.split(":")[1]),
    panMaxSpeed : parseFloat(CAME_PAN_MAX_SPEED),
    panReverseCtrl : 1 == parseInt(CAME_PAN_REVERSE_CTRL),
    tiltMaxSpeed : parseFloat(CAME_TILT_MAX_SPEED),
    tiltReverseCtrl : 1 == parseInt(CAME_TILT_REVERSE_CTRL),
    log : parseInt(CAME_LOG),
    autoConnect : CAME_AUTOCONNECT
  },
  DMX : {
    name : "LanBox LCE",
    host : DMX_HOST.split(":")[0],
    port : parseInt(DMX_HOST.split(":")[1]),
    log : parseInt(DMX_LOG)
  },
  OBS : {
    name : "OBS",
    host : OBS_HOST.split(":")[0],
    port : parseInt(OBS_HOST.split(":")[1]),
    log : parseInt(OBS_LOG)
  },
  TIMELINE : {
    name : "REC",
    log : parseInt(TIMELINE_LOG),
    duration : parseInt(TIMELINE_DURATION),
    recFile : TIMELINE_REC_FILE
  },
  PLAYER : {
    log : parseInt(PLAYER_LOG),
    host : PLAYER_HOST.split(":")[0],
    port : parseInt(PLAYER_HOST.split(":")[1])
  }
};
