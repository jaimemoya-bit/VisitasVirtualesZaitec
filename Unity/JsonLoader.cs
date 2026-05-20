using System.Collections;
using UnityEngine;
using UnityEngine.Networking;
using TMPro;

public class JsonLoader : MonoBehaviour
{
    [Header("Configuración del Centro")]
    [SerializeField] private int idCentro = 1; // <- ID numérico del centro, se cambia en el Inspector por cada escena

    [Header("Textos UI")]
    public TMP_Text[] textos;

    [Header("Ajustes")]
    [SerializeField] private float tiempoActualizacion = 30f; // Refresco cada 30 segundos para no sobrecargar el servidor

    // URL base de la API donde está desplegado el servidor
    private const string API_BASE_URL = "https://visitasvirtuales.dedyn.io";

    void Start()
    {
        // Antes de pedir POIs, revisa WebBridge recibio un ID desde la web, si lo tiene usa ese.
        // Si no lo tiene sigue usando el número que está en el inspector
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
        StartCoroutine(ActualizarJson());
    }

    IEnumerator ActualizarJson()
    {
        while (true)
        {
            yield return StartCoroutine(ObtenerPoisDesdeAPI());
            yield return new WaitForSeconds(tiempoActualizacion);
        }
    }

    // El endpoint para listar los POIs de un centro no requiere autenticación
    IEnumerator ObtenerPoisDesdeAPI()
    {
        // Construimos la URL con el id numérico del centro
        string url = $"{API_BASE_URL}/api/v1/centers/{idCentro}/pois";

        using (UnityWebRequest www = UnityWebRequest.Get(url))
        {
            yield return www.SendWebRequest();
            if (www.result != UnityWebRequest.Result.Success)
            {
                Debug.LogWarning($"[JsonLoader] Error al obtener POIs: {www.error}");
                yield break;
            }

            string json = www.downloadHandler.text;

            // La API devuelve un objeto con dos propiedades: message y pois
            // JsonUtility mapea directamente el JSON al PoiWrapper sin necesidad de manipularlo
            PoiWrapper data = JsonUtility.FromJson<PoiWrapper>(json);

            if (data == null || data.pois == null || data.pois.Length == 0)
            {
                Debug.LogWarning($"[JsonLoader] No se encontraron POIs para el centro: {idCentro}");
                yield break;
            }

            // Actualizamos los textos con los POIs recibidos de la API
            for (int i = 0; i < textos.Length && i < data.pois.Length; i++)
            {
                textos[i].text = $"<b>{data.pois[i].name}</b>\n<size=80%>{data.pois[i].details.description}</size>";
            }

            Debug.Log($"[JsonLoader] Centro {idCentro} cargado con {data.pois.Length} POIs.");
        }
    }
}

// --- Clases de datos que reflejan la respuesta de la API ---

// El campo details de cada POI contiene la descripción
[System.Serializable]
public class PoiDetails
{
    public string description;
}

// Un POI tal como lo devuelve la API
[System.Serializable]
public class Poi
{
    public int id;
    public string name;
    public PoiDetails details;
    public int centerId;
    public int userId;
}

// Wrapper necesario porque JsonUtility no lee arrays directamente en la raíz
[System.Serializable]
public class PoiWrapper
{
    public string message;
    public Poi[] pois;
}