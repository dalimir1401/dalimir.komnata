import {ROOM, obstacles} from './room.js';

export const avatarRadius = .135;
export function walkable(x,z){
  const r=avatarRadius;
  if(!Number.isFinite(x)||!Number.isFinite(z)||x < -ROOM.width/2+r || x > ROOM.width/2-r || z < ROOM.windowZ+r || z > ROOM.entryZ-r)return false;
  for(const b of obstacles){
    const cx=Math.max(b.x-b.w/2,Math.min(x,b.x+b.w/2));
    const cz=Math.max(b.z-b.d/2,Math.min(z,b.z+b.d/2));
    if(Math.hypot(x-cx,z-cz)<r)return false;
  }
  return true;
}

const cell=.075,nx=Math.ceil(ROOM.width/cell)+1,nz=Math.ceil(ROOM.depth/cell)+1;
const grid=Array.from({length:nx*nz},(_,i)=>({x:-ROOM.width/2+(i%nx)*cell,z:ROOM.windowZ+Math.floor(i/nx)*cell}));
const free=grid.map(p=>walkable(p.x,p.z));
function nearest(p){let best=-1,dist=Infinity;for(let i=0;i<grid.length;i++){if(!free[i])continue;const d=(grid[i].x-p.x)**2+(grid[i].z-p.z)**2;if(d<dist){best=i;dist=d;}}return best;}
export function findPath(from,to){
  if(![from?.x,from?.z,to?.x,to?.z].every(Number.isFinite))return [];
  const start=nearest(from),end=nearest(to);if(start<0||end<0)return [];
  const parents=new Int32Array(grid.length).fill(-1),seen=new Uint8Array(grid.length),queue=[start];seen[start]=1;
  for(let head=0;head<queue.length;head++){
    const current=queue[head];if(current===end)break;const x=current%nx,z=Math.floor(current/nx);
    for(const [dx,dz]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
      const xx=x+dx,zz=z+dz;if(xx<0||xx>=nx||zz<0||zz>=nz)continue;const ni=zz*nx+xx;
      if(seen[ni]||!free[ni]||(dx&&dz&&(!free[z*nx+xx]||!free[zz*nx+x])))continue;
      parents[ni]=current;seen[ni]=1;queue.push(ni);
    }
  }
  if(!seen[end])return [];const route=[];for(let p=end;p!==start;p=parents[p])route.unshift({...grid[p]});
  if(walkable(to.x,to.z)&&Math.hypot(grid[end].x-to.x,grid[end].z-to.z)<cell*1.8)route.push({x:to.x,z:to.z});
  return route;
}
