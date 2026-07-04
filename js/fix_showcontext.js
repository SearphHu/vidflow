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
