using UnityEngine;

/// <summary>
/// Hereda de EditorPois y gestiona exclusivamente el drag & drop.
///
/// Inspector: solo 1 referencia imprescindible:
///   - PrefabGhost → prefab visual que sigue al cursor (Asset)
///
/// Autodetectado en Start():
///   - MouseController → FindObjectOfType (se desactiva durante el arrastre)
///   - Canvas raíz     → GetComponentInParent
///   - Crosshair       → BuscarEnHijos por nombre "Crosshair"
///   - ZonaDropVisor   → BuscarEnHijos por nombre "ZonaDropVisor" desde la raíz
/// </summary>
public class DragDropPois : EditorPois
{
    // ── Inspector — solo 1 referencia ─────────────────────────────────────────

    [Header("Drag & Drop")]
    [Tooltip("Prefab visual que sigue al cursor (Asset — no está en escena)")]
    [SerializeField] private GameObject prefabGhost;

    // ── Autodetectadas en Start() ─────────────────────────────────────────────

    private MouseController mouseController;
    private Canvas          canvasRaiz;
    private GameObject      crosshair;
    private RectTransform   zonaDropVisor; // Autodetectada por nombre "ZonaDropVisor"

    // ── Estado interno ────────────────────────────────────────────────────────

    private bool       estaArrastrando = false;
    private string     tipoArrastrado  = "";
    private GameObject ghostActual     = null;

    // Fix timing: evita que el drop se procese en el mismo frame que IniciarArrastre()
    // porque el click del botón del panel también dispara GetMouseButtonUp(0) inmediatamente
    private bool mouseWasDown = false;

    // ── Ciclo de vida ─────────────────────────────────────────────────────────

    protected override void Start()
    {
        base.Start();

        // Autodetección
        mouseController = FindObjectOfType<MouseController>();
        canvasRaiz      = GetComponentInParent<Canvas>();
        crosshair       = BuscarEnHijos(transform, "Crosshair")?.gameObject;

        // ZonaDropVisor se busca desde la raíz del Canvas para evitar
        // problemas con prefabs que no pueden referenciar objetos de la escena
        Transform zonaVisor = BuscarEnHijos(transform.root, "ZonaDropVisor");
        if (zonaVisor != null)
            zonaDropVisor = zonaVisor.GetComponent<RectTransform>();

        if (mouseController == null) Debug.LogWarning("[DragDropPois] MouseController no encontrado.");
        if (canvasRaiz      == null) Debug.LogWarning("[DragDropPois] Canvas raíz no encontrado.");
        if (crosshair       == null) Debug.LogWarning("[DragDropPois] 'Crosshair' no encontrado en jerarquía.");
        if (zonaDropVisor   == null) Debug.LogWarning("[DragDropPois] 'ZonaDropVisor' no encontrado en jerarquía.");

        if (crosshair != null) crosshair.SetActive(false);
    }

    private void Update()
    {
        if (!estaArrastrando) return;

        // Ghost sigue al cursor
        if (ghostActual != null)
            ghostActual.transform.position = Input.mousePosition;

        // Esperamos a que el botón se presione de nuevo después de IniciarArrastre()
        // para evitar procesar el drop en el mismo frame del click inicial
        if (Input.GetMouseButtonDown(0))
            mouseWasDown = true;

        if (mouseWasDown && Input.GetMouseButtonUp(0))
            ProcesarDrop();

        // Cancelar con Escape
        if (Input.GetKeyDown(KeyCode.Escape))
            CancelarArrastre();
    }

    // ── API pública — botones del panel izquierdo ─────────────────────────────

    // Conectar en Inspector: OnClick → DragDropPois.IniciarArrastre("basico")
    //                                   DragDropPois.IniciarArrastre("imagen")
    public void IniciarArrastre(string tipo)
    {
        if (estaArrastrando) return;

        estaArrastrando = true;
        tipoArrastrado  = tipo;

        // Desactivar cámara para que el arrastre no la mueva
        if (mouseController != null) mouseController.enabled = false;

        if (prefabGhost != null && canvasRaiz != null)
        {
            ghostActual = Instantiate(prefabGhost, canvasRaiz.transform);
            ghostActual.transform.position = Input.mousePosition;
        }

        if (crosshair != null) crosshair.SetActive(true);

        panelIzquierdo?.SetActive(false);

        Debug.Log($"[DragDropPois] Arrastre iniciado — tipo: {tipo}");
    }

    // ── Lógica interna ────────────────────────────────────────────────────────

private void ProcesarDrop()
{
    if (zonaDropVisor == null)
    {
        Debug.LogWarning("[DragDropPois] ZonaDropVisor no encontrada.");
        CancelarArrastre();
        return;
    }

    if (!RectTransformUtility.RectangleContainsScreenPoint(
            zonaDropVisor, Input.mousePosition, null))
    {
        Debug.Log("[DragDropPois] Drop fuera del visor, cancelado.");
        CancelarArrastre();
        return;
    }

    Camera cam = Camera.main;

    // Obtener la rotación actual de la cámara normalizada (0-360)
    float camYaw   = cam.transform.eulerAngles.y;          // 0-360
    float camPitch = cam.transform.eulerAngles.x;          // 0-360 (negativo = arriba)

    // Unity guarda pitch negativo como valores > 180 (ej: -10° = 350°)
    // Normalizar a rango -180..180
    if (camYaw   > 180f) camYaw   -= 360f;
    if (camPitch > 180f) camPitch -= 360f;

    // Calcular el offset del mouse respecto al centro de la pantalla
    // Esto da el ángulo adicional según dónde hizo drop dentro del visor
    float screenW = Screen.width;
    float screenH = Screen.height;
    float mouseX  = Input.mousePosition.x;
    float mouseY  = Input.mousePosition.y;

    // FOV horizontal y vertical de la cámara
    float fovV = cam.fieldOfView;                          // vertical FOV en grados
    float fovH = Camera.VerticalToHorizontalFieldOfView(fovV, cam.aspect);

    // Offset angular del punto de drop respecto al centro de pantalla
    float offsetYaw   = ((mouseX / screenW) - 0.5f) * fovH;
    float offsetPitch = -((mouseY / screenH) - 0.5f) * fovV;

    // Yaw y pitch finales = rotación de cámara + offset del mouse
    float finalYaw   = camYaw   + offsetYaw;
    float finalPitch = camPitch + offsetPitch;  // no invertir — Unity Y arriba

    // Normalizar a (0-1) para guardar en DB
    // Yaw:   -180..180  → 0..1
    // Pitch:  -80..80   → 0..1  (mismo rango que ColocarEnEsfera)
    float x = Mathf.Clamp01((finalYaw   + 180f) / 360f);
    float y = Mathf.Clamp01(1f - ((finalPitch + 80f) / 160f));



    string tipoConfirmado = tipoArrastrado;
    LimpiarEstadoArrastre();
    MostrarPanelConfirmar(tipoConfirmado, x, y);
}
    private void CancelarArrastre()
    {
        LimpiarEstadoArrastre();
        Debug.Log("[DragDropPois] Arrastre cancelado.");
    }

    private void LimpiarEstadoArrastre()
    {
        estaArrastrando = false;
        mouseWasDown = false;
        tipoArrastrado  = "";

        // Reactivar cámara al terminar
        if (mouseController != null) mouseController.enabled = true;

        if (ghostActual != null)
        {
            Destroy(ghostActual);
            ghostActual = null;
        }

        if (crosshair != null) crosshair.SetActive(false);
    }

}