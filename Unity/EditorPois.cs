using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Networking;
using TMPro;

/// <summary>
/// Gestiona la lógica central del modo edición de POIs.
/// 
/// Inspector: solo 1 referencia imprescindible (prefabItemPoi)
/// Todo lo demás se autodetecta en Start():
///   - Lógica:  JsonLoader, CameraView      → FindObjectOfType
///   - UI:      Paneles, botones, inputs     → GameObject.Find por nombre
///
/// Nombres de objetos esperados en Canvas_Admin:
///   PanelIzquierdo, BtnToggleIzquierdo
///   PanelDerecho, ContenedorListaPois
///   PanelConfirmar, NombrePoi, DescripcionPoi, BtnConfirmar, BtnCancelar
///   PanelConfirmarImagen, BtnConfirmarImagen, BtnCancelarImagen
/// </summary>
public class EditorPois : MonoBehaviour
{
    // ── Inspector — solo lo que no puede encontrarse en escena ────────────────

    [Header("Prefabs")]

    [Tooltip("Prefab del item POI para el listado derecho (Assets — no está en escena)")]
    [SerializeField] protected GameObject prefabItemPoi;

    // ── Referencias UI — autodetectadas por nombre en Start() ────────────────

    protected GameObject    panelIzquierdo;
    protected Button        btnToggleIzquierdo;
    protected GameObject    panelDerecho;
    protected Transform     contenedorListaPois;

    // Panel confirmación POI básico
    protected GameObject     panelConfirmar;
    protected TMP_InputField inputNombre;
    protected TMP_InputField inputDescripcion;
    protected Button        btnConfirmar;
    protected Button        btnCancelar;

    // Panel confirmación POI imagen — solo nombre, sin descripción
    protected GameObject     panelConfirmarImagen;
    protected TMP_InputField inputNombreImagen;
    protected Button btnConfirmarImagen;
    protected Button btnCancelarImagen;
    

    // ── Referencias lógicas — autodetectadas por tipo en Start() ─────────────

    protected JsonLoader jsonLoader;
    protected CameraView cameraView;

    // ── Estado interno ────────────────────────────────────────────────────────

    protected string tipoPoisPendiente = "";
    protected string urlImagenPendiente = "";
    protected float  dropX             = 0f;
    protected float  dropY             = 0f;

    protected const string API_BASE_URL = "http://localhost:8000";

    // ── Ciclo de vida ─────────────────────────────────────────────────────────

    protected virtual void Start()
    {
        if (!WebBridge.ModoEdicionActual)
        {
            enabled = false;
            return;
        }

        AutodetectarReferencias();
        InicializarUI();
        ActualizarListadoPois();
    }

    private void AutodetectarReferencias()
    {
        // Lógica — por tipo, única instancia en escena
        jsonLoader = FindObjectOfType<JsonLoader>();
        cameraView = FindObjectOfType<CameraView>();

        // UI — GameObject.Find busca en toda la escena sin importar prefabs
        panelIzquierdo       = BuscarPorNombre("PanelIzquierdo");
        panelDerecho         = BuscarPorNombre("PanelDerecho");
        panelConfirmar       = BuscarPorNombre("PanelConfirmar");
        panelConfirmarImagen = BuscarPorNombre("PanelConfirmarImagen");

        Transform btnToggle     = BuscarTransformPorNombre("BtnToggleIzquierdo");
        Transform contenedor    = BuscarTransformPorNombre("ContenedorListaPois");
        Transform inputBasico   = BuscarTransformPorNombre("NombrePoi");
        Transform inputDesc     = BuscarTransformPorNombre("DescripcionPoi");
        Transform btnConf       = BuscarTransformPorNombre("BtnConfirmar");
        Transform btnCanc       = BuscarTransformPorNombre("BtnCancelar");
        Transform btnConfImagen = BuscarTransformPorNombre("BtnConfirmarImagen");
        Transform btnCancImagen = BuscarTransformPorNombre("BtnCancelarImagen");

        if (btnToggle     != null) btnToggleIzquierdo  = btnToggle.GetComponent<Button>();
        if (contenedor    != null) contenedorListaPois  = contenedor;
        if (inputBasico   != null) inputNombre          = inputBasico.GetComponent<TMP_InputField>();
        if (inputDesc     != null) inputDescripcion     = inputDesc.GetComponent<TMP_InputField>();
        if (btnConf       != null) btnConfirmar         = btnConf.GetComponent<Button>();
        if (btnCanc       != null) btnCancelar          = btnCanc.GetComponent<Button>();
        if (btnConfImagen != null) btnConfirmarImagen   = btnConfImagen.GetComponent<Button>();
        if (btnCancImagen != null) btnCancelarImagen    = btnCancImagen.GetComponent<Button>();

        // inputNombreImagen busca NombrePoi dentro de PanelConfirmarImagen
        if (panelConfirmarImagen != null)
        {
            Transform inputImagen = BuscarEnHijos(panelConfirmarImagen.transform, "InputNombreImagen");
            if (inputImagen != null) inputNombreImagen = inputImagen.GetComponent<TMP_InputField>();
        }

        // Warnings
        if (jsonLoader           == null) Debug.LogWarning("[EditorPois] JsonLoader no encontrado.");
        if (cameraView           == null) Debug.LogWarning("[EditorPois] CameraView no encontrado.");
        if (panelIzquierdo       == null) Debug.LogWarning("[EditorPois] 'PanelIzquierdo' no encontrado.");
        if (panelDerecho         == null) Debug.LogWarning("[EditorPois] 'PanelDerecho' no encontrado.");
        if (panelConfirmar       == null) Debug.LogWarning("[EditorPois] 'PanelConfirmar' no encontrado.");
        if (panelConfirmarImagen == null) Debug.LogWarning("[EditorPois] 'PanelConfirmarImagen' no encontrado.");
        if (btnToggleIzquierdo   == null) Debug.LogWarning("[EditorPois] 'BtnToggleIzquierdo' no encontrado.");
        if (contenedorListaPois  == null) Debug.LogWarning("[EditorPois] 'ContenedorListaPois' no encontrado.");
        if (inputNombre          == null) Debug.LogWarning("[EditorPois] 'NombrePoi' no encontrado.");
        if (inputDescripcion     == null) Debug.LogWarning("[EditorPois] 'DescripcionPoi' no encontrado.");
        if (btnConfirmar         == null) Debug.LogWarning("[EditorPois] 'BtnConfirmar' no encontrado.");
        if (btnCancelar          == null) Debug.LogWarning("[EditorPois] 'BtnCancelar' no encontrado.");
        if (btnConfirmarImagen   == null) Debug.LogWarning("[EditorPois] 'BtnConfirmarImagen' no encontrado.");
        if (btnCancelarImagen    == null) Debug.LogWarning("[EditorPois] 'BtnCancelarImagen' no encontrado.");
    }

    private void InicializarUI()
    {
        //panelDerecho?.SetActive(true); no esta en funcionamiento aun
        panelIzquierdo?.SetActive(false);
        panelConfirmar?.SetActive(false);
        panelConfirmarImagen?.SetActive(false);

        btnToggleIzquierdo?.onClick.AddListener(TogglePanelIzquierdo);
        btnConfirmar?.onClick.AddListener(ConfirmarCreacionPoi);
        btnCancelar?.onClick.AddListener(CancelarCreacion);
        btnConfirmarImagen?.onClick.AddListener(ConfirmarCreacionPoi);
        btnCancelarImagen?.onClick.AddListener(CancelarCreacion);
    }

    // ── Helpers de búsqueda ───────────────────────────────────────────────────

    private GameObject BuscarPorNombre(string nombre)
    {
        foreach (Transform t in GetComponentsInChildren<Transform>(true))
            if (t.name == nombre) return t.gameObject;
        Debug.LogWarning($"[EditorPois] '{nombre}' no encontrado en Canvas.");
        return null;
    }

    private Transform BuscarTransformPorNombre(string nombre)
    {
        foreach (Transform t in GetComponentsInChildren<Transform>(true))
            if (t.name == nombre) return t;
        return null;
    }

    protected Transform BuscarEnHijos(Transform padre, string nombre)
    {
        foreach (Transform hijo in padre)
        {
            if (hijo.name == nombre) return hijo;
            Transform encontrado = BuscarEnHijos(hijo, nombre);
            if (encontrado != null) return encontrado;
        }
        return null;
    }

    // ── Panel izquierdo ───────────────────────────────────────────────────────

    protected void TogglePanelIzquierdo()
    {
        if (panelIzquierdo != null)
            panelIzquierdo.SetActive(!panelIzquierdo.activeSelf);
    }

    // ── Panel de confirmación ─────────────────────────────────────────────────

    public void MostrarPanelConfirmar(string tipo, float x, float y)
    {
        tipoPoisPendiente = tipo;
        dropX = x;
        dropY = y;

        if (tipo == "imagen")
        {
            if (inputNombreImagen != null) inputNombreImagen.text = "";
            panelConfirmarImagen?.SetActive(true);
            inputNombreImagen?.ActivateInputField();
        }
        else
        {
            if (inputNombre      != null) inputNombre.text      = "";
            if (inputDescripcion != null) inputDescripcion.text = "";
            panelConfirmar?.SetActive(true);
            inputNombre?.ActivateInputField();
        }
    }

    private void ReabrirPanelConNombre(string tipo, string nombre, string descripcion)
    {
        tipoPoisPendiente = tipo;

        if (tipo == "imagen")
        {
            if (inputNombreImagen != null) inputNombreImagen.text = nombre;
            panelConfirmarImagen?.SetActive(true);
            inputNombreImagen?.ActivateInputField();
        }
        else
        {
            if (inputNombre      != null) inputNombre.text      = nombre;
            if (inputDescripcion != null) inputDescripcion.text = descripcion;
            panelConfirmar?.SetActive(true);
            inputNombre?.ActivateInputField();
        }

        Debug.Log("[EditorPois] Nombre duplicado — cambia el nombre e inténtalo de nuevo.");
    }

    private void ConfirmarCreacionPoi()
    {
        TMP_InputField inputActivo = tipoPoisPendiente == "imagen" ? inputNombreImagen : inputNombre;
        string nombre = inputActivo != null ? inputActivo.text.Trim() : "";
        string descripcion = (tipoPoisPendiente != "imagen" && inputDescripcion != null)
            ? inputDescripcion.text.Trim()
            : "";

        if (string.IsNullOrEmpty(nombre))
        {
            Debug.LogWarning("[EditorPois] El nombre no puede estar vacío.");
            return;
        }

        panelConfirmar?.SetActive(false);
        panelConfirmarImagen?.SetActive(false);
        StartCoroutine(CrearPoiEnAPI(nombre, descripcion, tipoPoisPendiente, dropX, dropY));
    }

    private void CancelarCreacion()
    {
        panelConfirmar?.SetActive(false);
        panelConfirmarImagen?.SetActive(false);
        tipoPoisPendiente = "";
    }

    // ── POST a la API ─────────────────────────────────────────────────────────

    protected IEnumerator CrearPoiEnAPI(string nombre, string descripcion, string tipo, float x, float y)
    {
        string token    = jsonLoader != null ? jsonLoader.ObtenerToken() : "";
        string idCentro = jsonLoader != null ? jsonLoader.ObtenerIdCentro().ToString() : WebBridge.IdCentroActual;

        if (string.IsNullOrEmpty(token))
        {
            Debug.LogWarning("[EditorPois] Token vacío.");
            yield break;
        }

        string details = tipo == "imagen"
            ? $"{{\"description\":\"\",\"posX\":{x.ToString("F4", System.Globalization.CultureInfo.InvariantCulture)}," +
              $"\"posY\":{y.ToString("F4", System.Globalization.CultureInfo.InvariantCulture)},\"tipo\":\"imagen\",\"imagenes\":[]}}"
            : $"{{\"description\":\"{EscaparJson(descripcion)}\",\"posX\":{x.ToString("F4", System.Globalization.CultureInfo.InvariantCulture)}," +
              $"\"posY\":{y.ToString("F4", System.Globalization.CultureInfo.InvariantCulture)},\"tipo\":\"basico\"}}";

        string userId   = WebBridge.UserIdActual;
            // TEMPORAL para pruebas locales
            if (string.IsNullOrEmpty(userId))
            userId = "1";

        string bodyJson = $"{{\"name\":\"{EscaparJson(nombre)}\",\"details\":{details}," +
                          $"\"center_id\":{idCentro},\"user_id\":{userId}}}";

        string url = $"{API_BASE_URL}/api/v1/centers/{idCentro}/pois";

        using (UnityWebRequest www = new UnityWebRequest(url, "POST"))
        {
            byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(bodyJson);
            www.uploadHandler   = new UploadHandlerRaw(bodyRaw);
            www.downloadHandler = new DownloadHandlerBuffer();
            www.SetRequestHeader("Content-Type", "application/json");
            www.SetRequestHeader("Authorization", $"Bearer {token}");

            yield return www.SendWebRequest();

            Debug.Log($"[EditorPois] Body enviado: {bodyJson}");

            if (www.responseCode == 409)
            {
                Debug.LogWarning($"[EditorPois] Nombre duplicado: ya existe un POI '{nombre}' en este centro.");
                ReabrirPanelConNombre(tipo, nombre, descripcion);
                yield break;
            }

            if (www.result != UnityWebRequest.Result.Success)
            {
                Debug.LogWarning($"[EditorPois] Error creando POI: {www.error}");
                yield break;
            }

            CrearPoiResponse resp = JsonUtility.FromJson<CrearPoiResponse>(www.downloadHandler.text);
            int nuevoId = resp?.newPoi != null ? resp.newPoi.id : 0;
            Debug.Log($"[EditorPois] POI '{nombre}' (id:{nuevoId}) creado en centro {idCentro}.");

            WebBridge.EnviarCoordenadasPoi(x, y, tipo, nuevoId);
            jsonLoader?.RecargarPois();

            yield return new WaitForSeconds(0.5f);
            ActualizarListadoPois();
        }
    }

    // ── Listado barra derecha ─────────────────────────────────────────────────

    public void ActualizarListadoPois()
    {
        StartCoroutine(ObtenerYMostrarPois());
    }

    private IEnumerator ObtenerYMostrarPois()
    {
        string token    = jsonLoader != null ? jsonLoader.ObtenerToken() : "";
        string idCentro = jsonLoader != null ? jsonLoader.ObtenerIdCentro().ToString() : WebBridge.IdCentroActual;

        if (string.IsNullOrEmpty(token)) yield break;

        string url = $"{API_BASE_URL}/api/v1/centers/{idCentro}/pois";

        using (UnityWebRequest www = UnityWebRequest.Get(url))
        {
            www.SetRequestHeader("Authorization", $"Bearer {token}");
            yield return www.SendWebRequest();

            if (www.result != UnityWebRequest.Result.Success)
            {
                Debug.LogWarning($"[EditorPois] Error obteniendo POIs: {www.error}");
                yield break;
            }

            PoiWrapper data = JsonUtility.FromJson<PoiWrapper>(www.downloadHandler.text);
            if (data == null || data.pois == null) yield break;

            foreach (Transform hijo in contenedorListaPois)
                Destroy(hijo.gameObject);

            foreach (Poi poi in data.pois)
                InstanciarItemPoi(poi);
        }
    }

    private void InstanciarItemPoi(Poi poi)
    {
        if (prefabItemPoi == null || contenedorListaPois == null) return;

        GameObject item = Instantiate(prefabItemPoi, contenedorListaPois);

        TMP_Text textoNombre = item.GetComponentInChildren<TMP_Text>();
        if (textoNombre != null)
            textoNombre.text = poi.name;

        Button[] botones = item.GetComponentsInChildren<Button>();

        if (botones.Length >= 1)
        {
            Poi capturado = poi;
            botones[0].onClick.AddListener(() => NavegarAPoi(capturado));
        }

        if (botones.Length >= 2)
        {
            Poi capturado = poi;
            botones[1].onClick.AddListener(() => StartCoroutine(BorrarPoi(capturado.id)));
        }
    }

    // ── Navegación a POI ──────────────────────────────────────────────────────

        private void NavegarAPoi(Poi poi)
    {
        if (cameraView == null) return;

        float posX = poi.details != null ? poi.details.posX : 0.5f;
        float posY = poi.details != null ? poi.details.posY : 0.5f;

        float yaw   = Mathf.Lerp(-180f, 180f, posX);
        float pitch = Mathf.Lerp( -80f,  80f, posY);

        // Mismo orden que ColocarEnEsfera
        Quaternion rotacion  = Quaternion.AngleAxis(yaw, Vector3.up)
                            * Quaternion.AngleAxis(-pitch, Vector3.right);
        Vector3 direccion    = rotacion * Vector3.forward;
        Vector3 posObjetivo  = cameraView.transform.position + direccion * 10f;

        cameraView.RotateCameraToLookAt(posObjetivo);
        Debug.Log($"[EditorPois] Navegando a '{poi.name}' | yaw:{yaw:F1} pitch:{pitch:F1}");
    }

    // ── Borrado ───────────────────────────────────────────────────────────────

    private IEnumerator BorrarPoi(int idPoi)
    {
        string token    = jsonLoader != null ? jsonLoader.ObtenerToken() : "";
        string idCentro = jsonLoader != null ? jsonLoader.ObtenerIdCentro().ToString() : WebBridge.IdCentroActual;

        if (string.IsNullOrEmpty(token)) yield break;

        string url = $"{API_BASE_URL}/api/v1/centers/{idCentro}/pois/{idPoi}";

        using (UnityWebRequest www = UnityWebRequest.Delete(url))
        {
            www.SetRequestHeader("Authorization", $"Bearer {token}");
            www.downloadHandler = new DownloadHandlerBuffer();

            yield return www.SendWebRequest();

            if (www.result != UnityWebRequest.Result.Success)
            {
                Debug.LogWarning($"[EditorPois] Error borrando POI {idPoi}: {www.error}");
                yield break;
            }

            Debug.Log($"[EditorPois] POI {idPoi} borrado.");
            jsonLoader?.RecargarPois();
            yield return new WaitForSeconds(0.3f);
            ActualizarListadoPois();
        }
    }

    // ── Utilidades ────────────────────────────────────────────────────────────

    protected string EscaparJson(string texto)
    {
        return texto.Replace("\\", "\\\\").Replace("\"", "\\\"");
    }
}

[System.Serializable]
public class CrearPoiResponse
{
    public string message;
    public Poi    newPoi;
}