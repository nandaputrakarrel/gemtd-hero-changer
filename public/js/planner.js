(() => {
    const BUILDS_KEY = "gemtd_builds_v2";
    const ACTIVE_KEY = "gemtd_active_build_v1";

    const TOWER_IMG  = (snake) => '/gems/advanced/gemtd_' + snake + '.png';
    const SECRET_IMG = (snake) => '/gems/secrets/gemtd_' + snake + '.png';
    const PEDAL_IMG  = (snakeNoPedal) => '/gems/pedals/gemtd_' + snakeNoPedal + '.png';

    const COMBINED_NAMES = [
        "Silver","Silver Knight","Pink Diamond","Huge Pink Diamond","Koh-i-noor Diamond",
        "Malachite","Vivid Malachite","Uranium-238","Uranium-235","Depleted-Kyparium",
        "Asteriated Ruby","Volcano","Bloodstone","Antique Bloodstone","The Crown Prince",
        "Jade","Quartz","Grey Jade","Monkey King Jade","Diamond Cullinan",
        "Lucky Chinese Jade","Charming Lazurite","Golden Jubilee","Gold","Egypt Gold",
        "Dark Emerald","Emerald Golem","Paraiba Tourmaline","Elaborately Carved Tourmaline","Sapphire Star Of Adam",
        "Deep Sea Pearl","Chrysoberyl Cat's Eye","Red Coral","Natural Zumurud","Carmen-Lucia",
        "Yellow Sapphire","Northern Saber's Eye","Star Sapphire"
    ];
    const SECRET_NAMES = ["Obsidian","Agate","Fantastic Miss Shrimp","Yaphets Stone","Burning Stone"];
    const PEDALS = [
        "Ensnare Pedal","Gale Pedal","Torrent Pedal","Howl Pedal",
        "Acid Pedal","Paralysis Pedal","Terrorize Pedal","Decrepify Pedal"
    ];

    function toSnake(name){
        return name.toLowerCase().replace(/['']/g,"").replace(/-/g," ")
            .replace(/[^a-z0-9 ]/g," ").trim().replace(/\s+/g,"_");
    }
    function pedalBaseSnake(p){ return toSnake(p.replace(/\s*Pedal\s*$/i,"").trim()); }

    function loadBuilds(){
        try{
            const raw = localStorage.getItem(BUILDS_KEY);
            if(!raw) return {};
            const obj = JSON.parse(raw);
            return (obj && typeof obj === "object") ? obj : {};
        }catch{ return {}; }
    }
    function saveBuilds(){ localStorage.setItem(BUILDS_KEY, JSON.stringify(builds)); }

    function getActiveBuildName(){ return localStorage.getItem(ACTIVE_KEY) || ""; }
    function setActiveBuildName(name){ localStorage.setItem(ACTIVE_KEY, name); }

    function b64urlEncode(str){
        return btoa(unescape(encodeURIComponent(str)))
            .replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
    }
    function b64urlDecode(str){
        str = str.replace(/-/g,"+").replace(/_/g,"/");
        while(str.length % 4) str += "=";
        return decodeURIComponent(escape(atob(str)));
    }
    function exportHash(){
        return b64urlEncode(JSON.stringify({ builds, active }));
    }
    function importHash(hash){
        const json = b64urlDecode(hash.trim());
        const obj = JSON.parse(json);
        if(!obj || typeof obj !== "object" || !obj.builds) throw new Error("bad");
        builds = obj.builds;
        active = obj.active && builds[obj.active] ? obj.active : Object.keys(builds)[0];
        setActiveBuildName(active);
        saveBuilds();
        render();
    }

    let builds = loadBuilds();
    let active = getActiveBuildName();

    function ensureOneBuild(){
        if(Object.keys(builds).length === 0){
            builds["default"] = { towers:{}, pedals:{} };
            active = "default";
            setActiveBuildName(active);
            saveBuilds();
        } else if(!builds[active]){
            active = Object.keys(builds)[0];
            setActiveBuildName(active);
        }
    }
    ensureOneBuild();

    const els = {
        buildSelect: document.getElementById("buildSelect"),
        buildName: document.getElementById("buildName"),
        createBuild: document.getElementById("createBuild"),
        renameBuild: document.getElementById("renameBuild"),
        deleteBuild: document.getElementById("deleteBuild"),
        clearBuild: document.getElementById("clearBuild"),
        search: document.getElementById("search"),
        current: document.getElementById("current"),
        towers: document.getElementById("towers"),
        pedals: document.getElementById("pedals"),
        exportBtn: document.getElementById("exportBtn"),
        importBtn: document.getElementById("importBtn"),
        hashBox: document.getElementById("hashBox"),
    };

    function imgNode(url, fallbackText){
        const box=document.createElement("div"); box.className="icon";
        const img=document.createElement("img"); img.loading="lazy"; img.alt=fallbackText; img.src=url;
        img.onerror=()=>{ img.remove(); box.innerHTML='<div style="font-size:10px;color:rgba(230,237,246,.55);padding:4px;text-align:center">'+fallbackText+'</div>'; };
        box.appendChild(img); return box;
    }

    function makeTile(title, subtitle, imgUrl, count, onClick){
        const t=document.createElement("div");
        t.className="tile"+(count>0?" active":"");
        const top=document.createElement("div"); top.className="top";
        const left=document.createElement("div"); left.className="left";
        left.appendChild(imgNode(imgUrl,title));
        const txt=document.createElement("div");
        txt.innerHTML='<div class="name">'+title+'</div><div class="meta">'+subtitle+'</div>';
        left.appendChild(txt);
        const tags=document.createElement("div");
        tags.innerHTML='<span class="tag">x'+count+'</span>';
        top.appendChild(left); top.appendChild(tags);
        t.appendChild(top);
        t.onclick=()=>onClick(false);
        t.oncontextmenu=(e)=>{ e.preventDefault(); onClick(true); };
        return t;
    }

    function matches(name){
        const q = els.search.value.trim().toLowerCase();
        if(!q) return true;
        return name.toLowerCase().includes(q);
    }

    function curBuild(){ return builds[active]; }

    function adjust(map, key, delta){
        map[key] = Math.max(0, (map[key]||0) + delta);
        if(map[key]===0) delete map[key];
        saveBuilds();
        render();
    }

    function renderBuildSelect(){
        els.buildSelect.innerHTML="";
        const names = Object.keys(builds).sort((a,b)=>a.localeCompare(b));
        for(const n of names){
            const opt=document.createElement("option");
            opt.value=n; opt.textContent=n;
            if(n===active) opt.selected=true;
            els.buildSelect.appendChild(opt);
        }
    }

    function render(){
        renderBuildSelect();

        els.current.innerHTML="";
        const b = curBuild();

        const towerEntries = Object.entries(b.towers).sort((a,b)=>a[0].localeCompare(b[0]));
        const pedalEntries = Object.entries(b.pedals).sort((a,b)=>a[0].localeCompare(b[0]));

        for(const [name,count] of towerEntries){
            const isSecret = SECRET_NAMES.includes(name);
            const img = isSecret ? SECRET_IMG(toSnake(name)) : TOWER_IMG(toSnake(name));
            els.current.appendChild(makeTile(name, "Tower", img, count, (rc)=>adjust(b.towers,name, rc?-1:+1)));
        }
        for(const [name,count] of pedalEntries){
            const baseName = name.replace(/^Sparkling\s+/i,"");
            const img = PEDAL_IMG(pedalBaseSnake(baseName));
            els.current.appendChild(makeTile(name, "Sparkling Pedal", img, count, (rc)=>adjust(b.pedals,name, rc?-1:+1)));
        }
        if(els.current.children.length===0){
            const d=document.createElement("div");
            d.className="tile";
            d.innerHTML='<div class="name">Empty</div><div class="meta">Click towers/pedals below to add them.</div>';
            els.current.appendChild(d);
        }

        els.towers.innerHTML="";
        for(const name of [...COMBINED_NAMES, ...SECRET_NAMES].sort((a,b)=>a.localeCompare(b))){
            if(!matches(name)) continue;
            const isSecret = SECRET_NAMES.includes(name);
            const img = isSecret ? SECRET_IMG(toSnake(name)) : TOWER_IMG(toSnake(name));
            const count = b.towers[name]||0;
            els.towers.appendChild(makeTile(name, isSecret?"Secret tower":"Tower", img, count, (rc)=>adjust(b.towers,name, rc?-1:+1)));
        }

        els.pedals.innerHTML="";
        for(const p of PEDALS){
            if(!matches(p)) continue;
            const key = "Sparkling " + p;
            const img = PEDAL_IMG(pedalBaseSnake(p));
            const count = b.pedals[key]||0;
            els.pedals.appendChild(makeTile(key, "Sparkling Pedal", img, count, (rc)=>adjust(b.pedals,key, rc?-1:+1)));
        }
    }

    els.buildSelect.onchange = () => {
        active = els.buildSelect.value;
        setActiveBuildName(active);
        render();
    };

    els.createBuild.onclick = () => {
        const name = (els.buildName.value||"").trim();
        if(!name) return alert("Enter a build name.");
        if(builds[name]) return alert("Build already exists.");
        builds[name] = { towers:{}, pedals:{} };
        active = name;
        setActiveBuildName(active);
        saveBuilds();
        els.buildName.value="";
        render();
    };

    els.renameBuild.onclick = () => {
        const newName = (els.buildName.value||"").trim();
        if(!newName) return alert("Enter a new name.");
        if(builds[newName]) return alert("That name already exists.");
        const data = builds[active];
        delete builds[active];
        builds[newName] = data;
        active = newName;
        setActiveBuildName(active);
        saveBuilds();
        els.buildName.value="";
        render();
    };

    els.deleteBuild.onclick = () => {
        if(Object.keys(builds).length<=1) return alert("You need at least 1 build.");
        if(!confirm('Delete build "'+active+'"?')) return;
        delete builds[active];
        active = Object.keys(builds)[0];
        setActiveBuildName(active);
        saveBuilds();
        render();
    };

    els.clearBuild.onclick = () => {
        if(!confirm('Clear all items from "'+active+'"?')) return;
        builds[active].towers = {};
        builds[active].pedals = {};
        saveBuilds();
        render();
    };

    els.exportBtn.onclick = () => {
        const h = exportHash();
        els.hashBox.value = h;
        els.hashBox.select();
        document.execCommand("copy");
        alert("Export copied.");
    };

    els.importBtn.onclick = () => {
        const h = (els.hashBox.value||"").trim();
        if(!h) return alert("Paste a hash first.");
        try{ importHash(h); alert("Imported!"); }
        catch{ alert("Invalid hash."); }
    };

    els.search.addEventListener("input", render);

    render();
})();
