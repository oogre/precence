import dotenv from 'dotenv';

const {
    CTRL_NAME,
    CTRL_LOG,
    DMX_HOST,
    DMX_LOG,
    ROBT_X_HOST,
    ROBT_X_MAX_SPEED,
    ROBT_X_REVERSE_CTRL,
    ROBT_X_LOG,
    ROBT_Y_HOST,
    ROBT_Y_MAX_SPEED,
    ROBT_Y_REVERSE_CTRL,
    ROBT_Y_LOG,
    TITLE,
    RECORDER_DURATION,
    RECORDER_REC_FILE,
    UI_WIDTH,
    UI_HEIGHT,
    CAME_HOST,
    CAME_LOG,
    CAME_PAN_MAX_SPEED,
    CAME_TILT_MAX_SPEED,
    CAME_PAN_REVERSE_CTRL,
    CAME_TILT_REVERSE_CTRL,
    OBS_HOST,
    OBS_LOG,
    REC_LOG
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
    maxSpeed : parseInt(ROBT_X_MAX_SPEED),
    reverseCtrl : 1 == parseInt(ROBT_X_REVERSE_CTRL)? -1 : 1,
    log : parseInt(ROBT_X_LOG)
  },{
    name : "Vertical",
    host : ROBT_Y_HOST.split(":")[0],
    port : parseInt(ROBT_Y_HOST.split(":")[1]),
    maxPos : 980,
    maxSpeed : parseInt(ROBT_Y_MAX_SPEED),
    reverseCtrl : 1 == parseInt(ROBT_Y_REVERSE_CTRL)? -1 : 1,
    log : parseInt(ROBT_Y_LOG)
  }],
  CAMERA : {
    name : "AW-UE100",
    host : CAME_HOST.split(":")[0],
    port : parseInt(CAME_HOST.split(":")[1]),
    panMaxSpeed : parseFloat(CAME_PAN_MAX_SPEED),
    panReverseCtrl : 1 == parseInt(CAME_PAN_REVERSE_CTRL),
    tiltMaxSpeed : parseFloat(CAME_TILT_MAX_SPEED),
    tiltReverseCtrl : 1 == parseInt(CAME_TILT_REVERSE_CTRL),
    log : parseInt(CAME_LOG)
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
  RECORDER : {
    name : "REC",
    log : parseInt(REC_LOG),
    duration : parseInt(RECORDER_DURATION),
    recFile : RECORDER_REC_FILE
  }
};
