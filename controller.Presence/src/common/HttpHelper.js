import http from 'http';

const DEBUG = false;

export const EASYRequest = (options) => {
	if(DEBUG)
		return console.log(options);

	return new Promise((success, fail)=>{
		let output = '';
		const req = http.request(options, (res) => {
			res.setEncoding('utf8');
			res.on('data', (chunk) => {
				output += chunk;
			});
			res.on('end', () => {
				success(output, res.statusCode, res);
			});
		});
		req.on('error', (error) => {
			fail(error.statusCode, error);
		});
		req.end();
	});
};