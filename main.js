﻿import * as soui4 from "soui4";
import {R} from "uires/R.js";

var g_workDir="";

const base_id = 1000;
const kBoardSize={row:7,col:7};
const kMaxState = 7;
const kMinSame = 3;//min same ele

function id2pos(id){
	id -= base_id;
	let ret={x:-1,y:-1};
	ret.y=Math.floor(id/kBoardSize.col);
	ret.x = id % kBoardSize.col;
	return ret;
}

function pos2id(pos){
	return base_id+pos.y*kBoardSize.col+pos.x;
}

class Board {
	constructor(mainDlg){
		this.mainDlg = mainDlg;
		this.board = new Array(kBoardSize.row);
		for(let i =0;i<kBoardSize.col;i++){
			this.board[i]=new Array(kBoardSize.col);
		}
	}

	init(){
		console.log("!!!init board");
		for(let y=0;y<kBoardSize.row;y++){
			for(let x=0;x<kBoardSize.col;x++){
				this.board[y][x]=Math.floor(Math.random()*kMaxState);
			}
		}
		this.checkBoard();
	}

	randomState(pos){
		this.board[pos.y][pos.x]=Math.floor(Math.random()*kMaxState);
		this.mainDlg.onGridChanged(pos,false);
	}

	setGridState(x,y,state,enableAni){
		try{
			this.board[y][x]=state;
			this.mainDlg.onGridChanged({x:x,y:y},enableAni);	
		}catch(e){
			console.log(e);
		}
	}
	getGridStateById(id){
		let pos = id2pos(id);
		return this.getGridState(pos.x,pos.y);
	}

	getGridState(x,y){
		return this.board[y][x];
	}

	canSwap(pos1,pos2){
		if(pos1.x==pos2.x){
			return Math.abs(pos1.y-pos2.y)==1;
		}else if(pos1.y==pos2.y){
			return Math.abs(pos1.x-pos2.x)==1;
		}
		return false;
	}

	//swap value of two grids
	swap(pos1,pos2){
		if(pos1.x<0 || pos1.x>=kBoardSize.col || pos1.y<0|| pos1.y>=kBoardSize.row)
			return false;
		if(pos2.x<0 || pos2.x>=kBoardSize.col || pos2.y<0|| pos2.y>=kBoardSize.row)
			return false;
		if(pos1.x==pos2.x && pos1.y==pos2.y)
			return false;
		let tmp = this.board[pos1.y][pos1.x];
		this.board[pos1.y][pos1.x]=this.board[pos2.y][pos2.x];
		this.board[pos2.y][pos2.x]=tmp;

		this.mainDlg.onGridChanged(pos1,false);
		this.mainDlg.onGridChanged(pos2,false);

		//test for 3 elements
		this.checkBoard();
		return true;
	}

	checkBoard(){
		if(this.checkBoardRow())
			return true;
		return this.checkBoardCol();
	}
	checkBoardCol(){
		for(let x=0;x<kBoardSize.col;x++){
			let nSame = 1;
			let y=kBoardSize.row-2;
			for(;y>=0;y--){
				if(this.board[y][x]==this.board[y+1][x])
				{
					nSame++;
				}else{
					if(nSame>=kMinSame){
						y++;
						break;
					}
					nSame = 1;
				}
			}
			if(y<0) y=0;
			if(nSame>=kMinSame){
				this.mainDlg.onGetSameY(x,y,nSame);
				return true;
			}
		}
		return false;
	}

	checkBoardRow(){
		for(let y=kBoardSize.row-1;y>=0;y--){
			let nSame = 1;
			let x=1;
			for(;x<kBoardSize.col;x++){
				if(this.board[y][x]==this.board[y][x-1])
				{
					nSame++;
				}else{
					if(nSame>=kMinSame){
						break;
					}
					nSame = 1;
				}
			}
			if(nSame>=kMinSame){
				this.mainDlg.onGetSameX(y,x-nSame,nSame);
				return true;
			}
		}
		return false;
	}

	freeSameX(y,x,len){
		for(let i=y;i>0;i--){
			for(let j=x;j<x+len;j++){
				this.setGridState(j,i,this.board[i-1][j],false);
			}
		}
		for(let j=x;j<x+len;j++){
			let state = Math.floor(Math.random()*kMaxState);
			this.setGridState(j,0,state,true);
		}
		this.checkBoard();
	}

	freeSameY(x,y,len){
		for(let i=0;i<len;i++){
			this.setGridState(x,y+len-1-i,this.board[x][y-1-i],false);
		}
		for(let j=0;j<len;j++){
			let state = Math.floor(Math.random()*kMaxState);
			this.setGridState(x,j,state,true);
		}
		this.checkBoard();
	}
}

class MainDialog extends soui4.JsHostWnd{
	constructor(){
		super("layout:dlg_main");
		this.onEvt = this.onEvent;
		this.ani_sel = soui4.GetApp().LoadAnimation("anim:scale_select");
		this.ani_move=soui4.GetApp().LoadValueAnimator("animator:move");
		this.board = new Board(this);
		this.click_id = -1;
		this.ani_list=[];
		this.coin = 20;
		this.score = 0;
	}

	showScore(){
		let num = this.score;
		if(num>999)
			return;
		let dig0 = num%10;
		let dig1 = num/10%10;
		let dig2 = num/100%10;
		this.setDigit("digit_score_0",dig0);
		this.setDigit("digit_score_1",dig1);
		this.setDigit("digit_score_2",dig2);
	}

	showCoin(){
		let num = this.coin;
		if(num>999)
			return;
		let dig0 = num%10;
		let dig1 = num/10%10;
		let dig2 = num/100%10;
		this.setDigit("digit_coin_0",dig0);
		this.setDigit("digit_coin_1",dig1);
		this.setDigit("digit_coin_2",dig2);
	}

	setDigit(digitName,digit){
		let stack=this.FindIChildByName(digitName);
		if(stack!=0){
			let stackApi=soui4.QiIStackView(stack);
			stackApi.SelectPage(digit,true);
			stackApi.Release();
		}
	}
	onEvent(e){
		let evtid = e.GetID();
		if(evtid==soui4.EVT_INIT){//event_init
			this.init();
		}else if(evtid==soui4.EVT_EXIT){
			this.uninit();
		}else if(evtid == soui4.EVT_CMD){
			let senderId = e.IdFrom();
			if(senderId>=base_id && senderId<base_id+kBoardSize.row*kBoardSize.col)
				this.onCmd(e);
		}
		return false;
	}

	buildAniWidget(aniframe,id,state){
		let head="<t:g.ele>";
		let tail="</t:g.ele>";
		let ele = "<data id=\""+ id +"\"/>";
		let xml = head+ele+tail;
		aniframe.CreateChildrenFromXml(xml);
		let ret = aniframe.FindIChildByID(id);
		let stackApi = soui4.QiIStackView(ret);
		stackApi.SelectPage(state,false);
		stackApi.Release();
		return ret;
	}

	
	onAnimationEnd(ani){
		console.log("onAnimationEnd");
		let userData = ani.jsUserData;
		userData.ani_widget.Destroy();
		userData.ele.SetVisible(true,false);
	}

	onAnimationUpdate(ani,val){
		let userData = ani.jsUserData;
		userData.ani_widget.Move(val);
	}

	//元素交换动画完成
	onAnimatorGroupEnd(aniGroup){
		console.log("onAnimatorGroupEnd");
		for(let i=0;i<this.ani_list.length;i++){
			if(this.ani_list[i]==aniGroup){
				this.ani_list.splice(i,1);
				break;
			}
		}
		let pos= aniGroup.jsUserData.pos;
		this.board.swap(pos[0],pos[1]);
		this.coin--;
		this.showCoin();
		this.checkAnimatorList();
	}

	checkAnimatorList(){
		if(this.ani_list.length==0){
			let wnd_aniframe=this.FindIChildByID(R.id.wnd_aniframe);
			wnd_aniframe.SetVisible(false,true);
		}
	}

	onCmd(e){
		if(this.coin<=0)
			return;
		if(this.click_id!=-1){
			let ele = soui4.toIWindow(this.FindIChildByID(this.click_id));
			ele.ClearAnimation();
			let pos1= id2pos(this.click_id);
			let pos2 = id2pos(e.IdFrom());
			if(this.board.canSwap(pos1,pos2)){
				//prepare animator
				let wnd_aniframe=this.FindIChildByID(R.id.wnd_aniframe);
				wnd_aniframe.SetVisible(true,true);
				let id1 = this.click_id;
				let id2 = e.IdFrom();
				let ele1=this.FindIChildByID(id1);
				let ele2 =this.FindIChildByID(id2);
				ele1.SetVisible(false,false);
				ele2.SetVisible(false,false);
				this.click_id = -1;

				let rc1 = ele1.GetWindowRect();
				let rc2 = ele2.GetWindowRect();
				let aniGroup = new soui4.SAnimatorGroup();
				aniGroup.cbHandler=this;
				aniGroup.onAnimatorGroupEnd = this.onAnimatorGroupEnd;
				aniGroup.jsUserData={anis:[],pos:[]};
				{
					let ani = new soui4.SValueAnimator();
					ani.CopyFrom(this.ani_move);
					ani.SetRange(rc1,rc2);
					ani.cbHandler = this;

					let pos=id2pos(id1);
					let state = this.board.getGridState(pos.x,pos.y);
					let ani_widget = this.buildAniWidget(wnd_aniframe,id1,state);
					ani.onAnimationUpdate=this.onAnimationUpdate;
					ani.onAnimationEnd=this.onAnimationEnd;	
					ani.jsUserData={ele:ele1,ani_widget:ani_widget};
					ani.Start(wnd_aniframe.GetContainer());
					aniGroup.AddAnimator(ani.GetIValueAnimator());
					aniGroup.jsUserData.anis.push(ani);
					aniGroup.jsUserData.pos.push(pos);
				}
				{
					let ani = new soui4.SValueAnimator();
					ani.CopyFrom(this.ani_move);
					ani.SetRange(rc2,rc1);
					ani.cbHandler = this;

					let pos=id2pos(id2);
					let state = this.board.getGridState(pos.x,pos.y);
					let ani_widget = this.buildAniWidget(wnd_aniframe,id2,state);

					ani.onAnimationUpdate=this.onAnimationUpdate;
					ani.onAnimationEnd=this.onAnimationEnd;
					ani.jsUserData={ele:ele2,ani_widget:ani_widget};

					ani.Start(wnd_aniframe.GetContainer());
					aniGroup.AddAnimator(ani.GetIValueAnimator());
					aniGroup.jsUserData.anis.push(ani);
					aniGroup.jsUserData.pos.push(pos);
				}
				this.ani_list.push(aniGroup);
			}else{
				this.click_id=-1;
				this.onCmd(e);
			}
		}else{
			let ele = soui4.toIWindow(e.Sender());
			let ani = this.ani_sel.clone();
			ele.SetAnimation(ani);
			ani.Release();
			this.click_id = e.IdFrom();
		}
	}

	getEleRect(pos){
		let id = pos2id(pos);
		let ele = this.FindIChildByID(id);
		return ele.GetWindowRect();
	}

	//下沉动画结束
	onAnimatorGroupEnd3(aniGroup){
		let samex = aniGroup.jsUserData.samex;
		console.log("onAnimatorGroupEnd3,samex:",samex.y,samex.x,samex.len);
		for(let i=0;i<this.ani_list.length;i++){
			if(this.ani_list[i]==aniGroup){
				this.ani_list.splice(i,1);
				break;
			}
		}

		this.checkAnimatorList();
		//update board state.
		this.coin ++;
		this.showCoin();
		this.score += samex.len;
		this.showScore();

		this.board.freeSameX(samex.y,samex.x,samex.len);
	}

	//消除动画结束
	onAnimatorGroupEnd2(aniGroup){
		console.log("onAnimatorGroupEnd2");
		for(let i=0;i<this.ani_list.length;i++){
			if(this.ani_list[i]==aniGroup){
				this.ani_list.splice(i,1);
				break;
			}
		}
		//启动元素下降动画
		if(aniGroup.jsUserData.samex.y>0){
			let aniGroup2 = new soui4.SAnimatorGroup();
			aniGroup2.cbHandler=this;
			aniGroup2.onAnimatorGroupEnd = this.onAnimatorGroupEnd3;
			aniGroup2.jsUserData={anis:[],pos:[],samex:aniGroup.jsUserData.samex};

			let wnd_aniframe = this.FindIChildByID(R.id.wnd_aniframe);

			let posLst= aniGroup.jsUserData.pos;
			for(let i=0;i<posLst.length;i++){
				for(let j=0;j<posLst[i].y;j++){
					let pos={x:posLst[i].x,y:j};
					let id = pos2id(pos);
					let ele = this.FindIChildByID(id);
					ele.SetVisible(false,false);
					let state = this.board.getGridState(pos.x,pos.y);
					let ani_widget = this.buildAniWidget(wnd_aniframe,id,state);
					let ani = new soui4.SValueAnimator();
					ani.CopyFrom(this.ani_move);
					let rc1=ele.GetWindowRect();
					let rc2=new soui4.CRect(rc1.left,rc1.top,rc1.right,rc1.bottom);
					rc2.OffsetRect(0,rc2.Height());
					ani.SetRange(rc1,rc2);
					ani.cbHandler = this;
					ani.onAnimationUpdate=this.onAnimationUpdate;
					ani.onAnimationEnd=this.onAnimationEnd;	
					ani.jsUserData={ele:ele,ani_widget:ani_widget};
					ani.Start(wnd_aniframe.GetContainer());
					aniGroup2.AddAnimator(ani.GetIValueAnimator());
					aniGroup2.jsUserData.anis.push(ani);
					aniGroup2.jsUserData.pos.push(pos);
				}
			}
			this.ani_list.push(aniGroup2);
		}else{
			this.onAnimatorGroupEnd3(aniGroup);
		}
	}

	onGetSameX(y,x,len){
		console.log("onGetSameX",y,x,len);
		let wnd_aniframe = this.FindIChildByID(R.id.wnd_aniframe);
		wnd_aniframe.SetVisible(true,true);

		let aniGroup = new soui4.SAnimatorGroup();
		aniGroup.cbHandler=this;
		aniGroup.onAnimatorGroupEnd = this.onAnimatorGroupEnd2;
		aniGroup.jsUserData={anis:[],pos:[],samex:{y:y,x:x,len:len}};

		let state = this.board.getGridState(x,y);
		let posStart={x:x,y:y};
		let posEnd={x:x+len-1,y};
		let rcStart = this.getEleRect(posStart);
		let rcEnd = this.getEleRect(posEnd);
		let rcCenter = rcStart;
		rcCenter.OffsetRect((rcEnd.right-rcStart.right)/2,0);

		for(let i=0;i<len;i++){
			let pos={x:x+i,y:y};
			let id = pos2id(pos);
			let ele = this.FindIChildByID(id);
			ele.SetVisible(false,true);
			let ani_widget = this.buildAniWidget(wnd_aniframe,id,state);
			let ani = new soui4.SValueAnimator();
			ani.CopyFrom(this.ani_move);
			ani.SetRange(ele.GetWindowRect(),rcCenter);
			ani.cbHandler = this;
			ani.onAnimationUpdate=this.onAnimationUpdate;
			ani.onAnimationEnd=this.onAnimationEnd;	
			ani.jsUserData={ele:ele,ani_widget:ani_widget};
			ani.Start(wnd_aniframe.GetContainer());
			aniGroup.AddAnimator(ani.GetIValueAnimator());
			aniGroup.jsUserData.anis.push(ani);
			aniGroup.jsUserData.pos.push(pos);
		}
		this.ani_list.push(aniGroup);
	}

	//下沉动画结束
	onAnimatorGroupEndY3(aniGroup){
		let samey = aniGroup.jsUserData.samey;
		console.log("onAnimatorGroupEndY3,samey:",samey.x,samey.y,samey.len);
		for(let i=0;i<this.ani_list.length;i++){
			if(this.ani_list[i]==aniGroup){
				this.ani_list.splice(i,1);
				break;
			}
		}

		this.checkAnimatorList();
		//update board state.
		this.coin ++;
		this.showCoin();
		this.score += samey.len;
		this.showScore();

		this.board.freeSameY(samey.x,samey.y,samey.len);
	}

		//消除动画结束
		onAnimatorGroupEndY2(aniGroup){
			console.log("onAnimatorGroupEndY2");
			for(let i=0;i<this.ani_list.length;i++){
				if(this.ani_list[i]==aniGroup){
					this.ani_list.splice(i,1);
					break;
				}
			}
			//启动元素下降动画
			let samey = aniGroup.jsUserData.samey;
			if(samey.y>0){
				let aniGroup2 = new soui4.SAnimatorGroup();
				aniGroup2.cbHandler=this;
				aniGroup2.onAnimatorGroupEnd = this.onAnimatorGroupEndY3;
				aniGroup2.jsUserData={anis:[],pos:[],samey:samey};
	
				let wnd_aniframe = this.FindIChildByID(R.id.wnd_aniframe);
	
				let posLst= aniGroup.jsUserData.pos;
				for(let y=0;y<samey.y;y++){
						let pos={x:samey.x,y:y};
						let id = pos2id(pos);
						let ele = this.FindIChildByID(id);
						ele.SetVisible(false,false);
						let state = this.board.getGridState(pos.x,pos.y);
						let ani_widget = this.buildAniWidget(wnd_aniframe,id,state);
						let ani = new soui4.SValueAnimator();
						ani.CopyFrom(this.ani_move);
						let rc1=ele.GetWindowRect();
						let rc2=new soui4.CRect(rc1.left,rc1.top,rc1.right,rc1.bottom);
						rc2.OffsetRect(0,rc2.Height()*samey.len);
						ani.SetRange(rc1,rc2);
						ani.cbHandler = this;
						ani.onAnimationUpdate=this.onAnimationUpdate;
						ani.onAnimationEnd=this.onAnimationEnd;	
						ani.jsUserData={ele:ele,ani_widget:ani_widget};
						ani.Start(wnd_aniframe.GetContainer());
						aniGroup2.AddAnimator(ani.GetIValueAnimator());
						aniGroup2.jsUserData.anis.push(ani);
						aniGroup2.jsUserData.pos.push(pos);
				}
				this.ani_list.push(aniGroup2);
			}else{
				this.onAnimatorGroupEndY3(aniGroup);
			}
	}

	onGetSameY(x,y,len){
		console.log("onGetSameY",x,y,len);

		let wnd_aniframe = this.FindIChildByID(R.id.wnd_aniframe);
		wnd_aniframe.SetVisible(true,true);

		//播放动画，显示一列元素合并成一个的动画
		let aniGroup = new soui4.SAnimatorGroup();
		aniGroup.cbHandler=this;
		aniGroup.onAnimatorGroupEnd = this.onAnimatorGroupEndY2;
		aniGroup.jsUserData={anis:[],pos:[],samey:{x:x,y:y,len:len}};

		let state = this.board.getGridState(x,y);
		let posStart={x:x,y:y};
		let posEnd={x:x,y:y+len-1};
		let rcStart = this.getEleRect(posStart);
		let rcEnd = this.getEleRect(posEnd);
		let rcCenter = rcStart;
		rcCenter.OffsetRect(0,(rcEnd.bottom-rcStart.bottom)/2);

		for(let i=0;i<len;i++){
			let pos={x:x,y:y+i};
			let id = pos2id(pos);
			let ele = this.FindIChildByID(id);
			ele.SetVisible(false,true);
			let ani_widget = this.buildAniWidget(wnd_aniframe,id,state);
			let ani = new soui4.SValueAnimator();
			ani.CopyFrom(this.ani_move);
			ani.SetRange(ele.GetWindowRect(),rcCenter);
			ani.cbHandler = this;
			ani.onAnimationUpdate=this.onAnimationUpdate;
			ani.onAnimationEnd=this.onAnimationEnd;	
			ani.jsUserData={ele:ele,ani_widget:ani_widget};
			ani.Start(wnd_aniframe.GetContainer());
			aniGroup.AddAnimator(ani.GetIValueAnimator());
			aniGroup.jsUserData.anis.push(ani);
			aniGroup.jsUserData.pos.push(pos);
		}
		this.ani_list.push(aniGroup);
	}

	onGridChanged(pos,enableAni){
		let wndBoard = this.FindIChildByID(R.id.wnd_board);
		let ele = wndBoard.FindIChildByID(pos2id(pos));
		let stackApi = soui4.QiIStackView(ele);
		let iIcon = this.board.getGridState(pos.x,pos.y);
		stackApi.SelectPage(iIcon,enableAni);
		stackApi.Release();
	}

	initBoard(){
		let wndBoard = this.FindIChildByID(R.id.wnd_board);
		wndBoard.DestroyAllChildren();
		wndBoard.SetAttribute("columnCount",""+kBoardSize.col,false);
	
		let head="<t:g.ele>";
		let tail="</t:g.ele>";
		let xml="";
		let eles = kBoardSize.row * kBoardSize.col;
		for(let i=0;i<eles;i++){
			let ele = "<data id=\""+ (base_id+i) +"\"/>";
			xml += head+ele+tail;
		}

		wndBoard.CreateChildrenFromXml(xml);
		wndBoard.RequestRelayout();
		this.board.init();
	}

	init(){
		console.log("init");
		this.initBoard();
		let wndBoard = this.FindIChildByID(R.id.wnd_board);
		for(let y=0;y<kBoardSize.row;y++){
			for(let x=0;x<kBoardSize.col;x++){
				let ele = wndBoard.FindIChildByID(pos2id({x:x,y:y}));
				let stackApi = soui4.QiIStackView(ele);
				let iIcon = this.board.getGridState(x,y);
				stackApi.SelectPage(iIcon,false);
				stackApi.Release();
			}
		}
		this.showCoin();
		this.showScore();
	}
	uninit(){
		//do uninit.
		console.log("uninit");
	}
};


function main(inst,workDir,args)
{
	soui4.log(workDir);
	g_workDir = workDir;
	let theApp = soui4.GetApp();
	let res = theApp.InitXmlNamedID(R.name_arr,R.id_arr);
	console.log("InitXmlNamedID ret:",res);
	let souiFac = soui4.CreateSouiFactory();
	//*
	let resProvider = souiFac.CreateResProvider(1);
	soui4.InitFileResProvider(resProvider,workDir + "\\uires");
	//*/
	/*
	// show how to load resource from a zip file
	let resProvider = soui4.CreateZipResProvider(theApp,workDir +"\\uires.zip","souizip");
	if(resProvider === 0){
		soui4.log("load res from uires.zip failed");
		return -1;
	}
	//*/
	let resMgr = theApp.GetResProviderMgr();
	resMgr.AddResProvider(resProvider,"uidef:xml_init");
	resProvider.Release();
	let hwnd = soui4.GetActiveWindow();
	let hostWnd = new MainDialog();
	hostWnd.Create(hwnd,0,0,0,0);
	hostWnd.SendMessage(0x110,0,0);//send init dialog message.
	hostWnd.ShowWindow(soui4.SW_SHOWNORMAL); 
	souiFac.Release();
	let ret= theApp.Run(hostWnd.GetHwnd());
	hostWnd=null;
	soui4.log("js quit");
	return ret;
}

globalThis.main=main;