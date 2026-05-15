using System.Collections;
using System.Collections.Generic;
using System.IO;
using UnityEngine;
using UnityEngine.Networking;

/// <summary>
/// Administrador centralizado encargado de cargar, actualizar y aplicar textos
/// en la escena a partir de un archivo JSON (local o remoto).
///
/// Este script permite:
/// - Leer archivos JSON desde StreamingAssets o desde una URL.
/// - Convertir la tabla JSON a un diccionario {id → texto}.
/// - Actualizar automáticamente los textos de todos los objetos con PoiText.
/// - Refrescar el contenido cada cierto intervalo mediante corrutinas.
/// </summary>
public class SceneTextManager : MonoBehaviour
{
    // ---------------------------------------------------------------------
    // CONFIGURACIÓN DE CARGA
    // ---------------------------------------------------------------------

    [Header("Configuración JSON")]
    [Tooltip(
        "Ruta relativa en StreamingAssets o URL completa.\n" +
        "Ejemplo local: textos_escena1.json\n" +
        "Ejemplo URL: https://midominio.com/textos/textos_escena1.json")]
    public string jsonPath;

    [Tooltip("Indica si el JSON debe cargarse automáticamente al iniciar la escena.")]
    public bool loadOnStart = true;

    /// <summary>
    /// Diccionario interno para acceso rápido por ID.
    /// Clave: ID del texto.
    /// Valor: contenido textual asociado.
    /// </summary>
    private Dictionary<string, string> _textsById;


    // ---------------------------------------------------------------------
    // CONFIGURACIÓN DE AUTO-ACTUALIZACIÓN
    // ---------------------------------------------------------------------

    [Header("Actualización Automática")]
    [Tooltip("Tiempo entre actualizaciones automáticas en segundos.")]
    public float refreshInterval = 10f;

    [Tooltip("Habilita/deshabilita la recarga periódica del JSON.")]
    public bool autoRefresh = true;


    // ---------------------------------------------------------------------
    // CICLO DE VIDA UNITY
    // ---------------------------------------------------------------------

    private void Start()
    {
        // Carga inicial del JSON si está habilitada.
        if (loadOnStart && !string.IsNullOrEmpty(jsonPath))
        {
            StartCoroutine(LoadAndApplyTexts());
        }

        // Inicia la rutina periódica si el modo automático está activo.
        if (autoRefresh)
        {
            StartCoroutine(AutoRefreshRoutine());
        }
    }


    // ---------------------------------------------------------------------
    // RUTINA DE AUTO-REFRESCO
    // ---------------------------------------------------------------------

    /// <summary>
    /// Corrutina que ejecuta la actualización automática cada X segundos.
    /// </summary>
    private IEnumerator AutoRefreshRoutine()
    {
        while (true)
        {
            yield return new WaitForSeconds(refreshInterval);

            Debug.Log("[SceneTextManager] Actualizando textos automáticamente...");
            yield return LoadAndApplyTexts();
        }
    }


    // ---------------------------------------------------------------------
    // CARGA + APLICACIÓN DE TEXTOS
    // ---------------------------------------------------------------------

    /// <summary>
    /// Carga el JSON (local o remoto), lo parsea, genera el diccionario de textos
    /// y actualiza todos los elementos PoiText en la escena.
    /// </summary>
    public IEnumerator LoadAndApplyTexts()
    {
        string json = null;

        // -----------------------------------------------------------------
        // 1. Cargar JSON (desde URL o archivo local)
        // -----------------------------------------------------------------

        if (IsUrl(jsonPath))
        {
            // --- Carga desde servidor remoto ---
            using (UnityWebRequest www = UnityWebRequest.Get(jsonPath))
            {
                yield return www.SendWebRequest();

#if UNITY_2020_1_OR_NEWER
                if (www.result != UnityWebRequest.Result.Success)
#else
                if (www.isNetworkError || www.isHttpError)
#endif
                {
                    Debug.LogError($"[SceneTextManager] Error al descargar JSON: {www.error}");
                    yield break;
                }

                json = www.downloadHandler.text;
            }
        }
        else
        {
            // --- Carga desde StreamingAssets ---
            string fullPath = Path.Combine(Application.streamingAssetsPath, jsonPath);

#if UNITY_ANDROID && !UNITY_EDITOR
            // En Android, StreamingAssets requiere WWW/UnityWebRequest debido al empaquetado .jar/apk.
            using (UnityWebRequest www = UnityWebRequest.Get(fullPath))
            {
                yield return www.SendWebRequest();

#if UNITY_2020_1_OR_NEWER
                if (www.result != UnityWebRequest.Result.Success)
#else
                if (www.isNetworkError || www.isHttpError)
#endif
                {
                    Debug.LogError($"[SceneTextManager] Error al leer JSON en Android: {www.error}");
                    yield break;
                }

                json = www.downloadHandler.text;
            }
#else
            // En PC, Mac, Linux y Editor se puede usar File.ReadAllText.
            if (!File.Exists(fullPath))
            {
                Debug.LogError($"[SceneTextManager] No se encuentra el archivo JSON en: {fullPath}");
                yield break;
            }

            json = File.ReadAllText(fullPath);
#endif
        }

        if (string.IsNullOrEmpty(json))
        {
            Debug.LogError("[SceneTextManager] JSON vacío o nulo.");
            yield break;
        }


        // -----------------------------------------------------------------
        // 2. Parsear JSON
        // -----------------------------------------------------------------

        PoiTable table = JsonUtility.FromJson<PoiTable>(json);

        if (table == null || table.entries == null)
        {
            Debug.LogError("[SceneTextManager] No se ha podido parsear el JSON o no contiene 'entries'.");
            yield break;
        }


        // -----------------------------------------------------------------
        // 3. Convertir a diccionario para acceso inmediato
        // -----------------------------------------------------------------

        _textsById = new Dictionary<string, string>();

        foreach (var entry in table.entries)
        {
            if (!_textsById.ContainsKey(entry.id))
            {
                _textsById.Add(entry.id, entry.text);
            }
            else
            {
                Debug.LogWarning($"[SceneTextManager] ID duplicado en JSON: {entry.id}");
            }
        }


        // -----------------------------------------------------------------
        // 4. Aplicar textos a los objetos de escena
        // -----------------------------------------------------------------

        ApplyTextsToScene();
    }


    // ---------------------------------------------------------------------
    // APLICAR TEXTOS A OBJETOS PoiText
    // ---------------------------------------------------------------------

    /// <summary>
    /// Busca todos los componentes PoiText en la escena (incluyendo objetos inactivos)
    /// y les asigna texto en función de su ID.
    /// </summary>
    private void ApplyTextsToScene()
    {
        PoiText[] poiTexts = FindObjectsOfType<PoiText>(includeInactive: true);

        foreach (var poi in poiTexts)
        {
            if (poi == null || string.IsNullOrEmpty(poi.id))
                continue;

            if (_textsById != null && _textsById.TryGetValue(poi.id, out string value))
            {
                poi.SetText(value);
            }
            else
            {
                Debug.LogWarning(
                    $"[SceneTextManager] No se ha encontrado texto para ID '{poi.id}' en el JSON.");
            }
        }
    }


    // ---------------------------------------------------------------------
    // UTILIDADES
    // ---------------------------------------------------------------------

    /// <summary>
    /// Determina si la ruta proporcionada corresponde a una URL HTTP/HTTPS.
    /// </summary>
    private bool IsUrl(string path)
    {
        return path.StartsWith("http://") || path.StartsWith("https://");
    }
}