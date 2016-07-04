function get_num(value)
{
	var num=parseFloat(value);
	if(!num)
		num=0;
	return num;
}

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

function doorways_manager_t(div)
{
	if(!div)
		return null;

	this.div=div;
	this.el=make_div(div);
	this.doorways={};
}

doorways_manager_t.prototype.create_doorway=function(id,properties)
{
	if(!this.doorways[id])
		this.doorways[id]=new doorways_t(this,id,properties);
	return this.doorways[id];
}

doorways_manager_t.prototype.remove_doorway=function(id)
{
	try
	{
		if(this.doorways[id])
		{
			this.doorways[id].destroy();
			this.doorways[id]=null;
		}
	}
	catch(error)
	{}
}

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

function doorways_t(manager,id,properties)
{
	var _this=this;
	if(!manager)
		return null;
	this.manager=manager;
	this.id=id;
	this.top_bar_height=32;
	var resizer_properties={};
	if(!properties)
		properties={};
	this.active=true;
	this.active_color=properties.active_color;
	this.deactive_color=properties.deactive_color;
	resizer_properties.pos=properties.pos;
	resizer_properties.size=properties.size;
	resizer_properties.min_size=properties.min_size;
	resizer_properties.outline=1;
	this.onresize=properties.onresize;
	if(!this.active_color)
		this.active_color="blue";
	if(!this.deactive_color)
		this.deactive_color="grey";
	resizer_properties.onresize=function(pos,size)
	{
		_this.content.style.width=size.w+"px";
		_this.content.style.height=size.h-_this.top_bar_height+"px";
		if(_this.onresize)
			_this.onresize(pos,size);
		_this.set_active(true);
	};
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
	this.resizer=new resizer_t(this.manager.el,this.window,resizer_properties);
	this.active_func=function()
	{
		_this.resizer.update();
	};
	this.window.addEventListener("mousedown",this.active_func);
	this.down_func=function(event)
	{
		event.preventDefault();
		_this.old_pos={x:event.pageX,y:event.pageY};
		_this.old_pos.x-=get_num(_this.window.offsetLeft);
		_this.old_pos.y-=get_num(_this.window.offsetTop);
		_this.dragging=true;
	};
	this.top_bar.addEventListener("mousedown",this.down_func);
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
	this.up_func=function(event)
	{
		_this.dragging=false;
	};
	document.addEventListener("mouseup",this.up_func);
}

doorways_t.prototype.destroy=function()
{
	try
	{
		if(this.move_func)
			document.removeEventListener("mousemove",this.move_func);
		if(this.up_func)
			document.removeEventListener("mouseup",this.up_func);
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

doorways_t.prototype.update=function()
{
	if(!this.resizer)
	{
		var _this=this;
		setTimeout(function(){_this.update();},1);
		return;
	}
	if(this.active)
	{
		this.top_bar.style.backgroundColor=this.active_color;
		this.window.style.zIndex=99;
	}
	else
	{
		this.top_bar.style.backgroundColor=this.deactive_color;
		this.window.style.zIndex=98;
	}
	for(var key in this.resizer.resizers)
		this.resizer.resizers[key].style.zIndex=this.window.style.zIndex;
}

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

function resizer_t(div,window,properties)
{
	var _this=this;
	if(!div||!window)
		return null;
	this.div=div;
	this.window=window;
	this.opacity=0;
	this.border=6;
	if(properties)
	{
		this.outline=properties.outline;
		this.pos=properties.pos;
		this.size=properties.size;
		this.min_size=properties.min_size;
		this.onresize=properties.onresize;
	}
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
			w:0,
			h:0
		};
	if(!this.outline)
		this.outline=1;
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
	this.down_func=function(event)
	{
		event.preventDefault();
		_this.drag_side=this.direction;
	};
	for(var key in this.resizers)
	{
		this.resizers[key].direction=key;
		this.resizers[key].addEventListener("mousedown",this.down_func);
	}
	this.move_func=function(event)
	{
		if(_this.drag_side)
		{
			var abs_pos=
			{
				x:event.pageX,
				y:event.pageY
			};
			if(_this.drag_side.indexOf("n")>=0)
				_this.resizers.n.style.top=
				_this.resizers.ne.style.top=
				_this.resizers.nw.style.top=Math.min(abs_pos.y-_this.border/2,
					get_num(_this.resizers.s.offsetTop)-_this.border,
					get_num(_this.resizers.s.offsetTop)-_this.min_size.h-_this.border);
			if(_this.drag_side.indexOf("e")>=0)
			{
				_this.resizers.e.style.left=
				_this.resizers.ne.style.left=
				_this.resizers.se.style.left=Math.max(abs_pos.x-_this.border/2,
					get_num(_this.resizers.w.offsetLeft)+_this.border,
					get_num(_this.resizers.w.offsetLeft)+_this.min_size.w-_this.border-_this.outline*2);
				}
			if(_this.drag_side.indexOf("s")>=0)
				_this.resizers.s.style.top=
				_this.resizers.se.style.top=
				_this.resizers.sw.style.top=Math.max(abs_pos.y-_this.border/2,
					get_num(_this.resizers.n.offsetTop)+_this.border,
					get_num(_this.resizers.n.offsetTop)+_this.min_size.h-_this.border-_this.outline*2);
			if(_this.drag_side.indexOf("w")>=0)
				_this.resizers.w.style.left=
				_this.resizers.nw.style.left=
				_this.resizers.sw.style.left=Math.min(abs_pos.x-_this.border/2,
					get_num(_this.resizers.e.offsetLeft)-_this.border,
					get_num(_this.resizers.e.offsetLeft)-_this.min_size.w-_this.border);
			_this.size=
			{
				w:get_num(_this.resizers.e.offsetLeft)-get_num(_this.resizers.w.offsetLeft)+_this.border,
				h:get_num(_this.resizers.s.offsetTop)-get_num(_this.resizers.n.offsetTop)+_this.border
			};
			_this.pos=
			{
				x:get_num(_this.resizers.w.offsetLeft),
				y:get_num(_this.resizers.n.offsetTop)
			};
			_this.update();
		}
	};
	document.addEventListener("mousemove",this.move_func);
	this.up_func=function(event)
	{
		_this.drag_side=null;
	};
	document.addEventListener("mouseup",this.up_func);
	this.move(this.pos);
	this.resize(this.size);
}

resizer_t.prototype.move=function(pos)
{
	this.pos=pos;
	this.update();
}

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

resizer_t.prototype.update=function()
{
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
	this.window.style.left=this.pos.x+"px";
	this.window.style.top=this.pos.y+"px";
	this.window.style.width=this.size.w+"px";
	this.window.style.height=this.size.h+"px";
	if(this.onresize)
		this.onresize(this.pos,this.size);
}

resizer_t.prototype.destroy=function()
{
	try
	{
		if(this.move_func)
			document.removeEventListener("mousemove",this.move_func);
		if(this.up_func)
			document.removeEventListener("mouseup",this.up_func);
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