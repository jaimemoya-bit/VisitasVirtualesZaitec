using UnityEngine;
using TMPro; // Necesario para usar componentes de texto TextMeshPro (TMP_Text).

/// <summary>
/// Componente encargado de representar y actualizar un texto asociado a un elemento
/// del escenario, normalmente un punto de interés (POI).
/// Este script permite identificar cada instancia mediante un ID y actualizar
/// su contenido de forma centralizada.
/// </summary>
public class PoiText : MonoBehaviour
{
    /// <summary>
    /// Identificador único del texto.
    /// Este ID puede ser usado por sistemas externos (localización, carga dinámica,
    /// gestores de UI, etc.) para asignar el contenido correcto.
    /// Ejemplos: "h1", "h2", "p1", "a3", "poi_description".
    /// </summary>
    [Tooltip("ID del texto, por ejemplo h1, h2, p1, a3...")]
    public string id;

    /// <summary>
    /// Referencia al componente visual que mostrará el contenido de texto.
    /// Es habitual asignarlo desde el Inspector.
    /// Se recomienda el uso de TextMeshPro (TMP_Text) por su mayor calidad y rendimiento.
    /// Si se desea usar el componente UI clásico, sustituir por UnityEngine.UI.Text.
    /// </summary>
    [Tooltip("Referencia al componente de texto (TextMeshProUGUI o similar).")]
    public TMP_Text textTarget;
    // Alternativa si se desea usar UI Text:
    // public UnityEngine.UI.Text textTarget;

    /// <summary>
    /// Asigna un nuevo valor al texto mostrado en la interfaz.
    /// Realiza una comprobación de seguridad para evitar referencias nulas.
    /// </summary>
    /// <param name="value">Nuevo contenido textual que se mostrará.</param>
    public void SetText(string value)
    {
        // Verifica que la referencia al componente de texto es válida.
        if (textTarget != null)
        {
            // Actualiza el texto visible.
            textTarget.text = value;
        }
        else
        {
            // Envía una advertencia a la consola si falta la referencia,
            // indicando el GameObject afectado para facilitar el diagnóstico.
            Debug.LogWarning($"[PoiText] No hay textTarget asignado en {name}");
        }
    }
}