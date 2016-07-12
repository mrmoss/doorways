//doorways.js
//Version 2
//Mike Moss
//07/12/2016

//Stores doorways and provides an interface for deleting and creating them.
function doorways_manager_t(div)
{
	if(!div)
		return null;
	this.div=div;
	this.doorways={};
	this.event_listeners=
	{
		add:[],
		remove:[],
		stackchange:[]
	};
	this.el=utility.make_div(div,
	{
		position:"absolute",
		width:"0px",
		height:"0px"
	});
	this.menu=new doorways_menu_t(this,
	{
		width:240
	});
}

//Event listeners:
//  stackchange(top_z) - Called when windows are reordered, top_z is an
//                         INT containing the zIndex of the top most window.
//  add(id)            - Called when a doorway with id is added.
//  remove(id)         - Called when a doorway with id is removed.
doorways_manager_t.prototype.addEventListener=function(listener,callback)
{
	utility.setEventListener(this,listener,callback);
}

//Event listeners:
//  See .addEventListener() for details.
doorways_manager_t.prototype.removeEventListener=function(listener,callback)
{
	utility.unsetEventListener(this,listener,callback);
}

//Creates a doorway, makes it the most active doorway, and returns a ref to it.
//  Properties are listed in doorways_t constructor.
doorways_manager_t.prototype.create_doorway=function(id,properties)
{
	if(!this.doorways[id])
	{
		this.doorways[id]=new doorways_t(this,id,properties);

		//Event listeners...
		for(var key in this.event_listeners.add)
			this.event_listeners.add[key](id);
	}

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

			//Event listeners...
			for(var key in this.event_listeners.remove)
				this.event_listeners.remove[key](id);
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
	//  Adds doorways with already existing zIndicies only.
	//  Note, offset is to prevent skipped indicies.
	//  Note, length*2 is to account for layers left for resizers.
	var ordered_array=[];
	var offset=0;
	for(var ii=0;ii<length*2;++ii)
	{
		var found=false;
		for(var key in this.doorways)
			if(this.doorways[key]&&this.doorways[key].window.style.zIndex!=""&&
				this.doorways[key].window.style.zIndex==ii)
			{
				found=true;
				ordered_array[ii-offset]=this.doorways[key];
			}
		if(!found)
			++offset;
	}

	//Add doorways with no zIndices (new ones or one that was clicked on last).
	for(var key in this.doorways)
		if(this.doorways[key]&&this.doorways[key].window.style.zIndex=="")
			ordered_array[ordered_array.length]=this.doorways[key];

	//Set the indicies (ii*2 to account for resizers).
	for(var ii=0;ii<ordered_array.length;++ii)
		if(ordered_array[ii])
			ordered_array[ii].window.style.zIndex=ii*2;

	//Event listeners...
	for(var key in this.event_listeners.stackchange)
		this.event_listeners.stackchange[key](ordered_array.length*2+1);
}

//Hide all/show all windows.
doorways_manager_t.prototype.hide_all=function(hide)
{
	if(hide)
	{
		this.hide_all_state=this.save();
		for(var key in this.doorways)
			if(this.doorways[key])
				this.doorways[key].set_minimized(true,false);
	}
	else if(this.hide_all_state)
	{
		this.load(this.hide_all_state);
		this.hide_all_state=null;
	}
}

//Saves all windows as a JSON object like so:
//{
//    doorway_id:
//    {
//        pos:{x:INT,y:INT},
//        size:{x:INT,y:INT},
//        min_size:{x:INT,y:INT},
//        active:BOOL,
//        minimized:BOOL,
//        z:INT
//    },
//    ...
//}
doorways_manager_t.prototype.save=function()
{
	var data={};
	for(var key in this.doorways)
		if(this.doorways[key])
			data[key]=
			{
				pos:this.doorways[key].resizer.pos,
				z:this.doorways[key].window.style.zIndex,
				size:this.doorways[key].resizer.size,
				min_size:this.doorways[key].resizer.min_size,
				active:this.doorways[key].active,
				minimized:this.doorways[key].minimized
			};
	return data;
}

//Loads doorways from a saved JSON object.
//  Format shown in doorways_manager_t.save().
doorways_manager_t.prototype.load=function(data)
{
	//Create doorway and set variables.
	//  Note: Setting all but active and zIndex, these need to be done after all doorways are created.
	for(var key in data)
	{
		var doorway=this.create_doorway(key);
		doorway.resizer.set_min_size(data[key].min_size);
		doorway.resizer.move(data[key].pos);
		doorway.resizer.resize(data[key].size);
		doorway.set_minimized(data[key].minimized);
	}

	//Set Z index.
	//  Note: This needs to be a separate step from above...
	for(var key in data)
		this.doorways[key].window.style.zIndex=data[key].z;

	//Set active window (yes, we need yet another separate iteration).
	for(var key in data)
		if(data[key].active)
			this.doorways[key].set_active(true);
}


//Properties include:
//  active_color        COLOR              Color of top bar when active (gray).
//  deactive_color      COLOR              Color of top bar when not active (black).
//  active_text_color   COLOR              Color of top bar text when active (white).
//  deactive_text_color COLOR              Color of top bar text when not active (gray).
//  min_size            {w:INT,h:INT}      Minimum size the doorway can be (200,200).
//  onresize            function(pos,size) Callback called when window is resized.
//  outline             INT                Width of outline around doorway (1).
//  pos                 {x:INT,y:INT}      Doorway starting position (0,0).
//  size                {w:INT,h:INT}      Doorway starting size (320,240).
//  top_bar_height      INT                Height of the top bar (32).
//  button_size         INT                Size of the help and minimize buttons(20).
//  button_spacing      INT                Spacing between buttons(5).
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
	this.minimized=false;
	this.active_color="#999999";
	this.deactive_color="#222222";
	this.active_text_color="white";
	this.deactive_text_color="#999999";
	this.top_bar_height=32;
	this.button_size=20;
	this.button_spacing=5;
	this.outline=2;
	this.border_radius=5;

	//Copy properties to resizer...
	var resizer_properties={};
	resizer_properties.pos=properties.pos;
	resizer_properties.size=properties.size;
	resizer_properties.min_size=properties.min_size;
	resizer_properties.outline=this.outline

	//Default properties...
	if(resizer_properties.active_color)
		this.active_color=resizer_properties.active_color;
	if(resizer_properties.deactive_color)
		this.deactive_color=resizer_properties.deactive_color;
	if(resizer_properties.active_text_color)
		this.active_text_color=resizer_properties.active_text_color;
	if(resizer_properties.deactive_text_color)
		this.deactive_text_color=resizer_properties.deactive_text_color;
	if(resizer_properties.top_bar_height)
		this.top_bar_height=resizer_properties.top_bar_height;
	if(resizer_properties.button_size)
		this.button_size=resizer_properties.button_size;
	if(resizer_properties.button_spacing)
		this.button_spacing=resizer_properties.button_spacing;

	//Our resize is a wrapper around the resizer onresize callback...
	resizer_properties.onresize=function(pos,size)
	{
		_this.content.style.height=size.h-_this.top_bar_height-resizer_properties.outline+"px";
		if(_this.onresize)
			_this.onresize(pos,size);
		_this.set_active(true);
	};

	//Make the parts of the doorway...
	this.window=utility.make_div(this.manager.el,
	{
		position:"absolute",
		border:"black solid "+this.outline+"px",
		borderRadius:this.border_radius+"px",
		overflow:"hidden"
	});
	this.top_bar=utility.make_div(this.window,
	{
		height:this.top_bar_height+"px",
		cursor:"move",
		borderBottom:"black solid "+this.outline+"px"
	});
	this.content=utility.make_div(this.window,
	{
		backgroundColor:"white"
	});
	this.minimize=utility.make_div(this.top_bar,
	{
		lineHeight:this.top_bar_height+"px",
		width:this.button_size+"px",
		height:this.top_bar_height+"px",
		cursor:"pointer",
		float:"right",
		marginRight:this.button_spacing+"px",
		webkitUserSelect:"none",
		mozUserSelect:"none",
		msUserSelect:"none",
		fontFamily:"Sans-serif",
		textAlign:"center"
	});
	this.minimize.innerHTML="_";
	this.help=utility.make_div(this.top_bar,
	{
		lineHeight:this.top_bar_height+"px",
		width:this.button_size+"px",
		height:this.top_bar_height+"px",
		cursor:"pointer",
		float:"right",
		marginRight:this.button_spacing+"px",
		webkitUserSelect:"none",
		mozUserSelect:"none",
		msUserSelect:"none",
		fontFamily:"Sans-serif",
		textAlign:"center"
	});
	this.help.innerHTML="?";
	this.title=utility.make_div(this.top_bar,
	{
		position:"absolute",
		top:"0px",
		lineHeight:this.top_bar_height+"px",
		color:"white",
		width:"0px",
		height:this.top_bar_height+"px",
		cursor:"grab",
		paddingLeft:this.button_spacing+"px",
		webkitUserSelect:"none",
		mozUserSelect:"none",
		msUserSelect:"none",
		fontFamily:"Sans-serif",
		overflow:"hidden",
		whiteSpace:"nowrap"
	});
	this.title.appendChild(document.createTextNode(id));

	//Prevent clicking on buttons from dragging windows around.
	var prevent_move=function(event)
	{
		_this.set_active(true);
		event.stopPropagation();
	};
	this.minimize.addEventListener("mousedown",prevent_move);
	this.minimize.addEventListener("touchstart",prevent_move);
	this.help.addEventListener("mousedown",prevent_move);
	this.help.addEventListener("touchstart",prevent_move);

	//Create Button Callbacks
	this.minimize.addEventListener("click",function(event)
	{
		_this.set_minimized(true);
	});

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
		_this.old_pos.x-=utility.get_num(_this.window.offsetLeft);
		_this.old_pos.y-=utility.get_num(_this.window.offsetTop);
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
		this.minimize.style.color=this.active_text_color;
		this.help.style.color=this.active_text_color;
		this.title.style.color=this.active_text_color;
		this.window.style.zIndex="";
	}
	else
	{
		this.top_bar.style.backgroundColor=this.deactive_color;
		this.minimize.style.color=this.deactive_text_color;
		this.help.style.color=this.deactive_text_color;
		this.title.style.color=this.deactive_text_color;
	}

	this.title.style.width=utility.get_num(this.window.offsetWidth)-
		this.button_spacing*4-this.button_size*2+"px";

	if(this.minimized)
		this.window.style.visibility="hidden";
	else
		this.window.style.visibility="visible";

	//Manager needs to reorder stacking
	this.manager.update_stacking();

	//Now that stacking is reordered, set resizers one index above window
	for(var key in this.resizer.resizers)
		this.resizer.resizers[key].style.zIndex=this.window.style.zIndex+1;
}

//Set the doorway on top.
//  FIXME: Move the for loop to a function in the manager?
doorways_t.prototype.set_active=function(active,wipe_hide_all)
{
	if(wipe_hide_all!=false)
		this.manager.hide_all_state=null;
	if(active)
	{
		this.minimized=false;
		for(var id in this.manager.doorways)
		{
			this.manager.doorways[id].active=false;
			if(id!=this.id)
				this.manager.doorways[id].update();
		}
	}
	this.active=active;
	this.update();
}

//Minimize a doorway.
doorways_t.prototype.set_minimized=function(minimized,wipe_hide_all)
{
	if(wipe_hide_all!=false)
		this.manager.hide_all_state=null;
	this.minimized=minimized;
	this.set_active(!this.minimized,wipe_hide_all);
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
	this.opacity=0;  //DEBUGGING HELPER
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
		n:utility.make_div(this.div,
		{
			backgroundColor:"yellow",
			cursor:"ns-resize",
			position:"absolute",
			opacity:this.opacity
		}),
		e:utility.make_div(this.div,
		{
			backgroundColor:"yellow",
			cursor:"ew-resize",
			position:"absolute",
			opacity:this.opacity
		}),
		s:utility.make_div(this.div,
		{
			backgroundColor:"yellow",
			cursor:"ns-resize",
			position:"absolute",
			opacity:this.opacity
		}),
		w:utility.make_div(this.div,
		{
			backgroundColor:"yellow",
			cursor:"ew-resize",
			position:"absolute",
			opacity:this.opacity
		}),
		ne:utility.make_div(this.div,
		{
			backgroundColor:"purple",
			cursor:"nesw-resize",
			position:"absolute",
			opacity:this.opacity
		}),
		se:utility.make_div(this.div,
		{
			backgroundColor:"purple",
			cursor:"nwse-resize",
			position:"absolute",
			opacity:this.opacity
		}),
		sw:utility.make_div(this.div,
		{
			backgroundColor:"purple",
			cursor:"nesw-resize",
			position:"absolute",
			opacity:this.opacity
		}),
		nw:utility.make_div(this.div,
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
			//Get global offset...
			var global_offset=utility.get_offset(_this.window);
			global_offset.x-=utility.get_num(_this.window.offsetLeft);
			global_offset.y-=utility.get_num(_this.window.offsetTop);

			//Get absolute pos of mouse.
			var abs_pos=
			{
				x:event.pageX-global_offset.x,
				y:event.pageY-global_offset.y
			};

			//North resizers.
			if(_this.drag_side.indexOf("n")>=0)
				_this.resizers.n.style.top=
				_this.resizers.ne.style.top=
				_this.resizers.nw.style.top=Math.max(Math.min(abs_pos.y-_this.border/2,
					utility.get_num(_this.resizers.s.offsetTop)-_this.border,
					utility.get_num(_this.resizers.s.offsetTop)-_this.min_size.h-
						_this.border),0);

			//East resizers.
			if(_this.drag_side.indexOf("e")>=0)
				_this.resizers.e.style.left=
				_this.resizers.ne.style.left=
				_this.resizers.se.style.left=Math.max(abs_pos.x-_this.border/2,
					utility.get_num(_this.resizers.w.offsetLeft)+_this.border,
					utility.get_num(_this.resizers.w.offsetLeft)+_this.min_size.w-
						_this.border);

			//South resizers.
			if(_this.drag_side.indexOf("s")>=0)
				_this.resizers.s.style.top=
				_this.resizers.se.style.top=
				_this.resizers.sw.style.top=Math.max(abs_pos.y-_this.border/2,
					utility.get_num(_this.resizers.n.offsetTop)+_this.border,
					utility.get_num(_this.resizers.n.offsetTop)+_this.min_size.h-
						_this.border);

			//West resizers.
			if(_this.drag_side.indexOf("w")>=0)
				_this.resizers.w.style.left=
				_this.resizers.nw.style.left=
				_this.resizers.sw.style.left=Math.max(Math.min(abs_pos.x-_this.border/2,
					utility.get_num(_this.resizers.e.offsetLeft)-_this.border,
					utility.get_num(_this.resizers.e.offsetLeft)-_this.min_size.w-
						_this.border),0);

			//Calculate size.
			_this.size=
			{
				w:utility.get_num(_this.resizers.e.offsetLeft)-
					utility.get_num(_this.resizers.w.offsetLeft)+_this.border-_this.outline*2,
				h:utility.get_num(_this.resizers.s.offsetTop)-
					utility.get_num(_this.resizers.n.offsetTop)+_this.border-_this.outline*2
			};

			//Calculate position.
			_this.pos=
			{
				x:utility.get_num(_this.resizers.w.offsetLeft),
				y:utility.get_num(_this.resizers.n.offsetTop)
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
	if(pos.x<0)
		pos.x=0;
	if(pos.y<0)
		pos.y=0;
	this.pos=pos;
	this.update();
}

//Updates size...
resizer_t.prototype.resize=function(size)
{
	this.drag_side="se";
	var global_offset=utility.get_offset(this.window);
	global_offset.x-=utility.get_num(this.window.offsetLeft);
	global_offset.y-=utility.get_num(this.window.offsetTop);
	this.move_func
	({
		pageX:this.pos.x+this.size.w-this.border+this.outline+global_offset.x,
		pageY:this.pos.y+this.size.h-this.border+this.outline+global_offset.y
	});
	this.up_func();
}

//Sets minimum size...
resizer_t.prototype.set_min_size=function(size)
{
	this.min_size=size;
}

//Updates resizers not moved and the window passed.
resizer_t.prototype.update=function()
{
	//Update resizers not moved during the resize to keep ourself square.
	for(var key in this.resizers)
		if(this.resizers[key].direction)
		{
			if(this.resizers[key].direction.indexOf("n")>=0)
				utility.set_style(this.resizers[key],
				{
					top:this.pos.y+"px",
					height:this.border+"px"
				});
			if(this.resizers[key].direction.indexOf("e")>=0)
				utility.set_style(this.resizers[key],
				{
					left:this.pos.x+this.size.w-this.border+this.outline*2+"px",
					width:this.border+"px"
				});
			if(this.resizers[key].direction.indexOf("s")>=0)
				utility.set_style(this.resizers[key],
				{
					top:this.pos.y+this.size.h-this.border+this.outline*2+"px",
					height:this.border+"px"
				});
			if(this.resizers[key].direction.indexOf("w")>=0)
				utility.set_style(this.resizers[key],
				{
					left:this.pos.x+"px",
					width:this.border+"px"
				});
			if(this.resizers[key].direction=="n"||this.resizers[key].direction=="s")
				utility.set_style(this.resizers[key],
				{
					width:this.size.w-this.border*2+this.outline*2+"px",
					left:this.pos.x+this.border+"px"
				});
			if(this.resizers[key].direction=="e"||this.resizers[key].direction=="w")
				utility.set_style(this.resizers[key],
				{
					height:this.size.h-this.border*2+this.outline*2+"px",
					top:this.pos.y+this.border+"px"
				});
		}

	//Set window pos and size.
	utility.set_style(this.window,
	{
		left:this.pos.x+"px",
		top:this.pos.y+"px",
		width:this.size.w+"px",
		height:this.size.h+"px"
	});

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

//Helper class that makes a highlightable div.
//  Special CSS:
//    enterOpacity          Opacity when mouse enters.
//    leaveOpacity          Opacity when mouse leaves.
//    enterColor            Color when mouse enters.
//    leaveColor            Color when mouse leaves.
//    enterBackgroundColor  Background color when mouse enters.
//    leaveBackgroundColor  Background color when mouse leaves.
//  See .addEventListener() for listeners.
function highlightable_t(div,style)
{
	if(!div)
		return null;
	this.div=div;
	var _this=this;
	this.style=style;
	this.event_listeners=
	{
		click:[]
	};
	this.el=utility.make_div(this.div,style);
	if(!style.cursor)
		this.el.style.cursor="pointer";
	this.el.addEventListener("mouseenter",function(){_this.highlight();});
	this.el.addEventListener("mouseleave",function(){_this.unhighlight();});
	this.el.addEventListener("click",function()
	{
		for(var key in _this.event_listeners.click)
			_this.event_listeners.click[key]();
	});
	this.unhighlight();
}

//Cleanup function...
highlightable_t.prototype.destroy=function()
{
	if(this.div&&this.el)
		this.div.removeChild(this.el);
	this.div=this.el=null;
}

//Highlight function sets colors and opacities to enter(if passed in).
highlightable_t.prototype.highlight=function()
{
	if(this.style.enterOpacity>=0)
		this.el.style.opacity=this.style.enterOpacity;
	if(this.style.enterBackgroundColor)
		this.el.style.backgroundColor=this.style.enterBackgroundColor;
	if(this.style.enterColor)
		this.el.style.color=this.style.enterColor;
}

//Unhighlight function sets colors and opacities to leave (if passed in).
highlightable_t.prototype.unhighlight=function()
{
	if(this.style.leaveOpacity>=0)
		this.el.style.opacity=this.style.leaveOpacity;
	if(this.style.leaveBackgroundColor)
		this.el.style.backgroundColor=this.style.leaveBackgroundColor;
	if(this.style.leaveColor)
		this.el.style.color=this.style.leaveColor;
}

//Event listeners:
//  click() - Called when highlightable button is clicked.
highlightable_t.prototype.addEventListener=function(listener,callback)
{
	utility.setEventListener(this,listener,callback);
}

//Event listeners:
//  See .addEventListener() for details.
highlightable_t.prototype.removeEventListener=function(listener,callback)
{
	utility.unsetEventListener(this,listener,callback);
}

//Side menu for doorways.
//  width        INT       Width of menu bar. (128)
//  handle_width INT       Width of hide/show button. (24).
function doorways_menu_t(manager,properties)
{
	if(!manager)
		return null;
	var _this=this;
	this.manager=manager;
	this.buttons=[];

	//Style variables...
	this.button_area_width=128;
	this.handle_width=24;
	this.shown=true;

	//Copy properties...
	if(properties)
	{
		if(properties.width)
			this.button_area_width=properties.width;
		if(properties.handle_width)
			this.handle_width=properties.handle_width;
	}

	//Side menu creation and callbacks.
	this.menu=utility.make_div(this.manager.div,
	{
		position:"absolute",
		top:"0px",
		left:"0px",
		height:"100%",
		width:this.button_area_width+this.handle_width+"px"
	});

	//Set menu on top of all other windows...(little hacky...).
	this.manager.addEventListener("stackchange",function(z_top)
	{
		var offset=999;
		_this.menu.style.zIndex=z_top+offset;
		_this.button_area.style.zIndex=z_top+offset*2;
		_this.handle.el.style.zIndex=z_top+offset*3;
		_this.icon.style.zIndex=z_top+offset*3;
	});

	//Buttons div creation and callbacks.
	this.button_area=utility.make_div(this.menu,
	{
		position:"absolute",
		top:"0px",
		left:"0px",
		height:"100%",
		width:this.button_area_width+"px",
		backgroundColor:"#222222"
		});

	//Menu icon.
	this.icon=utility.make_img(this.button_area,"",
	{
		width:"100px",
		margin:"auto",
		display:"hidden"
	});

	this.status_area=utility.make_div(this.button_area,
	{
		width:"100%",
		height:"auto",
		fontFamily:"Sans-serif",
		textAlign:"center"
	});

	//Side menu hide/show menu creation and callbacks.
	this.handle=new highlightable_t(this.menu,
	{
		position:"absolute",
		top:"0px",
		right:"0px",
		height:"100%",
		width:this.handle_width+"px",
		leaveBackgroundColor:"#222222",
		enterBackgroundColor:"#999999",
		leaveColor:"#999999",
		enterColor:"white",
		display:"table"
	});
	this.handle_text=utility.make_div(this.handle.el,
	{
		fontFamily:"Sans-serif",
		textAlign:"center",
		display:"table-cell",
		verticalAlign:"middle"
	});
	this.handle_text.innerHTML="<";

	//Click to show/hide.
	this.handle.addEventListener("click",function()
	{
		if(_this.shown)
		{
			_this.menu.style.width=_this.handle_width+"px";
			_this.button_area.style.visibility="hidden";
			_this.handle_text.innerHTML=">";
			_this.manager.el.style.left=_this.handle_width+"px";
		}
		else
		{
			_this.menu.style.width=_this.button_area_width+_this.handle_width+"px";
			_this.button_area.style.visibility="visible";
			_this.handle_text.innerHTML="<";
			_this.manager.el.style.left=_this.button_area_width+_this.handle_width+"px";
		}
		_this.shown=!_this.shown;
		_this.handle.unhighlight();
	});

	//Callbacks to update menu...
	var update=function()
	{
		_this.clear_buttons();
		for(var key in _this.manager.doorways)
			_this.build_button(_this.manager.doorways[key]);
	};
	this.manager.addEventListener("add",update);
	this.manager.addEventListener("remove",update);

	//Initial button creation and move the UI...
	this.manager.el.style.left=this.button_area_width+this.handle_width+"px";
	update();
}

//Cleanup function...
doorways_menu_t.prototype.destroy=function()
{
	if(this.manager&&this.manager.el)
		this.manager.div.removeChild(this.menu);
	if(this.handle)
		this.handle.destroy();
	this.manager=this.handle=null;
}

//Set innerHTML of status area... (this might be a terrible idea...)
doorways_menu_t.prototype.set_status=function(innerHTML,style)
{
	if(this.status_area.innerHTML!=innerHTML)
		this.status_area.innerHTML=innerHTML;
	utility.set_style(this.status_area,style);
}

//Clear all buttons made by doorways manager.
doorways_menu_t.prototype.clear_buttons=function()
{
	for(var key in this.buttons)
		this.buttons[key].destroy();
	this.buttons=[];
}

//Add a new doorways button (buttons are used to hide/show doorways).
doorways_menu_t.prototype.build_button=function(doorway)
{
	this.buttons.push(new doorways_menu_button_t(this.button_area,doorway,
		this.button_area_width));
}

//Sets the icon of the menu to the given src.
doorways_menu_t.prototype.set_icon=function(src)
{
	this.icon.src=src;
	if(src)
		utility.set_style(this.icon,
		{
			paddingTop:"10px",
			paddingBottom:"10px",
			display:"block"
		});
	else
		utility.set_style(this.icon,
		{
			paddingTop:"none",
			paddingBottom:"none",
			display:"hidden"
		});
}

//Doorways menu button helper function.
function doorways_menu_button_t(div,doorway,width)
{
	if(!div||!doorway)
		return null;
	var _this=this;
	this.div=div;
	this.doorway=doorway;
	this.padding=5;
	this.width=width;
	this.height=32;
	this.button=new highlightable_t(this.div,
	{
		height:this.height+"px",
		width:this.width-this.padding+"px",
		lineHeight:this.height+"px",
		paddingLeft:this.padding+"px",
		webkitUserSelect:"none",
		mozUserSelect:"none",
		msUserSelect:"none",
		fontFamily:"Sans-serif",
		leaveBackgroundColor:"#222222",
		enterBackgroundColor:"#999999",
		leaveColor:"#999999",
		enterColor:"white",
		overflow:"hidden",
		whiteSpace:"nowrap"
	});
	this.button.addEventListener("click",function()
	{
		_this.doorway.set_active(true);
	});
	console.log(this.doorway.id);
	this.text=document.createTextNode(this.doorway.id);
	this.button.el.appendChild(this.text);
}

//Cleanup function...
doorways_menu_button_t.prototype.destroy=function()
{
	if(this.button)
		this.button.destroy();
	this.div=this.doorway=this.button=null;
}