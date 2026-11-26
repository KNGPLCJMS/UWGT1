const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d")
const tilesize = 20;
//Preps array and variables for Map Generation

function randint(max) {
  return Math.floor(Math.random() * max);
}

const tileset = [
    [[0.6,0.4,0,0],"#0f4810"],
    [[0.5,0.4,0.1,0],"#66d462"],
    [[0,0.1,0.5,0.4],"#f2d06b"],
    [[0,0,0.3,0.7],"#57b1ea"]
]
function validMap(map){
    for (let x = 0; x<map.length; x++){
        for (let y = 0; y<map[x].length;y++){
            const tile = map[x][y];

            if(x+1<map.length&&tileset[tile-1][0][map[x+1][y]-1]===0){
                return false
            }
            if(y+1<map[x].length&&tileset[tile-1][0][map[x][y+1]-1]===0){
                return false
            }
        }
    }
    return true;
}
function startwfcgenerate(){
    const x = document.getElementById("inpX").value;
    const y = document.getElementById("inpY").value;

    wfcgenerate(x,y);
}

// Actual generation is done here
function wfcgenerate(x,y){
    x = Number(x)
    y = Number(y)

    const allTiles = tileset.map((_, index)=>index+1);
    const directions = [
        [0,1],
        [0,-1],
        [1,0],
        [-1,0]
    ]
    function neighbouring(tA, tB){
        return tileset[tA-1][0][tB-1]>0;
    }
    function generateAttempt(){
        const domain = Array.from(
            {length:x},
            () => Array.from({length:y},()=>[...allTiles])
        );
        function prop(sx,sy){
            const que = [[sx,sy]];
            while (que.length>0){
                const [cx,cy]=que.shift();
                const curr = domain[cx][cy];
                
                if (curr.length ===0 ) return false;

                for (const[dx,dy] of directions){
                    const nx = cx+dx;
                    const ny = cy+dy;

                    if (nx<0||nx>=x||ny<0||ny>=y){
                        continue
                    }
                    
                    const oldD = domain[nx][ny];
                    const newD = oldD.filter(nTile=>curr.some(tile=>neighbouring(tile,nTile)));
                    
                    if (newD.length ===0) return false;

                    if(newD.length!=oldD.length){
                        domain[nx][ny]=newD;
                        que.push([nx,ny]);
                    }
                }
            }
            return true;
        }
        while (true){
            let minDomSize = Infinity;
            let candidates = [];

            for (let i = 0; i<x; i++){
                for (let j = 0; j<y; j++){
                    const size = domain[i][j].length;

                    if(size>1&&size<minDomSize){
                        minDomSize = size;
                        candidates = [[i,j]];
                    } else if (size>1 && size==minDomSize){
                        candidates.push([i,j]);
                    }
                }
            }

            if (candidates.length==0){
                return domain.map(column => column.map(domain => domain[0]));
            }

            const [cx,cy] = candidates[randint(candidates.length)];
            const options = domain[cx][cy];
            const weights = options.map(candidates=>{
                let weight = 0;
                 for (const[dx,dy] of directions){
                    const nx = cx+dx;
                    const ny = cy+dy;

                    if (nx<0||nx>=x||ny<0||ny>=y){
                        continue
                    }
                    const nD = domain[nx][ny];
                    if(nD.length===1){
                        const nTile = nD[0];
                        weight+=tileset[nTile-1][0][candidates-1];
                    }
                 }
                 return weight||1;
            })
            const chosenTile= pickWeighted(options,weights);
            domain[cx][cy] = [chosenTile];

            if (!prop(cx, cy)){
                return null;
            }
        }
    }
    
    let map = null;

    for (let att = 0; att<100&&map==null; att++){
        map = generateAttempt();
    }
    if (map == null){
        map = Array.from({length:x}, ()=>Array(y).fill(2));
    }
    
    if(validMap(map)){draw(map,x,y);}
    else {wfcgenerate()}
    console.log(map)
}
function pickWeighted(options, weight){
    const total = weight.reduce((sum,weight)=>sum+weight,0);
    if ( total<=0) return options[randint(options.length)];
    let r = Math.random()*total;
    for (let i=0; i<options.length; i++){
        r-=weight[i]
        if (r<0)return options[i];
    }
    return options[options.length-1];
}
// Drawing Map
function draw(map,x,y){
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0,0,500,500)
    for (let i =0; i<x; i++){
        for (let j = 0; j<y; j++){
            ctx.fillStyle = tileset[(map[i][j])-1][1];
            ctx.fillRect(i*tilesize,j*tilesize,tilesize,tilesize);
        }
    }
}

//Generates
function seed(i1,i2,i3,i4,ic){
    let seed = Math.random();
    const ruleset = [[0,0,0],tileset[0][0],tileset[1][0],tileset[2][0],tileset[3][0]]
    const prob = ruleset[i1].map(
        (value,i)=>(value+i2[i]+i3[i]+i4[i])/ic
    );
    let total = 0;
    for (let i = 0; i<prob.length; i++){
        total+=prob[i]
        if (seed<=total){
            return i+1;
        }
    }
}

const pertileset = [
    [0.42,"#57b1ea"],
    [0.48,"#f2d06b"],
    [0.55,"#66d462"],
    [1.00,"#0f4810"],
]

function startpergenerate(){
    const x = document.getElementById("inpX").value;
    const y = document.getElementById("inpY").value;
    perlin.seed()
    pergen(x,y);
    
}
function pergen(x,y){
    let map = [];
    for (let i = 0; i<x; i++){
        map[i]=[];
        for (let j = 0; j<y; j++){
            map[i][j]=perseed(i,j);
        } 
    }
    console.log(map);
    draw(map,x,y);
}
function perseed(x,y){
    const scale = 0.08;
    const val = (perlin.get(x*scale,y*scale)+1)/2;
    for (let i = 0; i<pertileset.length; i++){
        if (val<=pertileset[i][0]){
            return i+1;
        }
    }
}

let perlin = {
    rand_vect: function(){
        let theta = Math.random() * 2 * Math.PI;
        return {x: Math.cos(theta), y: Math.sin(theta)};
    },
    dot_prod_grid: function(x, y, vx, vy){
        let g_vect;
        let d_vect = {x: x - vx, y: y - vy};
        if (this.gradients[[vx,vy]]){
            g_vect = this.gradients[[vx,vy]];
        } else {
            g_vect = this.rand_vect();
            this.gradients[[vx, vy]] = g_vect;
        }
        return d_vect.x * g_vect.x + d_vect.y * g_vect.y;
    },
    smootherstep: function(x){
        return 6*x**5 - 15*x**4 + 10*x**3;
    },
    interp: function(x, a, b){
        return a + this.smootherstep(x) * (b-a);
    },
    seed: function(){
        this.gradients = {};
        this.memory = {};
    },
    get: function(x, y) {
        if (this.memory.hasOwnProperty([x,y]))
            return this.memory[[x,y]];
        let xf = Math.floor(x);
        let yf = Math.floor(y);
        //interpolate
        let tl = this.dot_prod_grid(x, y, xf,   yf);
        let tr = this.dot_prod_grid(x, y, xf+1, yf);
        let bl = this.dot_prod_grid(x, y, xf,   yf+1);
        let br = this.dot_prod_grid(x, y, xf+1, yf+1);
        let xt = this.interp(x-xf, tl, tr);
        let xb = this.interp(x-xf, bl, br);
        let v = this.interp(y-yf, xt, xb);
        this.memory[[x,y]] = v;
        return v;
    }
}