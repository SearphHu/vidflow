
var { readFileSync, writeFileSync } = await import('node:fs');
var path = 'C:/Users/Administrator/Documents/Ai agent/ai-video-platform/studio.html';
var content = readFileSync(path, 'utf-8');

// 1. Add expand button - insert after </textarea> and before mention-dropdown
var old_part = '</textarea><div class="mention-dropdown"';
var new_part = '</textarea><button class="expand-btn" onclick="openPromptModal(\'' + ' + node.id + \'\')\'" title="放大编辑"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg></button><div class="mention-dropdown"';

// Instead of using template literals, use manual construction
content = content.replace(
  '</textarea><div class=\"mention-dropdown\"',
  '</textarea><button class=\"expand-btn\" onclick=\"openPromptModal(\'' + ' + node.id + \'\')\'" title=\"放大编辑\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3\"/></svg></button><div class=\"mention-dropdown\"'
);
console.log('1. Expand button added');

// 2. Modal HTML
var modal = '<div id="prompt-modal" class="prompt-modal" style="display:none"><div class="prompt-modal-backdrop" onclick="closePromptModal()"></div><div class="prompt-modal-content"><div class="prompt-modal-header"><span class="prompt-modal-title">编辑提示词</span><button class="prompt-modal-close" onclick="closePromptModal()"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div><textarea id="modal-textarea" class="prompt-modal-textarea" placeholder="输入视频提示词..." oninput="onModalInput(this)"></textarea><div class="mention-dropdown" id="modal-mention-dropdown" style="display:none"></div><div class="prompt-modal-footer"><button class="btn btn-primary" onclick="savePromptModal()">确定</button><button class="btn btn-ghost" onclick="closePromptModal()">取消</button></div></div></div>';
content = content.replace('</body>', modal + '</body>');
console.log('2. Modal HTML added');

// 3. CSS
var css = '<style>.ta-wrap{position:relative}.expand-btn{position:absolute;bottom:6px;right:6px;width:26px;height:26px;border-radius:6px;border:1px solid var(--border);background:var(--bg3);color:var(--text2);cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0.5;transition:opacity .2s;z-index:2;padding:0}.expand-btn:hover{opacity:1;background:var(--accent);color:#fff}.prompt-modal{position:fixed;top:0;left:0;right:0;bottom:0;z-index:100000;display:none;align-items:center;justify-content:center}.prompt-modal-backdrop{position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5)}.prompt-modal-content{position:relative;background:var(--card);border-radius:12px;width:85%;max-width:900px;max-height:85vh;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,0.3);display:flex;flex-direction:column}.prompt-modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}.prompt-modal-title{font-size:16px;font-weight:600;color:var(--text)}.prompt-modal-close{background:none;border:none;color:var(--text2);cursor:pointer;padding:4px;border-radius:4px;line-height:1}.prompt-modal-close:hover{background:var(--bg2);color:var(--text)}.prompt-modal-textarea{width:100%;min-height:300px;padding:14px;font-size:14px;line-height:1.6;border-radius:8px;border:1px solid var(--border);background:var(--bg3);color:var(--text);resize:vertical;outline:none;font-family:inherit}.prompt-modal-textarea:focus{border-color:#8B5CF6;box-shadow:0 0 0 2px rgba(139,92,246,0.2)}.prompt-modal-footer{display:flex;gap:8px;justify-content:flex-end;margin-top:16px}</style>';
content = content.replace('</head>', css + '</head>');
console.log('3. CSS added');

// 4. JavaScript functions
var js = 'var _modalNodeId=null;function openPromptModal(nodeId){_modalNodeId=nodeId;var ta=document.getElementById(nodeId+\'-textarea\');if(!ta)return;document.getElementById(\'modal-textarea\').value=ta.value;document.getElementById(\'prompt-modal\').style.display=\'flex\';setTimeout(function(){document.getElementById(\'modal-textarea\').focus()},100)}function closePromptModal(){document.getElementById(\'prompt-modal\').style.display=\'none\';_modalNodeId=null}function savePromptModal(){if(_modalNodeId){var ta=document.getElementById(_modalNodeId+\'-textarea\');var mt=document.getElementById(\'modal-textarea\');if(ta&&mt){ta.value=mt.value;updateNodeData(_modalNodeId,\'prompt\',mt.value)}}closePromptModal()}function onModalInput(el){var text=el.value;var atPos=text.lastIndexOf(\'@\');if(atPos>=0){var query=text.substring(atPos+1).toLowerCase();showMentions(_modalNodeId,query,el)}else{hideMentions(_modalNodeId)}}window.openPromptModal=openPromptModal;window.closePromptModal=closePromptModal;window.savePromptModal=savePromptModal;window.onModalInput=onModalInput;';
content = content.replace('</script>', js + '</script>');
console.log('4. JS functions added');

writeFileSync(path, content, 'utf-8');
console.log('Done!');
