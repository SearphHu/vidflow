function cleanupConnection() {
  var el = document.getElementById("temp-line");
  if (el) el.remove();
  if (connecting.active) {
    connecting.active = false;
    document.removeEventListener("mousemove", onConnectMove);
    document.removeEventListener("mouseup", onConnectEnd);
  }
}
function cleanUpTempLine() { var el = document.getElementById("temp-line"); if (el) el.remove(); }
function showToast(msg, type) {
  var c = document.getElementById("toast-container");
  if (!c) return;
  var t = document.createElement("div");
  t.className = "toast" + (type ? " " + type : "");
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(function () { t.style.opacity = "0"; t.style.transition = "all 0.3s"; setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 300); }, 3000);
}
function getNode(id) { for (var i = 0; i < nodes.length; i++) { if (nodes[i].id === id) return nodes[i]; } return null; }
function updateNodeData(nodeId, key, val) { for (var i = 0; i < nodes.length; i++) { if (nodes[i].id === nodeId) { nodes[i].data[key] = val; return; } } }

function removeNode(id) {
  if (!confirm("确定删除此节点？")) return;
  for (var i = connections.length - 1; i >= 0; i--) { if (connections[i].from === id || connections[i].to === id) connections.splice(i, 1); }
  var el = document.getElementById(id); if (el && el.parentNode) el.parentNode.removeChild(el);
  for (var i = 0; i < nodes.length; i++) { if (nodes[i].id === id) { nodes.splice(i, 1); break; } }
  renderConnections();
}

function getNodeBodyHTML(node) {
  var type = node.type;
  var d = node.data || {};
  var p = d.prompt || "";
  var mot = d.motion || 5, res = d.resolution || "720x1280", dur = d.duration || 5;
  switch (type) {
    case "prompt":
      return '<div class="node-preview-area"><div class="node-preview-placeholder"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".4"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></div><textarea id="' + node.id + '-textarea" placeholder="输入视频描述..." oninput="onPromptInput(this,' + node.id + ')">' + p + "</textarea></div>";
    case "text":
      return '<div class="node-preview-area"><div class="node-preview-placeholder"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".4"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></div><textarea placeholder="输入文本提示..." oninput="updateNodeData(' + node.id + ",'prompt',this.value)">" + p + "</textarea></div>";
    case "image":
      return '<div class="node-preview-area"><input type="text" placeholder="图片生成提示词..." value="' + p + '" oninput="updateNodeData(' + node.id + ",'prompt',this.value)"></div><div class="node-params"><div class="param-row"><label>尺寸</label><select onchange=\"updateNodeData('" + node.id + "','resolution',this.value)\"><option value=\"720x1280\">720x1280</option><option value=\"1080x1920\">1080x1920</option><option value=\"1024x1024\">1024x1024</option></select></div></div>";
    case "video":
      return '<div class="node-preview-area"><div class="node-refs" id="refs-' + node.id + '"><span class="node-ref-empty">连接上游节点以引用</span></div><textarea placeholder="输入视频提示词..." oninput="onPromptInput(this,' + node.id + ')">' + p + "</textarea><div class=\"mention-dropdown\" id=\"mention-" + node.id + "\" style=\"display:none\"></div></div><div class=\"node-params\"><div class=\"param-row\"><label>模型</label><select onchange=\"updateNodeData('" + node.id + "','model',this.value)\"><option value=\"seedance-2\" " + (d.model === "seedance-2" ? "selected" : "") + ">Seedance 2.0</option><option value=\"gen3\" " + (d.model === "gen3" ? "selected" : "") + ">Gen-3 Alpha</option><option value=\"kling\" " + (d.model === "kling" ? "selected" : "") + ">Kling 1.5</option></select></div><div class=\"param-row\"><label>时长(s)</label><input type=\"range\" min=\"4\" max=\"15\" value=\"" + dur + "\" oninput=\"updateNodeData('" + node.id + "','duration',parseInt(this.value));document.getElementById('dur-val-" + node.id + "').textContent=this.value\"><span class=\"param-val\" id=\"dur-val-" + node.id + "\">" + dur + "</span></div><div class=\"param-row\"><label>运动强度</label><input type=\"range\" min=\"1\" max=\"10\" value=\"" + mot + "\" oninput=\"updateNodeData('" + node.id + "','motion',parseInt(this.value))\"><span class=\"param-val\">" + mot + "</span></div><div class=\"param-row\"><label>分辨率</label><select onchange=\"updateNodeData('" + node.id + "','resolution',this.value)\"><option value=\"720x1280\" " + (res === "720x1280" ? "selected" : "") + ">720x1280</option><option value=\"1080x1920\" " + (res === "1080x1920" ? "selected" : "") + ">1080x1920</option><option value=\"1024x1024\" " + (res === "1024x1024" ? "selected" : "") + ">1024x1024</option></select></div></div><div class=\"node-result\" id=\"result-" + node.id + "\" style=\"display:none\"></div>";
    case "preview":
      return '<div class="node-preview-area"><div class="node-preview-placeholder"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".4"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg></div></div>';
    default:
      return "";
  }
}

function renderNode(node) {
  var def = NODE_TYPES[node.type];
  if (!def) return;
  var el = document.createElement("div");
  el.className = "workflow-node";
  el.id = node.id;
  el.style.left = Math.round(node.x) + "px";
  el.style.top = Math.round(node.y) + "px";
  var title = (TYPE_NAMES[node.type] || node.type);
  var clrBtn = '<button class="node-close" onclick="removeNode(\'' + node.id + '\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';
  var portsHTML = renderPorts(node);
  el.innerHTML = '<div class="node-header"><div class="node-dot" style="background:' + def.color + '"></div><span class="node-title">' + title + '</span>' + clrBtn + '</div><div class="node-body">' + getNodeBodyHTML(node) + '</div><div class="node-side-ports">' + portsHTML + '</div>';
  el.addEventListener("mousedown", function (e) {
    if (e.target.closest(".node-close") || e.target.closest(".port") || e.target.closest("textarea") || e.target.closest("input") || e.target.closest("button") || e.target.closest("select") || e.target.closest(".param-btn") || e.target.closest("input[type='range']")) return;
    selectedNode = node.id;
    document.querySelectorAll(".workflow-node").forEach(function (n) { n.classList.remove("selected"); });
    el.classList.add("selected");
    var sx = e.clientX, sy = e.clientY, ox = node.x, oy = node.y;
    function mv(ev) { node.x = ox + (ev.clientX - sx) / (canvasState.scale || 1); node.y = oy + (ev.clientY - sy) / (canvasState.scale || 1); el.style.left = Math.round(node.x) + "px"; el.style.top = Math.round(node.y) + "px"; renderConnections(); }
    function up() { document.removeEventListener("mousemove", mv); document.removeEventListener("mouseup", up); }
    document.addEventListener("mousemove", mv);
    document.addEventListener("mouseup", up);
  });
  var nl = document.getElementById("nodes-layer");
  if (nl) nl.appendChild(el);
  node.el = el;
}

function renderPorts(node) {
  var def = NODE_TYPES[node.type];
  if (!def) return '';
  var html = '';
  if (def.inputs) {
    for (var i = 0; i < def.inputs.length; i++) {
      var p = def.inputs[i];
      html += '<div class="port side-port side-port-input" title="' + p + '" data-node="' + node.id + '" data-port="' + p + '" onmousedown="event.stopPropagation();startConnection(\'' + node.id + '\',\'' + p + '\',event)"><div class="side-port-dot port-dot input"></div></div>';
    }
  }
  if (def.outputs) {
    for (var i = 0; i < def.outputs.length; i++) {
      var p = def.outputs[i];
      html += '<div class="port side-port side-port-output" title="' + p + '" data-node="' + node.id + '" data-port="' + p + '" onmousedown="event.stopPropagation();startConnection(\'' + node.id + '\',\'' + p + '\',event)"><div class="side-port-dot port-dot output"></div></div>';
    }
  }
  return html;
}

function startConnection(nodeId, port, e) {
  e.stopPropagation();
  var target = e.target.closest(".side-port, .port-dot");
  if (!target) return;
  if (!nodeId || !port) {
    nodeId = target.getAttribute("data-node") || nodeId;
    port = target.getAttribute("data-port") || port;
  }
  if (!nodeId || !port) return;
  var dot = target.querySelector(".side-port-dot") || target;
  var dRect = dot.getBoundingClientRect();
  var dotCX = dRect.left + dRect.width / 2;
  var dotCY = dRect.top + dRect.height / 2;
  connecting = { active: true, sourceNode: nodeId, sourcePort: port, mouseX: dotCX, mouseY: dotCY, sourceX: dotCX, sourceY: dotCY };
  var svg = document.getElementById("connections-layer");
  if (!svg) return;
  var line = document.createElementNS("http://www.w3.org/2000/svg", "path");
  line.id = "temp-line"; line.setAttribute("class", "temp-line");
  svg.appendChild(line);
  document.addEventListener("mousemove", onConnectMove);
  document.addEventListener("mouseup", onConnectEnd);
}
function onConnectMove(e) { if (!connecting.active) return; connecting.mouseX = e.clientX; connecting.mouseY = e.clientY; updateTempLine(); }
function onConnectEnd(e) {
  if (!connecting.active) return;
  var target = e.target.closest(".side-port, .port-dot");
  if (!target) { cleanupConnection(); return; }
  if (target.classList.contains("side-port-input") || (target.classList.contains("port-dot") && target.classList.contains("input"))) {
    var toNode = target.getAttribute("data-node");
    var toPort = target.getAttribute("data-port");
    if (toNode && toNode !== connecting.sourceNode) {
      for (var i = connections.length - 1; i >= 0; i--) { if (connections[i].to === toNode && connections[i].toPort === toPort) { connections.splice(i, 1); } }
      connections.push({ from: connecting.sourceNode, fromPort: connecting.sourcePort, to: toNode, toPort: toPort });
      renderConnections();
      showToast("已连接");
    }
  }
  var el = document.getElementById("temp-line"); if (el) el.remove();
  connecting.active = false;
  document.removeEventListener("mousemove", onConnectMove);
  document.removeEventListener("mouseup", onConnectEnd);
}
function updateTempLine() {
  var line = document.getElementById("temp-line");
  if (!line || !connecting.active) return;
  var vp = document.getElementById("canvas-viewport"); if (!vp) return;
  var rect = vp.getBoundingClientRect();
  var sx = (connecting.sourceX - rect.left - canvasState.x) / canvasState.scale;
  var sy = (connecting.sourceY - rect.top - canvasState.y) / canvasState.scale;
  var ex = ((connecting.mouseX || 0) - rect.left - canvasState.x) / canvasState.scale;
  var ey = ((connecting.mouseY || 0) - rect.top - canvasState.y) / canvasState.scale;
  var cx = (sx + ex) / 2;
  line.setAttribute("d", "M" + sx + " " + sy + " C" + cx + " " + sy + "," + cx + " " + ey + "," + ex + " " + ey);
}
function renderConnections() {
  var svg = document.getElementById("connections-layer"); if (!svg) return;
  var vp = document.getElementById("canvas-viewport"); if (!vp) return;
  var rect = vp.getBoundingClientRect();
  var html = "";
  for (var ci = 0; ci < connections.length; ci++) {
    var c = connections[ci];
    var fn = getNode(c.from), tn = getNode(c.to);
    if (!fn || !tn || !fn.el || !tn.el) continue;
    var fromPortEl = fn.el.querySelector('.side-port[data-port="' + c.fromPort + '"] .side-port-dot');
    var toPortEl = tn.el.querySelector('.side-port[data-port="' + c.toPort + '"] .side-port-dot');
    if (!fromPortEl || !toPortEl) continue;
    var fpRect = fromPortEl.getBoundingClientRect();
    var tpRect = toPortEl.getBoundingClientRect();
    var sx = (fpRect.left + fpRect.width/2 - rect.left - canvasState.x) / canvasState.scale;
    var sy = (fpRect.top + fpRect.height/2 - rect.top - canvasState.y) / canvasState.scale;
    var ex = (tpRect.left + tpRect.width/2 - rect.left - canvasState.x) / canvasState.scale;
    var ey = (tpRect.top + tpRect.height/2 - rect.top - canvasState.y) / canvasState.scale;
    var mx = (sx + ex) / 2;
    var color = c.fromPort === "prompt" ? "#8B5CF6" : c.fromPort === "image_url" ? "#10B981" : "#EC4899";
    var midX = (sx + ex) / 2;
    var midY = (sy + ey) / 2;
    html += '<g class="conn-group" data-idx="' + ci + '">';
    html += '<path d="M' + sx + ' ' + sy + ' C' + mx + ' ' + sy + ',' + mx + ' ' + ey + ',' + ex + ' ' + ey + '" stroke="' + color + '" stroke-width="8" fill="none" stroke-linecap="round" opacity="0" class="conn-hit"/>';
    html += '<path d="M' + sx + ' ' + sy + ' C' + mx + ' ' + sy + ',' + mx + ' ' + ey + ',' + ex + ' ' + ey + '" stroke="' + color + '" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.5" class="conn-line" style="cursor:pointer"/>';
    html += '<circle cx="' + ex + '" cy="' + ey + '" r="4" fill="' + color + '" opacity="0.6"/>';
    html += '<g class="conn-delete" style="display:none;cursor:pointer" onclick="removeConnection(' + ci + ')" transform="translate(' + midX + ',' + (midY - 14) + ')">';
    html += '<circle cx="0" cy="0" r="12" fill="var(--card)" stroke="var(--border)" stroke-width="1.5"/>';
    html += '<path d="M-4-3L4 3M4-3L-4 3" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round"/>';
    html += '</g></g>';
  }
  svg.innerHTML = html;
  svg.querySelectorAll(".conn-group").forEach(function(g) {
    var line = g.querySelector(".conn-line");
    var delBtn = g.querySelector(".conn-delete");
    var timer = null;
    function showDel() { if (delBtn) delBtn.style.display = "block"; }
    function hideDel() { if (delBtn) delBtn.style.display = "none"; }
    function onOver() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(showDel, 2000);
      if (line) line.setAttribute("stroke-width", "4");
    }
    function onOut() {
      if (timer) { clearTimeout(timer); timer = null; }
      hideDel();
      if (line) line.setAttribute("stroke-width", "2.5");
    }
    g.addEventListener("mouseenter", onOver);
    g.addEventListener("mouseleave", onOut);
  });
}

function initContextMenu() {
  var vp = document.getElementById("canvas-viewport");
  if (!vp) return;
  vp.addEventListener("contextmenu", function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.target.closest(".workflow-node")) return;
    var menu = document.getElementById("context-menu");
    if (!menu) return;
    menu.style.left = e.clientX + "px";
    menu.style.top = e.clientY + "px";
    menu.style.display = "block";
    var rect = vp.getBoundingClientRect();
    if (rect && rect.width > 0) {
      menu._canvasX = (e.clientX - rect.left - (canvasState.x || 0)) / (canvasState.scale || 1);
      menu._canvasY = (e.clientY - rect.top - (canvasState.y || 0)) / (canvasState.scale || 1);
    }
  });
  document.addEventListener("mousedown", function(e) {
    if (!e.target.closest(".context-menu")) closeContextMenu();
  });
  document.addEventListener("keydown", function(e) { if (e.key === "Escape") closeContextMenu(); });
}
function closeCM() { closeContextMenu(); }
function closeContextMenu() {
  var m = document.getElementById("context-menu");
  if (m) m.style.display = "none";
}

// Override addNode for context menu position
var _origAddNode2 = addNode;
addNode = function(type, x, y) {
  if (x == null || y == null) {
    var cmMenu = document.getElementById("context-menu");
    if (cmMenu && cmMenu._canvasX != null) {
      x = cmMenu._canvasX;
      y = cmMenu._canvasY;
    }
  }
  return _origAddNode2(type, x, y);
};

// Override renderConnections to also update refs
var _origRenderConn2 = renderConnections;
renderConnections = function() {
  _origRenderConn2();
  for (var ni = 0; ni < nodes.length; ni++) {
    if (nodes[ni].type === "video") {
      if (typeof renderRefs === "function") renderRefs(nodes[ni].id);
    }
  }
};
