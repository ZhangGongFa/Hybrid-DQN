from pathlib import Path
root=Path(__file__).parent
html=(root/'template.html').read_text(encoding='utf-8-sig')
app=(root/'app-core.js').read_text(encoding='utf-8-sig').replace('/*V2_EXTENSIONS*/',(root/'app-v2.js').read_text(encoding='utf-8-sig'))
(root/'app.js').write_text(app,encoding='utf-8')
engine=(root/'engine.js').read_text(encoding='utf-8-sig')+'\n'+(root/'engine-v2.js').read_text(encoding='utf-8-sig')
css=(root/'styles.css').read_text(encoding='utf-8-sig')+'\n'+(root/'styles-v2.css').read_text(encoding='utf-8-sig')
for key,content in [('STYLE',css),('ENGINE',engine),('APP',app)]:html=html.replace('/*'+key+'*/',content)
(root/'dist'/'index.html').write_text(html,encoding='utf-8')
print('Built standalone HTML:',len(html.encode('utf-8')),'bytes')
