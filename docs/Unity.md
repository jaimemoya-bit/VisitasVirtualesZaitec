# Unity — Documentación visitas virtuales

## Índice

1. [Visión general](#1-visión-general)
2. [Escenas y Build Settings](#2-escenas-y-build-settings)
3. [Scripts C#](#3-scripts-c--qué-hace-cada-uno)
4. [Puente React ↔ Unity](#4-puente-react--unity)
5. [Comunicación con la API](#5-comunicación-con-la-api)
6. [Compilar el build WebGL](#6-cómo-compilar-el-build-webgl)
7. [Añadir un centro nuevo](#7-añadir-un-centro-nuevo)
8. [Control de versiones](#8-control-de-versiones)

---

## 1. Visión general

El módulo de Unity es un build WebGL que se embebe dentro de la aplicación web React. No es una app independiente depende de React para saber qué centro educativo tiene que mostrar.

El flujo general:

```
Usuario elige un centro 
  → React envía el ID del centro y el índice de escena a Unity vía <SendMessage>
  → Unity (escena Bootstrap) recibe los IDs y carga la escena correspondiente
  → La escena del centro arranca, JsonLoader se autentica en la API y carga los POIs
  → Los textos de los puntos de interés se muestran en la visita 360°
```

El build WebGL se encuentra como archivos estáticos desde la carpeta `visitas-virtuales/public/Build_Unity/` del frontend.

-- 

## 2. Escenas y Build Settings
 
El proyecto Unity contiene las siguientes escenas, que deben estar en este orden exacto en el momento de compilar en Unity, en la de parte de **File → Build Settings**:
 
| Índice | Nombre | Centro educativo |
|--------|--------|-----------------|
| 0 | Bootstrap | Pantalla de arranque (negra). 
  -    Contiene el GameObject `WebBridge` que recibe los IDs desde React y carga la escena correcta. |
| 1 | Madrid | Instituto Madrid |
| 2 | Córdoba | Instituto Córdoba |
| 3 | Jerez | Instituto Jerez |
| 4 | Pacífico | Instituto Pacífico |
 
Este orden se refleja en el mapeo definido en `visitas-virtuales/src/helpers/escenas.js`:
 
```js
export const ESCENAS_POR_CENTRO = {
    1: 1, // Instituto Madrid   → Escena 1
    2: 4, // Instituto Pacífico → Escena 4
    3: 3, // Instituto Jerez    → Escena 3
    4: 2, // Instituto Córdoba  → Escena 2
};
```
 
> **El orden de las escenas es crítico.** El índice que aparece en Build Settings tiene que coincidir exactamente con el mapeo de `escenas.js`. Si se añade una escena nueva en el medio de la lista, los índices de las escenas siguientes se desplazan y hay que actualizar ese archivo también.
 
--

## 3. Scripts C# — qué hace cada uno

Todos los scripts están en `Assets/Scripts/` dentro del proyecto Unity, usando el 'Unity Control Version' -Plastic SCM- y también en la carpeta `Unity/` del repositorio Git como referencia.

### `WebBridge.cs`

**Ubicación en escena:** GameObject `WebBridge` en la escena **Bootstrap** (índice 0).

Es el punto de entrada de la comunicación desde React. Cuando Unity carga la escena Bootstrap, este script espera dos mensajes de JavaScript:

- `RecibirIdCentro(string)  ` → recibe el ID numérico del centro seleccionado (ej: `"1"` para Madrid).
- `RecibirIdEscena(string)` → recibe el índice de la escena de Unity que debe cargarse (ej: `"1"`).

Una vez que han llegado los dos mensajes, llama a `SceneManager.LoadScene(sceneIndex)` para cargar la escena del centro. Si solo llega uno de los dos mensajes, espera al otro antes de hacer nada.

Las variables `IdCentroActual` e `IdEscenaActual` son **estáticas** — esto significa que persisten aunque Unity cambie de escena, de modo que `JsonLoader` puede leerlas desde la escena del centro.

--

### `JsonLoader.cs`

**Ubicación en escena:** GameObject `DataManager` en cada escena de centro (Madrid, Córdoba, Jerez, Pacífico).
 
Se encarga de autenticarse en la API REST y cargar los puntos de interés (POIs) del centro correspondiente. Se ejecuta automáticamente cuando la escena del centro arranca (`Start()`).
 
**Flujo de ejecución:**
 
1. Lee `WebBridge.IdCentroActual` para saber qué centro mostrar. Si no hay valor (al probar directamente en el Editor sin pasar por la web), usa el valor configurado en el Inspector (`Id Centro`).
2. Hace un `POST` a `/api/v1/users/auth` para obtener un token JWT.
3. Con ese token, hace un `GET` a `/api/v1/centers/{idCentro}/pois` para obtener los POIs.
4. Actualiza los textos de la UI con el nombre y descripción de cada POI.
5. Repite la petición de POIs cada 30 segundos (configurable en el Inspector).
Si el token expira (respuesta 403), renueva el login automáticamente.
 
> **Nota para pruebas en el Editor:** El campo `Id Centro` del Inspector actúa como fallback. Configurarlo con el ID real del centro permite probar sin pasar por React (ej: `1` para Madrid, `2` para Pacífico, `3` para Jerez, `4` para Córdoba).
 
--
 
### `SceneManager.cs` (SceneTextManager)
 
Gestor alternativo de textos basado en archivos JSON locales o remotos. Lee un JSON desde `StreamingAssets` o desde una URL, lo convierte en un diccionario `{id → texto}` y aplica los textos a todos los objetos `PoiText` presentes en la escena.
 
> En el build WebGL actual no se usa directamente, los textos los gestiona `JsonLoader` desde la API. Este script está disponible como alternativa basada en JSON estático.
 
--
 
### `POIData.cs`
 
Clase de datos serializable que define la estructura de un POI cuando se lee desde un JSON local. Contiene hasta 10 campos de texto (`p1` a `p10`).
 
--
 
### `PoiText.cs` y `PoiTextData.cs`
 
Componentes que representan un punto de interés en la escena. `PoiText` se adjunta a los objetos 3D que actúan como POIs y expone un método `SetText(string)` que usa `SceneTextManager` para aplicar el texto según el ID.
 
--
 
### `POITextManager.cs`
 
Gestor alternativo de textos que usa `File.ReadAllText()`. 
**No funciona en WebGL** ya que ese entorno no permite acceso directo al sistema de archivos. Mantenido por compatibilidad con builds de escritorio.
 
--
 
## 4. Puente React ↔ Unity
 
La comunicación de React hacia Unity se realiza mediante `SendMessage`, función que expone el build WebGL de Unity para llamar a métodos públicos de GameObjects desde JavaScript.
 
**Sintaxis:**
```js
unityInstance.SendMessage('NombreGameObject', 'NombreMetodo', 'valor');
```
 
**Llamadas que hace React al cargar el visor:**
 
```js
// Enviado desde UnityViewer.jsx tras un delay de 1.5s
unityInstance.SendMessage('WebBridge', 'RecibirIdCentro', selectedCenter.id.toString());
unityInstance.SendMessage('WebBridge', 'RecibirIdEscena', sceneId.toString());
```
 
> El delay de 1.5 segundos es necesario porque aunque el JavaScript de Unity termina de cargar, los GameObjects de Bootstrap todavía no están inicializados. Sin él, `SendMessage` falla con `object WebBridge not found`.
 
--
 
## 5. Comunicación con la API
 
`JsonLoader` se comunica con la API REST usando `UnityWebRequest` con autenticación JWT.
 
**Endpoint de login:**
```
POST https://visitasvirtuales.dedyn.io/api/v1/users/auth
Content-Type: application/json
 
{ "email": "admin_mad@instituto.es", "password": "Admin123!" }
```
 
**Endpoint de POIs:**
```
GET https://visitasvirtuales.dedyn.io/api/v1/centers/{idCentro}/pois
Authorization: Bearer {accessToken}
```
 
**Respuesta esperada:**
```json
{
  "message": "OK",
  "pois": [
    {
      "id": 1,
      "name": "Entrada",
      "details": { "description": "Texto descriptivo del POI" },
      "centerId": 1,
      "userId": 1
    }
  ]
}
```

> **Nota sobre CORS:** Para que Unity WebGL pueda hacer peticiones a la API desde el navegador, el servidor debe permitir el origen del frontend en su configuración CORS. Sin esta configuración el navegador bloquea las peticiones aunque el código sea correcto.
 
--
 
## 6. Cómo compilar el build WebGL
 
1. Abrir el proyecto en **Unity 2022.3.62f3**.
2. Verificar el orden de escenas en **File → Build Settings** (ver sección 2).
3. Seleccionar la plataforma **WebGL**.
4. En **Player Settings → Publishing Settings → Compression Format** seleccionar **Disabled** (necesario para compatibilidad con Vite, en este proyecto).
5. Desmarcar **Development Build**.
6. Click en **Build** → seleccionar `visitas-virtuales/public/Build_Unity/` como destino.
**Archivos generados:**
 
| Archivo                       | ¿Va en Git? |
|-------------------------------|-------------|
| `Build_Unity.loader.js`       | Sí |
| `Build_Unity.framework.js`    | Sí |
| `Build_Unity.wasm`            | Sí |
| `Build_Unity.data` (>200MB)   | No, se distribuye por Google Drive |
 
> tras compilar, subir el WebGL a la carpeta **Build Unity** de Google Drive del equipo. Para probar en local, descargarlo y colocarlo en `visitas-virtuales/public/Build_Unity/`.
 
--
 
## 7. Añadir un centro nuevo
 
**En Unity:**
1. Crear la escena y añadirla al final en **File → Build Settings**. Anotar el índice asignado.
2. En la escena nueva, crear un GameObject vacío `DataManager` con el script `JsonLoader`. Configurar el campo `Id Centro` del Inspector con el ID del centro en la base de datos.
3. Crear también un GameObject `WebBridge` con el script `WebBridge.cs`.
4. Recompilar el build y subir el nuevo a Google Drive.
**En React (`visitas-virtuales/src/helpers/escenas.js`):** ejemplo
```js
export const ESCENAS_POR_CENTRO = {
    1: 1, // Instituto Madrid
    2: 4, // Instituto Pacífico
    3: 3, // Instituto Jerez
    4: 2, // Instituto Córdoba
    5: 5, // Instituto Nuevo → añadir con el índice real del build
};
```
 
**Verificar IDs en la base de datos:**
```sql
SELECT id, name FROM centers;
```
 
--
 
## 8. Control de versiones
 
El proyecto Unity se versiona con **Plastic SCM**, independientemente del repositorio Git del proyecto web.

### Plastic SCM
- **Repositorio:** `VisitasVirtuales-Proyecto360`
- Los cambios se guardan con **changesets** (equivalente a commits en Git).
Los scripts C# están también en la carpeta `Unity/` del repositorio Git como referencia para el equipo web, pero la fuente esta en el repositorio de Plastic SCM.

### Git
- **Repositorio:** [https://github.com/jaimemoya-bit/VisitasVirtualesZaitec](https://github.com/jaimemoya-bit/VisitasVirtualesZaitec)
- **Rama dev:** `Web_Zaitec`
- Los scripts C# de Unity se mantienen en la carpeta `Unity/` como referencia, pero no se editan directamente desde aquí.