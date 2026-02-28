(() => {
    const BUILDS_KEY = "gemtd_builds_v2";
    const ACTIVE_KEY = "gemtd_active_build_v1";
    const RUN_KEY = "gemtd_run_picked_v2";

    const TOWER_IMG  = (snake) => '/gems/advanced/gemtd_' + snake + '.png';
    const SECRET_IMG = (snake) => '/gems/secrets/gemtd_' + snake + '.png';
    const BASIC_IMG  = (letter) => '/gems/basics/' + letter + '.png';
    const PEDAL_IMG  = (snakeNoPedal) => '/gems/pedals/gemtd_' + snakeNoPedal + '.png';

    const GEM_LETTERS = ["B","D","E","G","P","Q","R","Y"];
    const BASE_GEMS = [];
    for (const L of GEM_LETTERS) for (let i=1;i<=6;i++) BASE_GEMS.push(L+i);

    const COMBINED = [
        { name:"Silver", recipes:[["B1","Y1","D1"]] },
        { name:"Silver Knight", recipes:[["Silver","Q2","R3"]] },
        { name:"Pink Diamond", recipes:[["D5","Y3","D3"]] },
        { name:"Huge Pink Diamond", recipes:[["Pink Diamond","Silver Knight","Silver"]] },
        { name:"Koh-i-noor Diamond", recipes:[["Huge Pink Diamond","P6","D6"], ["P1","P2","P3","P4","P5"]] },
        { name:"Malachite", recipes:[["E1","Q1","G1"]] },
        { name:"Vivid Malachite", recipes:[["Malachite","D2","Y3"]] },
        { name:"Uranium-238", recipes:[["Y5","E2","B3"]] },
        { name:"Uranium-235", recipes:[["Uranium-238","Vivid Malachite","Malachite"]] },
        { name:"Depleted-Kyparium", recipes:[["Uranium-235","Q6","Y6"], ["Q1","Q2","Q3","Q4","Q5"]] },
        { name:"Asteriated Ruby", recipes:[["R2","R1","P1"]] },
        { name:"Volcano", recipes:[["Asteriated Ruby","R4","P3"]] },
        { name:"Bloodstone", recipes:[["R5","Q4","P3"]] },
        { name:"Antique Bloodstone", recipes:[["Bloodstone","Volcano","R2"]] },
        { name:"The Crown Prince", recipes:[["Antique Bloodstone","R6","G6"], ["R1","R2","R3","R4","R5"]] },
        { name:"Jade", recipes:[["G3","E3","B2"]] },
        { name:"Quartz", recipes:[["G4","R3","P2"]] },
        { name:"Grey Jade", recipes:[["Jade","B4","Q3"]] },
        { name:"Monkey King Jade", recipes:[["Grey Jade","G4","P2"]] },
        { name:"Diamond Cullinan", recipes:[["Monkey King Jade","D6","B6"], ["D1","D2","D3","D4","D5"]] },
        { name:"Lucky Chinese Jade", recipes:[["Jade","Quartz","G3"]] },
        { name:"Charming Lazurite", recipes:[["Quartz","P4","Y2"]] },
        { name:"Golden Jubilee", recipes:[["Charming Lazurite","Y6","R6"], ["Y1","Y2","Y3","Y4","Y5"]] },
        { name:"Gold", recipes:[["P5","P4","D2"]] },
        { name:"Egypt Gold", recipes:[["Gold","P5","Q2"]] },
        { name:"Dark Emerald", recipes:[["G5","B4","Y2"]] },
        { name:"Emerald Golem", recipes:[["Gold","Dark Emerald","D3"]] },
        { name:"Paraiba Tourmaline", recipes:[["Q5","E4","G2"]] },
        { name:"Elaborately Carved Tourmaline", recipes:[["Paraiba Tourmaline","Dark Emerald","G2"]] },
        { name:"Sapphire Star Of Adam", recipes:[["Elaborately Carved Tourmaline","G6","P6"], ["G1","G2","G3","G4","G5"]] },
        { name:"Deep Sea Pearl", recipes:[["Q4","D4","E2"]] },
        { name:"Chrysoberyl Cat's Eye", recipes:[["E5","D4","Q3"]] },
        { name:"Red Coral", recipes:[["Chrysoberyl Cat's Eye","Deep Sea Pearl","E4"]] },
        { name:"Natural Zumurud", recipes:[["Deep Sea Pearl","G5","D3"]] },
        { name:"Carmen-Lucia", recipes:[["Red Coral","E6","Q6"], ["E1","E2","E3","E4","E5"]] },
        { name:"Yellow Sapphire", recipes:[["B5","Y4","R4"]] },
        { name:"Northern Saber's Eye", recipes:[["Yellow Sapphire","Bloodstone","B5"]] },
        { name:"Star Sapphire", recipes:[["Yellow Sapphire","B6","E6"], ["B1","B2","B3","B4","B5"]] },
    ];

    const SECRET = [
        { name:"Obsidian" },{ name:"Agate" },{ name:"Fantastic Miss Shrimp" },{ name:"Yaphets Stone" },{ name:"Burning Stone" },
    ];
    const SECRET_SET = new Set(SECRET.map(x=>x.name));

    function toSnake(name){
        return name.toLowerCase().replace(/['']/g,"").replace(/-/g," ")
            .replace(/[^a-z0-9 ]/g," ").trim().replace(/\s+/g,"_");
    }
    function pedalBaseSnake(p){ return toSnake(p.replace(/\s*Pedal\s*$/i,"").trim()); }

    function loadBuilds(){
        try{ return JSON.parse(localStorage.getItem(BUILDS_KEY)||"{}")||{}; }
        catch{ return {}; }
    }
    function loadPicked(){
        try{ return JSON.parse(localStorage.getItem(RUN_KEY)||"{}")||{}; }
        catch{ return {}; }
    }
    function savePicked(){ localStorage.setItem(RUN_KEY, JSON.stringify(picked)); }

    function getActiveBuild(){ return localStorage.getItem(ACTIVE_KEY) || ""; }

    let builds = loadBuilds();
    let picked = loadPicked();
    let active = getActiveBuild();

    function ensurePicked(buildName){
        if(!picked[buildName]) picked[buildName] = { gems:{}, oneshotTowers:{}, pedals:{} };
        if(picked[buildName].towers && !picked[buildName].oneshotTowers){
            picked[buildName].oneshotTowers = picked[buildName].towers;
            delete picked[buildName].towers;
            savePicked();
        }
    }

    const recipeMap = new Map();
    for(const t of COMBINED) recipeMap.set(t.name,{type:"combined",recipes:t.recipes});
    for(const t of SECRET) recipeMap.set(t.name,{type:"secret",recipes:[]});
    for(const g of BASE_GEMS) recipeMap.set(g,{type:"gem",recipes:[]});

    function emptyGemCounts(){ const m={}; for(const g of BASE_GEMS) m[g]=0; return m; }
    function addCounts(a,b,mul=1){ for(const k in b) a[k]+= (b[k]||0)*mul; }
    function sumCounts(a){ let s=0; for(const k in a) s+=a[k]||0; return s; }
    function isBasicGem(x){ return BASE_GEMS.includes(x); }
    function isOneShotRecipe(recipe){ return recipe.every(isBasicGem); }

    const memoBest = new Map();
    function bestExpansionForOne(name){
        if(memoBest.has(name)) return memoBest.get(name);

        if(BASE_GEMS.includes(name)){
            const c=emptyGemCounts(); c[name]=1;
            const out={counts:c,total:1}; memoBest.set(name,out); return out;
        }

        const info = recipeMap.get(name);
        if(!info || info.type==="secret" || !info.recipes?.length){
            const out={counts:emptyGemCounts(),total:0}; memoBest.set(name,out); return out;
        }

        const filtered = info.recipes.filter(r => !isOneShotRecipe(r));
        const recipesToUse = filtered.length ? filtered : info.recipes;

        let best=null;
        for(const r of recipesToUse){
            const c=emptyGemCounts();
            for(const ing of r){
                const exp = bestExpansionForOne(ing);
                addCounts(c, exp.counts, 1);
            }
            const tot=sumCounts(c);
            if(!best || tot<best.total) best={counts:c,total:tot};
        }
        memoBest.set(name,best);
        return best;
    }

    function isTowerOneShotAllowed(name){
        const info = recipeMap.get(name);
        if(!info || info.type!=="combined") return false;
        return info.recipes.some(r => isOneShotRecipe(r));
    }

    const els = {
        buildSelect: document.getElementById("buildSelect"),
        resetRun: document.getElementById("resetRun"),
        status: document.getElementById("status"),
        needTowers: document.getElementById("needTowers"),
        needPedals: document.getElementById("needPedals"),
        needGems: document.getElementById("needGems"),
    };

    function imgNode(url, fallbackText){
        const box=document.createElement("div"); box.className="icon";
        const img=document.createElement("img"); img.loading="lazy"; img.alt=fallbackText; img.src=url;
        img.onerror=()=>{ img.remove(); box.innerHTML='<div style="font-size:10px;color:rgba(230,237,246,.55);padding:4px;text-align:center">'+fallbackText+'</div>'; };
        box.appendChild(img); return box;
    }

    function makeNeedTile(title, subtitle, imgUrl, need, got, onClick){
        const surplus = got - need;
        const cls = surplus > 0 ? "tile bad" : (got>0 ? "tile good" : "tile");
        const t=document.createElement("div");
        t.className = cls;

        const top=document.createElement("div"); top.className="top";
        const left=document.createElement("div"); left.className="left";
        left.appendChild(imgNode(imgUrl, (typeof title==="string"?title:"item")));
        const txt=document.createElement("div");
        const extra = surplus>0 ? ' • <span style="color:#ff9aa0">Surplus: '+surplus+'</span>' : "";
        txt.innerHTML='<div class="name">'+title+'</div><div class="meta">'+subtitle+' • Need: '+need+' • Picked: '+got+extra+'</div>';
        left.appendChild(txt);

        const tags=document.createElement("div");
        tags.innerHTML='<span class="tag">Need '+need+'</span>';
        top.appendChild(left); top.appendChild(tags);
        t.appendChild(top);

        t.onclick=()=>onClick(false);
        t.oncontextmenu=(e)=>{ e.preventDefault(); onClick(true); };

        return t;
    }

    function inc(obj, key, delta){
        obj[key] = Math.max(0, (obj[key]||0) + delta);
        if(obj[key]===0) delete obj[key];
    }

    function computeLockedGems(pickedObj){
        const locked = emptyGemCounts();
        for(const [name, cnt] of Object.entries(pickedObj.oneshotTowers || {})){
            const n = cnt || 0;
            if(n <= 0) continue;
            const info = recipeMap.get(name);
            if(info?.type !== "combined") continue;
            const exp = bestExpansionForOne(name).counts;
            addCounts(locked, exp, n);
        }
        return locked;
    }

    function compute(buildName){
        const b = builds[buildName];
        if(!b) return null;

        ensurePicked(buildName);
        const p = picked[buildName];

        const plannedTowers = {...(b.towers||{})};
        const plannedPedals = {...(b.pedals||{})};

        const lockedGems = computeLockedGems(p);

        const baseNeedGems = emptyGemCounts();
        for(const [towerName, cnt] of Object.entries(plannedTowers)){
            const count = cnt||0;
            if(count<=0) continue;
            const info = recipeMap.get(towerName);
            if(info?.type==="secret") continue;
            const exp = bestExpansionForOne(towerName).counts;
            addCounts(baseNeedGems, exp, count);
        }

        const needOneShotTowers = {};
        for (const [towerName, cnt] of Object.entries(plannedTowers)) {
            const count = cnt || 0;
            if (count <= 0) continue;
            const info = recipeMap.get(towerName);
            if (info?.type === "secret") {
                needOneShotTowers[towerName] = (needOneShotTowers[towerName] || 0) + count;
            }
        }

        const eligible = new Set();
        for (const [towerName, cnt] of Object.entries(plannedTowers)) {
            const count = cnt || 0;
            if (count <= 0) continue;
            if (isTowerOneShotAllowed(towerName)) eligible.add(towerName);
            collectOneShotEligibleSubTowers(towerName, eligible);
        }

        for (const s of eligible) {
            if (SECRET_SET.has(s)) continue;
            const occ = countOccurrencesInBuild(s, plannedTowers);
            if (occ > 0) needOneShotTowers[s] = occ;
        }

        const canceledByOneshot = emptyGemCounts();
        for(const [towerName, got] of Object.entries(p.oneshotTowers||{})){
            const pickedCount = got||0;
            if(pickedCount<=0) continue;
            const info = recipeMap.get(towerName);
            if(info?.type !== "combined") continue;
            const planned = plannedTowers[towerName] || countOccurrencesInBuild(towerName, plannedTowers);
            const effective = Math.min(planned, pickedCount);
            const exp = bestExpansionForOne(towerName).counts;
            addCounts(canceledByOneshot, exp, effective);
        }

        const remainingGems = emptyGemCounts();
        for(const g of BASE_GEMS){
            const need = baseNeedGems[g]||0;
            const cancel = canceledByOneshot[g]||0;
            const pickedGem = (p.gems && p.gems[g]) ? p.gems[g] : 0;
            const locked = lockedGems[g] || 0;
            const usablePicked = Math.max(0, pickedGem - locked);
            remainingGems[g] = Math.max(0, need - cancel - usablePicked);
        }

        const remainingOneShotTowers = {};
        for(const [name, need] of Object.entries(needOneShotTowers)){
            const got = (p.oneshotTowers && p.oneshotTowers[name]) ? p.oneshotTowers[name] : 0;
            remainingOneShotTowers[name] = Math.max(0, need - got);
        }

        const remainingPedals = {};
        for(const [key, need] of Object.entries(plannedPedals)){
            const got = (p.pedals && p.pedals[key]) ? p.pedals[key] : 0;
            remainingPedals[key] = Math.max(0, (need||0) - got);
        }

        const gemsLeft = sumCounts(remainingGems);
        const towersLeft = Object.values(remainingOneShotTowers).reduce((a,b)=>a+b,0);
        const pedalsLeft = Object.values(remainingPedals).reduce((a,b)=>a+b,0);
        const finished = (gemsLeft===0 && towersLeft===0 && pedalsLeft===0);

        return {
            plannedTowers,
            baseNeedGems,
            remainingGems,
            remainingOneShotTowers,
            remainingPedals,
            needOneShotTowers,
            lockedGems,
            finished,
            picked: p
        };
    }

    function countOccurrencesInBuild(targetName, plannedTowers){
        let total = 0;
        for(const [towerName, cnt] of Object.entries(plannedTowers)){
            const count = cnt||0;
            if(count<=0) continue;
            total += countOccurrencesInTower(targetName, towerName) * count;
        }
        return total;
    }

    const memoOcc = new Map();
    function countOccurrencesInTower(targetName, towerName){
        const key = targetName + "||" + towerName;
        if(memoOcc.has(key)) return memoOcc.get(key);

        if(towerName === targetName){
            memoOcc.set(key, 1);
            return 1;
        }
        if(BASE_GEMS.includes(towerName)){
            memoOcc.set(key, 0);
            return 0;
        }

        const info = recipeMap.get(towerName);
        if(!info || info.type==="secret" || !info.recipes?.length){
            memoOcc.set(key, 0);
            return 0;
        }

        const filtered = info.recipes.filter(r => !isOneShotRecipe(r));
        const recipe = (filtered.length ? filtered[0] : info.recipes[0]);

        let sum = 0;
        for(const ing of recipe){
            sum += countOccurrencesInTower(targetName, ing);
        }
        memoOcc.set(key, sum);
        return sum;
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
        builds = loadBuilds();
        if(!builds || Object.keys(builds).length===0){
            els.status.textContent = "No builds found. Create one in the Build Planner.";
            return;
        }
        if(!builds[active]) active = Object.keys(builds)[0];

        renderBuildSelect();
        ensurePicked(active);

        const res = compute(active);
        if(!res){
            els.status.textContent = "Build not found.";
            return;
        }

        const gemsLeft = sumCounts(res.remainingGems);
        const towersLeft = Object.values(res.remainingOneShotTowers).reduce((a,b)=>a+b,0);
        const pedalsLeft = Object.values(res.remainingPedals).reduce((a,b)=>a+b,0);

        els.status.innerHTML =
            'Build: <b>'+active+'</b> • Remaining: ' +
            '<b style="color:'+(res.finished ? '#b7ffb7' : '#e6edf6')+'">' +
            gemsLeft+' gems, '+towersLeft+' one-shots, '+pedalsLeft+' pedals</b>';

        els.needTowers.innerHTML="";
        const towerEntries = Object.entries(res.needOneShotTowers).sort((a,b)=>a[0].localeCompare(b[0]));
        if(towerEntries.length===0){
            els.needTowers.innerHTML = '<div class="tile"><div class="name">None</div><div class="meta">No one-shot towers relevant.</div></div>';
        } else {
            for(const [name, need] of towerEntries){
                const got = res.picked.oneshotTowers[name]||0;
                const remaining = res.remainingOneShotTowers[name]||0;
                const img = SECRET_SET.has(name) ? SECRET_IMG(toSnake(name)) : TOWER_IMG(toSnake(name));
                const label = SECRET_SET.has(name) ? "Secret (must one-shot)" : "Optional one-shot (cancels gems)";

                const tile = makeNeedTile(
                    name,
                    label+' • Remaining: '+remaining,
                    img,
                    need,
                    got,
                    (rc) => {
                        const delta = rc ? -1 : +1;
                        inc(res.picked.oneshotTowers, name, delta);
                        const info = recipeMap.get(name);
                        if (info?.type === "combined") {
                            const exp = bestExpansionForOne(name).counts;
                            for (const g of BASE_GEMS) {
                                const add = (exp[g] || 0) * delta;
                                if (add !== 0) inc(res.picked.gems, g, add);
                            }
                        }
                        picked[active] = res.picked;
                        savePicked();
                        render();
                    }
                );

                if(remaining===0) tile.className = "tile good";
                els.needTowers.appendChild(tile);
            }
        }

        els.needPedals.innerHTML="";
        const pedalEntries = Object.entries(res.remainingPedals).sort((a,b)=>a[0].localeCompare(b[0]));
        if(pedalEntries.length===0){
            els.needPedals.innerHTML = '<div class="tile good"><div class="name">Done</div><div class="meta">No pedals remaining.</div></div>';
        } else {
            for(const [key, remaining] of pedalEntries){
                if(remaining<=0) continue;
                const planned = (builds[active].pedals||{})[key]||0;
                const got = res.picked.pedals[key]||0;
                const baseName = key.replace(/^Sparkling\s+/i,"");
                const img = PEDAL_IMG(pedalBaseSnake(baseName));
                els.needPedals.appendChild(makeNeedTile(
                    key,
                    'Sparkling pedal • Remaining: '+remaining,
                    img,
                    planned,
                    got,
                    (rc)=>{ inc(res.picked.pedals, key, rc?-1:+1); picked[active]=res.picked; savePicked(); render(); }
                ));
            }
            if(!els.needPedals.children.length){
                els.needPedals.innerHTML = '<div class="tile good"><div class="name">Done</div><div class="meta">All pedals completed.</div></div>';
            }
        }

        els.needGems.innerHTML="";
        let any=false;
        for(const g of BASE_GEMS){
            const remaining = res.remainingGems[g]||0;
            const planned = res.baseNeedGems[g]||0;
            const got = res.picked.gems[g]||0;
            const locked = (res.lockedGems && res.lockedGems[g]) ? res.lockedGems[g] : 0;

            if(planned===0 && got===0) continue;
            any=true;

            const img = BASIC_IMG(g[0]);
            const subtitle =
                'Remaining: '+remaining +
                (locked>0 ? ' • Locked: '+locked : "");

            const tile = makeNeedTile(
                '<span class="mono">'+g+'</span>',
                subtitle,
                img,
                planned,
                got,
                (rc)=>{
                    const delta = rc ? -1 : +1;
                    const cur = res.picked.gems[g] || 0;
                    if(delta < 0 && cur <= locked) return;
                    inc(res.picked.gems, g, delta);
                    picked[active]=res.picked;
                    savePicked();
                    render();
                }
            );

            if(remaining===0 && planned>0) tile.className = "tile good";
            els.needGems.appendChild(tile);
        }
        if(!any){
            els.needGems.innerHTML = '<div class="tile good"><div class="name">Done</div><div class="meta">No gems remaining.</div></div>';
        }

        const planIcons = document.getElementById("planIcons");
        planIcons.innerHTML = "";

        const plan = builds[active].towers || {};
        const sortedPlan = Object.entries(plan).sort((a,b)=>a[0].localeCompare(b[0]));
        const planDone = computePlanDoneMap(plan, res.picked);

        for(const [towerName, count] of sortedPlan){
            const done = !!planDone[towerName];
            const chip = document.createElement("div");
            chip.className = "iconChip" + (done ? " done" : "");
            const img = document.createElement("img");
            img.loading = "lazy";
            img.alt = towerName;
            img.src = SECRET_SET.has(towerName) ? SECRET_IMG(toSnake(towerName)) : TOWER_IMG(toSnake(towerName));
            img.onerror = () => { img.remove(); chip.textContent = towerName.slice(0,6); };
            chip.appendChild(img);
            const badge = document.createElement("div");
            badge.className = "badge";
            badge.textContent = "x" + count;
            chip.appendChild(badge);
            planIcons.appendChild(chip);
        }

        const plannedPedals = builds[active].pedals || {};
        for (const [key, count] of Object.entries(plannedPedals).sort((a,b)=>a[0].localeCompare(b[0]))) {
            const got = (res.picked.pedals && res.picked.pedals[key]) ? res.picked.pedals[key] : 0;
            const done = got >= (count || 0);
            const baseName = key.replace(/^Sparkling\s+/i,"");
            const imgUrl = PEDAL_IMG(pedalBaseSnake(baseName));
            const chip = document.createElement("div");
            chip.className = "iconChip" + (done ? " done" : "");
            const img = document.createElement("img");
            img.loading = "lazy";
            img.alt = key;
            img.src = imgUrl;
            img.onerror = () => { img.remove(); chip.textContent = baseName.slice(0,6); };
            chip.appendChild(img);
            const badge = document.createElement("div");
            badge.className = "badge";
            badge.textContent = "x" + count;
            chip.appendChild(badge);
            planIcons.appendChild(chip);
        }
    }

    function collectOneShotEligibleSubTowers(rootName, outSet){
        if(BASE_GEMS.includes(rootName)) return;
        const info = recipeMap.get(rootName);
        if(!info || info.type==="secret" || !info.recipes?.length) return;
        const filtered = info.recipes.filter(r => !isOneShotRecipe(r));
        const recipe = (filtered.length ? filtered[0] : info.recipes[0]);
        for(const ing of recipe){
            const ingInfo = recipeMap.get(ing);
            if(ingInfo?.type==="combined" && isTowerOneShotAllowed(ing)){
                outSet.add(ing);
            }
            collectOneShotEligibleSubTowers(ing, outSet);
        }
    }

    els.buildSelect.onchange = () => {
        active = els.buildSelect.value;
        localStorage.setItem(ACTIVE_KEY, active);
        render();
    };

    els.resetRun.onclick = () => {
        if(!confirm('Reset picked counts for "'+active+'"?')) return;
        picked[active] = { gems:{}, oneshotTowers:{}, pedals:{} };
        savePicked();
        render();
    };

    function cloneCounts(obj){ return JSON.parse(JSON.stringify(obj||{})); }

    function buildInventoryFromPicked(pickedObj){
        const locked = computeLockedGems(pickedObj);
        const gems = cloneCounts(pickedObj.gems || {});
        for(const g of BASE_GEMS){
            gems[g] = Math.max(0, (gems[g]||0) - (locked[g]||0));
            if(gems[g]===0) delete gems[g];
        }
        return {
            gems,
            towers: cloneCounts(pickedObj.oneshotTowers || {})
        };
    }

    function getPlanningRecipe(towerName){
        const info = recipeMap.get(towerName);
        if(!info || info.type!=="combined") return null;
        const filtered = info.recipes.filter(r => !isOneShotRecipe(r));
        return (filtered.length ? filtered[0] : info.recipes[0]);
    }

    function canCraftOne(towerName, inv){
        if(BASE_GEMS.includes(towerName)){
            if((inv.gems[towerName]||0) <= 0) return false;
            inv.gems[towerName]--;
            return true;
        }
        const info = recipeMap.get(towerName);
        if(!info) return false;
        if(info.type === "secret") return false;
        if((inv.towers[towerName]||0) > 0){
            inv.towers[towerName]--;
            return true;
        }
        const recipe = getPlanningRecipe(towerName);
        if(!recipe) return false;
        const snapshot = { gems: cloneCounts(inv.gems), towers: cloneCounts(inv.towers) };
        for(const ing of recipe){
            if(!canCraftOne(ing, inv)){
                inv.gems = snapshot.gems;
                inv.towers = snapshot.towers;
                return false;
            }
        }
        return true;
    }

    function towerComplexity(name){
        return bestExpansionForOne(name)?.total ?? 0;
    }

    function computePlanDoneMap(plannedTowers, pickedObj){
        const inv = buildInventoryFromPicked(pickedObj);
        const entries = Object.entries(plannedTowers)
            .filter(([n,c]) => (c||0) > 0)
            .filter(([n,_]) => !SECRET_SET.has(n))
            .sort((a,b) => towerComplexity(b[0]) - towerComplexity(a[0]));

        const crafted = {};
        for(const [towerName, needCount] of entries){
            let ok = 0;
            for(let i=0;i<needCount;i++){
                if(canCraftOne(towerName, inv)) ok++;
                else break;
            }
            crafted[towerName] = ok;
        }

        const doneMap = {};
        for(const [towerName, needCount] of Object.entries(plannedTowers)){
            const req = needCount||0;
            if(req<=0) continue;
            if(SECRET_SET.has(towerName)){
                const got = (pickedObj.oneshotTowers?.[towerName] || 0);
                doneMap[towerName] = got >= req;
            } else {
                doneMap[towerName] = (crafted[towerName] || 0) >= req;
            }
        }
        return doneMap;
    }

    render();
})();
