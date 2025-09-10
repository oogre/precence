
import Enum from 'enum';


export const NANO_TO_MILLIS = 0.000001;
export const MILLIS_TO_NANO = 1000000;

export const ChannelStatus = new Enum({'NONE':0, 'PLAY':1, 'RECORD':2}) ;
export const nextChannel = (channel)=>{
	return ChannelStatus.get((channel.value+1)%ChannelStatus.enums.length);
}
