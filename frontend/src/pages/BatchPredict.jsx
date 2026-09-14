import { useState } from "react";
import { useTranslation } from "react-i18next";
import client from "../api/client";

export default function BatchPredict() {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const downloadSample = async () => {
    const { data } = await client.get("/batch/sample-csv");
    const blob = new Blob([data.csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!file) return;
    setError("");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await client.post("/batch/predict", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setRows(data.results);
    } catch (err) {
      setError(err.response?.data?.detail || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>{t("batch.title")}</h1>
      <p>{t("batch.intro")}</p>
      <div className="panel">
        <button className="secondary" onClick={downloadSample} type="button">{t("batch.download_sample")}</button>
        <form onSubmit={submit} style={{ marginTop: "1rem" }}>
          <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} />
          <button className="primary" type="submit" disabled={loading || !file} style={{ marginInlineStart: "1rem" }}>
            {loading ? t("common.loading") : t("batch.upload")}
          </button>
        </form>
        {error && <p className="error-text">{error}</p>}
      </div>

      {rows.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("batch.row")}</th>
              <th>{t("batch.result")}</th>
              <th>{t("batch.probability")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.row_index}>
                <td>{r.row_index + 1}</td>
                <td>{r.predicted_label}</td>
                <td>{r.malignant_probability_pct}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
