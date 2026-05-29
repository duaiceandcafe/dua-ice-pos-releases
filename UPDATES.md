# 🔄 Cómo funcionan las actualizaciones automáticas

La app instalada en el cliente **comprueba si hay nueva versión** automáticamente:
- 5 segundos después de abrir
- Cada 4 horas mientras está abierta

Si hay actualización:
1. Se descarga en silencio en segundo plano (barra de progreso en taskbar)
2. Cuando termina, le aparece al cliente: **"Update Ready — Restart Now / Later"**
3. Si elige "Later" → se instala cuando cierre la app

---

## 🚀 Setup inicial (1 sola vez)

### 1. Crea cuenta de GitHub

Si no tienes: https://github.com/signup — gratis.

### 2. Crea un repositorio para los releases

1. Ve a https://github.com/new
2. Repository name: `dua-ice-pos-releases`
3. **Public** (más fácil — si quieres Private necesitas configurar token; ver más abajo)
4. ✅ Add a README
5. Create repository

### 3. Edita `package.json`

Cambia esto:
```json
"owner": "YOUR_GITHUB_USERNAME",
```
Por tu usuario real de GitHub, ej:
```json
"owner": "bilalsheikh",
```

### 4. Crea un Personal Access Token

Lo necesitas para subir releases desde tu Mac:

1. https://github.com/settings/tokens/new
2. Note: `electron-builder dua-ice-pos`
3. Expiration: **No expiration** (o 1 año)
4. Permisos a marcar:
   - ✅ `repo` (toda la sección)
5. Generate token → **copia el token** (empieza con `ghp_...`)
6. Guárdalo en un sitio seguro (no se vuelve a mostrar)

### 5. Exporta el token en tu terminal

```bash
export GH_TOKEN="ghp_tutokenaqui"
```

Para que se guarde permanente, añade esa línea al final de `~/.zshrc` o `~/.bash_profile`:
```bash
echo 'export GH_TOKEN="ghp_tutokenaqui"' >> ~/.zshrc
source ~/.zshrc
```

---

## 📦 Workflow cuando hagas una actualización

Cada vez que cambies el HTML del POS:

### 1. Reemplaza `index.html`
Copia la versión nueva desde `../hjhhhjhjj.html`:
```bash
cp ../hjhhhjhjj.html index.html
```

### 2. Sube la versión en `package.json`
Cambia `"version": "1.0.0"` a la siguiente:
- Pequeño fix → `1.0.1`, `1.0.2`...
- Nueva feature → `1.1.0`, `1.2.0`...
- Cambio gordo → `2.0.0`

### 3. Compila + sube a GitHub
```bash
npm run publish:win
```
Esto:
- Genera el `.exe` instalador
- Sube a GitHub Releases como **draft**
- Genera el archivo `latest.yml` que la app del cliente leerá

### 4. Publica el draft
1. Ve a `https://github.com/TU_USUARIO/dua-ice-pos-releases/releases`
2. Verás un draft con la versión nueva
3. Edit → escribe qué cambia (opcional, ej. "Added monthly reports")
4. Click **Publish release**

### 5. ¡Listo!
La próxima vez que el cliente abra su app, en 5 segundos detectará la actualización y se descargará sola.

---

## 🔍 Cómo verificar que funciona

En el PC del cliente (o en tu Mac probando):
1. Abre la app instalada → menú **Help → Check for Updates**
2. Si hay nueva versión, sale el dialog para descargar
3. Si está al día, sale "You are running the latest version"

---

## 🔐 Si quieres un repo PRIVADO en GitHub

Cambia en `package.json`:
```json
"publish": [{ "provider": "github", "owner": "TU_USUARIO", "repo": "dua-ice-pos-releases", "private": true }]
```

Y en `main.js` necesitas embeber el token (lo cual NO es seguro para apps públicas).

Mi recomendación: deja el repo público pero **vacío** de código (solo releases). Nadie verá lo que hay dentro a no ser que descargue el `.exe`.

---

## ⚠️ Notas importantes

- La **primera versión** no necesita publicarse a GitHub — solo se la das al cliente directamente como `.exe`.
- A partir de la **segunda versión**, sí publica con `npm run publish:win` para que se auto-actualice.
- El `.exe` ya instalado en el cliente sabe a qué repo mirar gracias al `publish` en `package.json`.
- Las versiones siguen formato **semver**: `MAJOR.MINOR.PATCH`. Siempre sube alguno de los 3 números.

---

## 🛟 Si algo va mal

**Error: "Cannot find Update.exe"**: solo afecta a dev mode. En producción funciona.

**No detecta la actualización**: comprueba que la version del package.json es mayor que la actual instalada, y que el release está **publicado** (no draft).

**El cliente está sin internet**: la app sigue funcionando normal, simplemente no comprueba updates. Cuando vuelva a tener red, comprobará.

**Quieres forzar la actualización**: aumenta versión a `999.0.0`, publica, y vuelve a la normal después.
