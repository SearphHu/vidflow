#!/usr/bin/env python3
"""VidFlow - Production Server"""
import json, os, sys, urllib.request, urllib.error
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = int(os.environ.get("PORT", 8765))
HOST = os.environ.get("HOST", "0.0.0.0")

class Handler(SimpleHTTPRequestHandler):
    def _cors(self, status=200):
        self.send_response(status)
        o = self.headers.get("Origin", "*")
        self.send_header("Access-Control-Allow-Origin", o)
        self.send_header("Access-Control-Allow-Credentials", "true")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Target-URL")
        self.end_headers()
    
    def do_OPTIONS(self):
        self._cors(204)
    
    def _proxy(self, method="GET"):
        target = self.headers.get("X-Target-URL", "")
        auth = self.headers.get("Authorization", "")
        if not target:
            self._cors(400)
            self.wfile.write(json.dumps({"error":"Missing X-Target-URL"}).encode())
            return
        headers = {}
        if auth: headers["Authorization"] = auth
        if method == "POST":
            headers["Content-Type"] = "application/json"
            cl = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(cl) if cl > 0 else b"{}"
        else:
            body = None
        try:
            req = urllib.request.Request(target, data=body, headers=headers, method=method)
            with urllib.request.urlopen(req, timeout=180) as resp:
                d = resp.read()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", self.headers.get("Origin","*"))
                self.end_headers()
                self.wfile.write(d)
        except urllib.error.HTTPError as e:
            self.send_response(e.code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", self.headers.get("Origin","*"))
            self.end_headers()
            self.wfile.write(e.read())
        except Exception as e:
            self.send_response(502)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", self.headers.get("Origin","*"))
            self.end_headers()
            self.wfile.write(json.dumps({"error":str(e)}).encode())
    
    def do_GET(self):
        if self.path.startswith("/api/proxy"):
            self._proxy("GET")
        else:
            super().do_GET()
    
    
    def _handle_generate(self):
        cl = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(cl)) if cl > 0 else {}
        model = body.get("model", "")
        prompt = body.get("prompt", "")
        
        # Map model to API endpoint and key
        api_map = {
            "seedream": {"url": "https://ark.cn-beijing.volces.com/api/v3/images/generations", "key": os.environ.get("SEEDREAM_KEY",""), "model_id": "doubao-seedream-5-0-260128"},
            "seedance": {"url": "https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks", "key": os.environ.get("SEEDANCE_KEY",""), "model_id": "doubao-seedance-2-0-260128"},
            "seedance-mini": {"url": "https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks", "key": os.environ.get("SEEDANCE_MINI_KEY",""), "model_id": "doubao-seedance-2-0-mini-260615"},
            "image2": {"url": "https://api.openai.com/v1/images/generations", "key": os.environ.get("IMAGE2_KEY",""), "model_id": "dall-e-2"},
            "deepseek": {"url": "https://api.deepseek.com/v1/chat/completions", "key": os.environ.get("DEEPSEEK_KEY",""), "model_id": "deepseek-chat"},
        }
        info = api_map.get(model, {})
        if not info.get("key"):
            self._cors(200)
            self.wfile.write(json.dumps({"image_url":"https://picsum.photos/800/450?random="+str(hash(prompt)),"text":"Mock: no API key configured","error":"API key not configured for "+model}).encode())
            return
        
        try:
            # Build request based on model type
            if model in ("seedance", "seedance-mini"):
                content = [{"type":"text","text":prompt}]
                if body.get("image_refs"):
                    for ref in body["image_refs"]:
                        content.append({"type":"image_url","image_url":{"url":ref},"role":"reference_image"})
                req_body = {"model":info["model_id"],"content":content,"duration":body.get("duration",5)}
            elif model == "seedream":
                req_body = {"model":info["model_id"],"prompt":prompt,"size":"2K","response_format":"url","watermark":True,"sequential_image_generation":"disabled"}
            elif model == "image2":
                req_body = {"model":info["model_id"],"prompt":prompt,"n":1,"size":"1024x1024"}
            elif model == "deepseek":
                req_body = {"model":info["model_id"],"messages":[{"role":"user","content":prompt}],"max_tokens":2048}
            else:
                self._cors(400)
                self.wfile.write(json.dumps({"error":"Unknown model"}).encode())
                return
            
            import urllib.request
            req = urllib.request.Request(info["url"], data=json.dumps(req_body).encode(), headers={"Content-Type":"application/json","Authorization":"Bearer "+info["key"]}, method="POST")
            with urllib.request.urlopen(req, timeout=120) as resp:
                data = json.loads(resp.read())
                
                if model in ("seedance", "seedance-mini"):
                    task_id = data.get("id") or data.get("task_id")
                    if task_id:
                        result = {"task_id": task_id}
                    else:
                        result = {"error": "No task ID returned", "raw": str(data)[:200]}
                elif model == "seedream":
                    url = data.get("data",[{}])[0].get("url","")
                    result = {"image_url": url}
                elif model == "image2":
                    url = data.get("data",[{}])[0].get("url","")
                    result = {"image_url": url}
                elif model == "deepseek":
                    text = data.get("choices",[{}])[0].get("message",{}).get("content","")
                    result = {"text": text}
                else:
                    result = {"error": "Unexpected response"}
                
                self._cors(200)
                self.wfile.write(json.dumps(result).encode())
        except urllib.error.HTTPError as e:
            self._cors(e.code)
            self.wfile.write(json.dumps({"error":"API error: HTTP "+str(e.code)}).encode())
        except Exception as e:
            self._cors(200)
            # Fallback to mock
            if model in ("seedream", "image2"):
                self.wfile.write(json.dumps({"image_url":"https://picsum.photos/800/450?random="+str(hash(prompt))}).encode())
            elif model in ("seedance", "seedance-mini"):
                self.wfile.write(json.dumps({"error":"Video API error: "+str(e)}).encode())
            else:
                self.wfile.write(json.dumps({"text":"Mock response: "+str(e)}).encode())
    
    def _handle_poll(self):
        cl = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(cl)) if cl > 0 else {}
        task_id = body.get("task_id", "")
        model = body.get("model", "seedance")
        
        api_map = {
            "seedance": {"url": "https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/", "key": os.environ.get("SEEDANCE_KEY","")},
            "seedance-mini": {"url": "https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/", "key": os.environ.get("SEEDANCE_MINI_KEY","")},
        }
        info = api_map.get(model, {})
        if not task_id or not info.get("key"):
            self._cors(200)
            self.wfile.write(json.dumps({"status":"failed","error":"Missing task_id or API key"}).encode())
            return
        
        try:
            req = urllib.request.Request(info["url"]+task_id, headers={"Authorization":"Bearer "+info["key"]}, method="GET")
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read())
                status = data.get("status","")
                if status in ("succeeded","completed","success"):
                    vu = data.get("output",{}).get("video_url","") or data.get("content",{}).get("video_url","")
                    result = {"status":"completed","video_url":vu} if vu else {"status":"running"}
                elif status in ("failed","error"):
                    result = {"status":"failed","error":"Task failed"}
                else:
                    result = {"status":"running"}
                self._cors(200)
                self.wfile.write(json.dumps(result).encode())
        except Exception as e:
            self._cors(200)
            self.wfile.write(json.dumps({"status":"running"}).encode())
def do_POST(self):
        if self.path == "/api/proxy":
            self._proxy("POST")
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    print(f"\n  VidFlow Server\n  Port: {PORT}\n  Open: http://localhost:{PORT}/index.html\n")
    HTTPServer((HOST, PORT), Handler).serve_forever()
