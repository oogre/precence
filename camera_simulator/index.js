var http = require('http');


const randRange = (min, max, len) => Math.round(lerp(min, max, Math.random())).toString(16).nf(len).toUpperCase();
const lerp = (a,b,alpha) => a + alpha * ( b - a );
String.prototype.nf = function(len){
  let tmp = this;
  while(tmp.length < len){
    tmp = "0"+tmp;
  }
  return tmp;
}
//create a server object:
http.createServer(function (req, res) {
  const {searchParams} = new URL(`http://127.0.0.1:80/${req.url}`)
  const cmd = searchParams.get("cmd");
  const reply = cmd[1].toLowerCase()+cmd.substring(2);
  res.setHeader("Content-Type", "text/plain");
  res.writeHead(200);
    

  if(reply.substring(0, 3) == "pTD"){
    const value = `pTD${randRange(0, 0XFFFF, 4)}${randRange(0, 0XFFFF, 4)}${randRange(0, 0X3E7, 3)}${randRange(0, 0X63, 2)}${randRange(0, 0XFF, 2)}`;
    console.log(value);
    res.end(value); //end the response
  }else{
    console.log(reply);
    res.end(reply); //end the response
  }

  

  
}).listen(8080); //the server object listens on port 8080 

