import got from 'got';

export const call = async(address, request, flag=1) => {
	// prepare the waiter for the response
	let waitForDataSuccess;
	let waitForDataReject;

	const waitForData = new Promise((resolve, reject)=>{
		waitForDataSuccess = resolve;
		waitForDataReject = reject;
	});
	
	// send and wait for the response
	httpCall(address, request, flag)
		.then( ({body}) => {
			waitForDataSuccess(body);	
		})
		.catch(error=>{
			waitForDataReject(error);
		});

	return await waitForData;
}


export const httpCall = (address, request, flag) => {
	return got(`http://${address}/cgi-bin/${flag?`aw_ptz`:`aw_cam`}`,{
		method: 'GET',
		searchParams : {
			cmd : request,
			res : 1
		},
		timeout: {
			lookup: 100,
			connect: 1000,
			socket: 1000,
			send: 1000,
			response: 1000
		}
	});
}