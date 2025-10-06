var ampl = script.addFloatParameter("amplitude","Description of my float param",2,0.1,100); 		//This will add a float number parameter (slider), default value of 0.1, with a range between 0 and 1

function filter(inputs, minValues, maxValues, multiplexIndex){
	inputs[0] = getValue(inputs[0]-inputs[1], ampl.get());
	return inputs;
}

function getValue(x, amplitude){
	var f = x/amplitude;
	return Math.pow(Math.E, -1 * f * f);
}
