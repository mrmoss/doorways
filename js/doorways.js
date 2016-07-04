//doorways.js
//Version 2
//Mike Moss
//07/04/2016

//To get things like style.width and .offsetHeight.
//  (Aka things which are sometimes null and have "px" at the end).
function get_num(value)
{
	var num=parseFloat(value);
	if(!num)
		num=0;
	return num;
}

//Make a div function...
function make_div(div,style,className)
{
	var el=document.createElement("div");
	if(className)
		el.className=className;
	el.style.width=el.style.height="100%";
	if(style)
		for(var key in style)
			el.style[key]=style[key];
	if(div)
		div.appendChild(el);
	return el;
}

//Stores doorways and provides an interface for deleting and creating them.
function doorways_manager_t(div)
{
	if(!div)
		return null;
	this.div=div;
	this.el=make_div(div);
	this.doorways={};
}

//Creates a doorway, makes it the most active doorway, and returns a ref to it.
//  Properties are listed in doorways_t constructor.
doorways_manager_t.prototype.create_doorway=function(id,properties)
{
	if(!this.doorways[id])
		this.doorways[id]=new doorways_t(this,id,properties);
	this.update_stacking();
	return this.doorways[id];
}

//Removes a doorway and updates stacking (if it exists...).
doorways_manager_t.prototype.remove_doorway=function(id)
{
	try
	{
		if(this.doorways[id])
		{
			this.doorways[id].destroy();
			this.doorways[id]=null;
			this.update_stacking();
		}
	}
	catch(error)
	{}
}

//Destroys all doorways and self.
doorways_manager_t.prototype.destroy=function()
{
	if(this.doorways)
		for(var id in this.doorways)
			this.remove_doorway(id);
	try
	{
		if(this.div&&this.el)
			this.div.removeChild(this.el);
	}
	catch(error)
	{}
	this.div=this.el=this.doorways=null;
}

//Called when a window changes it's z ordering.
doorways_manager_t.prototype.update_stacking=function()
{
	//Get number of doorways (deleted ones are valid keys in map...).
	var length=0;
	for(var key in this.doorways)
		if(this.doorways[key])
			++length;

	//Created an ordered array based on zIndex.
	//  (Note, offset is to prevent skipped indicies).
	var ordered_array=[];
	var offset=0;
	for(var ii=0;ii<length;++ii)
	{
		var found=false;
		for(var key in this.doorways)
			if(this.doorways[key]&&this.doorways[key].window.style.zIndex!=""&&this.doorways[key].window.style.zIndex==ii)
			{
				found=true;
				ordered_array[ii-offset]=this.doorways[key];
			}
		if(!found)
			++offset;
	}

	//Add doorways with already existing zIndicies
	for(var key in this.doorways)
		if(this.doorways[key]&&this.doorways[key].window.style.zIndex=="")
			ordered_array[ordered_array.length]=this.doorways[key];

	//Add doorways with no zIndices (new ones or one that was clicked on last)
	for(var ii=0;ii<ordered_array.length;++ii)
		if(ordered_array[ii])
			ordered_array[ii].window.style.zIndex=ii;

}

//Properties include:
//  active_color   COLOR              Color of top bar when active (blue).
//  deactive_color COLOR              Color of top bar when not active (gray).
//  min_size       {w:INT,h:INT}      Minimum size the doorway can be (200,200).
//  onresize       function(pos,size) Callback called when window is resized.
//  outline        INT                Width of outline around doorway (1).
//  pos            {x:INT,y:INT}      Doorway starting position (0,0).
//  size           {w:INT,h:INT}      Doorway starting size (320,240).
//  top_bar_height INT                Height of the top bar (32).
function doorways_t(manager,id,properties)
{
	var _this=this;
	if(!manager)
		return null;
	this.manager=manager;
	this.id=id;
	if(!properties)
		properties={};

	//First created on top.
	this.active=true;
	this.active_color=properties.active_color;
	this.deactive_color=properties.deactive_color;
	this.onresize=properties.onresize;

	//Copy properties to resizer...
	var resizer_properties={};
	resizer_properties.pos=properties.pos;
	resizer_properties.size=properties.size;
	resizer_properties.min_size=properties.min_size;
	resizer_properties.outline=1;

	//Default properties...
	if(!this.active_color)
		this.active_color="blue";
	if(!this.deactive_color)
		this.deactive_color="grey";
	if(!this.top_bar_height)
		this.top_bar_height=32;

	//Our resize is a wrapper around the resizer onresize callback...
	resizer_properties.onresize=function(pos,size)
	{
		_this.content.style.width=size.w+"px";
		_this.content.style.height=size.h-_this.top_bar_height+"px";
		if(_this.onresize)
			_this.onresize(pos,size);
		_this.set_active(true);
	};

	//Make the parts of the doorway...
	this.window=make_div(this.manager.el,
	{
		position:"absolute",
		border:"black solid "+resizer_properties.outline+"px"
	});
	this.top_bar=make_div(this.window,
	{
		height:this.top_bar_height+"px",
		cursor:"move",
		borderBottom:"black solid "+resizer_properties.outline+"px"
	});
	this.content=make_div(this.window,
	{
		backgroundColor:"white",
		borderBottom:"black solid "+resizer_properties.outline+"px"
	});
	this.minimize=make_div(this.top_bar,
	{
		backgroundColor:"green",
		width:this.top_bar_height+"px",
		height:this.top_bar_height+"px",
		cursor:"pointer",
		float:"right",
		marginRight:"5px"
	});
	this.help=make_div(this.top_bar,
	{
		backgroundColor:"red",
		width:this.top_bar_height+"px",
		height:this.top_bar_height+"px",
		cursor:"pointer",
		float:"right",
		marginRight:"5px"
	});
	this.title=make_div(this.top_bar,
	{
		lineHeight:this.top_bar_height+"px",
		color:"white",
		width:this.top_bar_height+"px",
		height:this.top_bar_height+"px",
		cursor:"grab",
		marginLeft:"5px"
	});
	this.title.innerHTML=id;

	//Create resizer.
	this.resizer=new resizer_t(this.manager.el,this.window,resizer_properties);

	//Clicking the window activates it.
	this.active_func=function()
	{
		_this.resizer.update();
	};
	this.window.addEventListener("mousedown",this.active_func);
	this.window.addEventListener("touchstart",this.active_func);

	//Drag start.
	this.down_func=function(event)
	{
		event.preventDefault();
		_this.old_pos={x:event.pageX,y:event.pageY};
		_this.old_pos.x-=get_num(_this.window.offsetLeft);
		_this.old_pos.y-=get_num(_this.window.offsetTop);
		_this.dragging=true;
	};
	this.top_bar.addEventListener("mousedown",this.down_func);
	this.top_bar.addEventListener("touchstart",this.down_func);

	//Dragging.
	this.move_func=function(event)
	{
		if(_this.resizer.drag_side)
			_this.dragging=false;

		if(_this.dragging)
		{
			var new_pos=
			{
				x:event.pageX-_this.old_pos.x,
				y:event.pageY-_this.old_pos.y
			};
			if(new_pos.x<0)
				new_pos.x=0;
			if(new_pos.y<0)
				new_pos.y=0;
			_this.resizer.move(new_pos);
		}
	};
	document.addEventListener("mousemove",this.move_func);
	document.addEventListener("touchmove",this.move_func);

	//Drag end.
	this.up_func=function(event)
	{
		_this.dragging=false;
	};
	document.addEventListener("mouseup",this.up_func);
	document.addEventListener("touchend",this.up_func);
}

//Cleans up doorway and resizer.
doorways_t.prototype.destroy=function()
{
	try
	{
		if(this.move_func)
		{
			document.removeEventListener("mousemove",this.move_func);
			document.removeEventListener("touchmove",this.move_func);
		}
		if(this.up_func)
		{
			document.removeEventListener("mouseup",this.up_func);
			document.removeEventListener("touchend",this.up_func);
		}
	}
	catch(error)
	{}
	this.move_func=this.up_func=null;
	try
	{
		if(this.resizer)
			this.resize.destroy();
	}
	catch(error)
	{}
	try
	{
		if(this.manager&&this.manager.el&&this.window)
			this.div.removeChild(this.el);
	}
	catch(error)
	{}
	this.manager=this.window=this.id=null;
}

//Called after being resized or after a change in active-ness.
doorways_t.prototype.update=function()
{
	//Small chance this is called before resizer is made...
	//  Instead of trying to fix this, just keep trying until resizer is made...
	if(!this.resizer)
	{
		var _this=this;
		setTimeout(function(){_this.update();},1);
		return;
	}

	//Set colors and put on top of stack if necessary (set zIndex to "").
	if(this.active)
	{
		this.top_bar.style.backgroundColor=this.active_color;
		this.window.style.zIndex="";
	}
	else
	{
		this.top_bar.style.backgroundColor=this.deactive_color;
	}

	//Manager needs to reorder stacking
	this.manager.update_stacking();

	//Now that stacking is reordered, set resizers one index above window
	for(var key in this.resizer.resizers)
		this.resizer.resizers[key].style.zIndex=this.window.style.zIndex+1;
}

//Set the doorway on top.
//  FIXME: Move the for loop to a function in the manager?
doorways_t.prototype.set_active=function(active)
{
	for(var id in this.manager.doorways)
	{
		this.manager.doorways[id].active=false;
		if(id!=this.id)
			this.manager.doorways[id].update();
	}
	this.active=true;
	this.update();
}

//Creates resizers around the window in the div with properties:
//  min_size       {w:INT,h:INT}      Minimum size window can be (200,200).
//  onresize       function(pos,size) Callback called when resized.
//  outline        INT                Window outline width (1).
//  pos            {x:INT,y:INT}      Starting window position (0,0).
//  size           {w:INT,h:INT}      Starting window size (320,240).
function resizer_t(div,window,properties)
{
	var _this=this;
	if(!div||!window)
		return null;
	this.div=div;
	this.window=window;
	this.opacity=0;
	this.border=6;

	//Copy properties...
	if(properties)
	{
		this.outline=properties.outline;
		this.pos=properties.pos;
		this.size=properties.size;
		this.min_size=properties.min_size;
		this.onresize=properties.onresize;
	}

	//Default properties...
	if(!this.pos)
		this.pos=
		{
			x:0,
			y:0
		};
	if(!this.size)
		this.size=
		{
			w:320,
			h:240
		};
	if(!this.min_size)
		this.min_size=
		{
			w:200,
			h:200
		};
	if(!this.outline)
		this.outline=1;

	//Create resizers (n, e, s, e, ne, etc...)
	this.resizers=
	{
		n:make_div(this.div,
		{
			backgroundColor:"yellow",
			cursor:"ns-resize",
			position:"absolute",
			opacity:this.opacity
		}),
		e:make_div(this.div,
		{
			backgroundColor:"yellow",
			cursor:"ew-resize",
			position:"absolute",
			opacity:this.opacity
		}),
		s:make_div(this.div,
		{
			backgroundColor:"yellow",
			cursor:"ns-resize",
			position:"absolute",
			opacity:this.opacity
		}),
		w:make_div(this.div,
		{
			backgroundColor:"yellow",
			cursor:"ew-resize",
			position:"absolute",
			opacity:this.opacity
		}),
		ne:make_div(this.div,
		{
			backgroundColor:"purple",
			cursor:"nesw-resize",
			position:"absolute",
			opacity:this.opacity
		}),
		se:make_div(this.div,
		{
			backgroundColor:"purple",
			cursor:"nwse-resize",
			position:"absolute",
			opacity:this.opacity
		}),
		sw:make_div(this.div,
		{
			backgroundColor:"purple",
			cursor:"nesw-resize",
			position:"absolute",
			opacity:this.opacity
		}),
		nw:make_div(this.div,
		{
			backgroundColor:"purple",
			cursor:"nwse-resize",
			position:"absolute",
			opacity:this.opacity
		})
	};

	//Drag start.
	this.down_func=function(event)
	{
		event.preventDefault();
		_this.drag_side=this.direction;
	};
	for(var key in this.resizers)
	{
		this.resizers[key].direction=key;
		this.resizers[key].addEventListener("mousedown",this.down_func);
		this.resizers[key].addEventListener("touchstart",this.down_func);
	}

	//Dragging.
	this.move_func=function(event)
	{
		//If dragging a side.
		if(_this.drag_side)
		{
			//Get absolute pos of mouse.
			var abs_pos=
			{
				x:event.pageX,
				y:event.pageY
			};

			//North resizers.
			if(_this.drag_side.indexOf("n")>=0)
				_this.resizers.n.style.top=
				_this.resizers.ne.style.top=
				_this.resizers.nw.style.top=Math.min(abs_pos.y-_this.border/2,
					get_num(_this.resizers.s.offsetTop)-_this.border,
					get_num(_this.resizers.s.offsetTop)-_this.min_size.h-_this.border);

			//East resizers.
			if(_this.drag_side.indexOf("e")>=0)
			{
				_this.resizers.e.style.left=
				_this.resizers.ne.style.left=
				_this.resizers.se.style.left=Math.max(abs_pos.x-_this.border/2,
					get_num(_this.resizers.w.offsetLeft)+_this.border,
					get_num(_this.resizers.w.offsetLeft)+_this.min_size.w-_this.border-_this.outline*2);
				}

			//South resizers.
			if(_this.drag_side.indexOf("s")>=0)
				_this.resizers.s.style.top=
				_this.resizers.se.style.top=
				_this.resizers.sw.style.top=Math.max(abs_pos.y-_this.border/2,
					get_num(_this.resizers.n.offsetTop)+_this.border,
					get_num(_this.resizers.n.offsetTop)+_this.min_size.h-_this.border-_this.outline*2);

			//West resizers.
			if(_this.drag_side.indexOf("w")>=0)
				_this.resizers.w.style.left=
				_this.resizers.nw.style.left=
				_this.resizers.sw.style.left=Math.min(abs_pos.x-_this.border/2,
					get_num(_this.resizers.e.offsetLeft)-_this.border,
					get_num(_this.resizers.e.offsetLeft)-_this.min_size.w-_this.border);

			//Calculate size.
			_this.size=
			{
				w:get_num(_this.resizers.e.offsetLeft)-get_num(_this.resizers.w.offsetLeft)+_this.border,
				h:get_num(_this.resizers.s.offsetTop)-get_num(_this.resizers.n.offsetTop)+_this.border
			};

			//Calculate position.
			_this.pos=
			{
				x:get_num(_this.resizers.w.offsetLeft),
				y:get_num(_this.resizers.n.offsetTop)
			};

			//Updae window.
			_this.update();
		}
	};
	document.addEventListener("mousemove",this.move_func);
	document.addEventListener("touchmove",this.move_func);

	//Drag end.
	this.up_func=function(event)
	{
		_this.drag_side=null;
	};
	document.addEventListener("mouseup",this.up_func);
	document.addEventListener("touchend",this.up_func);

	//Initial move and resize.
	this.move(this.pos);
	this.resize(this.size);
}

//Updates position...
resizer_t.prototype.move=function(pos)
{
	this.pos=pos;
	this.update();
}

//Updates size...
resizer_t.prototype.resize=function(size)
{
	this.drag_side="se";
	this.move_func
	({
		pageX:this.pos.x+this.size.w-this.border+this.outline,
		pageY:this.pos.y+this.size.h-this.border+this.outline
	});
	this.up_func();
}

//Updates resizers not moved and the window passed.
resizer_t.prototype.update=function()
{
	//Update resizers not moved during the resize to keep ourself square.
	for(var key in this.resizers)
		if(this.resizers[key].direction)
		{
			if(this.resizers[key].direction.indexOf("n")>=0)
			{
				this.resizers[key].style.top=this.pos.y+"px";
				this.resizers[key].style.height=this.border+"px";
			}
			if(this.resizers[key].direction.indexOf("e")>=0)
			{
				this.resizers[key].style.left=this.pos.x+this.size.w-this.border+"px";
				this.resizers[key].style.width=this.border+"px";
			}
			if(this.resizers[key].direction.indexOf("s")>=0)
			{
				this.resizers[key].style.top=this.pos.y+this.size.h-this.border+"px";
				this.resizers[key].style.height=this.border+"px";
			}
			if(this.resizers[key].direction.indexOf("w")>=0)
			{
				this.resizers[key].style.left=this.pos.x+"px";
				this.resizers[key].style.width=this.border+"px";
			}
			if(this.resizers[key].direction=="n"||this.resizers[key].direction=="s")
			{
				this.resizers[key].style.width=this.size.w-this.border*2+"px";
				this.resizers[key].style.left=this.pos.x+this.border+"px";
			}
			if(this.resizers[key].direction=="e"||this.resizers[key].direction=="w")
			{
				this.resizers[key].style.height=this.size.h-this.border*2+"px";
				this.resizers[key].style.top=this.pos.y+this.border+"px";
			}
		}

	//Set window pos and size.
	this.window.style.left=this.pos.x+"px";
	this.window.style.top=this.pos.y+"px";
	this.window.style.width=this.size.w+"px";
	this.window.style.height=this.size.h+"px";

	//User callback call.
	if(this.onresize)
		this.onresize(this.pos,this.size);
}

//Cleanup resizers.
resizer_t.prototype.destroy=function()
{
	try
	{
		if(this.move_func)
		{
			document.removeEventListener("mousemove",this.move_func);
			document.removeEventListener("touchmove",this.move_func);
		}
		if(this.up_func)
		{
			document.removeEventListener("mouseup",this.up_func);
			document.removeEventListener("touchend",this.up_func);
		}
	}
	catch(error)
	{}
	this.move_func=this.up_func=null;
	try
	{
		for(var key in this.resizers)
			this.div.removeChild(this.resizers[key]);
	}
	catch(error)
	{}
	for(var key in this.resizers)
		this.resizers[key]=null;
	this.div=this.window=this.resizers=null;

}