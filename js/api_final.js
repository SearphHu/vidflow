const SeedanceAPI={
  apiKey: localStorage.getItem('seedance_api_key') || '',
  deepseekKey: localStorage.getItem('deepseek_api_key') || 'sk-05c533fcaad642a7b669385d0b67b5b1',
  endpoint: 'https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks',
  modelId: 'doubao-seedance-2-0-260128',
  setApiKey(k){this.apiKey=k;localStorage.setItem('seedance_api_key',k)},
  setDeepSeekKey(k){this.deepseekKey=k;localStorage.setItem('deepseek_api_key',k)},
  async generateVideo(params){
    if(!this.apiKey)return this.mockGenerate(params);
    try{
      var content=[{type:'text',text:params.prompt||''}];
      if(params.image_urls){var imgs=params.image_urls.split('\n').filter(function(u){return u});for(var i=0;i<imgs.length;i++){content.push({type:'image_url',image_url:{url:imgs[i]},role:'reference_image'})}}
      if(params.video_urls){var vids=params.video_urls.split('\n').filter(function(u){return u});for(var i=0;i<vids.length;i++){content.push({type:'video_url',video_url:{url:vids[i]},role:'reference_video'})}}
      var body={model:this.modelId,content:content,duration:params.duration||11,ratio:params.ratio||'16:9',quality:params.quality||'720P'};
      var r=await fetch(this.endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+this.apiKey},body:JSON.stringify(body)});
      if(!r.ok)throw new Error('HTTP '+r.status);
      var result=await r.json();
      if(result.id)return await this.pollTask(result.id);
      return result;
    }catch(e){console.error(e);return this.mockGenerate(params)}
  },
  async pollTask(taskId){
    for(var i=0;i<60;i++){
      await new Promise(function(r){setTimeout(r,5000)});
      try{
        var r=await fetch(this.endpoint+'/'+taskId,{headers:{Authorization:'Bearer '+this.apiKey}});
        var status=await r.json();
        if(status.status==='succeeded'||status.status==='completed')return status;
        if(status.status==='failed')return this.mockGenerate({});
      }catch(e){}
    }
    return this.mockGenerate({});
  },
  mockGenerate(p){
    var urls=['https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4','https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4','https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4','https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'];
    return{id:'gen_'+Date.now(),video_url:urls[Math.floor(Math.random()*urls.length)],prompt:p.prompt||'',model:this.modelId,status:'completed',created_at:new Date().toISOString()}
  },
  async generateImage(prompt){
    return{id:'img_'+Date.now(),image_url:'https://picsum.photos/800/450?random='+Math.random(),prompt:prompt}
  },
  async generateText(prompt,model){
    if(model==='deepseek'&&this.deepseekKey){
      try{
        var r=await fetch('https://api.deepseek.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+this.deepseekKey},body:JSON.stringify({model:'deepseek-chat',messages:[{role:'user',content:prompt}],max_tokens:2048})});
        if(!r.ok)throw new Error('HTTP '+r.status);
        var d=await r.json();
        return{id:'txt_'+Date.now(),text:d.choices[0].message.content||'',title:'AI 生成结果'}
      }catch(e){console.error(e);return this.mockGenerateText(prompt)}
    }
    return this.mockGenerateText(prompt);
  },
  mockGenerateText(prompt){
    return{id:'txt_'+Date.now(),text:'这是由 AI 生成的文本内容。\n\n当前节点: '+prompt,title:'AI 生成结果'}
  }
};
