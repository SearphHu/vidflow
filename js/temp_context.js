function initContextMenu() {
  document.addEventListener("contextmenu", function(e) { e.preventDefault(); });
  document.getElementById("canvas-viewport").addEventListener("contextmenu", function(e) {
    e.stopPropagation();
    if (e.target.closest(".workflow-node")) return;
    showContextMenu(e.clientX, e.clientY);
  });
  document.addEventListener("mousedown", function(e) {
    if (!e.target.closest(".context-menu")) closeContextMenu();
  });
  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") { closeContextMenu(); document.querySelectorAll(".workflow-node").forEach(function(n){n.classList.remove("selected")}); selectedNode = null; }
    if ((e.key === "Delete" || e.key === "Backspace") && selectedNode) {
      if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return;
      e.preventDefault();
      removeNode(selectedNode);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "a") { e.preventDefault(); }
  });
}
function showContextMenu(clientX, clientY) {
  var menu = document.getElementById("context-menu");
  if (!menu) return;
  menu.style.left = clientX + "px";
  menu.style.top = clientY + "px";
  menu.style.display = "block";
  var vp = document.getElementById("canvas-viewport");
  if (vp) {
    var rect = vp.getBoundingClientRect();
    if (rect && rect.width > 0) {
      menu._canvasX = (clientX - rect.left) / (canvasState.scale || 1);
      menu._canvasY = (clientY - rect.top) / (canvasState.scale || 1);
    }
  }
}
function closeCM() { closeContextMenu(); }
function closeContextMenu() {
  var m = document.getElementById("context-menu");
  if (m) m.style.display = "none";
}
