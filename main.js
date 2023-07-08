import * as soui4 from "soui4";
import {R} from "uires/R.js";

var g_workDir="";

const base_id = 1000;
const kBoardSize={row:7,col:7};

class MainDialog extends soui4.JsHostWnd{
	constructor(){
		super("layout:dlg_main");
		this.onEvt = this.onEvent;
		this.ani_sel = soui4.GetApp().LoadAnimation("anim:scale_select");
	}

	onEvent(e){
		let evtid = e.GetID();
		if(evtid==soui4.EVT_INIT){//event_init
			this.init();
		}else if(evtid==soui4.EVT_EXIT){
			this.uninit();
		}else if(evtid == soui4.EVT_CMD){
			this.onCmd(e);
		}
		return false;
	}
	
	onCmd(e){
		let ele = soui4.toIWindow(e.Sender());
		let ani = this.ani_sel.clone();
		ele.SetAnimation(ani);
		ani.Release();
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
	}

	init(){
		console.log("init");
		this.initBoard();
		let wndBoard = this.FindIChildByID(R.id.wnd_board);
		for(let y=0;y<kBoardSize.row;y++){
			for(let x=0;x<kBoardSize.col;x++){
				let ele = wndBoard.FindIChildByID(base_id+y*kBoardSize.col+x);
				let stackApi = soui4.QiIStackView(ele);
				let iIcon = Math.floor(Math.random()*7);
				stackApi.SelectPage(iIcon);
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