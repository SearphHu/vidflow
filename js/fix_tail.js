// Add missing functions at end of file
function onPromptInput(el, nodeId) {
  updateNodeData(nodeId, 'prompt', el.value);
  var text = el.value;
  var atPos = text.lastIndexOf("@");
  if (atPos >= 0 && (atPos === 0 || text[atPos-1] === ' ' || text[atPos-1] === "\n")) {
    var query = text.substring(atPos + 1).toLowerCase();
    showMentions(nodeId, query, el);
  } else {
    hideMentions(nodeId);
  }
}
function onMentionKeydown(e, nodeId) {
  if (e.key === 'Enter' || e.key === ' ') {
    var dd = document.getElementById('mention-' + nodeId);
    if (dd && dd.style.display !== 'none' && dd.querySelector('.mention-item')) {
      e.preventDefault();
      selectMention(nodeId);
    }
  }
  if (e.key === 'Escape') { hideMentions(nodeId); }
}
function showMentions(nodeId, query, el) {
  var dd = document.getElementById('mention-' + nodeId);
  if (!dd) return;
  var node = getNode(nodeId);
  if (!node) { hideMentions(nodeId); return; }
  var refs = getConnectedRefs(nodeId);
  if (refs.length === 0) { hideMentions(nodeId); return; }
  var filtered = refs.filter(function(r) { return r.name.toLowerCase().indexOf(query) >= 0; });
  if (filtered.length === 0) { hideMentions(nodeId); return; }
  var html = '';
  for (var i = 0; i < filtered.length; i++) {
    var r = filtered[i];
    html += '<div class="mention-item" data-ref="' + r.name + '" onclick="insertMention("' + nodeId + '","' + r.name + '")"><span class="mention-dot" style="background:' + r.color + '"></span>@' + r.name + ' <span class="mention-type">' + r.typeName + '</span></div>';
  }
  dd.innerHTML = html;
  dd.style.display = 'block';
  if (el) {
    dd.style.bottom = '100%';
    dd.style.left = '0';
  }
}
function hideMentions(nodeId) {
  var dd = document.getElementById('mention-' + nodeId);
  if (dd) dd.style.display = 'none';
}
function selectMention(nodeId) {
  var dd = document.getElementById('mention-' + nodeId);
  if (!dd) return;
  var first = dd.querySelector('.mention-item');
  if (first) insertMention(nodeId, first.getAttribute('data-ref'));
}
function insertMention(nodeId, refName) {
  var el = document.getElementById(nodeId + ' textarea');
  if (!el) { hideMentions(nodeId); return; }
  var text = el.value;
  var atPos = text.lastIndexOf("@");
  if (atPos >= 0) {
    el.value = text.substring(0, atPos) + "@" + refName + ' ';
    updateNodeData(nodeId, 'prompt', el.value);
  }
  hideMentions(nodeId);
  el.focus();
}
function getConnectedRefs(nodeId) {
  var refs = [];
  for (var ci = 0; ci < connections.length; ci++) {
    if (connections[ci].to === nodeId) {
      for (var ni = 0; ni < nodes.length; ni++) {
        if (nodes[ni].id === connections[ci].from) {
          var def = NODE_TYPES[nodes[ni].type];
          refs.push({
            id: nodes[ni].id,
            name: (def ? def.title : nodes[ni].type),
            typeName: def ? (nodes[ni].type === 'prompt' ? '提示词' : nodes[ni].type === 'text' ? '文本' : nodes[ni].type === 'image' ? '图片' : '视频') : '',
            color: def ? def.color : '#6B7280',
            port: connections[ci].fromPort
          });
        }
      }
    }
  }
  return refs;
}
function renderRefs(nodeId) {
  var refsEl = document.getElementById('refs-' + nodeId);
  if (!refsEl) return;
  var refs = getConnectedRefs(nodeId);
  if (refs.length === 0) {
    refsEl.innerHTML = '<span class="node-ref-empty">连接上游节点以引用</span>';
    return;
  }
  var html = '';
  for (var i = 0; i < refs.length; i++) {
    var r = refs[i];
    var cls = 'node-ref node-ref-' + (r.port || 'text');
    html += '<span class="' + cls + '"><span class="node-ref-dot" style="background:' + r.color + '"></span>@' + r.name + '</span>';
  }
  refsEl.innerHTML = html;
}

// Override renderConnections to also update refs
var _origRenderConnections = renderConnections;
renderConnections = function() {
  _origRenderConnections();
  for (var ni = 0; ni < nodes.length; ni++) {
    if (nodes[ni].type === 'video') {
      renderRefs(nodes[ni].id);
    }
  }
};

// ===== FILE UPLOAD =====
var _uploadType = '';
function uploadFile(type) {
  _uploadType = type;
  var inp = document.getElementById('file-upload-' + type);
  if (inp) inp.click();
}
function handleFileUpload(event, type) {
  var file = event.target.files[0];
  if (!file) return;
  event.target.value = '';
  var url = URL.createObjectURL(file);
  var nodeType = type === 'image' ? 'image' : 'video';
  var menu = document.getElementById('context-menu');
  var cx = menu ? (menu._canvasX || 300) : 300;
  var cy = menu ? (menu._canvasY || 200) : 200;
  var node = addNode(nodeType, cx, cy);
  if (node) {
    node.data['_' + type + '_url'] = url;
    node.data.prompt = file.name;
    var bodyEl = node.el ? node.el.querySelector('.node-body') : null;
    if (bodyEl) {
      var preview = '';
      if (type === 'image') {
        preview = '<img src="' + url + '" style="width:100%;aspect-ratio:16/9;object-fit:cover;display:block;border-bottom:1px solid var(--border)" alt="' + file.name + '">';
      } else {
        preview = '<video src="' + url + '" style="width:100%;aspect-ratio:16/9;object-fit:cover;display:block;border-bottom:1px solid var(--border)" controls></video>';
      }
      bodyEl.innerHTML = preview + '<div class="node-result" style="margin:0;border-radius:0;padding:8px 12px;font-size:12px;color:var(--text2)">' + file.name + '</div>';
    }
    showToast('已上传: ' + file.name);
  }
}

// AddNode override for context menu position
var _origAddNode = addNode;
addNode = function(type, x, y) {
  if (x == null || y == null) {
    var cmMenu = document.getElementById('context-menu');
    if (cmMenu && cmMenu._canvasX != null) {
      x = cmMenu._canvasX;
      y = cmMenu._canvasY;
    }
  }
  return _origAddNode(type, x, y);
};

// ===== HOME PAGE =====
function loadHomePage() {
  var tpl = document.getElementById('home-templates');
  if (tpl) {
    var templates = [
      { name: '空白项目', desc: '从零开始搭建工作流', icon: 'B', color: '#6B7280' },
      { name: '文本生成视频', desc: '输入提示词直接生成视频', icon: 'T', color: '#8B5CF6' },
      { name: '图片生成视频', desc: '上传图片并生成动画视频', icon: 'I', color: '#10B981' },
      { name: '视频增强', desc: '对已有视频进行 AI 增强', icon: 'V', color: '#EC4899' },
    ];
    var html = '';
    for (var i = 0; i < templates.length; i++) {
      var t = templates[i];
      html += '<div class="home-card" onclick="switchPage("create")"><div class="home-card-icon" style="background:' + t.color + '">' + t.icon + '</div><div class="home-card-title">' + t.name + '</div><div class="home-card-desc">' + t.desc + '</div></div>';
    }
    tpl.innerHTML = html;
  }
  var proj = document.getElementById('home-projects');
  if (proj) {
    var projects = getSavedProjects();
    if (projects.length === 0) {
      proj.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text3);font-size:14px">暂无保存的项目。创建一个新项目开始吧！</div>';
    } else {
      var h = '';
      for (var i = 0; i < projects.length; i++) {
        var p = projects[i];
        h += '<div class="home-card" onclick="switchPage("create")"><div class="home-card-title">' + p.name + '</div><div class="home-card-desc">' + (p.desc || '') + '</div><div class="home-card-meta"><span>' + p.date + '</span><span>' + p.nodes + ' 个节点</span></div></div>';
      }
      proj.innerHTML = h;
    }
  }
}
function getSavedProjects() {
  try { return JSON.parse(localStorage.getItem('seedance_projects') || '[]'); } catch(e) { return []; }
}
