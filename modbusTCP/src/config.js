import dotenv from 'dotenv';

const {
    CTRL_NAME,
    ROBT_X_HOST,
    ROBT_Y_HOST,
    CAME_HOST,
    CAME_SIM_HOST,
    TITLE,
    UI_WIDTH,
    UI_HEIGHT
} = dotenv.config().parsed;

export default {
  window : {
    title: TITLE,
    width: parseInt(UI_WIDTH),
    height: parseInt(UI_HEIGHT) 
  },
  controller : {
    name : CTRL_NAME,
    axes : [{
      name : "STICK LEFT",
      values : [{
        name : "Horizontal",
        position : 0.5
      },{
        name : "Vertical",
        position : 0.5
      }]
    },
    {
      name : "STICK RIGHT",
      values : [{
        name : "Horizontal",
        position : 0.5
      },{
        name : "Vertical",
        position : 0.5
      }]
    },
    {
      name : "B TRIG",
      values : [{
        name : "LEFT",
        position : 0
      },{
        name : "RIGHT",
        position : 0
      }]
    },
    {
      name : "T TRIG",
      values : [{
        name : "LEFT",
        position : 0
      },{
        name : "RIGHT",
        position : 0
      }]
    },
    {
      name : "A",
      position : 0
    },
    {
      name : "B",
      position : 0
    },
    {
      name : "X",
      position : 0
    },
    {
      name : "Y",
      position : 0
    }]
  },
  robots : [{
    name : "Horizontal",
    host : ROBT_X_HOST.split(":")[0],
    port : parseInt(ROBT_X_HOST.split(":")[1]),
    maxPos : 196,
    position : 0,
    speed : 0
  },{
    name : "Vertical",
    host : ROBT_Y_HOST.split(":")[0],
    port : parseInt(ROBT_Y_HOST.split(":")[1]),
    maxPos : 196,
    position : 0,
    speed : 0
  }],
  camera : {
    name : "Panasonic AW-UE100",
    host : CAME_HOST.split(":")[0],
    port : parseInt(CAME_HOST.split(":")[1]),
    axes : [{
      name : "Pan",
      position : 0,
      speed : 0
    },{
      name : "Tilt",
      position : 0,
      speed : 0
    },{
      name : "Zoom",
      position : 0,
      speed : 0
    },{
      name : "Iris",
      position : 0,
      speed : 0
    },{
      name : "Focus",
      position : 0,
      speed : 0
    }]
  },
  camera_simulation : {
    name : "Panasonic AW-UE100",
    host : CAME_SIM_HOST.split(":")[0],
    port : parseInt(CAME_SIM_HOST.split(":")[1]),
    axes : [{
      name : "Pan",
      position : 0,
      speed : 0
    },{
      name : "Tilt",
      position : 0,
      speed : 0
    },{
      name : "Zoom",
      position : 0,
      speed : 0
    },{
      name : "Iris",
      position : 0,
      speed : 0
    },{
      name : "Focus",
      position : 0,
      speed : 0
    }]
  }
};
