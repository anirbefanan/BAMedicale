// Fail routine content checks if a local master could be staged or served.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
function git(args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  if (result.error) throw result.error;
  return result;
}
const ignoredMaster = git(['check-ignore', '-q', '--', 'Material/Video/__ba_medicale_master_guard__.mov']);
if (ignoredMaster.status !== 0) throw Error('New Material/Video masters must be ignored by Git.');
const ignoredDerivative = git(['check-ignore', '-q', '--', 'assets/videos/__ba_medicale_derivative_guard__.mp4']);
if (ignoredDerivative.status === 0) throw Error('Optimized assets/videos derivatives must remain publishable.');
const staged = git(['diff', '--cached', '--name-only', '-z', '--', 'Material/Video/']);
if (staged.status !== 0) throw Error(staged.stderr || 'Cannot inspect staged video masters.');
const stagedMasters = staged.stdout.split('\0').filter(Boolean);
if (stagedMasters.length) throw Error('Protected video masters are staged: ' + stagedMasters.join(', '));
const changed = git(['diff', '--name-only', '-z', '--', 'Material/Video/']);
if (changed.status !== 0) throw Error(changed.stderr || 'Cannot inspect protected video masters.');
const changedMasters = changed.stdout.split('\0').filter(Boolean);
if (changedMasters.length) throw Error('Protected video masters were modified: ' + changedMasters.join(', '));
const videos = JSON.parse(fs.readFileSync(path.join(root, 'data/original-videos.json'), 'utf8')).videos;
const ids = new Set();
for (const video of videos) {
  if (ids.has(video.id)) throw Error('Duplicate BA Medicale Original ID: ' + video.id);
  ids.add(video.id);
  if (!/^assets\/videos\/[a-z0-9/_-]+\.mp4$/.test(video.video_url || '') || video.url !== video.video_url) throw Error('Original must serve one optimized MP4 derivative: ' + video.id);
  if (!fs.existsSync(path.join(root, video.video_url))) throw Error('Missing optimized derivative: ' + video.video_url);
}
console.log('Video source boundary passed: protected masters ignored and unstaged; ' + videos.length + ' publishable Originals.');
