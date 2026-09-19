(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.BA_EBOOKS=api;})(typeof window==='undefined'?this:window,()=>{
  const defaultCover='assets/ebooks/default-ebook-cover.png';
  const cover=book=>book.cover||defaultCover;
  const batch=(books,page=0)=>{const total=Math.ceil(books.length/25),index=Math.max(0,Math.min(page,Math.max(0,total-1)));return {items:books.slice(index*25,index*25+25),index,total};};
  const pages=book=>book.demo?[{image:cover(book),title:book.title},{title:'Preview / Coming Soon',text:'This is a demonstration of the BA Medicale reader. This title is a placeholder, not a published medical book.'},{title:'A space for learning',text:'Content coming soon. These neutral preview pages demonstrate navigation only; no medical chapters are available.'},{title:'You have reached the end of the preview',text:'Return to the bookshelf to explore the other Coming Soon previews.'}]:book.sourcePages?(book.pages||[]):[{image:cover(book),title:book.title},...(book.pages||[])];
  const spread=(page,count,double)=>{page=Math.max(0,Math.min(page,count-1));const start=double&&page>0?page-(page%2===0?1:0):page;return {start,end:Math.min(count-1,start+(double&&start>0?1:0))};};
  const search=(book,query)=>book.demo||!query.trim()?[]:pages(book).map((p,index)=>({index,title:p.title||'Page '+(index+1),text:p.text||''})).filter(p=>(p.title+' '+p.text).toLowerCase().includes(query.trim().toLowerCase()));
  return {defaultCover,cover,batch,pages,spread,search};
});
