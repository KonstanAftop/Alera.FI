// Approximate polylines of the upper Citarum and key tributaries flowing
// through / past Majalaya. Coordinates ordered HULU -> HILIR so that
// line-progress animations move in the actual direction of flow.
// Source: digitised from OSM / public hydrological references.

import type { FeatureCollection, LineString } from "geojson";

export interface RiverProps {
  name: string;
  kelas: "utama" | "anak"; // main river vs tributary
}

export const RIVERS: FeatureCollection<LineString, RiverProps> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Sungai Citarum (Hulu → Hilir)", kelas: "utama" },
      geometry: {
        type: "LineString",
        coordinates: [
          // Mata air Situ Cisanti (kaki G. Wayang) ~1450 mdpl
          [107.7861, -7.2069],
          [107.7795, -7.1880],
          [107.7702, -7.1705],
          [107.7640, -7.1530],
          [107.7588, -7.1360],
          [107.7560, -7.1180],
          [107.7575, -7.1010],
          [107.7600, -7.0830],
          [107.7612, -7.0660],
          // Lewat Majalaya Kota
          [107.7619, -7.0500],
          [107.7600, -7.0420],
          [107.7560, -7.0345],
          [107.7480, -7.0280],
          [107.7370, -7.0235],
          [107.7240, -7.0205],
          [107.7080, -7.0180],
          [107.6900, -7.0150],
          [107.6720, -7.0110],
          [107.6540, -7.0070],
          [107.6400, -7.0035],
          // Baleendah & Dayeuhkolot (rawan banjir)
          [107.6286, -7.0036],
          [107.6230, -6.9950],
          [107.6175, -6.9836],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Anak Sungai Kertasari", kelas: "anak" },
      geometry: {
        type: "LineString",
        coordinates: [
          [107.7503, -7.1492],
          [107.7540, -7.1395],
          [107.7575, -7.1280],
          [107.7588, -7.1180],
          [107.7588, -7.1075],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Anak Sungai Pacet", kelas: "anak" },
      geometry: {
        type: "LineString",
        coordinates: [
          [107.8211, -7.1100],
          [107.8090, -7.1010],
          [107.7950, -7.0920],
          [107.7800, -7.0820],
          [107.7700, -7.0740],
          [107.7619, -7.0660],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Cisangkuy (menuju Baleendah)", kelas: "anak" },
      geometry: {
        type: "LineString",
        coordinates: [
          [107.6050, -7.1450],
          [107.6080, -7.1280],
          [107.6120, -7.1100],
          [107.6160, -7.0900],
          [107.6210, -7.0700],
          [107.6250, -7.0500],
          [107.6280, -7.0250],
          [107.6286, -7.0036],
        ],
      },
    },
  ],
};
