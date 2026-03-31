// lines.js — All MBTA rapid transit line definitions
// Usage: import { LINES, LINE_KEYS, GREEN_BRANCHES } from "./lines";

const ORANGE_STOPS = [
  { id: "place-ogmnl", name: "Oak Grove" },
  { id: "place-mlmnl", name: "Malden Center" },
  { id: "place-welln", name: "Wellington" },
  { id: "place-astao", name: "Assembly" },
  { id: "place-sull", name: "Sullivan Square" },
  { id: "place-ccmnl", name: "Community College" },
  { id: "place-north", name: "North Station" },
  { id: "place-haecl", name: "Haymarket" },
  { id: "place-state", name: "State" },
  { id: "place-dwnxg", name: "Downtown Crossing" },
  { id: "place-chncl", name: "Chinatown" },
  { id: "place-tumnl", name: "Tufts Medical Center" },
  { id: "place-bbsta", name: "Back Bay" },
  { id: "place-masta", name: "Massachusetts Ave" },
  { id: "place-ruggl", name: "Ruggles" },
  { id: "place-rcmnl", name: "Roxbury Crossing" },
  { id: "place-jaksn", name: "Jackson Square" },
  { id: "place-sbmnl", name: "Stony Brook" },
  { id: "place-grnst", name: "Green Street" },
  { id: "place-forhl", name: "Forest Hills" },
];

const RED_STOPS = [
  { id: "place-alfcl", name: "Alewife" },
  { id: "place-davis", name: "Davis" },
  { id: "place-portr", name: "Porter" },
  { id: "place-harsq", name: "Harvard" },
  { id: "place-cntsq", name: "Central" },
  { id: "place-knncl", name: "Kendall/MIT" },
  { id: "place-chmnl", name: "Charles/MGH" },
  { id: "place-pktrm", name: "Park Street" },
  { id: "place-dwnxg", name: "Downtown Crossing" },
  { id: "place-sstat", name: "South Station" },
  { id: "place-brdwy", name: "Broadway" },
  { id: "place-andrw", name: "Andrew" },
  { id: "place-jfk",   name: "JFK/UMass" },
  { id: "place-shmnl", name: "Savin Hill",     branch: "Ashmont" },
  { id: "place-fldcr", name: "Fields Corner",  branch: "Ashmont" },
  { id: "place-smmnl", name: "Shawmut",        branch: "Ashmont" },
  { id: "place-asmnl", name: "Ashmont",         branch: "Ashmont" },
  { id: "place-nqncy", name: "North Quincy",   branch: "Braintree" },
  { id: "place-wlsta", name: "Wollaston",      branch: "Braintree" },
  { id: "place-qnctr", name: "Quincy Center",  branch: "Braintree" },
  { id: "place-qamnl", name: "Quincy Adams",   branch: "Braintree" },
  { id: "place-brntn", name: "Braintree",       branch: "Braintree" },
];

const BLUE_STOPS = [
  { id: "place-wondl", name: "Wonderland" },
  { id: "place-rbmnl", name: "Revere Beach" },
  { id: "place-bmmnl", name: "Beachmont" },
  { id: "place-sdmnl", name: "Suffolk Downs" },
  { id: "place-orhte", name: "Orient Heights" },
  { id: "place-wimnl", name: "Wood Island" },
  { id: "place-aport", name: "Airport" },
  { id: "place-mvbcl", name: "Maverick" },
  { id: "place-aqucl", name: "Aquarium" },
  { id: "place-state", name: "State" },
  { id: "place-gover", name: "Government Center" },
  { id: "place-bomnl", name: "Bowdoin" },
];

// ─── Green Line shared trunk segments ────────────────────────────────
const GL_TRUNK_CORE = [
  // Park St → Gov Center (B & C terminus)
  { id: "place-gover", name: "Government Center" },
  { id: "place-pktrm", name: "Park Street" },
  { id: "place-boyls", name: "Boylston" },
  { id: "place-armnl", name: "Arlington" },
  { id: "place-coecl", name: "Copley" },
];

const GL_TRUNK_HYNES_KENMORE = [
  { id: "place-hymnl", name: "Hynes Convention Center" },
  { id: "place-kencl", name: "Kenmore" },
];

const GL_TRUNK_NORTH = [
  // North of Gov Center (D & E only)
  { id: "place-haecl", name: "Haymarket" },
  { id: "place-north", name: "North Station" },
  { id: "place-spmnl", name: "Science Park/West End" },
  { id: "place-lech",  name: "Lechmere" },
];

const GREEN_B_BRANCH = [
  { id: "place-bland", name: "Blandford Street" },
  { id: "place-buest", name: "BU East" },
  { id: "place-bucen", name: "BU Central" },
  { id: "place-amory", name: "Amory Street" },
  { id: "place-babck", name: "Babcock Street" },
  { id: "place-brico", name: "Packard's Corner" },
  { id: "place-harvd", name: "Harvard Avenue" },
  { id: "place-grigg", name: "Griggs Street" },
  { id: "place-alsgr", name: "Allston Street" },
  { id: "place-wrnst", name: "Warren Street" },
  { id: "place-wascm", name: "Washington Street" },
  { id: "place-sthld", name: "Sutherland Road" },
  { id: "place-chswk", name: "Chiswick Road" },
  { id: "place-chill", name: "Chestnut Hill Avenue" },
  { id: "place-sougr", name: "South Street" },
  { id: "place-lake",  name: "Boston College" },
];

const GREEN_C_BRANCH = [
  { id: "place-smary", name: "Saint Mary's Street" },
  { id: "place-hwsst", name: "Hawes Street" },
  { id: "place-kntst", name: "Kent Street" },
  { id: "place-stpul", name: "Saint Paul Street" },
  { id: "place-cool",  name: "Coolidge Corner" },
  { id: "place-sumav", name: "Summit Avenue" },
  { id: "place-bndhl", name: "Brandon Hall" },
  { id: "place-fbkst", name: "Fairbanks Street" },
  { id: "place-bcnwa", name: "Washington Square" },
  { id: "place-tapst", name: "Tappan Street" },
  { id: "place-denrd", name: "Dean Road" },
  { id: "place-engav", name: "Englewood Avenue" },
  { id: "place-clmnl", name: "Cleveland Circle" },
];

const GREEN_D_BRANCH = [
  { id: "place-fenwy", name: "Fenway" },
  { id: "place-longw", name: "Longwood" },
  { id: "place-bvmnl", name: "Brookline Village" },
  { id: "place-brkhl", name: "Brookline Hills" },
  { id: "place-bcnfd", name: "Beaconsfield" },
  { id: "place-rsmnl", name: "Reservoir" },
  { id: "place-chhil", name: "Chestnut Hill" },
  { id: "place-newto", name: "Newton Centre" },
  { id: "place-newtn", name: "Newton Highlands" },
  { id: "place-eliot", name: "Eliot" },
  { id: "place-waban", name: "Waban" },
  { id: "place-woodl", name: "Woodland" },
  { id: "place-river", name: "Riverside" },
];

const GREEN_D_NORTH = [
  { id: "place-unsqu", name: "Union Square" },
];

const GREEN_E_SOUTH = [
  { id: "place-prmnl", name: "Prudential" },
  { id: "place-symcl", name: "Symphony" },
  { id: "place-nuniv", name: "Northeastern University" },
  { id: "place-mfa",   name: "Museum of Fine Arts" },
  { id: "place-lngmd", name: "Longwood Medical Area" },
  { id: "place-brmnl", name: "Brigham Circle" },
  { id: "place-fenwd", name: "Fenwood Road" },
  { id: "place-mispk", name: "Mission Park" },
  { id: "place-rvrwy", name: "Riverway" },
  { id: "place-bckhl", name: "Back of the Hill" },
  { id: "place-hsmnl", name: "Heath Street" },
];

const GREEN_E_NORTH = [
  { id: "place-esomr", name: "East Somerville" },
  { id: "place-gilmn", name: "Gilman Square" },
  { id: "place-mgngl", name: "Magoun Square" },
  { id: "place-balsq", name: "Ball Square" },
  { id: "place-mdftf", name: "Medford/Tufts" },
];

// ─── Composed line definitions ───────────────────────────────────────
export const LINES = {
  Orange: {
    route: "Orange",
    color: "#f97316",
    dirs: ["Forest Hills", "Oak Grove"],
    terminals: new Set(["place-ogmnl", "place-forhl"]),
    stops: ORANGE_STOPS,
  },
  Red: {
    route: "Red",
    color: "#ef4444",
    dirs: ["Ashmont/Braintree", "Alewife"],
    terminals: new Set(["place-alfcl", "place-asmnl", "place-brntn"]),
    stops: RED_STOPS,
  },
  Blue: {
    route: "Blue",
    color: "#3b82f6",
    dirs: ["Bowdoin", "Wonderland"],
    terminals: new Set(["place-wondl", "place-bomnl"]),
    stops: BLUE_STOPS,
  },
  "Green-B": {
    route: "Green-B",
    color: "#22c55e",
    dirs: ["Boston College", "Government Center"],
    terminals: new Set(["place-lake", "place-gover"]),
    stops: [...GL_TRUNK_CORE, ...GL_TRUNK_HYNES_KENMORE, ...GREEN_B_BRANCH],
  },
  "Green-C": {
    route: "Green-C",
    color: "#22c55e",
    dirs: ["Cleveland Circle", "Government Center"],
    terminals: new Set(["place-clmnl", "place-gover"]),
    stops: [...GL_TRUNK_CORE, ...GL_TRUNK_HYNES_KENMORE, ...GREEN_C_BRANCH],
  },
  "Green-D": {
    route: "Green-D",
    color: "#22c55e",
    dirs: ["Riverside", "Union Square"],
    terminals: new Set(["place-river", "place-unsqu"]),
    stops: [
      ...GREEN_D_NORTH, ...GL_TRUNK_NORTH, ...GL_TRUNK_CORE,
      ...GL_TRUNK_HYNES_KENMORE, ...GREEN_D_BRANCH,
    ],
  },
  "Green-E": {
    route: "Green-E",
    color: "#22c55e",
    dirs: ["Heath Street", "Medford/Tufts"],
    terminals: new Set(["place-hsmnl", "place-mdftf"]),
    stops: [
      ...[...GREEN_E_NORTH].reverse(), ...[...GL_TRUNK_NORTH].reverse(),
      ...GL_TRUNK_CORE, ...GREEN_E_SOUTH,
    ],
  },
};

export const LINE_KEYS = Object.keys(LINES);
export const GREEN_BRANCHES = ["Green-B", "Green-C", "Green-D", "Green-E"];