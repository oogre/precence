


const outHeader = Buffer.from([0x00, 0X00, 0X00, 0X00, 0X00, 0X13, 0X00, 0X17, 0X00, 0X00, 0X00, 0X04, 0X00, 0X00, 0X00, 0X04, 0X08]);

export const call = async(client, request)=>{
	let waitForDataSuccess;
	let waitForDataReject;
	const waitForData = new Promise((resolve, reject)=>{
		waitForDataSuccess = resolve;
		waitForDataReject = reject;
	});
	const onData = (data)=>{
		client.off("data", onData);
		const d = Buffer.copyBytesFrom(data, 9, 8);
		if(d.length != 8){
			waitForDataReject(d);	
		}else {
			waitForDataSuccess(d);	
		}
	}
	client.on("data", onData);

	//increment values of 2 firsts bytes of header
	outHeader.writeUInt16BE((outHeader.readUInt16BE(0)+1) % 0XFFFF);

	client.write(Buffer.concat([outHeader, request]));	
	return await waitForData;
}