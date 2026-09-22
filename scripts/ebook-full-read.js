const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(root,book){
  const base=path.dirname(book.pageManifest),file=path.join(root,base,'full-read.json');
  if(!fs.existsSync(file))throw Error(`${book.id}: Full Read preparation is required before publication`);
  const data=JSON.parse(fs.readFileSync(file,'utf8'));
  const hash=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,book.sourcePdf))).digest('hex');
  if(data.sourceSha256!==hash||data.pages.length!==book.pages.length)throw Error('Full Read source integrity mismatch');
  const toc=[];
  const body=data.pages.map((page,i)=>{
    let furniture=[];
    const content=page.segments.map((s,j)=>{
      const id=`chapter-${i+1}-${j+1}`;
      if(s.type==='furniture'){furniture.push(s.text);return '';}
      if(s.type==='heading'){toc.push({id,text:s.text});return `<h3 id="${id}" tabindex="-1">${esc(s.text)}</h3>`;}
      if(s.type==='subheading')return `<h4>${esc(s.text)}</h4>`;
      if(s.image){
        if(!/^reading-\d+-\d+\.png$/.test(s.image)||!fs.existsSync(path.join(root,base,s.image)))throw Error('Invalid Full Read source figure');
        if(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,base,s.image))).digest('hex')!==s.sha256)throw Error('Full Read figure integrity mismatch');
        const label=s.type==='table-image'?'Source table':s.type==='source-fragment'?'Original source detail':'Source figure';
        if(s.rows)return `<div class="source-table" role="region" tabindex="0" aria-label="Source table, original PDF page ${i+1}"><table>${s.rows.map((row,r)=>'<tr>'+row.map(cell=>`<${r?'td':'th scope="col"'}>${esc(cell).replace(/\n/g,'<br>')}</${r?'td':'th'}>`).join('')+'</tr>').join('')}</table></div>`;
        return `<figure class="ebook-source-figure"><div class="ebook-source-visual${s.type==='table-image'?' ebook-source-visual--table':''}" tabindex="0" role="region" aria-label="${label}, original PDF page ${i+1}"><a href="/${esc(base+'/'+s.image)}" target="_blank" rel="noopener noreferrer" aria-label="Enlarge ${label.toLowerCase()}"><img src="/${esc(base+'/'+s.image)}" width="${Number(s.width)}" height="${Number(s.height)}" alt="${label}, preserved from original PDF page ${i+1}" loading="lazy" decoding="async"></a></div><figcaption>${s.caption?esc(s.caption)+' · ':''}<a href="/${esc(book.sourcePdf)}#page=${i+1}">Inspect original ${label.toLowerCase()}</a></figcaption></figure>`;
      }
      return s.type==='list-item'?`<ul class="ebook-source-list"><li>${esc(s.text)}</li></ul>`:`<p>${esc(s.text)}</p>`;
    }).join('');
    return `<section data-reader-page="${i+(book.coverAsPage?1:0)}" tabindex="-1" aria-label="Original PDF page ${i+1}">${content}${furniture.length?`<details class="ebook-source-imprint"><summary>Original page imprint</summary>${furniture.map(t=>`<p>${esc(t)}</p>`).join('')}</details>`:''}</section>`;
  }).join('');
  return `<nav class="ebook-toc" aria-label="Table of Contents"><h2>Table of Contents</h2>${toc.length?`<ol>${toc.map(t=>`<li><a href="#${t.id}">${esc(t.text)}</a></li>`).join('')}</ol>`:'<p>This edition preserves its original page structure.</p>'}</nav><div class="ebook-reading-body">${body}</div>`;
}
module.exports={render};
