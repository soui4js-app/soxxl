import * as soui4 from "soui4";
import {R} from "uires/R.js";

var g_workDir="";

const base_id = 1000;
const kBoardSize={row:7,col:7};
const kMaxState = 7;

function id2pos(id){
	id -= base_id;
	let ret={x:-1,y:-1};
	ret.y=Math.floor(id/kBoardSize.col);
	ret.x=id%kBoardSize.col;
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
		this.init();
	}

	init(){
		for(let y=0;y<kBoardSize.row;y++){
			for(let x=0;x<kBoardSize.col;x++){
				this.board[y][x]=Math.floor(Math.random()*kMaxState);
			}
		}
	}

	getGridState(x,y){
		return this.board[y][x];
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

		this.mainDlg.onGridChanged(pos1);
		this.mainDlg.onGridChanged(pos2);

		//test for 3 line
		return true;
	}
}

class MainDialog extends soui4.JsHostWnd{
	constructor(){
		super("layout:dlg_main");
		this.onEvt = this.onEvent;
		this.ani_sel = soui4.GetApp().LoadAnimation("anim:scale_select");
		this.board = new Board(this);
		this.click_id = -1;
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
			if(e.NameFrom()=="btn_test"){
				this.onTest(e);
			}
		}
		return false;
	}
	
	onAnimationUpdate(ani,val){
		console.log("onAnimationUpdate");
		//console.log("onAnimationUpdate,",val.left,val.top,val.right,val.bottom);
	}

	onTest(e){
		console.log("test");
		this.ani_move = new soui4.SValueAnimator();
		this.ani_move.LoadAniamtor("animator:move");
		this.ani_move.SetRange(new soui4.CRect(0,0,50,50),new soui4.CRect(100,100,250,250));
		this.ani_move.cbHandler=this;
		this.ani_move.onAnimationUpdate = this.onAnimationUpdate
		this.ani_move.Start(this.GetIRoot());
	}

	onCmd(e){
		if(this.click_id!=-1){
			let ele = soui4.toIWindow(this.FindIChildByID(this.click_id));
			ele.ClearAnimation();
			let pos1= id2pos(this.click_id);
			let pos2 = id2pos(e.IdFrom());
			this.board.swap(pos1,pos2);
			this.click_id = -1;
		}else{
			let ele = soui4.toIWindow(e.Sender());
			let ani = this.ani_sel.clone();
			ele.SetAnimation(ani);
			ani.Release();
			this.click_id = e.IdFrom();
		}
	}

	onGridChanged(pos){
		let wndBoard = this.FindIChildByID(R.id.wnd_board);
		let ele = wndBoard.FindIChildByID(pos2id(pos));
		let stackApi = soui4.QiIStackView(ele);
		let iIcon = this.board.getGridState(pos.x,pos.y);
		stackApi.SelectPage(iIcon,true);
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