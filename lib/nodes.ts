export type Status = "Live" | "Expanding";

export type ModalityLabel = "Stereo-RGB" | "IMU" | "Wrist cam" | "Haptic glove";

export interface Modality {
  /** Short label shown on the chip, e.g. "Stereo-RGB". */
  label: ModalityLabel;
  /** Compact code used in the HUD readout, e.g. "RGB". */
  code: "RGB" | "IMU" | "WRIST" | "GLOVE";
  /** Whether this modality is currently captured at the node. */
  active: boolean;
}

export interface Environment {
  /** Environment name (bold). */
  n: string;
  /** Sector tag (mono, right-aligned). */
  t: string;
  /** One-line task description of the actual manipulation/work. */
  task: string;
  /** Optional flag — "hot" highlights the densest-signal row in amber. */
  flag?: "hot";
}

export interface PraxisNode {
  /** 1-based index used for display (e.g. NODE 02 / 04). */
  index: number;
  /** Country / node name. */
  n: string;
  /** Human-readable region label. */
  region: string;
  lat: number;
  lon: number;
  continent: string;
  status: Status;
  /** Fixed-order capture stack: RGB, IMU, WRIST, GLOVE. */
  modalities: Modality[];
  environments: Environment[];
  note: string;
  /** Left empty for v1 — no real sample footage yet. */
  sampleUrl: string;
}

/** Build a fixed-order modality stack from the set of active codes. */
function stack(active: Modality["code"][]): Modality[] {
  const defs: { label: ModalityLabel; code: Modality["code"] }[] = [
    { label: "Stereo-RGB", code: "RGB" },
    { label: "IMU", code: "IMU" },
    { label: "Wrist cam", code: "WRIST" },
    { label: "Haptic glove", code: "GLOVE" },
  ];
  return defs.map((d) => ({ ...d, active: active.includes(d.code) }));
}

export const NODES: PraxisNode[] = [
  {
    index: 1,
    n: "United Kingdom",
    region: "NW England · London",
    lat: 53.27,
    lon: -2.87,
    continent: "Europe",
    status: "Live",
    modalities: stack(["RGB", "IMU", "WRIST"]),
    environments: [
      {
        n: "Oil refinery",
        t: "Heavy industrial",
        task: "Process operators on rounds — manual valve and manifold operation, gauge reading, sampling and inspection across a hazardous site. Two-handed tool use in PPE, constrained postures, mobile navigation of process units.",
      },
      {
        n: "Residential care home",
        t: "Care · residential",
        task: "Caregivers supporting residents — transfers and repositioning, assisted dressing and feeding, mobility support. Compliant, force-sensitive bimanual contact with a deformable human body; high-stakes handling.",
      },
    ],
    note: "Two ends of the spectrum from one market — hazardous heavy-industrial process work and close-contact human care.",
    sampleUrl: "",
  },
  {
    index: 2,
    n: "India",
    region: "Surat · Hyderabad",
    lat: 21.17,
    lon: 72.83,
    continent: "Asia",
    status: "Live",
    modalities: stack(["RGB", "IMU", "WRIST", "GLOVE"]),
    environments: [
      {
        n: "Diamond cutting & polishing",
        t: "Precision manipulation",
        task: "Cutters working stones against rotating scaifes under magnification — sub-millimetre bimanual manipulation, fine tool control, continuous force modulation against a hard, high-value workpiece. The densest fine-manipulation signal we capture.",
        flag: "hot",
      },
      {
        n: "Textiles",
        t: "Light manufacturing",
        task: "Cutting, stitching and fabric handling — manipulation of deformable, non-rigid materials with two-handed alignment and feeding.",
      },
      {
        n: "Pharma",
        t: "Cleanroom process",
        task: "Packaging, inspection and small-part handling under contamination constraints — precise, repeatable manipulation.",
      },
      {
        n: "Residential",
        t: "Domestic tasks",
        task: "Cooking, cleaning, tidying and object retrieval in real homes — long-horizon, unstructured, full-range household manipulation.",
      },
    ],
    note: "Our highest-fidelity floor. Diamond work pairs IMU, wrist cameras and haptic-glove kinematics on sub-millimetre manipulation — the manipulation data VLA builders are starved for.",
    sampleUrl: "",
  },
  {
    index: 3,
    n: "Tanzania",
    region: "Dar es Salaam",
    lat: -6.79,
    lon: 39.21,
    continent: "Africa",
    status: "Live",
    modalities: stack(["RGB", "IMU", "WRIST"]),
    environments: [
      {
        n: "Beverage bottling",
        t: "Line operation",
        task: "Loading, capping, sorting and palletizing at throughput — repetitive high-rate bimanual handling and machine tending.",
      },
      {
        n: "Motorcycle assembly",
        t: "Assembly",
        task: "Sequential mechanical assembly — fastening, part fitting, powered and hand tool use, torque-sensitive insertion.",
      },
      {
        n: "Textiles",
        t: "Light manufacturing",
        task: "Sewing and cutting — deformable-material handling and machine operation.",
      },
      {
        n: "Field electrical",
        t: "Skilled trades",
        task: "Electricians in the field — wiring, fixture install and diagnosis. Mobile manipulation in unstructured, variable environments.",
      },
    ],
    note: "High-throughput line and assembly work plus mobile, unstructured skilled-trade tasks captured in the field.",
    sampleUrl: "",
  },
  {
    index: 4,
    n: "Peru",
    region: "Lima",
    lat: -12.05,
    lon: -77.04,
    continent: "South America",
    status: "Expanding",
    modalities: stack(["RGB", "IMU"]),
    environments: [
      {
        n: "Mining operations",
        t: "Heavy industrial",
        task: "Operators running extraction and materials handling — heavy equipment operation, hauling and processing in harsh, large-scale outdoor environments. Whole-body work and machine control at industrial scale.",
      },
      {
        n: "Mining maintenance",
        t: "Skilled trades",
        task: "Maintenance crews servicing heavy machinery — rigging, fastening, component replacement and repair with powered and hand tools in confined, variable conditions. Force-heavy bimanual manipulation.",
      },
    ],
    note: "Latest market online — heavy-industrial capture across the group's mining operations, with collection expanding.",
    sampleUrl: "",
  },
];
