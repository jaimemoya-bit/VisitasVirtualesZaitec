using System.Collections;
using UnityEngine;
using TMPro;
using System.IO;

public class POITextManager : MonoBehaviour
{
    public TMP_Text p1;
    public TMP_Text p2;
    public TMP_Text p3;
    public TMP_Text p4;
    public TMP_Text p5;
    public TMP_Text p6;
    public TMP_Text p7;
    public TMP_Text p8;
    public TMP_Text p9;
    public TMP_Text p10;

    string path;

    void Start()
    {
        path = Path.Combine(Application.streamingAssetsPath, "poiTexts.json");
        StartCoroutine(UpdateTexts());
    }

    IEnumerator UpdateTexts()
    {
        while (true)
        {
            LoadJson();
            yield return new WaitForSeconds(5f);
        }
    }

    void LoadJson()
    {
        if (File.Exists(path))
        {
            string json = File.ReadAllText(path);

            POIData data = JsonUtility.FromJson<POIData>(json);

            p1.text = data.p1;
            p2.text = data.p2;
            p3.text = data.p3;
            p4.text = data.p4;
            p5.text = data.p5;
            p6.text = data.p6;
            p7.text = data.p7;
            p8.text = data.p8;
            p9.text = data.p9;
            p10.text = data.p10;
        }

        Debug.Log("Leyendo JSON en: " + path);
    }
}
