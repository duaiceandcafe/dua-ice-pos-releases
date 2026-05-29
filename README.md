# Dua Ice POS — Desktop App

Empaqueta el POS como aplicación de escritorio para Windows / Mac / Linux.

## Requisitos previos (instalar 1 sola vez)

### 1. Node.js
Descarga e instala desde https://nodejs.org/ (versión LTS).

Verifica:
```bash
node --version   # debe mostrar v18 o superior
npm --version
```

## Setup (1 sola vez en esta carpeta)

```bash
cd electron-app
npm install
```
Esto descarga Electron y electron-builder (~200 MB). Tarda 1-3 min.

## Probar en tu Mac (sin generar instalador)

```bash
npm start
```
Se abre la app inmediatamente. Si todo funciona, ya está lista para empaquetar.

## Generar el INSTALADOR para Windows (.exe)

```bash
npm run build:win
```

El instalador queda en `dist/Dua Ice POS Setup 1.0.0.exe` (~80–150 MB).

Lo copias al PC del cliente → doble click → se instala como cualquier programa con icono en el escritorio y en el menú inicio.

## Generar el INSTALADOR para Mac (.dmg)

```bash
npm run build:mac
```

Queda en `dist/Dua Ice POS-1.0.0.dmg`.

## ¿Dónde se guardan los datos del cliente?

Electron guarda automáticamente el `localStorage` en:

- **Windows**: `C:\Users\<usuario>\AppData\Roaming\dua-ice-pos\`
- **Mac**: `~/Library/Application Support/dua-ice-pos/`
- **Linux**: `~/.config/dua-ice-pos/`

Los datos persisten entre sesiones igual que en el navegador, pero ahora son privados a la app.

## Hacer backup de datos

Dentro de la app: **Menú Help → Backup Data (Export)** → descarga un JSON con todas las ventas, turnos, productos, etc.

## Actualizar el POS (cuando hagas cambios al HTML)

1. Reemplaza `electron-app/index.html` con la nueva versión del HTML
2. Sube la versión en `package.json` (1.0.0 → 1.0.1)
3. Vuelve a ejecutar `npm run build:win`
4. Manda el nuevo `.exe` al cliente; se reinstala encima

## Estructura final

```
electron-app/
├── main.js           ← proceso principal (ventanas, menú, multi-pantalla)
├── index.html        ← el POS completo (copia de hjhhhjhjj.html)
├── package.json      ← config del builder
├── icon.png          ← (opcional) icono 512×512 px
└── dist/             ← instaladores generados aquí
```

## Iconos personalizados (opcional)

Coloca un PNG cuadrado de **512×512px** llamado `icon.png` en esta carpeta antes de hacer el build.

Para Windows .ico:
```bash
# opcional, mejora la calidad del icono
npm install -g png-to-ico
png-to-ico icon.png > icon.ico
```
Y cambia en `package.json`: `"icon": "icon.ico"` en la sección `win`.
