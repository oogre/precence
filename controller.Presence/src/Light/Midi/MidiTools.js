/*----------------------------------------*\
  cyclone - MidiTools.js
  @author Evrard Vincent (vincent@ogre.be)
  @Date:   2024-03-20 22:46:37
  @Last Modified time: 2024-03-24 18:12:35
\*----------------------------------------*/

import midi from 'midi';

const midiDevices = {};


export const getID = (midiName) => {
  const findIdFor = (devices, name)=>{
  	return new Array(devices.getPortCount()).fill(0)
  			.map((_, id)=>devices.getPortName(id))
  			.findIndex(value => name == value);
  }
  return [
  	findIdFor(new midi.Input(), midiName),
  	findIdFor(new midi.Output(), midiName)
  ];
}

export const connectOutput = (midiName)=>{
  if(midiDevices[midiName])
    return midiDevices[midiName];

  const device = new midi.Output();
  const [_, outID] = getID(midiName);

  if(outID < 0){
    //device.openVirtualPort(midiName);
    throw new Error(`MIDI_DEVICE_OUT (${midiName}) not found => go virtual`) ;
  }else{
    device.openPort(outID);  
  }
  midiDevices[midiName] = device;
  return midiDevices[midiName];
}
export const connectInput = (midiName)=>{
  let onCCHandler = ()=>{}
  let _debug = false;
  const device = new midi.Input();
  const [inID, _] = getID(midiName);
  
  if(inID < 0){
    // device.openVirtualPort(midiName);
    throw new Error(`MIDI_DEVICE_IN (${midiName}) not found => go virtual`) ;
  }else{
    device.openPort(inID);  
  }

  const _onKnob = 
  device.on('message', (deltaTime, [status, number, value]) => {
    const [type, channel] = [status & 0xF0 , status & 0x0F];
    _debug && console.log(`c: ${channel} n: ${number} v: ${value} d: ${deltaTime}`);
    switch(type){
      case MIDI_MESSAGE.CONTROL_CHANGE : return onCCHandler(channel, number, value, deltaTime)
    }
  });
  return {
    verbose : (flag = true) => {
      _debug = !!flag;
    },
    quiet : (flag = false) => {
      _debug = !!flag;
    },
    onCC : (_onCCHandler)=>{
      onCCHandler = _onCCHandler;
    }
  };
}

export const sendCC = (device, channel, id, value)=>{
  return send(device, MIDI_MESSAGE.CONTROL_CHANGE|channel, id, value)
}

export const send = (device, channel, id, value)=>{
  return device.sendMessage([channel, id, value]); 
}

export const MIDI_MESSAGE = {
  NOTE_OFF : 0x80,
  NOTE_ON : 0x90,
  KEY_PRESSURE : 0xA0,
  CONTROL_CHANGE : 0xB0,
  PROGRAM_CHANGE : 0xC0,
  CHANNEL_PRESSURE : 0xD0,
  PITCH_BEND : 0xE0
};

