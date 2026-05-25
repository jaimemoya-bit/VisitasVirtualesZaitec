using System.Collections;
using UnityEngine;
using UnityEngine.Networking;
using TMPro;

public class JsonLoader : MonoBehaviour
{
    [Header("Configuración del Centro")]
    [SerializeField] private int idCentro = 1; // ID numérico del centro, se cambia en el Inspector por cada escena

    [Header("Textos UI")]
    public TMP_Text[] textos;

    [Header("Modo Edición")]
    // Referencia al CanvasEdicion del prefab — asignar en el Inspector de cada escena
    [SerializeField] private GameObject canvasEdicion;

    [Header("Ajustes")]
    [SerializeField] private float tiempoActualizacion = 30f; // Refresco periódico en segundos

    // URL base de la API
    private const string API_BASE_URL = "http://localhost:8000";

    // Credenciales para obtener el token de acceso
    private const string EMAIL    = "admin_mad@instituto.es";
    private const string PASSWORD = "Admin123!";

    // Token JWT — se reutiliza en cada petición y se renueva si expira
    private string accessToken = "";

    // Último conjunto de POIs recibidos — permite saber cuántos hay para calcular el índice del siguiente
    private Poi[] poisActuales = new Poi[0];

    // ── Ciclo de vida ─────────────────────────────────────────────────────────

    void Start()
    {
        // Si WebBridge recibió un ID desde React, usamos ese
        // Si no, seguimos con el valor del Inspector (útil para pruebas en el editor)
        if (!string.IsNullOrEmpty(WebBridge.IdCentroActual)
            && int.TryParse(WebBridge.IdCentroActual, out int idDesdeWeb))
        {
            idCentro = idDesdeWeb;
            Debug.Log($"[JsonLoader] Usando ID de centro desde WebBridge: {idCentro}");
        }
        else
        {
            Debug.LogWarning($"[JsonLoader] WebBridge sin ID, usando valor del Inspector: {idCentro}");
        }

        // Aplicar modo edición — activa o desactiva el CanvasEdicion según WebBridge
        WebBridge.AplicarModoEdicion(canvasEdicion);

        // Login → carga de POIs
        StartCoroutine(IniciarConexion());
    }

    // ── Conexión y autenticación ──────────────────────────────────────────────

    IEnumerator IniciarConexion()
    {
        yield return StartCoroutine(Login());

        if (!string.IsNullOrEmpty(accessToken))
        {
            Debug.Log("[JsonLoader] Login correcto, iniciando carga de POIs...");
            StartCoroutine(ActualizarJson());
        }
        else
        {
            Debug.LogWarning("[JsonLoader] No se pudo obtener el token, verifica las credenciales.");
        }
    }

    IEnumerator Login()
    {
        string url      = $"{API_BASE_URL}/api/v1/users/auth";
        string bodyJson = $"{{\"email\":\"{EMAIL}\",\"password\":\"{PASSWORD}\"}}";

        using (UnityWebRequest www = new UnityWebRequest(url, "POST"))
        {
            byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(bodyJson);
            www.uploadHandler   = new UploadHandlerRaw(bodyRaw);
            www.downloadHandler = new DownloadHandlerBuffer();
            www.SetRequestHeader("Content-Type", "application/json");

            yield return www.SendWebRequest();

            if (www.result != UnityWebRequest.Result.Success)
            {
                Debug.LogWarning($"[JsonLoader] Error en login: {www.error}");
                yield break;
            }

            TokenResponse tokenResponse = JsonUtility.FromJson<TokenResponse>(www.downloadHandler.text);

            if (tokenResponse != null && !string.IsNullOrEmpty(tokenResponse.accessToken))
            {
                accessToken = tokenResponse.accessToken;
                Debug.Log("[JsonLoader] Token obtenido correctamente.");
            }
            else
            {
                Debug.LogWarning("[JsonLoader] La respuesta del login no contiene token.");
            }
        }
    }

    // ── Bucle de actualización periódica ──────────────────────────────────────

    IEnumerator ActualizarJson()
    {
        while (true)
        {
            yield return StartCoroutine(ObtenerPoisDesdeAPI());
            yield return new WaitForSeconds(tiempoActualizacion);
        }
    }

    // ── Obtención y pintado de POIs ───────────────────────────────────────────

    IEnumerator ObtenerPoisDesdeAPI()
    {
        string url = $"{API_BASE_URL}/api/v1/centers/{idCentro}/pois";

        using (UnityWebRequest www = UnityWebRequest.Get(url))
        {
            www.SetRequestHeader("Authorization", $"Bearer {accessToken}");

            yield return www.SendWebRequest();

            // Token expirado → renovar y reintentar en el siguiente ciclo
            if (www.responseCode == 403)
            {
                Debug.LogWarning("[JsonLoader] Token expirado, renovando...");
                yield return StartCoroutine(Login());
                yield break;
            }

            if (www.result != UnityWebRequest.Result.Success)
            {
                Debug.LogWarning($"[JsonLoader] Error obteniendo POIs: {www.error}");
                yield break;
            }

            PoiWrapper data = JsonUtility.FromJson<PoiWrapper>(www.downloadHandler.text);

            if (data == null || data.pois == null || data.pois.Length == 0)
            {
                Debug.LogWarning($"[JsonLoader] No se encontraron POIs para el centro {idCentro}.");
                yield break;
            }

            // Guardamos los POIs para que EditorPois pueda consultar cuántos hay
            poisActuales = data.pois;

            // Pintamos los textos TMP vinculando cada POI a su slot por índice
            ActualizarTextosPOIs(data.pois);

            Debug.Log($"[JsonLoader] Centro {idCentro} cargado con {data.pois.Length} POIs.");
        }
    }

    // Vincula cada POI al TMP_Text de su mismo índice
    // Si hay más POIs que slots de texto, los extras se ignoran hasta que se añadan más slots
    private void ActualizarTextosPOIs(Poi[] pois)
    {
        for (int i = 0; i < textos.Length; i++)
        {
            if (textos[i] == null) continue;

            if (i < pois.Length)
            {
                // Slot ocupado: mostrar nombre y descripción del POI
                textos[i].text = $"<b>{pois[i].name}</b>\n<size=80%>{pois[i].details.description}</size>";
                textos[i].gameObject.SetActive(true);
            }
            else
            {
                // Slot vacío: ocultarlo para que no quede texto residual en pantalla
                textos[i].gameObject.SetActive(false);
            }
        }
    }

    // ── API pública para EditorPois y React ──────────────────────────────────

    // React llama a este método via SendMessage tras crear un POI nuevo
    // Unity lo recibe, recarga los POIs y actualiza el listado automáticamente
    public void RecargarPois()
    {
        Debug.Log("[JsonLoader] Recarga manual solicitada desde React.");
        StartCoroutine(ObtenerPoisDesdeAPI());
    }

    // Devuelve cuántos POIs hay actualmente en este centro
    // EditorPois lo usa para calcular el índice del siguiente POI (poisActuales.Length + 1)
    public int ObtenerTotalPois()
    {
        return poisActuales != null ? poisActuales.Length : 0;
    }

    // Devuelve el ID del centro actual
    // EditorPois lo necesita para construir el payload del POST
    public int ObtenerIdCentro()
    {
        return idCentro;
    }

    // Devuelve el token JWT actual para que EditorPois pueda hacer el POST directamente
    // Sin necesidad de duplicar la lógica de login
    public string ObtenerToken()
    {
        return accessToken;
    }
}

// ── Clases de datos ───────────────────────────────────────────────────────────

[System.Serializable]
public class TokenResponse
{
    public string accessToken;
}

[System.Serializable]
public class PoiDetails
{
    public string description;
    public float  posX;        // Coordenada X normalizada (0-1) donde se colocó el POI
    public float  posY;        // Coordenada Y normalizada (0-1) donde se colocó el POI
    public string tipo;        // "basico" o "imagen"
    public string imageUrl;    // Solo para tipo imagen
}

[System.Serializable]
public class Poi
{
    public int id;
    public string name;
    public PoiDetails details;
    public int centerId;
    public int userId;
}

[System.Serializable]
public class PoiWrapper
{
    public string message;
    public Poi[] pois;
}