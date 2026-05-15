using UnityEngine;
using UnityEngine.SceneManagement;

public class WebBridge : MonoBehaviour
{
    // Variables estáticas: persisten entre cambios de escena (son de clase, no de instancia)
    // Cualquier otro script puede leerlas con WebBridge.IdCentroActual
    public static string IdCentroActual { get; private set; } = "";
    public static string IdEscenaActual  { get; private set; } = "";

    // Flags para saber qué IDs ya llegaron desde React
    private bool _centroRecibido = false;
    private bool _escenaRecibida = false;

    // Recibir rol de usuario desde React. Confiar en backend para validar permisos.
    // Esto es solo para mostrar el canvas de administración en Unity.
    public static string RolUsuario { get; private set; } = "guest";

    // JavaScript llama a este método primero
    public void RecibirIdCentro(string idCentro)
    {
        IdCentroActual = idCentro;
        _centroRecibido = true;
        Debug.Log("[WebBridge] ID de centro recibido: " + idCentro);
        TryLoadScene();
    }

    // JavaScript llama a este método segundo
    public void RecibirIdEscena(string idEscena)
    {
        IdEscenaActual = idEscena;
        _escenaRecibida = true;
        Debug.Log("[WebBridge] ID de escena recibido: " + idEscena);
        TryLoadScene();
    }

    // JavaScript llama a este método para enviar el rol del usuario
    public void RecibirRolUsuario(string rol)
    {
        RolUsuario = rol;
        Debug.Log("[WebBridge] Rol de usuario recibido: " + rol);
    }

    // Carga la escena solo cuando han llegado los dos IDs
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

        Debug.Log($"[WebBridge] Cargando escena {sceneIndex} para centro {IdCentroActual}");
        SceneManager.LoadScene(sceneIndex);
    }
}