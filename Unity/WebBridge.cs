using UnityEngine;
using UnityEngine.SceneManagement;

public class WebBridge : MonoBehaviour
{
    // Variables estáticas: persisten entre cambios de escena (son de clase, no de instancia)
    // Cualquier otro script puede leerlas con WebBridge.IdCentroActual
    public static string IdCentroActual    { get; private set; } = "";
    public static string IdEscenaActual    { get; private set; } = "";
    public static bool   ModoEdicionActual { get;  set; } = false;
    public static string UserIdActual      { get; private set; } = ""; // ← ID del admin logueado en React

    // Flags para saber qué parámetros ya llegaron desde React
    private bool _centroRecibido = false;
    private bool _escenaRecibida = false;

    // ── Métodos llamados desde React via SendMessage ──────────────────────────

    // React llama a este método primero
    public void RecibirIdCentro(string idCentro)
    {
        IdCentroActual = idCentro;
        _centroRecibido = true;
        Debug.Log("[WebBridge] ID de centro recibido: " + idCentro);
        TryLoadScene();
    }

    // React llama a este método segundo
    public void RecibirIdEscena(string idEscena)
    {
        IdEscenaActual = idEscena;
        _escenaRecibida = true;
        Debug.Log("[WebBridge] ID de escena recibido: " + idEscena);
        TryLoadScene();
    }

    // React llama a este método para activar el modo edición (opcional)
    // Si React no lo llama, ModoEdicionActual queda en false y la visita es normal
    public void RecibirModoEdicion(string modo)
    {
        ModoEdicionActual = modo.ToLower() == "true";
        Debug.Log("[WebBridge] Modo edición: " + ModoEdicionActual);
    }

    // React manda el ID del usuario logueado para que EditorPois lo use en el POST
    // Se extrae del JWT/sesión en React antes de abrir el modo edición
    public void RecibirUserId(string userId)
    {
        UserIdActual = userId;
        Debug.Log("[WebBridge] User ID recibido: " + userId);
    }

    // ── Activación del canvas de edición desde otras escenas ─────────────────

    // JsonLoader llama a este método estático una vez que la escena del centro está cargada
    // para activar o desactivar el CanvasEdicion según el modo recibido
    public static void AplicarModoEdicion(GameObject canvasEdicionEnEscena)
    {
        if (canvasEdicionEnEscena == null)
        {
            Debug.LogWarning("[WebBridge] CanvasEdicion no asignado en la escena.");
            return;
        }

        canvasEdicionEnEscena.SetActive(ModoEdicionActual);
        Debug.Log($"[WebBridge] CanvasEdicion {(ModoEdicionActual ? "ACTIVADO" : "DESACTIVADO")}");
    }

    // ── Comunicación Unity → React ────────────────────────────────────────────

    // EditorPois llama a este método cuando el admin confirma la posición de un POI
    // Envía las coordenadas normalizadas (0-1) + idCentro + userId + tipo al JS de la página
    public static void EnviarCoordenadasPoi(float x, float y, string tipoPoi, int poiId = 0)
    {
        string json = $"{{" +
                      $"\"x\":{x.ToString("F4", System.Globalization.CultureInfo.InvariantCulture)}," +
                      $"\"y\":{y.ToString("F4", System.Globalization.CultureInfo.InvariantCulture)}," +
                      $"\"idCentro\":\"{IdCentroActual}\"," +
                      $"\"userId\":\"{UserIdActual}\"," +
                      $"\"poiId\":{poiId}," +
                      $"\"tipo\":\"{tipoPoi}\"" +
                      $"}}";

        Debug.Log("[WebBridge] Enviando coords POI a React: " + json);

#if !UNITY_EDITOR && UNITY_WEBGL
        OnPoiCoordinatesReady(json);
#endif
    }

#if !UNITY_EDITOR && UNITY_WEBGL
    // Función JS definida en el lado web que recibe las coordenadas del POI
    [System.Runtime.InteropServices.DllImport("__Internal")]
    private static extern void OnPoiCoordinatesReady(string json);
#endif

    // ── Carga de escena ───────────────────────────────────────────────────────

    // Carga la escena solo cuando han llegado centro + escena
    // El modo edición se aplica después desde JsonLoader
    private void TryLoadScene()
    {
        if (!_centroRecibido || !_escenaRecibida)
        {
            Debug.Log("[WebBridge] Esperando el segundo ID antes de cargar escena...");
            return;
        }

        if (!int.TryParse(IdEscenaActual, out int sceneIndex))
        {
            Debug.LogWarning("[WebBridge] ID de escena inválido: " + IdEscenaActual);
            return;
        }

        Debug.Log($"[WebBridge] Cargando escena {sceneIndex} para centro {IdCentroActual}" +
                  $" | ModoEdicion: {ModoEdicionActual}");
        SceneManager.LoadScene(sceneIndex);
    }
}