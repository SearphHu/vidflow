content = open('index.html', 'r', encoding='utf-8').read()

# 1. Add restoreMediaPreview function before loadProj
helper = """
function restoreMediaPreview(node) {
  if (!node || !node.el) return;
  var body = node.el.querySelector('.node-body');
  if (!body) return;
  var url = node.data && (node.data._image_url || node.data._video_url);
  if (!url) return;
  var isImg = !!node.data._image_url;
  var html = isImg
    ? '<img src="' + url + '" style="width:100%;aspect-ratio:16/9;object-fit:cover;display:block;border-bottom:1px solid var(--border)" alt="' + (node.data.prompt || '') + '">'
    : '<video src="' + url + '" style="width:100%;aspect-ratio:16/9;object-fit:cover;display:block;border-bottom:1px solid var(--border)" controls></video>';
  html += '<div class="node-result" style="margin:0;border-radius:0;padding:8px 12px;font-size:12px;color:var(--text2)">' + (node.data.prompt || '') + '</div>';
  body.innerHTML = html;
  // Restore generated result if exists
  if (node.lastResult) {
    var resDiv = document.getElementById('result-' + node.id);
    if (resDiv) {
      resDiv.style.display = 'block';
      if (node.lastResult.video_url) {
        resDiv.innerHTML = '<div style="position:relative;"><video src="' + node.lastResult.video_url + '" controls style="width:100%;border-radius:6px;display:block;background:#000;" autoplay muted></video></div>';
      } else if (node.lastResult.image_url) {
        resDiv.innerHTML = '<img src="' + node.lastResult.image_url + '" style="width:100%;border-radius:6px">';
      } else if (node.lastResult.text) {
        resDiv.innerHTML = '<div style="padding:8px;font-size:12px;white-space:pre-wrap;">' + node.lastResult.text + '</div>';
      }
    }
  }
}
"""

# Insert helper BEFORE function loadProj(n)
old = "function loadProj(n){"
new = helper + "\nfunction loadProj(n){"

if old in content:
    content = content.replace(old, new, 1)  # only first occurrence
    open('index.html', 'w', encoding='utf-8').write(content)
    print('Added restoreMediaPreview')
else:
    print('NOT FOUND')
