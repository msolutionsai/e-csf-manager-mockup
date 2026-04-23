/* ============================================
   e-CSF Manager — Data & Business Rules
   All amounts in DH, all text in French
   ============================================ */

// --- CURRENT VIRTUAL "TODAY" (fixed so deadlines remain meaningful) ---
// Mockup clock: 2026-04-23 (aligns with real date context)
const TODAY = new Date(2026, 3, 23); // months are 0-indexed
const YEAR_N = TODAY.getFullYear();

// --- COMPANY ---
const COMPANY = {
  raisonSociale: "Maroc Industrie SA",
  activite: "Fabrication de composants métalliques et services industriels",
  secteur: "Industrie / BTP",
  adresse: "Zone Industrielle Sidi Bernoussi, Lot 412, Casablanca",
  telephone: "+212 522 74 12 80",
  fax: "+212 522 74 12 81",
  email: "rh@maroc-industrie.ma",
  dateCreation: "12/03/2007",
  patente: "35270148",
  identifiantFiscal: "2205873",
  rc: "148573",
  cnss: "123456",
  responsableFormation: "Mme. Fatima Benali",
  signataire: "M. Karim Alaoui",
  qualite: "Directeur Général",
  rib: "045 780 0123456789012 34",
  banque: "Attijariwafa Bank — Agence Casa Twin Center",
  effectif: { cadres: 22, employes: 48, ouvriers: 130, total: 200 },
  tfp: 180000,
  etudeGIAC: false,
  plafondCSF: 180000,
  budgetAlpha: 40000,
  exercice: 2026,
};

// --- USERS / PROFILES ---
const USERS = {
  rh:   { id: "u-rh",   name: "Fatima Benali",   role: "rh",   title: "Responsable Formation", avatar: "FB" },
  n1:   { id: "u-n1",   name: "Karim Alaoui",    role: "n1",   title: "Directeur Général",     avatar: "KA" },
  giac: { id: "u-giac", name: "Hicham El Idrissi", role: "giac", title: "Auditeur GIAC",       avatar: "HE", organism: "GIAC BTP & Industrie" },
};

// --- ORGANISMES DE FORMATION (OCF) ---
const OCFs = [
  { id: "ocf-1", raisonSociale: "FormaPlus Maroc",          cnss: "892310", formeJuridique: "SARL",   dateCreation: "2012-04-18", gerant: "M. Rachid Bennis", adresse: "Bd Zerktouni, Casablanca", tel: "+212 522 30 12 45", email: "contact@formaplus.ma", patente: "41820", if: "4019223", rc: "392847", domaines: ["Sécurité au travail","Soft skills","Management"], moyens: "Salles équipées Casa & Rabat, supports pédagogiques numériques" },
  { id: "ocf-2", raisonSociale: "Cabinet Argan Consulting", cnss: "674219", formeJuridique: "SA",     dateCreation: "2008-09-02", gerant: "Mme. Samira Lahlou", adresse: "Bd Abdelmoumen, Casablanca", tel: "+212 522 94 33 18", email: "argan@argan.ma", patente: "29845", if: "2194820", rc: "187392", domaines: ["Bureautique","Gestion","Finance"], moyens: "Laboratoires informatiques, plateformes e-learning" },
  { id: "ocf-3", raisonSociale: "SafeWeld Academy",         cnss: "512038", formeJuridique: "SARL",   dateCreation: "2015-06-30", gerant: "M. Mohamed Tazi", adresse: "Technopôle Nouaceur, Casablanca", tel: "+212 522 53 90 01", email: "info@safeweld.ma", patente: "38210", if: "3892011", rc: "412837", domaines: ["Soudure industrielle","Habilitation électrique","HSE"], moyens: "Ateliers de soudure, simulateurs, EPI complets" },
  { id: "ocf-4", raisonSociale: "Institut Alphabétisation Avenir", cnss: "302918", formeJuridique: "Association", dateCreation: "2010-01-15", gerant: "Mme. Latifa Oufkir", adresse: "Quartier Oulfa, Casablanca", tel: "+212 522 88 41 02", email: "avenir@alpha-avenir.ma", patente: "—", if: "1091382", rc: "091823", domaines: ["Alphabétisation fonctionnelle","Français professionnel"], moyens: "Formateurs spécialisés, manuels adaptés" },
];

// --- BUSINESS RULES ---
// Reimbursement rates and caps
const RULES = {
  rates: {
    "FP-externe":   { rate: 0.70, capType: "none" },
    "FNP-externe":  { rate: 0.40, capType: "none" },
    "FP-interne":   { rate: 0.70, capType: "daily-intervenant", capValue: 800 }, // 800 DH/jour/intervenant
    "FNP-interne":  { rate: 0.40, capType: "daily-intervenant", capValue: 800 },
    "Alpha":        { rate: 0.80, capType: "per-participant", capValue: 3000 },  // 3 000 DH/personne
    "LD":           { rate: 0.70, capType: "per-participant", capValue: 50000 }, // 50 000 DH/personne
  },
  delays: {
    FP: 10,    // AP = Action Planifiée
    FNP: 5,    // ANP = Action Non Planifiée
    Alpha: 5,
    LD: 10,
  },
  deadlines: {
    FP: { month: 6, day: 30 },   // 30 juin — AP
    FNP: { month: 12, day: 31 }, // 31 décembre — ANP
    Alpha: { month: 12, day: 31 },
    LD: { month: 6, day: 30 },
  },
  cancelMinHours: 24,
  // FP internes capped at 30% of total financial participation globally
  internFPShareCap: 0.30,
};

// Compute TFP plafond
function computePlafond(tfp, giacStudy) {
  if (tfp >= 3_000_000) return { blocked: true, value: 0, message: "Grand Établissement — hors champ CSF (TFP ≥ 3 000 000 DH)." };
  if (tfp >= 200_000)   return { blocked: false, value: tfp };
  if (tfp >= 20_000)    return { blocked: false, value: giacStudy ? 300_000 : 200_000 };
  if (tfp >  0)         return { blocked: false, value: tfp * (giacStudy ? 15 : 10) };
  return { blocked: true, value: 0, message: "TFP déclarée invalide." };
}

// Compute estimated reimbursement for a given formation draft
// Params: type ('FP'|'FNP'|'Alpha'|'LD'), realisee ('externe'|'interne'), cost, participants, days, intervenants
function computeReimbursement({ type, realisee, cost, participants, days, intervenants }) {
  const key = (type === "Alpha" || type === "LD") ? type : `${type}-${realisee}`;
  const rule = RULES.rates[key];
  if (!rule) return { base: 0, rate: 0, cap: null, amount: 0, net: cost || 0, capApplied: false, ruleKey: null };

  const rate = rule.rate;
  let base = Number(cost || 0);
  let capApplied = false;
  let capInfo = null;

  if (rule.capType === "daily-intervenant") {
    const ceiling = rule.capValue * Number(days || 0) * Number(intervenants || 1);
    capInfo = { label: `Plafond: 800 DH × ${days || 0} j × ${intervenants || 1} intervenant(s) = ${ceiling.toLocaleString("fr-FR")} DH` };
    if (ceiling < base) { base = ceiling; capApplied = true; }
  } else if (rule.capType === "per-participant") {
    const ceiling = rule.capValue * Number(participants || 0);
    capInfo = { label: `Plafond: ${rule.capValue.toLocaleString("fr-FR")} DH × ${participants || 0} pers. = ${ceiling.toLocaleString("fr-FR")} DH` };
    if (ceiling < base) { base = ceiling; capApplied = true; }
  }

  const amount = Math.round(base * rate);
  const net = Math.max(0, Math.round((cost || 0) - amount));
  return { base, rate, cap: capInfo, amount, net, capApplied, ruleKey: key };
}

// Delay / deadline check for the planned deposit date
function checkDelayAndDeadline(type, plannedDepositDate, startDate) {
  const errors = [];
  if (!plannedDepositDate) return errors;
  const d = new Date(plannedDepositDate);
  if (isNaN(d)) return errors;

  // Delay (days from TODAY)
  const delayDays = Math.ceil((d - TODAY) / (1000*60*60*24));
  const minDelay = RULES.delays[type] || 10;
  if (delayDays < minDelay) {
    errors.push({
      level: "red",
      title: "Délai non respecté",
      body: `Le dépôt est prévu dans ${delayDays} jours calendaires. Minimum requis : ${minDelay} jours pour une ${type === "FP" ? "Action Planifiée" : type === "FNP" ? "Action Non Planifiée" : type === "Alpha" ? "action Alpha" : "Longue Durée"}.`,
      blocks: true,
    });
  }

  // Hard deadline
  const dl = RULES.deadlines[type];
  if (dl) {
    const y = d.getFullYear();
    const limit = new Date(y, dl.month - 1, dl.day, 23, 59, 59);
    if (d > limit) {
      errors.push({
        level: "red",
        title: type === "FP"
          ? "Date limite AP dépassée"
          : type === "Alpha"
          ? "Date limite Alphabétisation dépassée"
          : type === "LD"
          ? "Date limite Longue Durée dépassée"
          : "Date limite ANP dépassée",
        body: type === "FP"
          ? "Les Actions Planifiées doivent être déposées avant le 30 juin."
          : type === "LD"
          ? "La Longue Durée suit le régime AP — dépôt avant le 30 juin."
          : "Le dépôt doit intervenir avant le 31 décembre de l'année N.",
        blocks: true,
      });
    }
  }

  return errors;
}

// --- PRELOADED TRAINING ACTIONS ---
// status: a-deposer | depose | contrat | en-cours | terminee | annulee | tardive
const STATUS_META = {
  "a-deposer":  { label: "À déposer",                class: "st-a-deposer" },
  "depose":     { label: "Dossier déposé",           class: "st-depose" },
  "contrat":    { label: "Contrat reçu",             class: "st-contrat" },
  "en-cours":   { label: "En cours",                 class: "st-en-cours" },
  "terminee":   { label: "Terminée",                 class: "st-terminee" },
  "dossier-fin":{ label: "Dossier financier à déposer", class: "st-depose" },
  "remboursee": { label: "Remboursée",               class: "st-terminee" },
  "annulee":    { label: "Annulée",                  class: "st-annulee" },
  "tardive":    { label: "Annulation tardive",       class: "st-tardive" },
};

const TRAININGS = [
  {
    id: "fm-01",
    theme: "Formation SST — Sécurité au Travail",
    type: "FP", realisee: "externe",
    ocfId: "ocf-1",
    domaine: "Sécurité et conditions de travail",
    participants: 12,
    cadres: 2, employes: 4, ouvriers: 6,
    jours: 2, coutHT: 18000,
    dateDebut: "2026-02-10", dateFin: "2026-02-11",
    dateDepotPrevue: "2026-01-25",
    dateDepotReel: "2026-01-24",
    dateContratRecu: "2026-02-01",
    status: "terminee", // needs dossier financier
    needsFinancier: true,
    remboursementEstime: 12600,
    actualMontantPaye: 18000,
    checklist: { m4: true, m5: true, f4: false, m6: false, paiement: true },
    historique: [
      { when: "2026-01-20", what: "Action saisie par F. Benali" },
      { when: "2026-01-24", what: "Dossier technique déposé à l'UGCSF" },
      { when: "2026-02-01", what: "Contrat de formation reçu — OFPPT" },
      { when: "2026-02-11", what: "Formation réalisée — 12 bénéficiaires présents" },
    ],
  },
  {
    id: "fm-02",
    theme: "Management de Proximité",
    type: "FP", realisee: "interne",
    animateur: "M. Youssef Bennani (Chef de Service RH)",
    domaine: "Management et leadership",
    participants: 8, cadres: 5, employes: 3, ouvriers: 0,
    jours: 3, coutJournalier: 800, intervenants: 1,
    coutHT: 2400, // 800 × 3 × 1
    dateDebut: "2026-04-14", dateFin: "2026-04-16",
    dateDepotPrevue: "2026-03-30",
    dateDepotReel: "2026-03-30",
    dateContratRecu: "2026-04-05",
    status: "en-cours",
    remboursementEstime: 1680,
    actualMontantPaye: null,
    checklist: { m4: false, m5: false, f4: false, m6: false, paiement: false },
    historique: [
      { when: "2026-03-25", what: "Action saisie par F. Benali" },
      { when: "2026-03-30", what: "Dossier technique déposé" },
      { when: "2026-04-05", what: "Contrat de formation reçu" },
      { when: "2026-04-14", what: "Démarrage de la formation" },
    ],
  },
  {
    id: "fm-03",
    theme: "Excel Avancé pour Gestionnaires",
    type: "FNP", realisee: "externe",
    ocfId: "ocf-2",
    domaine: "Bureautique et outils numériques",
    participants: 6, cadres: 4, employes: 2, ouvriers: 0,
    jours: 3, coutHT: 9600,
    dateDebut: "2026-03-03", dateFin: "2026-03-05",
    dateDepotPrevue: "2026-02-18",
    dateDepotReel: "2026-02-18",
    dateContratRecu: null, // J+64 — ALERT
    status: "contrat-en-attente",
    remboursementEstime: 3840,
    actualMontantPaye: null,
    checklist: { m4: false, m5: false, f4: false, m6: false, paiement: false },
    historique: [
      { when: "2026-02-15", what: "Action saisie" },
      { when: "2026-02-18", what: "Dossier technique déposé" },
    ],
    alerteUGCSF: true, // J+60 elapsed
  },
  {
    id: "fm-04",
    theme: "Formation Soudure TIG",
    type: "LD", realisee: "externe",
    ocfId: "ocf-3",
    domaine: "Métiers de l'industrie",
    participants: 2, cadres: 0, employes: 0, ouvriers: 2,
    jours: 45, coutHT: 85000,
    dateDebut: "2026-05-15", dateFin: "2026-07-30",
    dateDepotPrevue: "2026-04-10",
    dateDepotReel: "2026-04-10",
    dateContratRecu: "2026-04-20",
    status: "depose",
    remboursementEstime: 70000, // 50 000 × 2 pers × 70%
    actualMontantPaye: null,
    checklist: { m4: false, m5: false, f4: false, m6: false, paiement: false },
    historique: [
      { when: "2026-04-05", what: "Action saisie" },
      { when: "2026-04-10", what: "Dossier technique déposé" },
      { when: "2026-04-20", what: "Contrat reçu — OFPPT" },
    ],
  },
  {
    id: "fm-05",
    theme: "Alphabétisation Fonctionnelle — Opérateurs de Production",
    type: "Alpha", realisee: "externe",
    ocfId: "ocf-4",
    domaine: "Alphabétisation fonctionnelle",
    participants: 20, cadres: 0, employes: 0, ouvriers: 20,
    jours: 60, coutHT: 70000, // 3 500 DH/tête
    dateDebut: "2025-11-02", dateFin: "2026-03-10",
    dateDepotPrevue: "2025-10-20",
    dateDepotReel: "2025-10-20",
    dateContratRecu: "2025-10-28",
    status: "terminee",
    needsFinancier: true,
    budgetAlpha: true,
    remboursementEstime: 48000, // 3 000 × 20 × 80%
    actualMontantPaye: 70000,
    checklist: { m4: true, m5: true, f4: true, m6: true, paiement: true },
    historique: [
      { when: "2025-10-15", what: "Action saisie" },
      { when: "2025-10-20", what: "Dossier technique déposé" },
      { when: "2025-10-28", what: "Contrat reçu" },
      { when: "2026-03-10", what: "Formation réalisée — 18/20 présents" },
    ],
  },
  {
    id: "fm-06",
    theme: "Atelier Lean Manufacturing",
    type: "FP", realisee: "externe",
    ocfId: "ocf-2",
    domaine: "Production industrielle",
    participants: 10, cadres: 2, employes: 8, ouvriers: 0,
    jours: 2, coutHT: 14000,
    dateDebut: "2026-03-20", dateFin: "2026-03-21",
    dateDepotPrevue: "2026-02-25",
    dateDepotReel: null,
    status: "annulee",
    remboursementEstime: 0,
    historique: [
      { when: "2026-02-20", what: "Action saisie" },
      { when: "2026-03-15", what: "Annulation — Modèle 3 déposé à l'UGCSF" },
    ],
  },
  {
    id: "fm-07",
    theme: "Formation Habilitation Électrique BT",
    type: "FP", realisee: "externe",
    ocfId: "ocf-3",
    domaine: "Sécurité et habilitations réglementaires",
    participants: 5, cadres: 0, employes: 2, ouvriers: 3,
    jours: 2, coutHT: 12000,
    dateDebut: "2026-05-12", dateFin: "2026-05-13",
    dateDepotPrevue: "2026-05-02", // J-9 from today → delay bloquant (>10j required, only 9)
    dateDepotReel: null,
    status: "a-deposer",
    remboursementEstime: 8400,
    historique: [
      { when: "2026-04-21", what: "Action saisie" },
    ],
    alerteDelai: true,
  },
  {
    id: "fm-08",
    theme: "Gestion de Projet Agile",
    type: "FNP", realisee: "externe",
    ocfId: "ocf-1",
    domaine: "Management de projets",
    participants: 4, cadres: 4, employes: 0, ouvriers: 0,
    jours: 3, coutHT: 8400,
    dateDebut: "2026-06-08", dateFin: "2026-06-10",
    dateDepotPrevue: "2026-05-30",
    status: "a-saisir",
    remboursementEstime: 3360,
    historique: [ { when: "2026-04-22", what: "Brouillon — en cours de saisie" } ],
  },
];

// --- NOTIFICATIONS ---
const NOTIFICATIONS = [
  { id: "n1", sev: "red",    msg: "URGENT — Dossier technique AP « Formation Habilitation Électrique BT » doit être déposé dans 9 jours (minimum légal 10j).", when: "Il y a 10 min", read: false, profile: ["rh","n1"] },
  { id: "n2", sev: "red",    msg: "CRITIQUE — Contrat de formation non reçu depuis 64 jours (dossier: Excel Avancé pour Gestionnaires). Contactez l'UGCSF.", when: "Il y a 2 h", read: false, profile: ["rh","n1"] },
  { id: "n3", sev: "orange", msg: "Budget CSF consommé à 37% du plafond — 68 400 DH engagés sur 180 000 DH.", when: "Hier", read: false, profile: ["rh","n1"] },
  { id: "n4", sev: "orange", msg: "Plafond FP internes : 4,4% atteint — marge confortable pour les prochaines actions internes.", when: "Hier", read: true, profile: ["rh"] },
  { id: "n5", sev: "yellow", msg: "Formation « Formation SST — Sécurité au Travail » terminée depuis 71 jours — dossier financier non initié.", when: "Il y a 2 j", read: false, profile: ["rh"] },
  { id: "n6", sev: "green",  msg: "Contrat de formation reçu : « Formation Soudure TIG » — Statut mis à jour.", when: "Il y a 3 j", read: true, profile: ["rh","n1"] },
  { id: "n7", sev: "blue",   msg: "[GIAC] Validation reçue : votre dossier d'ingénierie 2026 a été approuvé par GIAC BTP & Industrie.", when: "Il y a 5 j", read: true, profile: ["rh","n1"] },
  { id: "n8", sev: "yellow", msg: "3 actions approchent de la date limite AP (30 juin) — pensez à anticiper le dépôt.", when: "Il y a 6 j", read: true, profile: ["rh","n1"] },
];

// --- GIAC PENDING DOSSIERS ---
const GIAC_DOSSIERS = [
  {
    id: "giac-d1",
    company: "Maroc Industrie SA",
    secteur: "Industrie / BTP",
    type: "Plan de formation 2026",
    submitted: "2026-04-10",
    status: "pending",
    plan: { budget: 180000, actions: 8, tfp: 180000 },
    ingenierie: "Étude de diagnostic stratégique réalisée en interne — 3 axes prioritaires : sécurité industrielle, transition numérique, management de proximité. 8 actions planifiées sur 2026 pour un budget de 180 000 DH aligné sur le plafond CSF.",
    ocfs: ["FormaPlus Maroc", "Cabinet Argan Consulting", "SafeWeld Academy"],
    contact: "Mme. Fatima Benali — rh@maroc-industrie.ma",
  },
  {
    id: "giac-d2",
    company: "Atlas Logistique SARL",
    secteur: "Transport & Logistique",
    type: "Ingénierie de formation groupée",
    submitted: "2026-04-12",
    status: "pending",
    plan: { budget: 120000, actions: 5, tfp: 95000 },
    ingenierie: "Formation groupée inter-entreprises sur la conduite économique et la sécurité routière. 5 actions sur le T2–T3 2026. Public: chauffeurs poids lourds et agents logistiques.",
    ocfs: ["Institut Sécurité Routière Maroc"],
    contact: "M. Abderrahim Saidi — formation@atlas-logistique.ma",
  },
  {
    id: "giac-d3",
    company: "Cosmetica Orient SA",
    secteur: "Industrie chimique / Cosmétique",
    type: "Plan de formation 2026 + Étude stratégique",
    submitted: "2026-04-18",
    status: "pending",
    plan: { budget: 280000, actions: 11, tfp: 240000 },
    ingenierie: "Étude GIAC stratégique incluse en amont — élargissement du plafond à 360 000 DH sollicité. 11 actions alignées sur la montée en compétence R&D et qualité cosmétique.",
    ocfs: ["FormaPlus Maroc", "Cabinet Argan Consulting", "Institut Pasteur Maroc"],
    contact: "Mme. Nadia Cherkaoui — n.cherkaoui@cosmetica-orient.ma",
  },
];

const GIAC_HISTORY = [
  { when: "2026-03-28", company: "SomaBat Constructions", decision: "Validé", motif: "Dossier conforme — ingénierie solide", agent: "Hicham El Idrissi" },
  { when: "2026-03-20", company: "Textile Riad SA", decision: "Complément demandé", motif: "Clarifier la répartition des bénéficiaires par CSP", agent: "Hicham El Idrissi" },
  { when: "2026-03-11", company: "AgroFood Maroc", decision: "Validé", motif: "Conforme — dépôt prioritaire recommandé", agent: "Hicham El Idrissi" },
  { when: "2026-02-24", company: "Casa Tech Services", decision: "Refusé", motif: "Ingénierie incomplète — absence de diagnostic préalable", agent: "Hicham El Idrissi" },
];

// --- Sample participants for Modèle 5 ---
const SAMPLE_PARTICIPANTS = [
  { prenomNom: "Youssef EL AMRANI",   cin: "BE458712", cnss: "234567890", csp: "E" },
  { prenomNom: "Samira BOUKHRISS",    cin: "BK712903", cnss: "234567891", csp: "C" },
  { prenomNom: "Hassan OUAZZANI",     cin: "BA290184", cnss: "234567892", csp: "O" },
  { prenomNom: "Fatima ZOUHAIRI",     cin: "BH672845", cnss: "234567893", csp: "E" },
  { prenomNom: "Mohammed BENJELLOUN", cin: "BJ109382", cnss: "234567894", csp: "O" },
];

// --- helpers ---
const fmtDH = (n) => (n == null || isNaN(n)) ? "—" : Number(n).toLocaleString("fr-FR") + " DH";
const fmtDate = (d) => {
  if (!d) return "—";
  const x = typeof d === "string" ? new Date(d) : d;
  if (isNaN(x)) return "—";
  return x.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
};
const daysBetween = (a, b) => Math.ceil((new Date(b) - new Date(a)) / (1000*60*60*24));

// Total engaged and consumed
function computeBudgets() {
  const rows = TRAININGS.filter(t => t.status !== "annulee" && t.status !== "a-saisir");
  const mainEngaged = rows
    .filter(t => !t.budgetAlpha)
    .reduce((s, t) => s + (t.remboursementEstime || 0), 0);
  const alphaEngaged = rows
    .filter(t => t.budgetAlpha)
    .reduce((s, t) => s + (t.remboursementEstime || 0), 0);
  const internalFP = rows
    .filter(t => t.type === "FP" && t.realisee === "interne")
    .reduce((s, t) => s + (t.remboursementEstime || 0), 0);
  return {
    main:  { consumed: mainEngaged,  total: COMPANY.plafondCSF,  pct: Math.min(100, Math.round(mainEngaged/COMPANY.plafondCSF*100)) },
    alpha: { consumed: alphaEngaged, total: COMPANY.budgetAlpha, pct: Math.min(100, Math.round(alphaEngaged/COMPANY.budgetAlpha*100)) },
    internalFP: {
      consumed: internalFP,
      total: Math.round(COMPANY.plafondCSF * RULES.internFPShareCap),
      pct: Math.min(100, Math.round(internalFP / (COMPANY.plafondCSF * RULES.internFPShareCap) * 100)),
    },
  };
}

function statusCounts() {
  const counts = { "a-deposer":0, "depose":0, "contrat":0, "en-cours":0, "terminee":0, "annulee":0 };
  TRAININGS.forEach(t => {
    const key = t.status === "contrat-en-attente" ? "depose"
              : t.status === "dossier-fin" ? "terminee"
              : t.status === "tardive" ? "annulee"
              : t.status === "a-saisir" ? "a-deposer"
              : t.status;
    if (counts[key] != null) counts[key]++;
  });
  return counts;
}

// Export so app.js can import (global scope)
window.CSF = {
  TODAY, YEAR_N, COMPANY, USERS, OCFs, RULES, STATUS_META,
  TRAININGS, NOTIFICATIONS, GIAC_DOSSIERS, GIAC_HISTORY, SAMPLE_PARTICIPANTS,
  computePlafond, computeReimbursement, checkDelayAndDeadline,
  fmtDH, fmtDate, daysBetween, computeBudgets, statusCounts,
};
