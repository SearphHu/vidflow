var isSelecting = false;
var selectionStart = { x: 0, y: 0 };
var selBox = null;

function initCanvas() {
  var vp = document.getElementById("canvas-viewport");
  if (!vp) return;
  
  // Create selection overlay
  selBox = document.createElement("div");
  selBox.id = "selection-box";
  selBox.style.cssText = "position:fixed;border:2px dashed #8B5CF6;background:rgba(139,92,246,0.1);display:none;pointer-events:none;z-index:1000;";
  document.body.appendChild(selBox);

  vp.addEventListener("mousedown", function (e) {
    // Middle button: canvas drag
    if (e.button === 1) {
      e.preventDefault();
      isDraggingCanvas = true;
      dragStart = { x: e.clientX - (canvasState.x || 0), y: e.clientY - (canvasState.y || 0) };
      vp.style.cursor = "grabbing";
      return;
    }
    // Left button: if not on a node, start selection box
    if (e.button === 0 && !e.target.closest(".workflow-node")) {
      isSelecting = true;
      selectionStart.x = e.clientX;
      selectionStart.y = e.clientY;
      selBox.style.left = e.clientX + "px";
      selBox.style.top = e.clientY + "px";
      selBox.style.width = "0px";
      selBox.style.height = "0px";
      selBox.style.display = "block";
    }
  });
  
  document.addEventListener("mousemove", function (e) {
    if (isDraggingCanvas) {
      canvasState.x = e.clientX - dragStart.x;
      canvasState.y = e.clientY - dragStart.y;
      updateTransform();
    }
    if (isSelecting) {
      var x = Math.min(selectionStart.x, e.clientX);
      var y = Math.min(selectionStart.y, e.clientY);
      selBox.style.left = x + "px";
      selBox.style.top = y + "px";
      selBox.style.width = Math.abs(e.clientX - selectionStart.x) + "px";
      selBox.style.height = Math.abs(e.clientY - selectionStart.y) + "px";
    }
  });
  
  document.addEventListener("mouseup", function (e) {
    if (isDraggingCanvas) {
      isDraggingCanvas = false;
      var cv = document.getElementById("canvas-viewport");
      if (cv) cv.style.cursor = "grab";
    }
    if (isSelecting) {
      isSelecting = false;
      selBox.style.display = "none";
      // Select nodes inside the rectangle
      if (e.button === 0) {
        var vp = document.getElementById("canvas-viewport");
        if (vp) {
          var rect = vp.getBoundingClientRect();
          var sLeft = parseInt(selBox.style.left) || 0;
          var sTop = parseInt(selBox.style.top) || 0;
          var sWidth = parseInt(selBox.style.width) || 0;
          var sHeight = parseInt(selBox.style.height) || 0;
          // Only select if dragged enough (avoid accidental clicks)
          if (sWidth > 5 || sHeight > 5) {
            var x1 = (sLeft - rect.left) / (canvasState.scale || 1);
            var y1 = (sTop - rect.top) / (canvasState.scale || 1);
            var x2 = x1 + sWidth / (canvasState.scale || 1);
            var y2 = y1 + sHeight / (canvasState.scale || 1);
            document.querySelectorAll(".workflow-node").forEach(function(n){n.classList.remove("selected")});
            selectedNode = null;
            for (var i = 0; i < nodes.length; i++) {
              var n = nodes[i];
              var el = document.getElementById(n.id);
              if (!el) continue;
              var nx = n.x, ny = n.y;
              var nw = n.width || 280;
              var nh = el.offsetHeight || 200;
              if (nx + nw > x1 && nx < x2 && ny + nh > y1 && ny < y2) {
                el.classList.add("selected");
                selectedNode = n.id;
              }
            }
          }
        }
      }
    }
  });
  
  // Zoom only with Ctrl+scroll
  vp.addEventListener("wheel", function (e) {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    var d = e.deltaY > 0 ? 0.9 : 1.1;
    canvasState.scale = Math.max(0.2, Math.min(3, (canvasState.scale || 1) * d));
    updateTransform();
  }, { passive: false });
  
  updateTransform();
}
