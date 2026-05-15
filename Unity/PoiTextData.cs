using System;
using UnityEngine;

/// <summary>
/// Representa una entrada individual dentro de la tabla de textos POI.
/// Cada entrada contiene un identificador único y su contenido asociado.
/// Esta clase se serializa directamente desde/hacia JSON.
/// </summary>
[Serializable]
public class PoiEntry
{
    /// <summary>
    /// Identificador único del texto.
    /// Este ID debe coincidir con el utilizado por componentes como PoiText
    /// para que el sistema pueda realizar la asignación de forma automática.
    /// </summary>
    public string id;

    /// <summary>
    /// Contenido textual asociado a este ID.
    /// Puede provenir de archivos JSON externos, sistemas de localización,
    /// editores de contenido o bases de datos.
    /// </summary>
    public string text;
}

/// <summary>
/// Tabla contenedora de múltiples elementos de tipo PoiEntry.
/// Esta clase envuelve un array de entradas y se utiliza como estructura
/// raíz para la deserialización desde archivos JSON completos.
/// </summary>
[Serializable]
public class PoiTable
{
    /// <summary>
    /// Lista de entradas (ID + texto) definidas en el JSON.
    /// Este array corresponde a la sección "entries" dentro del archivo.
    /// Ejemplo esperado en JSON:
    /// {
    ///     "entries": [
    ///         { "id": "h1", "text": "Título principal" },
    ///         { "id": "p1", "text": "Primer párrafo" }
    ///     ]
    /// }
    /// </summary>
    public PoiEntry[] entries;
}