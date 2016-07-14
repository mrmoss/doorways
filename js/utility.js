//utility.js
//Holds commonly used functions in a "class".
//Mike Moss
//07/12/2016

function utility_t()
{
}

//To get things like style.width and .offsetHeight.
//  (Aka things which are sometimes null and have "px" at the end).
utility_t.prototype.get_num=function(value)
{
	var num=parseFloat(value);
	if(!num)
		num=0;
	return num;
}

//Returns the global offset for an element via iterative looping of parents...
//  http://stackoverflow.com/questions/442404/retrieve-the-position-x-y-of-an-html-element
utility_t.prototype.get_offset=function(el)
{
	var offset=
	{
		x:0,
		y:0
	};
	while(el)
	{
		offset.x+=this.get_num(el.offsetLeft)-this.get_num(el.scrollLeft);
		offset.y+=this.get_num(el.offsetTop)-this.get_num(el.scrollTop);
		el=el.offsetParent;
	}
	return offset;
};

//Pass in an object containing css, apply said css to el.
utility_t.prototype.set_style=function(el,style)
{
	if(style)
		for(var key in style)
			el.style[key]=style[key];
}

//Make a div function...
utility_t.prototype.make_div=function(div,style,className)
{
	var el=document.createElement("div");
	el.style.width=el.style.height="100%";
	this.set_style(el,style);
	if(className)
		el.className=className;
	if(div)
		div.appendChild(el);
	return el;
}

//Make an image function...
utility_t.prototype.make_img=function(div,src,style,className)
{
	var el=document.createElement("img");
	if(src)
		el.src=src;
	if(className)
		el.className=className;
	this.set_style(el,style);
	if(div)
		div.appendChild(el);
	return el;
}


//Set an event listener for an object.
//  Note, if el is not a DOM object, you need to make a map of arrays called event_listeners:
//    Example: this.event_listeners={click:[]};
//  Note, throws error on invalid listener.
//  Note, listeners will only be added ONCE.
utility_t.prototype.setEventListener=function(el,listener,callback)
{
	//Check listener...
	var found=false;
	for(var key in el.event_listeners)
		if(key==listener)
		{
			found=true;
			break;
		}
	if(!found)
		throw "Invalid event listener \""+listener+"\".";

	//Check and add callback...
	var index=el.event_listeners[listener].indexOf(callback);
	if(index<0)
		el.event_listeners[listener].push(callback);
}

//Remove an event listener from an object.
//  Note, throws error on invalid listener.
//  Note, throws error on invalid callback for listener.
utility_t.prototype.unsetEventListener=function(el,listener,callback)
{
	//Check listener...
	var found=false;
	for(var key in el.event_listeners)
		if(key==listener)
		{
			found=true;
			break;
		}
	if(!found)
		throw "Invalid event listener \""+listener+"\".";

	//Check and remove callback...
	var index=el.event_listeners[listener].indexOf(callback);
	if(index<0)
		throw "Invalid callback for \""+listener+"\".";
	el.event_listeners[listener].splice(index,1);
}

var utility=new utility_t();