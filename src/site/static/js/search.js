/* search.js — Client-side search (< 3KB vanilla JS) */
(function(){
'use strict';
var ix=null,sel=-1,dt=null;
var inp=document.getElementById('search-input');
var res=document.getElementById('search-results');
var ctr=document.querySelector('.requires-js');
if(!inp||!res)return;
if(ctr)ctr.classList.add('js-enabled');

fetch('/search-index.json')
.then(function(r){return r.json()})
.then(function(d){ix=d})
.catch(function(){});

function sc(e,q){
var s=0,lq=q.toLowerCase();
if(e.t.toLowerCase().indexOf(lq)!==-1)s+=10;
if(e.g){for(var i=0;i<e.g.length;i++){
if(e.g[i].toLowerCase().indexOf(lq)!==-1){s+=8;break}}}
if(e.d.toLowerCase().indexOf(lq)!==-1)s+=5;
if(e.x.toLowerCase().indexOf(lq)!==-1)s+=1;
return s;
}

function esc(s){
var el=document.createElement('span');
el.textContent=s;return el.innerHTML;
}

function hl(items){
for(var i=0;i<items.length;i++)
items[i].classList.toggle('search-active',i===sel);
}

function render(m){
sel=-1;
if(!m.length){
res.innerHTML='<li class="search-empty">No results found</li>';
res.hidden=false;return;}
res.innerHTML=m.map(function(e,i){
return '<li class="search-item" data-idx="'+i+'">'+
'<a href="'+e.u+'"><strong>'+esc(e.t)+'</strong>'+
'<span>'+esc(e.d)+'</span></a></li>';
}).join('');
res.hidden=false;
}

function search(q){
if(!ix||!q.trim()){res.hidden=true;return}
var scored=[];
for(var i=0;i<ix.length;i++){
var s=sc(ix[i],q);
if(s>0)scored.push({s:s,e:ix[i]});}
scored.sort(function(a,b){return b.s-a.s});
render(scored.slice(0,8).map(function(x){return x.e}));
}

inp.addEventListener('input',function(){
clearTimeout(dt);
dt=setTimeout(function(){search(inp.value)},150);
});

inp.addEventListener('keydown',function(e){
var items=res.querySelectorAll('.search-item');
if(!items.length)return;
if(e.key==='ArrowDown'){
e.preventDefault();sel=Math.min(sel+1,items.length-1);hl(items);
}else if(e.key==='ArrowUp'){
e.preventDefault();sel=Math.max(sel-1,0);hl(items);
}else if(e.key==='Enter'&&sel>=0){
e.preventDefault();var a=items[sel].querySelector('a');
if(a)window.location.href=a.href;
}else if(e.key==='Escape'){res.hidden=true;sel=-1;}
});

document.addEventListener('click',function(e){
if(!inp.contains(e.target)&&!res.contains(e.target)){
res.hidden=true;sel=-1;}
});
})();
