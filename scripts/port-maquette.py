"""
Convertit une page de la maquette validée (FleetAdmin-maquettes/pages-navigateur/<Page>-v3.html) en 3 fichiers
chargés par la page React correspondante du back-office :
  - style.css  : CSS de la maquette, limité au conteneur .mq-<slug> (n'affecte pas le reste de l'application)
  - markup.html: contenu de la page (sans menu latéral, sans liens Documentation / Guide métier, sans grands paragraphes)
  - script.js  : script de la maquette, exporté en `mount(root, opts)` qui renvoie une fonction de nettoyage

Usage : python -I scripts/port-maquette.py <chemin Page-v3.html> <dossier de sortie> <slug>
"""
import pathlib
import re
import sys

src, out_dir, slug = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]), sys.argv[3]
html = src.read_text(encoding="utf-8")
out_dir.mkdir(parents=True, exist_ok=True)
SCOPE = f".mq-{slug}"

# ---------------------------------------------------------------- CSS
css = "\n".join(re.findall(r"<style[^>]*>(.*?)</style>", html, re.S))
css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)


def scope_selector(sel: str) -> str:
    sel = sel.strip()
    if not sel:
        return sel
    if sel in (":root", "html", "body", "html,body"):
        return SCOPE
    sel = re.sub(r"^(html\s*,\s*)?body(\.[\w-]+)?", lambda m: SCOPE + (m.group(2) or ""), sel)
    sel = re.sub(r"^:root", SCOPE, sel)
    if sel.startswith(SCOPE):
        return sel
    return f"{SCOPE} {sel}"


def scope_block(text: str) -> str:
    res, i, n = [], 0, len(text)
    while i < n:
        j = text.find("{", i)
        if j < 0:
            res.append(text[i:])
            break
        head = text[i:j].strip()
        depth, k = 1, j + 1
        while k < n and depth:
            if text[k] == "{":
                depth += 1
            elif text[k] == "}":
                depth -= 1
            k += 1
        body = text[j + 1 : k - 1]
        if head.startswith("@media") or head.startswith("@supports"):
            res.append(f"{head}{{{scope_block(body)}}}")
        elif head.startswith("@"):
            res.append(f"{head}{{{body}}}")
        else:
            sels = ",".join(scope_selector(s) for s in head.split(","))
            res.append(f"{sels}{{{body}}}")
        i = k
    return "\n".join(res)


scoped = scope_block(css)
# le conteneur remplace <body> : il prend toute la largeur de la zone de contenu
scoped = f"{SCOPE}{{min-height:100%;}}\n" + scoped
(out_dir / "style.css").write_text(scoped, encoding="utf-8")

# ---------------------------------------------------------------- markup
body = re.search(r"<body[^>]*>(.*?)<script", html, re.S).group(1)
main = re.search(r"<main[^>]*>(.*)</main>", body, re.S)
inner = main.group(1) if main else body
after_main = body[main.end():] if main else ""
modal_divs = "".join(re.findall(r"<div id=\"(?:md|modal)\"></div>", after_main))
main_open = re.search(r"<main([^>]*)>", body).group(1) if main else ""
# sélecteur « Connecté » du menu latéral de la maquette : gardé caché (le script le lit), le compte vient du back-office
# menu latéral de la maquette gardé caché : son script y lit / écrit (sélecteur « Connecté », libellés du menu)
nav_m = re.search(r"<nav.*?</nav>", body, re.S)
nav_select = nav_m.group(0) if nav_m else ""
markup = f"<main{main_open}>{inner}</main>{modal_divs}<div hidden>{nav_select}</div>"
# liens Documentation / Guide métier et notes de documentation
# gardés cachés et vides : le script de la maquette peut y écrire (ex. #docLink) sans erreur
markup = re.sub(r'<a ([^>]*href="Documentation[^"]*"[^>]*)>.*?</a>', r'<a hidden \1></a>', markup, flags=re.S)
markup = re.sub(r'\s*·?\s*<a href="#[^"]*" data-go="[^"]*" class="note">[^<]*</a>', "", markup)
# sous-titre explicatif sous le titre de la page
markup = re.sub(r'<p class="hsub"[^>]*>.*?</p>', '<p class="hsub" id="pSub" hidden></p>', markup, flags=re.S)
markup = re.sub(r'<p id="pSub"', '<p hidden id="pSub"', markup)
# phrases d'aide sous les tableaux (« Cliquez sur … pour … »)
markup = re.sub(r'<div class="foot">[^<]*</div>', "", markup)
(out_dir / "markup.html").write_text(markup.strip() + "\n", encoding="utf-8")

# ---------------------------------------------------------------- script
scripts = re.findall(r"<script>(.*?)</script>", html, re.S)
main_js = max(scripts, key=len)
js = main_js
# écouteurs globaux : enregistrés pour être retirés quand on quitte la page
js = js.replace("document.addEventListener(", "__on(")
js = js.replace("document.body.classList", "__root.classList")
# marques ⓘ / références de documentation dans les textes générés
js = re.sub(r'\s*·?\s*<a href="#[^"]*" data-go="[^"]*" class="note">[^<]*</a>', "", js)
# boutons et liens « Documentation » des fenêtres
js = re.sub(r'<a class="btn" href="Documentation[^"]*">Documentation</a>', "", js)
js = re.sub(r'<a [^>]*href="Documentation[^"]*"[^>]*>[^<]*</a>', "", js)

module = f"""/* eslint-disable */
// @ts-nocheck
/**
 * Script de la maquette validée {src.name} (FleetAdmin-maquettes v3), généré par scripts/port-maquette.py.
 * Même données, mêmes calculs, mêmes fenêtres que la maquette ; monté par la page React du back-office.
 */
export function mount(__root, opts = {{}}) {{
  const __listeners = [];
  // écouteurs et minuteries actifs seulement tant que la page est affichée, retirés quand on la quitte
  const __on = (type, fn, capture) => {{
    const w = (e) => {{ if (__root.isConnected) fn(e); }};
    document.addEventListener(type, w, capture);
    __listeners.push([type, w, capture]);
  }};
  const __timers = [];
  const setTimeout = (fn, ms, ...a) => {{ const id = window.setTimeout(() => {{ if (__root.isConnected) fn(...a); }}, ms); __timers.push(id); return id; }};
  const setInterval = (fn, ms, ...a) => {{ const id = window.setInterval(() => {{ if (__root.isConnected) fn(...a); }}, ms); __timers.push(id); return id; }};
  const clearTimeout = (id) => window.clearTimeout(id);
  const clearInterval = (id) => window.clearInterval(id);
  // compte connecté (fa-view = revendeur, fa-role = profil SAV) fourni par le back-office ; rien n'est écrit dans le navigateur
  const localStorage = {{
    getItem: (k) => (k === 'fa-view' ? opts.view || '' : k === 'fa-role' ? opts.role || '' : null),
    setItem: () => {{}},
    removeItem: () => {{}}
  }};
  // liens vers les autres pages de la maquette → navigation du back-office
  const location = {{
    get pathname() {{ return '/{src.name}'; }},
    get search() {{ return opts.search || ''; }},
    get hash() {{ return ''; }},
    set href(v) {{ if (opts.navigate) opts.navigate(v); }},
    replace: (v) => {{ if (opts.navigate) opts.navigate(v); }},
    reload: () => {{}}
  }};
{js}
  if (typeof opts.after === 'function') opts.after({{ setView: typeof setView === 'function' ? setView : null }});
  return () => {{
    __listeners.forEach(([t, f, c]) => document.removeEventListener(t, f, c));
    __timers.forEach((id) => {{ window.clearTimeout(id); window.clearInterval(id); }});
  }};
}}
"""
(out_dir / "script.js").write_text(module, encoding="utf-8")
DTS = """export function mount(root: HTMLElement, opts?: {
  view?: string;
  role?: string;
  search?: string;
  navigate?: (href: string) => void;
  after?: (api: { setView: ((v: string) => void) | null }) => void;
}): () => void;
"""
(out_dir / "script.d.ts").write_text(DTS, encoding="utf-8")
print(f"{src.name}: css {len(scoped)} · markup {len(markup)} · script {len(module)}")
