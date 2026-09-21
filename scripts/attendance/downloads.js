/* Download activity only. Six visible columns; durable per-attempt markers use cell notes. */
const DOWNLOAD_HEADERS = ['Date Submitted','Time Submitted','Email','Material','Event','Download Status'];
const DOWNLOAD_MATERIAL_ID = 'current-diagnostic-approach-and-therapy-selection-for-thyroid-nodules';
const DOWNLOAD_MATERIAL = 'Current Diagnostic Approach and Therapy Selection for Thyroid Nodules';
const DOWNLOAD_EVENT = '19 Sep 2026 — Management of Thyroid Nodules';
const DOWNLOAD_MATERIALS = {
  [DOWNLOAD_MATERIAL_ID]: DOWNLOAD_MATERIAL,
  'ultrasound-imaging-and-tirads-classification-in-thyroid-nodules': 'Ultrasound Imaging and TIRADS Classification in Thyroid Nodules',
  'bethesda-system-for-reporting-thyroid-cytopathology': 'Bethesda System for Reporting Thyroid Cytopathology'
};
function setupDownloads() {
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  assert_(ss && ss.getId()===props_().getProperty('TRACKER_ID'),'Use the existing bound tracker.');
  assert_(DriveApp.getFileById(ss.getId()).getOwner().getEmail()===Session.getEffectiveUser().getEmail(),'Run as tracker owner.');
  const lock=LockService.getScriptLock();lock.waitLock(5000);
  try {
    let sheet=ss.getSheetByName('Download Material');
    sheet=sheet||ss.insertSheet('Download Material');header_(sheet,DOWNLOAD_HEADERS);
    assert_(sheet.getLastColumn()<=6,'Unexpected download columns; review without overwriting.');
    sheet.setFrozenRows(1);sheet.setColumnWidths(1,6,160);sheet.setColumnWidth(3,260);sheet.setColumnWidth(4,520);sheet.setColumnWidth(5,420);
    sheet.getRange(1,1,1,6).setFontWeight('bold').setBackground('#981d36').setFontColor('#ffffff').setWrap(true);
    if(!sheet.getFilter())sheet.getRange(1,1,sheet.getMaxRows(),6).createFilter();
    props_().setProperty('DOWNLOAD_TAB_ID',String(sheet.getSheetId()));SpreadsheetApp.flush();
  } finally {lock.releaseLock();}
}
function downloadCorrelation_(p) {
  return p && p.origin===SITE_ORIGIN && Object.prototype.hasOwnProperty.call(DOWNLOAD_MATERIALS,p.material_id) && typeof p.request_id==='string' && /^[a-f0-9]{32}$/.test(p.request_id);
}
function validateDownload_(p) {
  if(!downloadCorrelation_(p)||p.action!=='download'||Object.keys(p).some(k=>!['action','material_id','request_id','origin','email'].includes(k)))return false;
  if(typeof p.email!=='string'||p.email.length>254||/[\x00-\x1f\x7f]/.test(p.email))return false;
  const email=p.email.trim();
  return /^[^\s@<>]+@[^\s@<>.]+(?:\.[^\s@<>.]+)+$/.test(email)&&email.split('@')[0].length<=64;
}
function downloadAckKey_(p){return 'DOWNLOAD_ACK_'+p.request_id;}
function recordDownload_(p) {
  if(!validateDownload_(p))return 'invalid';
  const materialTitle=DOWNLOAD_MATERIALS[p.material_id];
  const lock=LockService.getScriptLock();if(!lock.tryLock(5000))return 'retry';
  try {
    const id=props_().getProperty('DOWNLOAD_TAB_ID');if(id===null)return 'retry';
    const sheet=SpreadsheetApp.openById(props_().getProperty('TRACKER_ID')).getSheetById(Number(id));
    if(!sheet||sheet.getName()!=='Download Material')return 'retry';header_(sheet,DOWNLOAD_HEADERS);
    if(sheet.getMaxRows()>20000)return 'retry';
    const notes=sheet.getRange(2,1,sheet.getMaxRows()-1,1).getNotes();
    const prefix='ba-download:'+p.request_id+':';
    const digest=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,normalizedEmail_(p.email)).map(b=>('0'+(b&255).toString(16)).slice(-2)).join('');
    const marker=prefix+digest+(p.material_id===DOWNLOAD_MATERIAL_ID?'':':'+p.material_id);
    let row=notes.findIndex(r=>r[0].startsWith(prefix));
    if(row>=0){if(notes[row][0]!==marker)return 'invalid';row+=2;}
    else {
      const minute=String(Math.floor(Date.now()/60000)),rate=JSON.parse(props_().getProperty('DOWNLOAD_RATE')||'{}');
      const count=rate.minute===minute?rate.count:0;if(count>=120)return 'retry';
      props_().setProperty('DOWNLOAD_RATE',JSON.stringify({minute,count:count+1}));
      const lastReserved=notes.reduce((last,r,i)=>r[0]?i+2:last,1);
      row=Math.max(sheet.getLastRow(),lastReserved)+1;
      if(row>20000)return 'retry';
      if(row>sheet.getMaxRows())sheet.insertRowsAfter(sheet.getMaxRows(),100);
      // Reserve first. A retry can recover a partially written row without duplicating it.
      sheet.getRange(row,1).setNote(marker);SpreadsheetApp.flush();
    }
    const target=sheet.getRange(row,1,1,6),saved=target.getValues()[0];
    if(saved[5]==='Downloaded'&&saved[3]===materialTitle&&saved[4]===DOWNLOAD_EVENT&&normalizedEmail_(saved[2])===normalizedEmail_(p.email))return 'recorded';
    if(saved.some(v=>v!==''))return 'retry';
    const now=new Date(),values=[Utilities.formatDate(now,'Asia/Jakarta','yyyy-MM-dd'),Utilities.formatDate(now,'Asia/Jakarta','HH:mm:ss'),safeCell_(p.email.trim()),materialTitle,DOWNLOAD_EVENT,'Downloaded'];
    target.setNumberFormat('@').setValues([values]);SpreadsheetApp.flush();
    const check=target.getValues()[0];
    return check[0]===values[0]&&check[1]===values[1]&&normalizedEmail_(check[2])===normalizedEmail_(p.email)&&check[3]===materialTitle&&check[4]===DOWNLOAD_EVENT&&check[5]==='Downloaded'?'recorded':'retry';
  } finally {lock.releaseLock();}
}
function downloadReply_(p) {
  if(!downloadCorrelation_(p)||p.callback!=='baDownload_'+p.request_id||Object.keys(p).some(k=>!['action','material_id','request_id','origin','callback','attempt'].includes(k)))return ContentService.createTextOutput('Request unavailable.');
  let status='retry';try{status=CacheService.getScriptCache().get(downloadAckKey_(p))||'waiting';}catch(_){}
  return ContentService.createTextOutput('typeof '+p.callback+'==="function"&&'+p.callback+'('+JSON.stringify({type:'ba-download',request_id:p.request_id,status})+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
}
