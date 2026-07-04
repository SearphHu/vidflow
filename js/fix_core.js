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

function renderNode(node) {
  var def = NODE_TYPES[node.type];
  if (!def) return;
  var el = document.createElement("div");
  el.className = "workflow-node";
  el.id = node.id;
  el.style.left = Math.round(node.x) + "px";
  el.style.top = Math.round(node.y) + "px";
  var html = "<div class=\"node-header\"><div class=\"node-dot\" style=\"background:" + def.color + "\"></div><span class=\"node-title\">" + def.title + "</span><button class=\"node-close\" onclick=\"removeNode("" + node.id + "")\"><svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"/><line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"/></svg></button></div><div class=\"node-body\">" + getNodeBodyHTML(node) + "</div><div class=\"node-side-ports\">" + renderPorts(node) + "</div>";
  el.innerHTML = html;
  el.addEventListener("mousedown", function (e) {
    if (e.target.closest(".node-close") || e.target.closest(".port") || e.target.closest("textarea") || e.target.closest("input") || e.target.closest("button") || e.target.closest("select") || e.target.closest(".param-btn") || e.target.closest("input[type=\"range\"]")) return;
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
  if (!def) return "";
  var html = "";
  if (def.inputs) {
    for (var i = 0; i < def.inputs.length; i++) {
      var p = def.inputs[i];
      html += "<div class=\"port side-port side-port-input\" title=\"" + p + "\" data-node=\"" + node.id + "\" data-port=\"" + p + "\" onmousedown=\"event.stopPropagation();startConnection("" + node.id + "','" + p + "',event)\"><div class=\"side-port-dot port-dot input\"></div></div>";
    }
  }
  if (def.outputs) {
    for (var i = 0; i < def.outputs.length; i++) {
      var p = def.outputs[i];
      html += "<div class=\"port side-port side-port-output\" title=\"" + p + "\" data-node=\"" + node.id + "\" data-port=\"" + p + "\" onmousedown=\"event.stopPropagation();startConnection("" + node.id + "','" + p + "',event)\"><div class=\"side-port-dot port-dot output\"></div></div>";
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
    var fromPortEl = fn.el.querySelector(".side-port[data-port=\"" + c.fromPort + "\"] .side-port-dot");
    var toPortEl = tn.el.querySelector(".side-port[data-port=\"" + c.toPort + "\"] .side-port-dot");
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
    html += "<g class=\"conn-group\" data-idx=\"" + ci + "\">";
    html += "<path d=\"M" + sx + " " + sy + " C" + mx + " " + sy + "," + mx + " " + ey + "," + ex + " " + ey + "\" stroke=\"" + color + "\" stroke-width=\"8\" fill=\"none\" stroke-linecap=\"round\" opacity=\"0\" class=\"conn-hit\"/>";
    html += "<path d=\"M" + sx + " " + sy + " C" + mx + " " + sy + "," + mx + " " + ey + "," + ex + " " + ey + "\" stroke=\"" + color + "\" stroke-width=\"2.5\" fill=\"none\" stroke-linecap=\"round\" opacity=\"0.5\" class=\"conn-line\" style=\"cursor:pointer\"/>";
    html += "<circle cx=\"" + ex + "\" cy=\"" + ey + "\" r=\"4\" fill=\"" + color + "\" opacity=\"0.6\"/>";
    html += "<g class=\"conn-delete\" style=\"display:none;cursor:pointer\" onclick=\"removeConnection(" + ci + ")\" transform=\"translate(" + midX + "," + (midY - 14) + ")\">";
    html += "<circle cx=\"0\" cy=\"0\" r=\"12\" fill=\"var(--card)\" stroke=\"var(--border)\" stroke-width=\"1.5\"/>";
    html += "<path d=\"M-4-3L4 3M4-3L-4 3\" stroke=\"#EF4444\" stroke-width=\"2.5\" stroke-linecap=\"round\"/>";
    html += "</g></g>";
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
var _origAddNode = addNode;
addNode = function(type, x, y) {
  if (x == null || y == null) {
    var cmMenu = document.getElementById("context-menu");
    if (cmMenu && cmMenu._canvasX != null) {
      x = cmMenu._canvasX;
      y = cmMenu._canvasY;
    }
  }
  return _origAddNode(type, x, y);
};

// Override renderConnections to also update refs
var _origRenderConn = renderConnections;
renderConnections = function() {
  _origRenderConn();
  for (var ni = 0; ni < nodes.length; ni++) {
    if (nodes[ni].type === "video") {
      if (typeof renderRefs === "function") renderRefs(nodes[ni].id);
    }
  }
};

// Override renderNode to also add close button handler
var _origRenderNode = renderNode;
renderNode = function(node) {
  _origRenderNode(node);
};
