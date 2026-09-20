const fs=require("fs");
const path=require("path");
const crypto=require("crypto");
const {spawnSync}=require("child_process");

function assert(condition,message){if(!condition)throw new Error(message);}
function run(command,args){const result=spawnSync(command,args,{encoding:"utf8"});if(result.status!==0)throw new Error(`${command} failed without modifying publication state.`);return result.stdout;}
function prepare(source,output,repoRoot){
  assert(fs.existsSync(source)&&path.extname(source).toLowerCase()===".pdf","Prepared eBook source must be a PDF.");fs.mkdirSync(output,{recursive:true});
  const info=run("pdfinfo",[source]),pages=Number(info.match(/^Pages:\s+(\d+)/m)?.[1]),size=info.match(/^Page size:\s+([\d.]+) x ([\d.]+) pts/m);assert(pages>0&&size,"Unable to read eBook page geometry.");
  const prefix=path.join(output,"page");run("pdftoppm",["-png","-r","180",source,prefix]);const sourceSha256=crypto.createHash("sha256").update(fs.readFileSync(source)).digest("hex"),relativeOutput=path.relative(repoRoot,output).replace(/\\/g,"/"),records=[];
  for(let number=1;number<=pages;number++){
    const generated=path.join(output,`page-${number}.png`),padded=path.join(output,`page-${String(number).padStart(String(pages).length,"0")}.png`),file=fs.existsSync(generated)?generated:padded;assert(fs.existsSync(file),`Missing rendered source page ${number}.`);if(file!==generated)fs.renameSync(file,generated);
    const text=run("pdftotext",["-layout","-f",String(number),"-l",String(number),source,"-"]).replace(/\f/g,"").trim();records.push({number,image:`${relativeOutput}/page-${number}.png`,text,blocks:text?[{type:"paragraph",text}]:[]});
  }
  const manifest={schemaVersion:1,sourceSha256,pageAspect:Number(size[2])/Number(size[1]),pages:records};fs.writeFileSync(path.join(output,"pages.json"),JSON.stringify(manifest,null,2)+"\n","utf8");return manifest;
}
if(require.main===module){const args=process.argv.slice(2),source=args[args.indexOf("--source")+1],output=args[args.indexOf("--output")+1],root=path.resolve(__dirname,"../..");assert(source&&output,"Use --source <pdf> --output <asset-directory>.");const result=prepare(path.resolve(root,source),path.resolve(root,output),root);console.log(`prepared ${result.pages.length} source PDF page(s)`);}
module.exports={prepare};
