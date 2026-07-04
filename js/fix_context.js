function initContextMenu() {
  // Prevent browser context menu on canvas
  document.getElementById("canvas-viewport").addEventListener("contextmenu", function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.target.closest(".workflow-node")) return;
    showContextMenu(e.clientX, e.clientY);
  });
  // Safety net: prevent browser menu on the whole app
  document.getElementById("canvas-wrapper").addEventListener("contextmenu", function(e) {
    e.preventDefault();
  });
  // Close menu when clicking outside
  document.addEventListener("mousedown", function(e) {
    if (!e.target.closest(".context-menu")) closeContextMenu();
  });
  // Keyboard shortcuts
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
