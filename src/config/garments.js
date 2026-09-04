const CLOUD_NAME     = "YOUR_CLOUD_NAME";
const GARMENT_FOLDER = "garments";

export function getPhotoUrl(template, colorKey) {
  const colour = GARMENT_COLOURS.find((c) => c.key === colorKey);
  const hex    = colour ? colour.hex.replace("#", "") : "cccccc";
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_400,h_500,c_fill,b_rgb:${hex},e_colorize:100/sample`;
  // Swap to real photos once uploaded:
  // return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${GARMENT_FOLDER}/${template}-${colorKey}.jpg`;
}

export const GARMENT_COLOURS = [
  { key: "black",    label: "Black",    hex: "#111111" },
  { key: "white",    label: "White",    hex: "#f5f5f5" },
  { key: "cream",    label: "Cream",    hex: "#f0ead6" },
  { key: "grey",     label: "Grey",     hex: "#9e9e9e" },
  { key: "stone",    label: "Stone",    hex: "#c4b9a8" },
  { key: "navy",     label: "Navy",     hex: "#1a2744" },
  { key: "olive",    label: "Olive",    hex: "#556b2f" },
  { key: "burgundy", label: "Burgundy", hex: "#6e1423" },
  { key: "brown",    label: "Brown",    hex: "#5c3d2e" },
];

export const GARMENT_TEMPLATES = [
  { key: "tshirt",     label: "T-Shirt",     icon: "👕" },
  { key: "hoodie",     label: "Hoodie",      icon: "🧥" },
  { key: "crewneck",   label: "Crewneck",    icon: "👔" },
  { key: "trackpants", label: "Track Pants", icon: "👖" },
  { key: "trousers",   label: "Trousers",    icon: "👖" },
  { key: "cap",        label: "Cap",         icon: "🧢" },
  { key: "totebag",    label: "Tote Bag",    icon: "👜" },
  { key: "hat",        label: "Hat",         icon: "🎩" },
];

export const WAVE_PATHS = {
  tshirt: {
    viewBox: "0 0 400 500", strokeWidth: 8,
    paths: [
      "M -20 160 C 60 140, 140 180, 200 155 C 260 130, 340 170, 420 150",
      "M -20 185 C 60 165, 140 205, 200 180 C 260 155, 340 195, 420 175",
      "M -20 210 C 60 190, 140 230, 200 205 C 260 180, 340 220, 420 200",
      "M -20 235 C 60 215, 140 255, 200 230 C 260 205, 340 245, 420 225",
      "M -20 260 C 60 240, 140 280, 200 255 C 260 230, 340 270, 420 250",
      "M -20 285 C 60 265, 140 305, 200 280 C 260 255, 340 295, 420 275",
      "M -20 310 C 60 290, 140 330, 200 305 C 260 280, 340 320, 420 300",
    ],
  },
  hoodie: {
    viewBox: "0 0 400 500", strokeWidth: 9,
    paths: [
      "M -20 180 C 60 158, 140 200, 200 175 C 260 150, 340 192, 420 170",
      "M -20 207 C 60 185, 140 227, 200 202 C 260 177, 340 219, 420 197",
      "M -20 234 C 60 212, 140 254, 200 229 C 260 204, 340 246, 420 224",
      "M -20 261 C 60 239, 140 281, 200 256 C 260 231, 340 273, 420 251",
      "M -20 288 C 60 266, 140 308, 200 283 C 260 258, 340 300, 420 278",
      "M -20 315 C 60 293, 140 335, 200 310 C 260 285, 340 327, 420 305",
      "M -20 342 C 60 320, 140 362, 200 337 C 260 312, 340 354, 420 332",
    ],
  },
  crewneck: {
    viewBox: "0 0 400 500", strokeWidth: 8,
    paths: [
      "M -20 170 C 60 150, 140 190, 200 165 C 260 140, 340 180, 420 160",
      "M -20 196 C 60 176, 140 216, 200 191 C 260 166, 340 206, 420 186",
      "M -20 222 C 60 202, 140 242, 200 217 C 260 192, 340 232, 420 212",
      "M -20 248 C 60 228, 140 268, 200 243 C 260 218, 340 258, 420 238",
      "M -20 274 C 60 254, 140 294, 200 269 C 260 244, 340 284, 420 264",
      "M -20 300 C 60 280, 140 320, 200 295 C 260 270, 340 310, 420 290",
      "M -20 326 C 60 306, 140 346, 200 321 C 260 296, 340 336, 420 316",
    ],
  },
  trackpants: {
    viewBox: "0 0 400 500", strokeWidth: 7,
    paths: [
      "M 60 20 C 40 120, 80 220, 55 320 C 35 400, 70 460, 55 490",
      "M 85 20 C 65 120, 105 220, 80 320 C 60 400, 95 460, 80 490",
      "M 110 20 C 90 120, 130 220, 105 320 C 85 400, 120 460, 105 490",
      "M 265 20 C 245 120, 285 220, 260 320 C 240 400, 275 460, 260 490",
      "M 290 20 C 270 120, 310 220, 285 320 C 265 400, 300 460, 285 490",
      "M 315 20 C 295 120, 335 220, 310 320 C 290 400, 325 460, 310 490",
    ],
  },
  trousers: {
    viewBox: "0 0 400 500", strokeWidth: 6,
    paths: [
      "M 65 20 C 50 110, 80 210, 62 310 C 48 400, 68 455, 60 490",
      "M 88 20 C 73 110, 103 210, 85 310 C 71 400, 91 455, 83 490",
      "M 270 20 C 255 110, 285 210, 267 310 C 253 400, 273 455, 265 490",
      "M 293 20 C 278 110, 308 210, 290 310 C 276 400, 296 455, 288 490",
    ],
  },
  cap: {
    viewBox: "0 0 400 300", strokeWidth: 5,
    paths: [
      "M -20 100 C 60 88, 140 112, 200 98 C 260 84, 340 108, 420 96",
      "M -20 118 C 60 106, 140 130, 200 116 C 260 102, 340 126, 420 114",
      "M -20 136 C 60 124, 140 148, 200 134 C 260 120, 340 144, 420 132",
      "M -20 154 C 60 142, 140 166, 200 152 C 260 138, 340 162, 420 150",
    ],
  },
  totebag: {
    viewBox: "0 0 400 500", strokeWidth: 10,
    paths: [
      "M -20 150 C 80 120, 160 180, 200 145 C 240 110, 320 170, 420 140",
      "M -20 200 C 80 170, 160 230, 200 195 C 240 160, 320 220, 420 190",
      "M -20 250 C 80 220, 160 280, 200 245 C 240 210, 320 270, 420 240",
      "M -20 300 C 80 270, 160 330, 200 295 C 240 260, 320 320, 420 290",
      "M -20 350 C 80 320, 160 380, 200 345 C 240 310, 320 370, 420 340",
    ],
  },
  hat: {
    viewBox: "0 0 400 300", strokeWidth: 5,
    paths: [
      "M -20 95 C 60 80, 140 110, 200 93 C 260 76, 340 106, 420 91",
      "M -20 115 C 60 100, 140 130, 200 113 C 260 96, 340 126, 420 111",
      "M -20 135 C 60 120, 140 150, 200 133 C 260 116, 340 146, 420 131",
    ],
  },
};

export const STRIPE_COLOUR_PRESETS = [
  { label: "White",    hex: "#f5f5f5" },
  { label: "Black",    hex: "#111111" },
  { label: "Red",      hex: "#e05555" },
  { label: "Gold",     hex: "#c4aa45" },
  { label: "Cobalt",   hex: "#2e5e9e" },
  { label: "Lavender", hex: "#7f77dd" },
  { label: "Forest",   hex: "#3a6b4a" },
  { label: "Coral",    hex: "#e07b54" },
];
