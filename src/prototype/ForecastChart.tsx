import { forecast, value, type Post } from "./model";

export default function ForecastChart({ post, at }: { post: Post; at: string }) {
  const predictions = forecast(post, at);
  const current = value(post, at);
  if (!predictions.length || current === null) return null;
  const values = [current, ...predictions];
  const low = Math.min(...values, post.threshold);
  const high = Math.max(...values, post.threshold);
  const padding = Math.max((high - low) * 0.25, 0.15);
  const min = Math.max(0, low - padding);
  const max = high + padding;
  const x = (i: number) => 48 + i * 24;
  const y = (v: number) => 160 - (v - min) / (max - min) * 125;
  const clock = (i: number) => new Date(Date.parse(at) + i * 10 * 60000)
    .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
  const end = predictions[predictions.length - 1];
  return (
    <section className="water-forecast" aria-label={`Prediksi tinggi muka air ${post.name}`}>
      <h3>Prediksi tinggi muka air</h3>
      <p className="forecast-caption">2 jam ke depan · setiap 10 menit · WIB</p>
      <div className="forecast-key"><span>● Prediksi</span><span>Batas Waspada: <b>{post.threshold.toFixed(2)} m</b></span></div>
      <svg viewBox="0 0 360 200" role="img" aria-label={`Prediksi dari ${current.toFixed(2)} menjadi ${end.toFixed(2)} meter dalam 2 jam. Batas Waspada ${post.threshold.toFixed(2)} meter.`}>
        <text x="8" y="18">m</text>
        {[min, (min + max) / 2, max].map((v) => <g key={v}>
          <line x1="48" x2="336" y1={y(v)} y2={y(v)} stroke="#e2e8f0" />
          <text x="39" y={y(v) + 4} textAnchor="end">{v.toFixed(2)}</text>
        </g>)}
        <line x1="48" x2="336" y1={y(post.threshold)} y2={y(post.threshold)} stroke="#a85b00" strokeWidth="2" strokeDasharray="5 4" />
        <text x="336" y={y(post.threshold) - 7} textAnchor="end" fill="#854700">Waspada {post.threshold.toFixed(2)} m</text>
        <polyline points={values.map((v, i) => `${x(i)},${y(v)}`).join(" ")} fill="none" stroke="#176b87" strokeWidth="2.5" />
        {values.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r={i === 0 ? 4 : 3} fill={i === 0 ? "white" : "#176b87"} stroke="#176b87" strokeWidth="2"><title>{i === 0 ? "Pengamatan" : `+${i * 10} menit`} · {clock(i)} · {v.toFixed(2)} m</title></circle>)}
        {[0, 3, 6, 9, 12].map((i) => <text key={i} x={x(i)} y="184" textAnchor="middle">{clock(i)}</text>)}
      </svg>
      <p className="forecast-result">Sekarang <b>{current.toFixed(2)} m</b> → 2 jam lagi <b>{end.toFixed(2)} m</b></p>
      <small>Simulasi prediksi, bukan pengamatan saat ini.</small>
      <details><summary>Lihat angka per 10 menit</summary>
        <table><thead><tr><th>Waktu (WIB)</th><th>TMA (m)</th><th>Level prediksi</th></tr></thead>
          <tbody>{predictions.map((v, i) => <tr key={i}><td>{clock(i + 1)}</td><td>{v.toFixed(2)}</td><td>{v >= post.threshold ? "Waspada" : "Normal"}</td></tr>)}</tbody>
        </table>
      </details>
    </section>
  );
}
