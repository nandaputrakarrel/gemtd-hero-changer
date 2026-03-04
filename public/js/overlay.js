(() => {
    const BUILDS_KEY = "gemtd_builds_v2";
    const ACTIVE_KEY = "gemtd_active_build_v1";
    const RUN_KEY    = "gemtd_run_picked_v2"; // per build

    const TOWER_IMG  = (snake) => `/gems/advanced/gemtd_${snake}.png`;
    const SECRET_IMG = (snake) => `/gems/secrets/gemtd_${snake}.png`;
    const BASIC_IMG  = (letter) => `/gems/basics/${letter}.png`;
    const PEDAL_IMG  = (snakeNoPedal) => `/gems/pedals/gemtd_${snakeNoPedal}.png`;

    const GEM_LETTERS = ["B","D","E","G","P","Q","R","Y"];
    const BASE_GEMS = [];
    for (const L of GEM_LETTERS) for (let i=1;i<=6;i++) BASE_GEMS.push(`${L}${i}`);

    // --- recipes ---
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

    function loadBuilds(){ try{ return JSON.parse(localStorage.getItem(BUILDS_KEY)||"{}")||{}; } catch{ return {}; } }
    function loadPicked(){ try{ return JSON.parse(localStorage.getItem(RUN_KEY)||"{}")||{}; } catch{ return {}; } }
    function savePicked(){ localStorage.setItem(RUN_KEY, JSON.stringify(picked)); }
    function getActiveBuild(){ return localStorage.getItem(ACTIVE_KEY) || ""; }

    let builds = loadBuilds();
    let picked = loadPicked();
    let active = getActiveBuild();

    function ensurePicked(buildName){
        if(!picked[buildName]) picked[buildName] = { gems:{}, oneshotTowers:{}, pedals:{} };
        // migration safety
        if(picked[buildName].towers && !picked[buildName].oneshotTowers){
            picked[buildName].oneshotTowers = picked[buildName].towers;
            delete picked[buildName].towers;
            savePicked();
        }
    }

    // --- planning expansion (ignore one-shot recipes) ---
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

    const memoOcc = new Map();
    function countOccurrencesInTower(targetName, towerName){
        const key = targetName + "||" + towerName;
        if(memoOcc.has(key)) return memoOcc.get(key);

        if(towerName === targetName){ memoOcc.set(key, 1); return 1; }
        if(BASE_GEMS.includes(towerName)){ memoOcc.set(key, 0); return 0; }

        const info = recipeMap.get(towerName);
        if(!info || info.type==="secret" || !info.recipes?.length){ memoOcc.set(key, 0); return 0; }

        const filtered = info.recipes.filter(r => !isOneShotRecipe(r));
        const recipe = (filtered.length ? filtered[0] : info.recipes[0]);

        let sum = 0;
        for(const ing of recipe) sum += countOccurrencesInTower(targetName, ing);

        memoOcc.set(key, sum);
        return sum;
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

    function compute(buildName){
        const b = builds[buildName];
        if(!b) return null;

        ensurePicked(buildName);
        const p = picked[buildName];

        const plannedTowers = {...(b.towers||{})};
        const plannedPedals = {...(b.pedals||{})};
        const plannedGems   = {...(b.gems||{})};

        const lockedGems = computeLockedGems(p);

        // base gem need from planned towers (craft chain)
        const baseNeedGems = emptyGemCounts();
        for(const [towerName, cnt] of Object.entries(plannedTowers)){
            const count = cnt||0;
            if(count<=0) continue;
            const info = recipeMap.get(towerName);
            if(info?.type==="secret") continue;
            const exp = bestExpansionForOne(towerName).counts;
            addCounts(baseNeedGems, exp, count);
        }

        // add explicit planned base gems (from planner)
        for (const [g, cnt] of Object.entries(plannedGems)) {
            const n = cnt || 0;
            if (n <= 0) continue;
            if (!BASE_GEMS.includes(g)) continue;
            baseNeedGems[g] += n;
        }

        // one-shot needs: secrets required + eligible optional towers in build chain
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

        // cancel gem requirements for one-shot picked
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

        // remaining gems = baseNeed - canceled - usablePicked (picked minus locked)
        const remainingGems = emptyGemCounts();
        for(const g of BASE_GEMS){
            const need = baseNeedGems[g]||0;
            const cancel = canceledByOneshot[g]||0;

            const pickedGem = (p.gems && p.gems[g]) ? p.gems[g] : 0;
            const locked = lockedGems[g] || 0;
            const usablePicked = Math.max(0, pickedGem - locked);

            remainingGems[g] = Math.max(0, need - cancel - usablePicked);
        }

        return {
            baseNeedGems,
            remainingGems,
            needOneShotTowers,
            lockedGems,
            picked: p,
            plannedGems
        };
    }

    // --- UI bits ---
    const buildSelect = document.getElementById("buildSelect");
    const resetBtn = document.getElementById("resetRunBtn");
    const titleEl = document.getElementById("title");

    function renderBuildSelect(){
        if(!buildSelect) return;
        buildSelect.innerHTML="";
        const names = Object.keys(builds).sort((a,b)=>a.localeCompare(b));
        for(const n of names){
            const opt=document.createElement("option");
            opt.value=n; opt.textContent=n;
            if(n===active) opt.selected=true;
            buildSelect.appendChild(opt);
        }
    }

    // --- QUICK BAR (one-shots + pedals) ---
    function renderQuickBar(res){
        const quick = document.getElementById("quickBar");
        if(!quick) return;
        quick.innerHTML = "";

        const build = builds[active];
        if(!build) return;

        const oneShotEntries = Object.entries(res.needOneShotTowers || {})
            .filter(([_, need]) => (need||0) > 0)
            .sort((a,b)=>a[0].localeCompare(b[0]));

        const pedalEntries = Object.entries(build.pedals || {})
            .filter(([_, c]) => (c||0) > 0)
            .sort((a,b)=>a[0].localeCompare(b[0]));

        function addBtn({ imgUrl, alt, tag, got, need, onLeft, onRight }){
            const btn = document.createElement("div");
            btn.className = "quickBtn" + ((need>0 && got>=need) ? " done" : "");
            btn.title = `${alt}\nNeed: ${need} | Picked: ${got}\nLeft: +1 | Right: -1`;

            const img = document.createElement("img");
            img.loading="lazy";
            img.alt=alt;
            img.src=imgUrl;
            img.onerror=()=>{ img.remove(); btn.textContent = alt.slice(0,6); };
            btn.appendChild(img);

            if(tag){
                const t=document.createElement("div");
                t.className="quickTag";
                t.textContent=tag;
                btn.appendChild(t);
            }

            const c=document.createElement("div");
            c.className="quickCount";
            c.textContent=got;
            btn.appendChild(c);

            btn.onclick=()=>onLeft();
            btn.oncontextmenu=(e)=>{ e.preventDefault(); onRight(); };

            quick.appendChild(btn);
        }

        // one-shot towers
        for(const [name, need] of oneShotEntries){
            const got = res.picked.oneshotTowers?.[name] || 0;
            const imgUrl = SECRET_SET.has(name) ? SECRET_IMG(toSnake(name)) : TOWER_IMG(toSnake(name));
            const tag = SECRET_SET.has(name) ? "Sec" : "1S";;

            addBtn({
                imgUrl,
                alt: name,
                tag,
                got,
                need,
                onLeft: () => {
                    inc(res.picked.oneshotTowers, name, +1);

                    // add the base gems "represented" (locks them)
                    const info = recipeMap.get(name);
                    if(info?.type === "combined"){
                        const exp = bestExpansionForOne(name).counts;
                        for(const g of BASE_GEMS){
                            const add = (exp[g]||0);
                            if(add) inc(res.picked.gems, g, add);
                        }
                    }

                    picked[active]=res.picked;
                    savePicked();
                    render();
                },
                onRight: () => {
                    const before = res.picked.oneshotTowers?.[name] || 0;
                    if(before<=0) return;

                    inc(res.picked.oneshotTowers, name, -1);

                    // remove represented gems
                    const info = recipeMap.get(name);
                    if(info?.type === "combined"){
                        const exp = bestExpansionForOne(name).counts;
                        for(const g of BASE_GEMS){
                            const sub = (exp[g]||0);
                            if(sub) inc(res.picked.gems, g, -sub);
                        }
                    }

                    picked[active]=res.picked;
                    savePicked();
                    render();
                }
            });
        }

        // pedals
        for(const [key, need] of pedalEntries){
            const got = res.picked.pedals?.[key] || 0;
            const baseName = key.replace(/^Sparkling\s+/i,"");
            const imgUrl = PEDAL_IMG(pedalBaseSnake(baseName));

            addBtn({
                imgUrl,
                alt: key,
                tag: "P",
                got,
                need,
                onLeft: () => {
                    inc(res.picked.pedals, key, +1);
                    picked[active]=res.picked;
                    savePicked();
                    render();
                },
                onRight: () => {
                    inc(res.picked.pedals, key, -1);
                    picked[active]=res.picked;
                    savePicked();
                    render();
                }
            });
        }
    }

    // --- BASE GEM ICON LISTS (remaining only) ---
    function renderGemOverlay(res){
        const left = document.getElementById("gemListLeft");
        const right = document.getElementById("gemListRight");
        if(!left || !right) return;

        left.innerHTML="";
        right.innerHTML="";

        const gems = Object.entries(res.remainingGems)
            .filter(([_,v]) => v>0)
            .sort((a,b)=>a[0].localeCompare(b[0]));

        const half = Math.ceil(gems.length/2);

        function makeGem(g, remaining){
            const btn = document.createElement("div");
            btn.className = "quickBtn";
            btn.title = `${g} remaining: ${remaining}\nLeft: picked +1 | Right: picked -1`;

            const img = document.createElement("img");
            img.loading = "lazy";
            img.alt = g;
            img.src = BASIC_IMG(g[0]);
            img.onerror = () => img.remove();
            btn.appendChild(img);

            const t=document.createElement("div");
            t.className="quickTag";
            t.textContent=g;
            btn.appendChild(t);

            const c = document.createElement("div");
            c.className = "quickCount";
            c.textContent = remaining;
            btn.appendChild(c);

            btn.onclick = () => {
                inc(res.picked.gems, g, +1);
                picked[active]=res.picked;
                savePicked();
                render();
            };

            btn.oncontextmenu = (e) => {
                e.preventDefault();

                // block decrement below locked
                const locked = (res.lockedGems && res.lockedGems[g]) ? res.lockedGems[g] : 0;
                const cur = res.picked.gems?.[g] || 0;
                if(cur <= locked) return;

                inc(res.picked.gems, g, -1);
                picked[active]=res.picked;
                savePicked();
                render();
            };

            return btn;
        }

        gems.slice(0,half).forEach(([g,v]) => left.appendChild(makeGem(g,v)));
        gems.slice(half).forEach(([g,v]) => right.appendChild(makeGem(g,v)));
    }

    function makeIconBtn(imgUrl, alt, count, done){
        const btn = document.createElement("div");
        btn.className = "quickBtn" + (done ? " done" : "");
        btn.title = `${alt} x${count}`;

        const img = document.createElement("img");
        img.loading="lazy";
        img.alt=alt;
        img.src=imgUrl;
        img.onerror=()=>{ img.remove(); btn.textContent = alt.slice(0,6); };
        btn.appendChild(img);

        const c=document.createElement("div");
        c.className="quickCount";
        c.textContent=count;
        btn.appendChild(c);

        return btn;
    }

    // Plan bar includes: planned towers + planned pedals + planned base gems
    function renderPlanBar(res){
        const planBar = document.getElementById("planBar");
        if(!planBar) return;

        planBar.innerHTML = "";

        const build = builds[active];
        if(!build) return;

        const planEntries = Object.entries(build.towers || {})
            .filter(([_,c]) => (c||0) > 0)
            .sort((a,b)=>a[0].localeCompare(b[0]));

        const planPedals = Object.entries(build.pedals || {})
            .filter(([_,c]) => (c||0) > 0)
            .sort((a,b)=>a[0].localeCompare(b[0]));

        const planGems = Object.entries(build.gems || {})
            .filter(([_,c]) => (c||0) > 0)
            .sort((a,b)=>a[0].localeCompare(b[0]));

        const isAllGemsDone = sumCounts(res.remainingGems) === 0;

        // Towers
        for(const [towerName, need] of planEntries){
            const isSecret = SECRET_SET.has(towerName);
            const got = res.picked.oneshotTowers?.[towerName] || 0;
            const done = isSecret ? (got >= need) : isAllGemsDone;
            let imgUrl;
            if (/^E[1-5]$/.test(towerName)) {
                imgUrl = BASIC_IMG("E");
            } else {
                imgUrl = isSecret ? SECRET_IMG(toSnake(towerName)) : TOWER_IMG(toSnake(towerName));
            }
            planBar.appendChild(makeIconBtn(imgUrl, towerName, need, done));
        }

        // Pedals
        for(const [key, need] of planPedals){
            const got = res.picked.pedals?.[key] || 0;
            const baseName = key.replace(/^Sparkling\s+/i,"");
            const imgUrl = PEDAL_IMG(pedalBaseSnake(baseName));
            const done = got >= need;
            planBar.appendChild(makeIconBtn(imgUrl, key, need, done));
        }

        // Base gems planned (from planner)
        for(const [g, need] of planGems){
            const pickedGem = res.picked.gems?.[g] || 0;
            const done = pickedGem >= need;
            const imgUrl = BASIC_IMG(g[0]);
            planBar.appendChild(makeIconBtn(imgUrl, g, need, done));
        }
    }

    function render(){
        builds = loadBuilds();
        if(!builds || Object.keys(builds).length===0){
            titleEl.textContent = "☰ GemTD Overlay (no builds)";
            return;
        }
        if(!builds[active]) active = Object.keys(builds)[0];

        localStorage.setItem(ACTIVE_KEY, active);
        renderBuildSelect();
        ensurePicked(active);

        const res = compute(active);
        if(!res){
            titleEl.textContent = "☰ GemTD Overlay (build missing)";
            return;
        }

        titleEl.textContent = `☰ ${active}`;

        renderPlanBar(res);
        renderQuickBar(res);
        renderGemOverlay(res);
    }

    // build select (hidden) still works if you want to switch builds via devtools
    if(buildSelect){
        buildSelect.onchange = () => {
            active = buildSelect.value;
            localStorage.setItem(ACTIVE_KEY, active);
            render();
        };
    }

    // reset button
    if(resetBtn){
        resetBtn.onclick = () => {
            if(!confirm(`Reset picked counts for "${active}"?`)) return;
            picked[active] = { gems:{}, oneshotTowers:{}, pedals:{} };
            savePicked();
            render();
        };
    }

    // --- Pop Out (Picture-in-Picture) ---
    const pipBtn = document.getElementById("pipBtn");
    if(pipBtn){
        // hide the button when already inside a PiP window
        if(window.IS_PIP) {
            pipBtn.style.display = "none";
        } else {
            pipBtn.onclick = async () => {
                if(!("documentPictureInPicture" in window)){
                    // fallback: open a small popup window
                    window.open("/overlay", "gemtd_overlay", "width=420,height=400,popup=true");
                    return;
                }
                try {
                    const pipWin = await documentPictureInPicture.requestWindow({ width: 420, height: 400 });
                    pipWin.IS_PIP = true;

                    // copy styles
                    const style = pipWin.document.createElement("style");
                    style.textContent = document.querySelector("style")?.textContent || "";
                    pipWin.document.head.appendChild(style);

                    pipWin.document.body.style.cssText =
                        "margin:0;background:transparent;overflow:hidden;user-select:none;font-family:system-ui;color:#e6edf6;";

                    // clone current overlay HTML into PiP
                    pipWin.document.body.innerHTML = document.getElementById("overlayRoot").outerHTML;

                    // inject overlay.js so it runs fresh in the PiP window
                    const script = pipWin.document.createElement("script");
                    script.src = window.location.origin + "/js/overlay.js";
                    pipWin.document.body.appendChild(script);
                } catch(err) {
                    console.error("PiP failed:", err);
                }
            };
        }
    }

    // Re-render when planner saves a new build in another tab/window
    window.addEventListener("storage", (e) => {
        if(e.key === BUILDS_KEY || e.key === ACTIVE_KEY || e.key === RUN_KEY) render();
    });

    // --- Drag (Electron only — moves the native window) ---
    const drag = document.getElementById("dragBar");
    if(window.overlayAPI && drag){
        let dragging = false;
        let lastX = 0;
        let lastY = 0;

        drag.addEventListener("mousedown", (e) => {
            dragging = true;
            lastX = e.screenX;
            lastY = e.screenY;
        });

        document.addEventListener("mousemove", (e) => {
            if (!dragging) return;
            window.overlayAPI.moveBy(e.screenX - lastX, e.screenY - lastY);
            lastX = e.screenX;
            lastY = e.screenY;
        });

        document.addEventListener("mouseup", () => { dragging = false; });
    }

    // --- First-open hint ---
    const hintEl = document.getElementById("overlayHint");
    if(hintEl){
        setTimeout(() => hintEl.classList.add("hidden"), 5000);
    }

    render();
})();
