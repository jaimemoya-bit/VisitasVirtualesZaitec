using UnityEngine;

/// <summary>
/// Hereda de EditorPois y gestiona exclusivamente el drag & drop.
///
/// Inspector: solo 2 referencias imprescindibles:
///   - PrefabGhost    → prefab visual que sigue al cursor (Asset)
///   - ZonaDropVisor  → RectTransform sobre el visor 360
///
/// Autodetectado en Start():
///   - MouseController → FindObjectOfType (se desactiva durante el arrastre)
///   - Canvas raíz     → GetComponentInParent
///   - Crosshair       → BuscarEnHijos por nombre "Crosshair"
/// </summary>
public class DragDropPois : EditorPois
{
    // ── Inspector — solo 2 referencias ───────────────────────────────────────

    [Header("Drag & Drop")]
    [Tooltip("Prefab visual que sigue al cursor (Asset — no está en escena)")]
    [SerializeField] private GameObject    prefabGhost;

    [Tooltip("RectTransform transparente sobre el visor 360 que recibe el drop")]
    [SerializeField] private RectTransform zonaDropVisor;

    // ── Autodetectadas en Start() ─────────────────────────────────────────────

    private MouseController mouseController;
    private Canvas          canvasRaiz;
    private GameObject      crosshair;

    // ── Estado interno ────────────────────────────────────────────────────────

    private bool       estaArrastrando = false;
    private string     tipoArrastrado  = "";
    private GameObject ghostActual     = null;
    private bool mouseWasDown = false;

    // ── Ciclo de vida ─────────────────────────────────────────────────────────

    protected override void Start()
    {
        base.Start();

        // Autodetección
        mouseController = FindObjectOfType<MouseController>();
        canvasRaiz      = GetComponentInParent<Canvas>();
        crosshair       = BuscarEnHijos(transform, "Crosshair")?.gameObject;

        if (mouseController == null) Debug.LogWarning("[DragDropPois] MouseController no encontrado.");
        if (canvasRaiz      == null) Debug.LogWarning("[DragDropPois] Canvas raíz no encontrado.");
        if (crosshair       == null) Debug.LogWarning("[DragDropPois] 'Crosshair' no encontrado en jerarquía.");

        if (crosshair != null) crosshair.SetActive(false);
    }

    private void Update()
{
    if (!estaArrastrando) return;

    if (ghostActual != null)
        ghostActual.transform.position = Input.mousePosition;

    if (Input.GetMouseButtonDown(0))
        mouseWasDown = true;

    if (mouseWasDown && Input.GetMouseButtonUp(0))
        ProcesarDrop();

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
            Debug.LogWarning("[DragDropPois] ZonaDropVisor no asignada.");
            CancelarArrastre();
            return;
        }

        if (RectTransformUtility.RectangleContainsScreenPoint(zonaDropVisor, Input.mousePosition))
        {
            RectTransformUtility.ScreenPointToLocalPointInRectangle(
                zonaDropVisor,
                Input.mousePosition,
                null,
                out Vector2 localPoint
            );

            Rect  rect = zonaDropVisor.rect;
            float x    = Mathf.InverseLerp(rect.xMin, rect.xMax, localPoint.x);
            float y    = Mathf.InverseLerp(rect.yMin, rect.yMax, localPoint.y);

            Debug.Log($"[DragDropPois] Drop válido en ({x:F4}, {y:F4}) — tipo: {tipoArrastrado}");

            string tipoConfirmado = tipoArrastrado;
            LimpiarEstadoArrastre();
            MostrarPanelConfirmar(tipoConfirmado, x, y);
        }
        else
        {
            Debug.Log("[DragDropPois] Drop fuera del visor, cancelado.");
            CancelarArrastre();
        }
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

    // ── Helper búsqueda recursiva ─────────────────────────────────────────────

    private Transform BuscarEnHijos(Transform padre, string nombre)
    {
        foreach (Transform hijo in padre)
        {
            if (hijo.name == nombre) return hijo;
            Transform encontrado = BuscarEnHijos(hijo, nombre);
            if (encontrado != null) return encontrado;
        }
        return null;
    }
}