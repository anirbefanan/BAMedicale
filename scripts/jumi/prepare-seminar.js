const fs=require("fs"),path=require("path"),QR=require("qrcode"),{PNG}=require("pngjs"),decode=require("jsqr");
function assert(value,message){if(!value)throw new Error(message)}
function safePath(root,relative){const target=path.resolve(root,relative),within=path.relative(root,target);assert(within&&!within.startsWith("..")&&!path.isAbsolute(within),"Seminar output path is not allowed.");return target}
function icsText(value){return String(value||"").replace(/\\/g,"\\\\").replace(/\r?\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;")}
function utc(value){return new Date(value).toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z")}
async function prepareSeminar(root,request,output){
  assert(request&&output,"Use --request <manifest> --output <folder>.");
  const manifest=JSON.parse(fs.readFileSync(safePath(root,request),"utf8")),publication=manifest.metadata?.publication||{};
  assert(manifest.contentType==="Seminar"&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(manifest.slug),"A validated Seminar manifest is required.");
  assert(output===`assets/events/${manifest.slug}`,"Seminar output must be server-derived from its slug.");
  const folder=safePath(root,output);fs.mkdirSync(folder,{recursive:true});
  const eventUrl=`https://bamedicale.com/events/${manifest.slug}.html`,registration=String(publication.registration||"").trim().replace(/^https?:\/\//i,"");
  assert(/^[A-Za-z0-9.-]+(?:\/[A-Za-z0-9._~!$&'()*+,;=:@%/?#-]*)?$/.test(registration),"A valid permanent registration URL is required.");
  const url=`https://${registration}`,options={errorCorrectionLevel:"M",margin:4,color:{dark:"#000000",light:"#ffffff"}};
  const png=await QR.toBuffer(url,{...options,scale:12,type:"png"}),svg=await QR.toString(url,{...options,type:"svg"}),image=PNG.sync.read(png);
  assert(decode(image.data,image.width,image.height)?.data===url,"Registration QR verification failed.");
  fs.writeFileSync(path.join(folder,"registration-qr.png"),png);fs.writeFileSync(path.join(folder,"registration-qr.svg"),svg);
  const calendar=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//BA Medicale//JUMI Content OS//EN","CALSCALE:GREGORIAN","METHOD:PUBLISH","BEGIN:VEVENT",`UID:${manifest.slug}@bamedicale.com`,`DTSTAMP:${utc(manifest.requestedAt)}`,`DTSTART:${utc(publication.startDate)}`,`DTEND:${utc(publication.endDate)}`,`SUMMARY:${icsText(manifest.metadata.title)}`,`DESCRIPTION:${icsText([manifest.metadata.quickSummary,eventUrl].filter(Boolean).join("\n\n"))}`,`LOCATION:${icsText(publication.location)}`,`URL:${eventUrl}`,"END:VEVENT","END:VCALENDAR",""];
  fs.writeFileSync(path.join(folder,`${manifest.slug}.ics`),calendar.join("\r\n"));
  console.log(`Prepared Seminar registration/calendar assets for ${manifest.slug}.`);
}
if(require.main===module){const root=path.resolve(__dirname,"../.."),args=process.argv.slice(2),request=args[args.indexOf("--request")+1],output=args[args.indexOf("--output")+1];prepareSeminar(root,request,output).catch(error=>{console.error(error.message);process.exit(1)});}
module.exports={prepareSeminar};
