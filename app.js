/* ============================================
   e-CSF Manager — Application
   Vanilla JS SPA. Hash-based routing. Event delegation.
   ============================================ */
(function () {
  const {
    TODAY, COMPANY, USERS, OCFs, RULES, STATUS_META,
    TRAININGS, NOTIFICATIONS, GIAC_DOSSIERS, GIAC_HISTORY, SAMPLE_PARTICIPANTS,
    computeReimbursement, checkDelayAndDeadline,
    fmtDH, fmtDate, daysBetween, computeBudgets, statusCounts,
  } = window.CSF;

  const LOGO_DARK = "https://msolutionsai.github.io/e-csf-manager/img/logo-dark.png";

  // ---------------- STATE ----------------
  const state = {
    profile: null,                 // 'rh' | 'n1' | 'giac' | null
    route: "#/login",
    notifOpen: false,
    modal: null,                   // { type, data }
    trainings: TRAININGS.map(t => ({ ...t, checklist: { ...(t.checklist || {}) } })),
    notifications: NOTIFICATIONS.map(n => ({ ...n })),
    giacDossiers: GIAC_DOSSIERS.map(d => ({ ...d })),
    giacHistory: [...GIAC_HISTORY],
    newFormation: defaultNewFormation(),
    currentFormulaire: "F1",
    formationTab: "details",
    giacTab: "pending",
  };

  function defaultNewFormation() {
    return {
      type: "FP",
      realisee: "externe",
      theme: "",
      ocfId: OCFs[0].id,
      animateur: "",
      participants: 10,
      cadres: 0, employes: 0, ouvriers: 0,
      jours: 2,
      coutHT: 14000,
      coutJournalier: 800,
      intervenants: 1,
      dateDebut: "",
      dateFin: "",
      dateDepotPrevue: "",
      domaine: "",
    };
  }

  // ---------------- ROUTER ----------------
  function parseRoute() {
    const h = location.hash || "#/login";
    state.route = h;
    return h;
  }
  window.addEventListener("hashchange", () => { parseRoute(); render(); });

  function navigate(h) {
    if (location.hash === h) { render(); return; }
    location.hash = h;
  }

  // ---------------- TOASTS ----------------
  function toast(title, sub, type = "success") {
    const root = document.getElementById("toast-root");
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.innerHTML = `<div class="flex-1"><div class="title">${title}</div>${sub ? `<div class="sub">${sub}</div>` : ""}</div>`;
    root.appendChild(el);
    setTimeout(() => {
      el.style.transition = "opacity 300ms ease, transform 300ms ease";
      el.style.opacity = "0"; el.style.transform = "translateX(40px)";
      setTimeout(() => el.remove(), 320);
    }, 3600);
  }

  // ---------------- MODAL ----------------
  function openModal(modal) { state.modal = modal; render(); }
  function closeModal() { state.modal = null; render(); }

  // ---------------- ICONS (inline SVG) ----------------
  const ICONS = {
    home:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12 12 3l9 9"/><path d="M5 10v10h14V10"/></svg>`,
    list:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>`,
    form:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>`,
    money:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 6H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H7"/></svg>`,
    export: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 8 5-5 5 5"/><path d="M5 21h14"/></svg>`,
    bell:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>`,
    risk:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>`,
    chart:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l4-6 3 3 5-7"/></svg>`,
    check:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m20 6-11 11L4 12"/></svg>`,
    clock:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
    search: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg>`,
    plus:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>`,
    logout: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>`,
    dossier: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h5l2 3h9v13H4z"/></svg>`,
    history: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 9 9"/><path d="M3 3v6h6"/><path d="M12 7v5l3 2"/></svg>`,
  };

  // ---------------- RENDER ROOT ----------------
  function render() {
    parseRoute();
    const root = document.getElementById("root");

    if (!state.profile || state.route === "#/login") {
      root.innerHTML = renderLogin();
    } else {
      root.innerHTML = renderApp();
    }

    renderModalRoot();
    attachEvents();
  }

  // ---------------- LOGIN ----------------
  function renderLogin() {
    return `
      <div class="login-shell">
        <div class="login-card">
          <div class="login-logo"><img src="${LOGO_DARK}" alt="e-CSF Manager" /></div>
          <h1>Connexion</h1>
          <div class="subtitle">Cockpit de conformité CSF — Exercice ${COMPANY.exercice}</div>
          <div class="field">
            <label>Email professionnel</label>
            <input class="input" type="email" placeholder="prenom.nom@entreprise.ma" value="fatima.benali@maroc-industrie.ma" />
          </div>
          <div class="field">
            <label>Mot de passe</label>
            <input class="input" type="password" placeholder="••••••••••" value="••••••••••" />
          </div>
          <button class="btn btn-primary btn-block btn-lg" data-action="login" data-profile="rh">Se connecter</button>

          <div class="quick-login">
            <div class="label">Connexion rapide — démo</div>
            <button class="btn btn-ghost btn-block" data-action="login" data-profile="rh">
              👤 Se connecter en tant que RH (Fatima Benali)
            </button>
            <button class="btn btn-ghost btn-block" data-action="login" data-profile="n1">
              🎯 Se connecter en tant que Superviseur (Karim Alaoui)
            </button>
            <button class="btn btn-ghost btn-block" data-action="login" data-profile="giac">
              🛡️ Se connecter en tant qu'Auditeur GIAC (Hicham El Idrissi)
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ---------------- APP SHELL ----------------
  function renderApp() {
    return `
      <div class="app-shell ${state.profile}">
        ${renderSidebar()}
        <div class="main">
          ${renderTopbar()}
          <div class="content">${renderRoute()}</div>
        </div>
      </div>
      ${renderNotifPanel()}
    `;
  }

  function renderSidebar() {
    const p = state.profile;
    const u = USERS[p];
    const unreadCount = state.notifications.filter(n => !n.read && n.profile.includes(p)).length;

    const navRH = [
      { h: "#/dashboard",       icon: ICONS.home,    label: "Tableau de bord" },
      { h: "#/formations",      icon: ICONS.list,    label: "Actions de formation" },
      { h: "#/formulaires",     icon: ICONS.form,    label: "Formulaires OFPPT" },
      { h: "#/remboursement",   icon: ICONS.money,   label: "Préparation remboursement" },
      { h: "#/export",          icon: ICONS.export,  label: "Export" },
      { h: "#/notifications",   icon: ICONS.bell,    label: "Notifications", badge: unreadCount },
    ];
    const navN1 = [
      { h: "#/dashboard",       icon: ICONS.home,    label: "Vue d'ensemble" },
      { h: "#/formations",      icon: ICONS.chart,   label: "Suivi budgétaire" },
      { h: "#/risques",         icon: ICONS.risk,    label: "Actions à risque" },
      { h: "#/export",          icon: ICONS.export,  label: "Export" },
    ];
    const navGIAC = [
      { h: "#/giac",             icon: ICONS.dossier, label: "Dossiers en attente" },
      { h: "#/giac/done",        icon: ICONS.check,   label: "Dossiers traités" },
      { h: "#/giac/history",     icon: ICONS.history, label: "Historique des décisions" },
    ];
    const nav = p === "rh" ? navRH : p === "n1" ? navN1 : navGIAC;

    const roleLabel = p === "rh" ? "Collaborateur RH" : p === "n1" ? "N+1 / Superviseur" : "Auditeur GIAC";

    return `
      <aside class="sidebar">
        <div class="sidebar-header">
          <img src="${LOGO_DARK}" alt="e-CSF Manager" />
        </div>
        <div class="sidebar-profile">
          <div class="role">${roleLabel}</div>
          <div class="name">${u.name}</div>
          <div class="company">${p === "giac" ? u.organism : COMPANY.raisonSociale}</div>
        </div>
        ${nav.map(n => `
          <div class="nav-item ${state.route.startsWith(n.h) ? "active" : ""}" data-nav="${n.h}">
            <span class="icon">${n.icon}</span>
            <span class="label">${n.label}</span>
            ${n.badge ? `<span class="badge">${n.badge}</span>` : ""}
          </div>`).join("")}
        <div class="sidebar-footer">
          e-CSF Manager · v0.9 β<br/>© 2026 msolutionsai
        </div>
      </aside>
    `;
  }

  function renderTopbar() {
    const crumbs = getCrumbs();
    const p = state.profile;
    const unread = state.notifications.filter(n => !n.read && n.profile.includes(p)).length;
    return `
      <div class="topbar">
        <div class="crumbs">${crumbs}</div>
        <div class="topbar-actions">
          <div class="profile-switcher" role="tablist">
            <button class="${p==='rh'?'active':''}" data-switch="rh" data-p="rh">RH</button>
            <button class="${p==='n1'?'active':''}" data-switch="n1" data-p="n1">N+1</button>
            <button class="${p==='giac'?'active':''}" data-switch="giac" data-p="giac">GIAC</button>
          </div>
          <button class="icon-btn" data-action="toggle-notif" title="Notifications">
            ${ICONS.bell}${unread ? `<span class="dot"></span>` : ""}
          </button>
          <button class="icon-btn" data-action="logout" title="Déconnexion">${ICONS.logout}</button>
        </div>
      </div>
    `;
  }

  function getCrumbs() {
    const r = state.route;
    if (r === "#/dashboard") return state.profile === "rh" ? `<strong>Tableau de bord</strong>` : state.profile === "n1" ? `<strong>Vue d'ensemble</strong>` : "";
    if (r === "#/formations") return `<strong>${state.profile === "n1" ? "Suivi budgétaire" : "Actions de formation"}</strong>`;
    if (r === "#/formations/new") return `Actions de formation <span style="margin:0 8px">›</span> <strong>Nouvelle action</strong>`;
    if (r.startsWith("#/formations/")) {
      const id = r.split("/")[2];
      const t = state.trainings.find(x => x.id === id);
      return `Actions de formation <span style="margin:0 8px">›</span> <strong>${t ? t.theme : id}</strong>`;
    }
    if (r === "#/formulaires") return `<strong>Formulaires OFPPT</strong>`;
    if (r === "#/remboursement") return `<strong>Préparation remboursement</strong>`;
    if (r === "#/export") return `<strong>Export</strong>`;
    if (r === "#/notifications") return `<strong>Notifications</strong>`;
    if (r === "#/risques") return `<strong>Actions à risque</strong>`;
    if (r.startsWith("#/giac")) {
      if (r === "#/giac/done") return `Espace GIAC <span style="margin:0 8px">›</span> <strong>Dossiers traités</strong>`;
      if (r === "#/giac/history") return `Espace GIAC <span style="margin:0 8px">›</span> <strong>Historique des décisions</strong>`;
      return `<strong>Espace GIAC — Dossiers en attente</strong>`;
    }
    return "";
  }

  // ---------------- ROUTE DISPATCH ----------------
  function renderRoute() {
    const r = state.route;
    const p = state.profile;

    // Default route per profile
    if (r === "#/" || r === "" || r === "#/login") {
      const h = p === "giac" ? "#/giac" : "#/dashboard";
      setTimeout(() => navigate(h), 0);
      return "";
    }

    // GIAC profile is locked to its routes
    if (p === "giac" && !r.startsWith("#/giac")) {
      setTimeout(() => navigate("#/giac"), 0);
      return "";
    }

    if (r === "#/dashboard")      return p === "n1" ? renderDashboardN1() : renderDashboardRH();
    if (r === "#/formations")     return p === "n1" ? renderSuiviBudgetaire() : renderFormationsList();
    if (r === "#/formations/new") return renderNewFormation();
    if (r.startsWith("#/formations/")) return renderFormationDetail(r.split("/")[2]);
    if (r === "#/formulaires")    return renderFormulairesPage();
    if (r === "#/remboursement")  return renderRemboursementPage();
    if (r === "#/export")         return renderExportPage();
    if (r === "#/notifications")  return renderNotificationsPage();
    if (r === "#/risques")        return renderRisquesPage();
    if (r === "#/giac")           return renderGIACPending();
    if (r === "#/giac/done")      return renderGIACDone();
    if (r === "#/giac/history")   return renderGIACHistory();

    return `<div class="empty"><div class="big">🔍</div><h3>Page introuvable</h3><p class="muted">La route ${r} n'existe pas.</p></div>`;
  }

  // ============================================
  // DASHBOARD — RH
  // ============================================
  function renderDashboardRH() {
    const b = computeBudgets();
    const c = statusCounts();
    const upcoming = state.trainings
      .filter(t => t.dateDepotPrevue && new Date(t.dateDepotPrevue) >= TODAY)
      .sort((a,b) => new Date(a.dateDepotPrevue) - new Date(b.dateDepotPrevue))
      .slice(0, 5);

    const activeAlerts = [
      state.trainings.find(t => t.alerteDelai) && {
        level: "red", title: "Délai non respecté — AP",
        body: `« Formation Habilitation Électrique BT » : dépôt prévu dans 9 jours. Minimum requis : 10 jours calendaires.`,
      },
      state.trainings.find(t => t.alerteUGCSF) && {
        level: "red", title: "Contrat non reçu — J+64",
        body: `« Excel Avancé pour Gestionnaires » : 64 jours écoulés depuis le dépôt sans retour OFPPT. Contactez l'UGCSF.`,
      },
      state.trainings.find(t => t.needsFinancier && t.status === "terminee") && {
        level: "orange", title: "Dossier financier à constituer",
        body: `« Formation SST » — Terminée depuis 71 jours, dossier financier non initié.`,
      },
      { level: "green", title: "Plan 2026 validé par GIAC BTP & Industrie", body: "Ingénierie de formation approuvée le 18 avril 2026." },
    ].filter(Boolean);

    return `
      <div class="hero-head">
        <div>
          <h1>${COMPANY.raisonSociale} — Exercice ${COMPANY.exercice}</h1>
          <div class="sub">${COMPANY.secteur} · ${COMPANY.effectif.total} collaborateurs · TFP ${fmtDH(COMPANY.tfp)}</div>
        </div>
        <div class="flex gap-3 items-center">
          <span class="pill">● Plan validé GIAC</span>
          <button class="btn btn-primary" data-action="nav" data-href="#/formations/new">${ICONS.plus} Nouvelle action de formation</button>
          <button class="btn btn-ghost" data-action="nav" data-href="#/remboursement">Préparer dossier remboursement</button>
        </div>
      </div>

      <div class="grid grid-2 mb-6">
        ${gauge("Plafond CSF principal", b.main, "PRINCIPAL", true)}
        ${gauge("Budget Alpha (hors plafond)", b.alpha, "ALPHA", false)}
      </div>

      <div class="grid grid-2 mb-6">
        <div class="card">
          <div class="card-head">
            <h3>Plafond formations internes</h3>
            <span class="chip">Max ${Math.round(RULES.internFPShareCap*100)}% de la participation globale</span>
          </div>
          <div class="gauge-values">
            <div class="consumed">${fmtDH(b.internalFP.consumed)}</div>
            <div class="total">/ ${fmtDH(b.internalFP.total)}</div>
          </div>
          <div class="gauge-bar"><div class="gauge-fill" style="width:${b.internalFP.pct}%"></div></div>
          <div class="gauge-foot">
            <span>FP internes planifiées</span>
            <span class="pct">${b.internalFP.pct}%</span>
          </div>
        </div>

        <div class="card">
          <div class="card-head">
            <h3>Statuts des actions</h3>
            <span class="chip">${state.trainings.length} actions totales</span>
          </div>
          <div class="grid grid-3" style="gap:10px">
            ${kpi("À déposer",        c["a-deposer"],  "blue")}
            ${kpi("Dossier déposé",   c["depose"],     "orange")}
            ${kpi("Contrat reçu",     c["contrat"],    "teal")}
            ${kpi("En cours",         c["en-cours"],   "purple")}
            ${kpi("Terminées",        c["terminee"],   "green")}
            ${kpi("Annulées",         c["annulee"],    "gray")}
          </div>
        </div>
      </div>

      <div class="grid grid-2">
        <div class="card">
          <div class="card-head"><h3>Alertes actives</h3><span class="chip">${activeAlerts.length} signal(aux)</span></div>
          <div class="alerts">
            ${activeAlerts.map(a => alertEl(a)).join("")}
          </div>
        </div>

        <div class="card">
          <div class="card-head"><h3>Prochaines échéances — 30 jours</h3><span class="chip">Dépôts prévus</span></div>
          <div class="timeline">
            ${upcoming.length === 0 ? `<div class="muted">Aucune échéance à court terme.</div>` :
              upcoming.map(t => `
                <div class="timeline-item">
                  <div class="when">${fmtDate(t.dateDepotPrevue)}</div>
                  <div class="what"><span class="badge ${STATUS_META[t.status === "a-saisir" ? "a-deposer" : t.status === "contrat-en-attente" ? "depose" : t.status]?.class || "st-a-deposer"}">${STATUS_META[t.status === "a-saisir" ? "a-deposer" : t.status === "contrat-en-attente" ? "depose" : t.status]?.label || t.status}</span> · <strong>${t.theme}</strong></div>
                </div>
              `).join("")}
          </div>
        </div>
      </div>
    `;
  }

  // ============================================
  // DASHBOARD — N+1
  // ============================================
  function renderDashboardN1() {
    const b = computeBudgets();
    const atRisk = state.trainings.filter(t => t.alerteDelai || t.alerteUGCSF || (t.needsFinancier && t.status === "terminee"));
    const weeklyDigest = state.trainings
      .filter(t => ["a-deposer", "depose", "contrat-en-attente"].includes(t.status) || t.alerteDelai || t.alerteUGCSF)
      .slice(0, 6);

    return `
      <div class="hero-head">
        <div>
          <h1>Vue d'ensemble — ${COMPANY.raisonSociale}</h1>
          <div class="sub">Profil Superviseur · Lecture seule · Exercice ${COMPANY.exercice}</div>
        </div>
        <span class="pill" style="background:rgba(217,119,6,0.12);border-color:rgba(217,119,6,0.35);color:#FCD34D">👁 Lecture seule</span>
      </div>

      <div class="grid grid-2 mb-6">
        ${gauge("Plafond CSF principal", b.main, "PRINCIPAL", true)}
        ${gauge("Budget Alpha", b.alpha, "ALPHA", false)}
      </div>

      <div class="grid grid-2">
        <div class="card">
          <div class="card-head"><h3>Synthèse des risques</h3><span class="chip">${atRisk.length} action(s) à surveiller</span></div>
          <div class="alerts">
            ${atRisk.length === 0 ? `<div class="muted">Aucune action à risque cette semaine.</div>` :
              atRisk.map(t => alertEl({
                level: t.alerteDelai ? "red" : t.alerteUGCSF ? "red" : "orange",
                title: t.theme,
                body: t.alerteDelai ? "Délai de dépôt AP non respecté — intervention RH requise."
                    : t.alerteUGCSF ? "Contrat OFPPT non reçu depuis J+60 — relance UGCSF nécessaire."
                    : "Formation terminée — dossier financier non initié depuis plus de 30 jours.",
              })).join("")}
          </div>
        </div>

        <div class="card">
          <div class="card-head"><h3>Digest hebdomadaire</h3><span class="chip">Actions requérant attention</span></div>
          <div class="table-wrap" style="box-shadow:none;border:none">
          <table class="table">
            <thead><tr><th>Thème</th><th>Statut</th><th>Échéance</th></tr></thead>
            <tbody>
              ${weeklyDigest.map(t => {
                const key = t.status === "a-saisir" ? "a-deposer" : t.status === "contrat-en-attente" ? "depose" : t.status;
                const meta = STATUS_META[key] || { label: t.status, class: "st-a-deposer" };
                return `<tr data-nav="#/formations/${t.id}"><td>${t.theme}</td><td><span class="badge ${meta.class}">${meta.label}</span></td><td class="num muted">${fmtDate(t.dateDepotPrevue)}</td></tr>`;
              }).join("")}
            </tbody>
          </table></div>
        </div>
      </div>
    `;
  }

  // ============================================
  // N+1 — Suivi budgétaire
  // ============================================
  function renderSuiviBudgetaire() {
    const b = computeBudgets();
    return `
      <div class="page-header">
        <div><h1>Suivi budgétaire</h1><div class="sub">Consommation par action — lecture seule</div></div>
        <div class="page-header-actions"><button class="btn btn-ghost" data-action="nav" data-href="#/export">${ICONS.export} Exporter</button></div>
      </div>
      <div class="grid grid-3 mb-6">
        ${kpiCard("Engagé principal", fmtDH(b.main.consumed), `${b.main.pct}% du plafond`)}
        ${kpiCard("Engagé Alpha",      fmtDH(b.alpha.consumed), `${b.alpha.pct}% du budget séparé`)}
        ${kpiCard("FP internes",       fmtDH(b.internalFP.consumed), `${b.internalFP.pct}% du plafond 30%`)}
      </div>
      ${renderFormationsTable({ readOnly: true })}
    `;
  }

  // ============================================
  // N+1 — Actions à risque
  // ============================================
  function renderRisquesPage() {
    const atRisk = state.trainings.filter(t => t.alerteDelai || t.alerteUGCSF || (t.needsFinancier && t.status === "terminee"));
    return `
      <div class="page-header">
        <div><h1>Actions à risque</h1><div class="sub">${atRisk.length} action(s) requièrent une attention immédiate</div></div>
      </div>
      <div class="alerts">
        ${atRisk.length === 0 ? `<div class="card empty"><div class="big">✓</div><h3>Aucune action à risque</h3><p>Tous les dossiers sont à jour.</p></div>` :
          atRisk.map(t => `
            <div class="alert ${t.alerteDelai || t.alerteUGCSF ? "red" : "orange"}" data-nav="#/formations/${t.id}" style="cursor:pointer">
              <div class="ico">⚠</div>
              <div>
                <div class="title">${t.theme}</div>
                <div class="body">${t.alerteDelai ? "Délai de dépôt AP non respecté (minimum 10 jours calendaires)." : t.alerteUGCSF ? "Contrat OFPPT non reçu depuis J+60 — relance UGCSF." : "Dossier financier non initié depuis la réalisation."}</div>
              </div>
            </div>`).join("")}
      </div>
    `;
  }

  // ============================================
  // FORMATIONS LIST
  // ============================================
  function renderFormationsList() {
    return `
      <div class="page-header">
        <div><h1>Actions de formation</h1><div class="sub">${state.trainings.length} actions · Exercice ${COMPANY.exercice}</div></div>
        <div class="page-header-actions">
          <button class="btn btn-primary" data-action="nav" data-href="#/formations/new">${ICONS.plus} Nouvelle action</button>
        </div>
      </div>
      ${renderFormationsTable({ readOnly: false })}
    `;
  }

  function renderFormationsTable({ readOnly }) {
    return `
      <div class="table-wrap">
        <div class="table-toolbar">
          <div class="search"><input class="input" placeholder="Rechercher par thème, organisme…" id="search-input" /></div>
          <select class="select" style="max-width:200px" id="filter-type">
            <option value="">Tous les types</option>
            <option value="FP">Action Planifiée (AP)</option>
            <option value="FNP">Action Non Planifiée (ANP)</option>
            <option value="Alpha">Alphabétisation</option>
            <option value="LD">Longue Durée</option>
          </select>
          <select class="select" style="max-width:200px" id="filter-status">
            <option value="">Tous les statuts</option>
            ${Object.entries(STATUS_META).map(([k,v]) => `<option value="${k}">${v.label}</option>`).join("")}
          </select>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>Thème</th><th>Type</th><th>Organisme</th><th>Dates</th><th>Statut</th><th>Remboursement estimé</th>
            </tr>
          </thead>
          <tbody id="trainings-tbody">
            ${state.trainings.map(trainingRow).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function trainingRow(t) {
    const ocf = OCFs.find(o => o.id === t.ocfId);
    const key = t.status === "a-saisir" ? "a-deposer" : t.status === "contrat-en-attente" ? "depose" : t.status;
    const meta = STATUS_META[key] || { label: t.status, class: "st-a-deposer" };
    const flags = [];
    if (t.alerteDelai)  flags.push(`<span class="badge st-tardive">⚠ Délai</span>`);
    if (t.alerteUGCSF)  flags.push(`<span class="badge st-tardive">⚠ UGCSF</span>`);
    if (t.needsFinancier && t.status === "terminee") flags.push(`<span class="badge st-depose">Dossier financier</span>`);
    const typeLabel = t.type === "FP" ? "AP" : t.type === "FNP" ? "ANP" : t.type;
    return `
      <tr data-nav="#/formations/${t.id}">
        <td><strong>${t.theme}</strong><div class="tiny" style="margin-top:2px">${t.domaine || ""}</div></td>
        <td><span class="chip">${typeLabel} · ${t.realisee === "externe" ? "Externe" : "Interne"}</span></td>
        <td>${ocf ? ocf.raisonSociale : (t.animateur ? "Interne: " + t.animateur : "—")}</td>
        <td class="num small muted">${fmtDate(t.dateDebut)} → ${fmtDate(t.dateFin)}</td>
        <td><span class="badge ${meta.class}">${meta.label}</span> ${flags.join(" ")}</td>
        <td class="num"><strong>${fmtDH(t.remboursementEstime)}</strong></td>
      </tr>
    `;
  }

  // ============================================
  // NEW FORMATION FORM
  // ============================================
  function renderNewFormation() {
    const f = state.newFormation;
    const calc = computeReimbursement({
      type: f.type, realisee: f.realisee, cost: +f.coutHT || 0,
      participants: +f.participants || 0, days: +f.jours || 0, intervenants: +f.intervenants || 1,
    });

    const delayErrors = checkDelayAndDeadline(f.type, f.dateDepotPrevue, f.dateDebut);
    const b = computeBudgets();
    const willExceed = (b.main.consumed + (calc.amount || 0)) > b.main.total && !(f.type === "Alpha");

    // Extra alerts
    const extraAlerts = [];
    if (willExceed) extraAlerts.push({
      level: "orange", title: "Budget insuffisant",
      body: `Cette action dépasse le solde disponible de ${fmtDH((b.main.consumed + calc.amount) - b.main.total)}.`,
    });

    // Ingénierie interne not financeable — represented if internal + FP with "ingenierie" theme
    if (f.realisee === "interne" && /ingenierie|ingénierie|étude|etude/i.test(f.theme)) {
      extraAlerts.push({
        level: "red", title: "Ingénierie interne non finançable",
        body: "Les études d'ingénierie réalisées en interne ne sont pas remboursables au titre des CSF.",
      });
    }

    // FP interne share would exceed 30%
    if (f.type === "FP" && f.realisee === "interne") {
      const projectedFPInt = b.internalFP.consumed + (calc.amount || 0);
      const pct = projectedFPInt / b.internalFP.total * 100;
      if (pct > 85) extraAlerts.push({
        level: "orange", title: "Plafond formations internes",
        body: `Cette action portera les FP internes à ${Math.round(pct)}% du plafond autorisé (30% de la participation globale).`,
      });
    }

    const allErrors = [...delayErrors, ...extraAlerts];
    const blocking = allErrors.some(e => e.level === "red" || e.blocks);

    const totalCSP = (+f.cadres || 0) + (+f.employes || 0) + (+f.ouvriers || 0);

    return `
      <div class="page-header">
        <div>
          <h1>Nouvelle action de formation</h1>
          <div class="sub">Les contrôles réglementaires OFPPT s'exécutent en temps réel</div>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-ghost" data-action="nav" data-href="#/formations">Annuler</button>
          <button class="btn btn-primary" data-action="save-formation" ${blocking ? "disabled" : ""}>
            ${blocking ? "🔒 Validation bloquée" : "Enregistrer l'action"}
          </button>
        </div>
      </div>

      <div class="grid" style="grid-template-columns: 1.5fr 1fr; gap:24px">
        <div class="card flush">
          <!-- Section 1: Type -->
          <div class="form-section">
            <div class="form-section-title"><span class="num">1</span>Type d'action</div>
            <div class="radio-group">
              ${[
                { v: "FP",    t: "Formation Planifiée (AP)" },
                { v: "FNP",   t: "Formation Non Planifiée (ANP)" },
                { v: "Alpha", t: "Alphabétisation" },
                { v: "LD",    t: "Longue Durée" },
              ].map(r => `
                <label class="radio-pill ${f.type === r.v ? "checked" : ""}">
                  <input type="radio" name="type" value="${r.v}" data-nf="type" ${f.type === r.v ? "checked" : ""}/>
                  ${r.t}
                </label>
              `).join("")}
            </div>
            <div style="margin-top:16px"></div>
            <div class="radio-group">
              ${[
                { v: "externe", t: "Organisme externe" },
                { v: "interne", t: "Compétences internes" },
              ].map(r => `
                <label class="radio-pill ${f.realisee === r.v ? "checked" : ""}">
                  <input type="radio" name="realisee" value="${r.v}" data-nf="realisee" ${f.realisee === r.v ? "checked" : ""}/>
                  ${r.t}
                </label>
              `).join("")}
            </div>
          </div>

          <!-- Section 2: Identification -->
          <div class="form-section">
            <div class="form-section-title"><span class="num">2</span>Identification de l'action</div>
            <div class="field required">
              <label>Thème de l'action</label>
              <input class="input" data-nf="theme" value="${escapeHtml(f.theme)}" placeholder="Ex: Formation Gestion de Projet Agile" />
            </div>
            <div class="field">
              <label>Domaine (NDF)</label>
              <input class="input" data-nf="domaine" value="${escapeHtml(f.domaine)}" placeholder="Ex: Management de projets" />
            </div>
            ${f.realisee === "externe" ? `
              <div class="field required">
                <label>Organisme de formation</label>
                <select class="select" data-nf="ocfId">
                  ${OCFs.map(o => `<option value="${o.id}" ${f.ocfId === o.id ? "selected" : ""}>${o.raisonSociale} — CNSS ${o.cnss}</option>`).join("")}
                </select>
              </div>
            ` : `
              <div class="field required">
                <label>Animateur interne</label>
                <input class="input" data-nf="animateur" value="${escapeHtml(f.animateur || "")}" placeholder="Nom, prénom, fonction" />
              </div>
            `}
          </div>

          <!-- Section 3: Dates -->
          <div class="form-section">
            <div class="form-section-title"><span class="num">3</span>Planning et dépôt</div>
            <div class="grid grid-2" style="gap:14px">
              <div class="field required"><label>Date de début</label><input class="input" type="date" data-nf="dateDebut" value="${f.dateDebut || ""}" /></div>
              <div class="field required"><label>Date de fin</label><input class="input" type="date" data-nf="dateFin" value="${f.dateFin || ""}" /></div>
            </div>
            <div class="field required">
              <label>Date prévue de dépôt dossier à l'OFPPT</label>
              <input class="input" type="date" data-nf="dateDepotPrevue" value="${f.dateDepotPrevue || ""}" />
              <div class="hint">Délai minimum : ${RULES.delays[f.type]} jours calendaires avant le démarrage</div>
            </div>
          </div>

          <!-- Section 4: Effectifs & coûts -->
          <div class="form-section">
            <div class="form-section-title"><span class="num">4</span>Effectifs et coûts</div>
            <div class="grid grid-4" style="gap:12px">
              <div class="field"><label>Cadres</label><input class="input" type="number" min="0" data-nf="cadres" value="${f.cadres}"/></div>
              <div class="field"><label>Employés</label><input class="input" type="number" min="0" data-nf="employes" value="${f.employes}"/></div>
              <div class="field"><label>Ouvriers</label><input class="input" type="number" min="0" data-nf="ouvriers" value="${f.ouvriers}"/></div>
              <div class="field"><label>Total</label><input class="input" type="number" value="${totalCSP || f.participants}" disabled/></div>
            </div>
            <div class="grid grid-2" style="gap:14px">
              <div class="field required"><label>Nombre de participants</label><input class="input" type="number" min="1" data-nf="participants" value="${f.participants}"/></div>
              <div class="field required"><label>Nombre de jours</label><input class="input" type="number" min="1" data-nf="jours" value="${f.jours}"/></div>
            </div>
            ${f.realisee === "interne" ? `
              <div class="grid grid-2" style="gap:14px">
                <div class="field"><label>Coût journalier / intervenant</label><input class="input" type="number" min="0" data-nf="coutJournalier" value="${f.coutJournalier}"/><div class="hint">Plafond OFPPT : 800 DH / jour / intervenant</div></div>
                <div class="field"><label>Nombre d'intervenants</label><input class="input" type="number" min="1" data-nf="intervenants" value="${f.intervenants}"/></div>
              </div>
              <div class="field"><label>Coût HT total</label><input class="input" type="number" min="0" data-nf="coutHT" value="${f.coutHT}"/><div class="hint">Auto-calculé : ${(+f.coutJournalier||0) * (+f.jours||0) * (+f.intervenants||1)} DH</div></div>
            ` : `
              <div class="field required"><label>Coût HT total</label><input class="input" type="number" min="0" data-nf="coutHT" value="${f.coutHT}"/></div>
            `}
          </div>
        </div>

        <!-- CALC PANEL (hero) -->
        <div>
          <div class="calc-panel">
            <h3>● Moteur de calcul en direct</h3>
            <div class="calc-row"><span class="k">Règle appliquée</span><span class="v">${calc.ruleKey || "—"}</span></div>
            <div class="calc-row"><span class="k">Taux applicable</span><span class="v">${Math.round(calc.rate*100)}%</span></div>
            <div class="calc-row"><span class="k">Coût HT</span><span class="v">${fmtDH(+f.coutHT || 0)}</span></div>
            <div class="calc-row"><span class="k">Base de calcul retenue</span><span class="v">${fmtDH(calc.base)}</span></div>
            ${calc.capApplied ? `<div class="calc-row"><span class="k" style="color:#D97706">⚠ Plafond appliqué</span><span class="v small" style="font-size:11px">${calc.cap?.label || ""}</span></div>` : ""}
            <div class="calc-row highlight"><span class="k">Remboursement estimé</span><span class="v">${fmtDH(calc.amount)}</span></div>
            <div class="calc-row"><span class="k">Coût net entreprise</span><span class="v">${fmtDH(calc.net)}</span></div>
            <div class="calc-row total"><span class="k">Solde après action</span><span class="v">${fmtDH(Math.max(0, b.main.total - b.main.consumed - (f.type==="Alpha" ? 0 : calc.amount)))}</span></div>
          </div>

          <div class="card mt-4">
            <div class="card-head"><h3>Contrôles réglementaires</h3></div>
            <div class="alerts">
              ${allErrors.length === 0
                ? alertEl({ level: "green", title: "Action conforme", body: "Tous les contrôles réglementaires sont validés." })
                : allErrors.map(e => alertEl({ level: e.level || "red", title: e.title, body: e.body })).join("")
              }
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================
  // FORMATION DETAIL
  // ============================================
  function renderFormationDetail(id) {
    const t = state.trainings.find(x => x.id === id);
    if (!t) return `<div class="empty"><div class="big">🔍</div><h3>Action introuvable</h3></div>`;
    const ocf = OCFs.find(o => o.id === t.ocfId);
    const key = t.status === "a-saisir" ? "a-deposer" : t.status === "contrat-en-attente" ? "depose" : t.status;
    const meta = STATUS_META[key] || { label: t.status, class: "st-a-deposer" };
    const steps = [
      { key: "saisie",      label: "Saisie" },
      { key: "depose",      label: "Dossier technique déposé" },
      { key: "contrat",     label: "Contrat reçu" },
      { key: "realisee",    label: "Formation réalisée" },
      { key: "dossier-fin", label: "Dossier financier déposé" },
      { key: "remboursee",  label: "Remboursée" },
    ];
    const stepIndex = (() => {
      if (t.status === "a-saisir" || t.status === "a-deposer") return 0;
      if (t.status === "depose" || t.status === "contrat-en-attente") return 1;
      if (t.status === "contrat" || t.status === "en-cours") return 2;
      if (t.status === "terminee") return t.needsFinancier ? 3 : 4;
      if (t.status === "dossier-fin") return 4;
      if (t.status === "remboursee") return 5;
      if (t.status === "annulee" || t.status === "tardive") return -1;
      return 0;
    })();

    const tab = state.formationTab;

    // J+60 alert
    const j60 = t.dateDepotReel && !t.dateContratRecu ? daysBetween(t.dateDepotReel, TODAY) : null;
    const j60Alert = j60 != null && j60 >= 60 ? `<div class="alert red" style="margin-bottom:16px"><div class="ico">⚠</div><div><div class="title">Alerte J+60 — Contrat non reçu</div><div class="body">${j60} jours écoulés depuis le dépôt du dossier technique. Relance UGCSF recommandée.</div></div></div>` : "";

    return `
      <div class="page-header">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <span class="badge ${meta.class}">${meta.label}</span>
            <span class="chip">${t.type === "FP" ? "Action Planifiée" : t.type === "FNP" ? "Action Non Planifiée" : t.type === "Alpha" ? "Alphabétisation" : "Longue Durée"} · ${t.realisee === "externe" ? "Externe" : "Interne"}</span>
          </div>
          <h1>${t.theme}</h1>
          <div class="sub">${ocf ? ocf.raisonSociale + " · " : t.animateur ? "Animateur interne : " + t.animateur + " · " : ""}${t.participants} participants · ${t.jours} jour(s)</div>
        </div>
        <div class="page-header-actions">
          ${t.status !== "annulee" && t.status !== "tardive" && t.status !== "remboursee" ? `<button class="btn btn-ghost" data-action="advance-status" data-id="${t.id}">➜ Faire avancer le statut</button>` : ""}
          ${t.status !== "annulee" && t.status !== "tardive" && t.status !== "remboursee" ? `<button class="btn btn-ghost" data-action="cancel-training" data-id="${t.id}">✗ Annuler</button>` : ""}
        </div>
      </div>

      <div class="stepper">
        ${steps.map((s, i) => `
          <div class="step ${i < stepIndex ? "done" : i === stepIndex ? "active" : ""}">
            <div class="dot">${i < stepIndex ? "✓" : i+1}</div>
            <div class="step-label">${s.label}</div>
          </div>
        `).join("")}
      </div>

      ${j60Alert}

      <div class="tabs">
        <button class="tab ${tab==='details'?'active':''}" data-tab="details">Détails</button>
        <button class="tab ${tab==='checklist'?'active':''}" data-tab="checklist">Check-list remboursement</button>
        <button class="tab ${tab==='formulaires'?'active':''}" data-tab="formulaires">Formulaires OFPPT</button>
        <button class="tab ${tab==='historique'?'active':''}" data-tab="historique">Historique</button>
      </div>

      ${tab === 'details' ? renderFormationDetailsTab(t, ocf) : ""}
      ${tab === 'checklist' ? renderChecklistTab(t) : ""}
      ${tab === 'formulaires' ? renderFormulairesTab(t) : ""}
      ${tab === 'historique' ? renderHistoriqueTab(t) : ""}
    `;
  }

  function renderFormationDetailsTab(t, ocf) {
    const calc = computeReimbursement({
      type: t.type, realisee: t.realisee, cost: t.coutHT,
      participants: t.participants, days: t.jours, intervenants: t.intervenants || 1,
    });
    return `
      <div class="grid grid-2">
        <div class="card">
          <div class="card-head"><h3>Informations clés</h3></div>
          <div class="grid" style="gap:10px">
            <div class="flex justify-between"><span class="muted">Domaine (NDF)</span><strong>${t.domaine || "—"}</strong></div>
            <div class="flex justify-between"><span class="muted">Dates</span><strong>${fmtDate(t.dateDebut)} → ${fmtDate(t.dateFin)}</strong></div>
            <div class="flex justify-between"><span class="muted">Dépôt prévu</span><strong>${fmtDate(t.dateDepotPrevue)}</strong></div>
            <div class="flex justify-between"><span class="muted">Dépôt réel</span><strong>${fmtDate(t.dateDepotReel)}</strong></div>
            <div class="flex justify-between"><span class="muted">Contrat reçu</span><strong>${fmtDate(t.dateContratRecu)}</strong></div>
            <div class="flex justify-between"><span class="muted">Effectif par CSP</span><strong>${t.cadres || 0} C · ${t.employes || 0} E · ${t.ouvriers || 0} O</strong></div>
            ${ocf ? `<div class="flex justify-between"><span class="muted">Organisme (OCF)</span><strong>${ocf.raisonSociale}</strong></div>` : ""}
            ${t.animateur ? `<div class="flex justify-between"><span class="muted">Animateur interne</span><strong>${t.animateur}</strong></div>` : ""}
          </div>

          <div style="margin-top:18px">
            <h3 style="font-size:13px">Statut Contrat OFPPT</h3>
            <div class="flex items-center gap-3">
              <label class="check-pill ${t.dateContratRecu ? "checked" : ""}">
                <input type="checkbox" data-action="toggle-contrat" data-id="${t.id}" ${t.dateContratRecu ? "checked" : ""}/>
                Contrat reçu ${t.dateContratRecu ? `· ${fmtDate(t.dateContratRecu)}` : ""}
              </label>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-head"><h3>Calcul financier</h3></div>
          <div class="calc-row"><span class="k">Coût HT</span><span class="v">${fmtDH(t.coutHT)}</span></div>
          <div class="calc-row"><span class="k">Taux applicable</span><span class="v">${Math.round(calc.rate*100)}%</span></div>
          <div class="calc-row"><span class="k">Base retenue</span><span class="v">${fmtDH(calc.base)}</span></div>
          ${calc.capApplied ? `<div class="calc-row"><span class="k" style="color:#D97706">Plafond appliqué</span><span class="v small">${calc.cap?.label || ""}</span></div>` : ""}
          <div class="calc-row highlight"><span class="k">Remboursement estimé</span><span class="v">${fmtDH(calc.amount)}</span></div>
          <div class="calc-row total"><span class="k">Coût net entreprise</span><span class="v">${fmtDH(calc.net)}</span></div>
          ${t.actualMontantPaye ? `<div style="margin-top:14px" class="alert blue"><div class="ico">ℹ</div><div><div class="title">Montant réellement payé</div><div class="body">${fmtDH(t.actualMontantPaye)} — Remboursement recalculé sur ce montant.</div></div></div>` : ""}
        </div>
      </div>
    `;
  }

  function renderChecklistTab(t) {
    const isExt = t.realisee === "externe";
    const items = isExt ? [
      { k: "m4", label: "Modèle 4 — Facture originale signée et cachetée par l'organisme + cachet entreprise" },
      { k: "m5", label: "Modèle 5 — Liste de présence émargée avec cachets organisme + entreprise" },
      { k: "f4", label: "Formulaire F4 — Fiches d'évaluation des bénéficiaires" },
      { k: "m6", label: "Modèle 6 — Attestation de réalisation", warn: "Les thèmes doivent être identiques au contrat OFPPT" },
      { k: "paiement", label: "Justificatif de règlement (copie chèque + relevé de compte / ordre de virement + avis de débit)" },
    ] : [
      { k: "presence", label: "Liste de présence originale émargée par les bénéficiaires, cachetée entreprise" },
      { k: "theme", label: "Mention du thème de l'action" },
      { k: "jours", label: "Jours de réalisation" },
      { k: "animateur", label: "Identité et signature de l'animateur de la formation" },
    ];
    const checklist = t.checklist || {};
    const done = items.filter(i => checklist[i.k]).length;
    const pct = Math.round(done / items.length * 100);

    const isFirstYear = false; // simulated

    // Actual paid input
    return `
      <div class="grid grid-2" style="gap:24px">
        <div>
          <div class="card">
            <div class="card-head"><h3>Pièces à fournir</h3><span class="chip">${done}/${items.length} · ${pct}%</span></div>
            <div class="checklist-progress"><div class="bar"><div class="fill" style="width:${pct}%"></div></div><span class="small mono">${pct}%</span></div>
            <div class="checklist">
              ${items.map(i => `
                <div class="check-item ${checklist[i.k] ? "checked" : ""}" data-action="toggle-check" data-id="${t.id}" data-k="${i.k}">
                  <div class="box">${checklist[i.k] ? "✓" : ""}</div>
                  <div class="text">${i.label}${i.warn ? `<span class="warn">⚠ ${i.warn}</span>` : ""}</div>
                </div>
              `).join("")}
            </div>
          </div>

          <div class="card mt-4">
            <div class="card-head"><h3>Montant réellement payé</h3></div>
            <div class="field"><label>Montant payé à l'organisme (DH HT)</label>
              <input class="input" type="number" value="${t.actualMontantPaye || ""}" placeholder="${t.coutHT}" data-action="update-paid" data-id="${t.id}" />
              <div class="hint">Si différent du coût estimé, le remboursement sera recalculé.</div>
            </div>
          </div>
        </div>

        <div>
          <div class="alerts">
            <div class="alert orange"><div class="ico">⚠</div><div>
              <div class="title">Cohérence des signataires</div>
              <div class="body">Vérifiez que le signataire du Contrat de Formation est identique au signataire du Formulaire F1. Tout écart nécessite un avenant.</div>
            </div></div>
            <div class="alert orange"><div class="ico">⚠</div><div>
              <div class="title">Cohérence des thèmes</div>
              <div class="body">Les thèmes du Modèle 6 doivent être identiques à ceux du Contrat de Formation signé — pas à la facture.</div>
            </div></div>
            <div class="alert blue"><div class="ico">ℹ</div><div>
              <div class="title">Obligation d'archivage</div>
              <div class="body">Conservez ce dossier pendant 5 ans à compter de la date de réalisation de la formation.</div>
            </div></div>
            <div class="alert yellow"><div class="ico">⏱</div><div>
              <div class="title">Échéance dépôt dossier financier</div>
              <div class="body">Dossier financier à déposer avant le 31 décembre ${COMPANY.exercice + 1} — <strong class="mono">J-${Math.max(0, daysBetween(TODAY, new Date(COMPANY.exercice+1, 11, 31)))} jours</strong></div>
            </div></div>
            ${!isFirstYear ? `<div class="alert blue"><div class="ico">ℹ</div><div>
              <div class="title">Dossier administratif — Année N+</div>
              <div class="body">Cette année, seul le Formulaire F1 + une copie du dossier initial déposé sont requis.</div>
            </div></div>` : ""}
          </div>
        </div>
      </div>
    `;
  }

  function renderFormulairesTab(t) {
    const current = state.currentFormulaire;
    const list = [
      { code: "F1", name: "Identification entreprise" },
      { code: "F2", name: "Fiche action de formation" },
      { code: "F3", name: "Identification OCF" },
      { code: "M4", name: "Modèle 4 — Facture" },
      { code: "M5", name: "Modèle 5 — Liste de présence" },
      { code: "M6", name: "Modèle 6 — Attestation" },
    ];

    return `
      <div class="form-selector">
        ${list.map(f => `
          <button class="${current === f.code ? "active" : ""}" data-formulaire="${f.code}">
            <div class="code">${f.code}</div>
            <div class="name">${f.name}</div>
          </button>
        `).join("")}
      </div>

      <div class="flex justify-between items-center mb-4">
        <div class="muted small">Aperçu pré-rempli avec les données de l'action « ${t.theme} »</div>
        <div class="flex gap-2">
          <button class="btn btn-ghost btn-sm" data-action="edit-fields">✎ Modifier les champs</button>
          <button class="btn btn-primary btn-sm" data-action="export-pdf">⬇ Exporter PDF</button>
        </div>
      </div>

      ${renderFormulaire(current, t)}
    `;
  }

  function renderHistoriqueTab(t) {
    return `
      <div class="card">
        <div class="card-head"><h3>Historique de l'action</h3></div>
        <div class="status-trail">
          ${(t.historique || []).map(h => `
            <div class="status-trail-item">
              <div class="when">${fmtDate(h.when)}</div>
              <div>${h.what}</div>
            </div>
          `).join("") || `<div class="muted">Aucun historique.</div>`}
        </div>
      </div>
    `;
  }

  // ============================================
  // FORMULAIRES OFPPT (rendered previews)
  // ============================================
  function renderFormulaire(code, t) {
    const ocf = OCFs.find(o => o.id === t.ocfId);
    if (code === "F1") return formF1();
    if (code === "F2") return formF2(t, ocf);
    if (code === "F3") return formF3(ocf);
    if (code === "M4") return formM4(t, ocf);
    if (code === "M5") return formM5(t);
    if (code === "M6") return formM6(t);
    return `<div class="empty"><h3>Formulaire ${code}</h3><p>Aperçu non disponible.</p></div>`;
  }

  function formF1() {
    return `
      <div class="form-preview">
        <div class="header-bar">
          <div class="title-group">
            <span class="small-title">Contrats Spéciaux de Formation</span>
            <h2 class="big-title">Formulaire F1</h2>
          </div>
          <span class="small-title">Page 1/1</span>
        </div>
        <div class="sub-title">Fiche d'identification de l'entreprise</div>
        <div class="row"><span class="label">Raison sociale</span><span class="value">${COMPANY.raisonSociale}</span></div>
        <div class="row"><span class="label">Activité</span><span class="value">${COMPANY.activite}</span></div>
        <div class="row"><span class="label">Secteur d'activité</span><span class="value">${COMPANY.secteur}</span></div>
        <div class="row"><span class="label">Adresse</span><span class="value">${COMPANY.adresse}</span></div>
        <div class="row"><span class="label">Téléphone / Fax</span><span class="value">${COMPANY.telephone} / ${COMPANY.fax}</span></div>
        <div class="row"><span class="label">Email</span><span class="value">${COMPANY.email}</span></div>
        <div class="row"><span class="label">Date de création</span><span class="value">${COMPANY.dateCreation}</span></div>
        <div class="row"><span class="label">Patente / I.F.</span><span class="value">${COMPANY.patente} / ${COMPANY.identifiantFiscal}</span></div>
        <div class="row"><span class="label">N° RC / N° CNSS</span><span class="value">${COMPANY.rc} / ${COMPANY.cnss}</span></div>
        <div class="row"><span class="label">Responsable formation</span><span class="value">${COMPANY.responsableFormation}</span></div>
        <div class="row"><span class="label">Signataire légal</span><span class="value">${COMPANY.signataire} — ${COMPANY.qualite}</span></div>
        <table>
          <thead><tr><th>Cadres</th><th>Employés</th><th>Ouvriers</th><th>Total</th></tr></thead>
          <tbody><tr><td>${COMPANY.effectif.cadres}</td><td>${COMPANY.effectif.employes}</td><td>${COMPANY.effectif.ouvriers}</td><td><strong>${COMPANY.effectif.total}</strong></td></tr></tbody>
        </table>
        <div class="row" style="margin-top:14px"><span class="label">Déjà bénéficié des CSF (3 dernières années)</span><span class="value">Oui</span></div>
        <div class="signature-block">
          <div><strong>Fait à :</strong> Casablanca<br/><strong>Le :</strong> ${fmtDate(TODAY)}<br/><strong>Nom :</strong> ${COMPANY.signataire}<br/><strong>Qualité :</strong> ${COMPANY.qualite}</div>
          <div class="box"><em>Signature et cachet</em></div>
        </div>
        <div class="legal">Ce formulaire est disponible sur le Portail des CSF — http://csf.ofppt.org.ma</div>
      </div>
    `;
  }

  function formF2(t, ocf) {
    return `
      <div class="form-preview">
        <div class="header-bar">
          <div class="title-group">
            <span class="small-title">Contrats Spéciaux de Formation</span>
            <h2 class="big-title">Formulaire F2</h2>
          </div>
        </div>
        <div class="sub-title">Fiche d'identification de l'action de formation</div>
        <div class="row"><span class="label">Domaine (selon NDF)</span><span class="value">${t.domaine || "—"}</span></div>
        <div class="row"><span class="label">Thème de l'Action</span><span class="value">${t.theme}</span></div>
        <div class="row"><span class="label">Objectif</span><span class="value">Développement des compétences professionnelles des bénéficiaires dans le cadre du plan de formation ${COMPANY.exercice}.</span></div>
        <div class="row"><span class="label">Contenu indicatif</span><span class="value">Modules théoriques et pratiques conformes au référentiel de l'organisme de formation.</span></div>
        <table>
          <thead><tr><th>Cadres</th><th>Employés</th><th>Ouvriers</th><th>Total</th></tr></thead>
          <tbody><tr><td>${t.cadres || 0}</td><td>${t.employes || 0}</td><td>${t.ouvriers || 0}</td><td><strong>${t.participants}</strong></td></tr></tbody>
        </table>
        <div style="margin-top:14px"></div>
        <div class="row"><span class="label">Organisme (raison sociale)</span><span class="value">${ocf ? ocf.raisonSociale : (t.animateur ? "Interne : " + t.animateur : "—")}</span></div>
        <div class="row"><span class="label">N° CNSS Organisme</span><span class="value">${ocf ? ocf.cnss : "—"}</span></div>
        <div class="row"><span class="label">Type de formation</span><span class="value">☒ Intra-entreprise · ☐ Inter-entreprises</span></div>
        <div class="row"><span class="label">Coût de la Formation HT</span><span class="value"><strong>${fmtDH(t.coutHT)}</strong></span></div>
        <table>
          <thead><tr><th>Groupe</th><th>Effectif</th><th>Dates</th><th>Heure début</th><th>Heure fin</th><th>Lieu</th></tr></thead>
          <tbody>
            <tr><td>1</td><td>${t.participants}</td><td>${fmtDate(t.dateDebut)} → ${fmtDate(t.dateFin)}</td><td>09:00</td><td>17:00</td><td>${ocf ? "Siège " + ocf.raisonSociale.split(" ")[0] : "Locaux entreprise"}</td></tr>
          </tbody>
        </table>
        <div class="legal">NDF : Nomenclature des Domaines de Formation. Toute modification doit être notifiée à l'UGCSF via Modèle 3 au moins 3 jours ouvrables avant le démarrage.</div>
      </div>
    `;
  }

  function formF3(ocf) {
    if (!ocf) return `<div class="empty"><h3>Formulaire F3</h3><p>Non applicable — action réalisée en interne.</p></div>`;
    return `
      <div class="form-preview">
        <div class="header-bar"><div class="title-group"><span class="small-title">Contrats Spéciaux de Formation</span><h2 class="big-title">Formulaire F3</h2></div></div>
        <div class="sub-title">Fiche d'identification de l'Organisme de Formation</div>
        <div class="row"><span class="label">Raison sociale</span><span class="value">${ocf.raisonSociale}</span></div>
        <div class="row"><span class="label">Forme juridique</span><span class="value">${ocf.formeJuridique}</span></div>
        <div class="row"><span class="label">Date de création</span><span class="value">${fmtDate(ocf.dateCreation)}</span></div>
        <div class="row"><span class="label">Gérant</span><span class="value">${ocf.gerant}</span></div>
        <div class="row"><span class="label">Adresse</span><span class="value">${ocf.adresse}</span></div>
        <div class="row"><span class="label">Téléphone</span><span class="value">${ocf.tel}</span></div>
        <div class="row"><span class="label">Email</span><span class="value">${ocf.email}</span></div>
        <div class="row"><span class="label">Patente / I.F.</span><span class="value">${ocf.patente} / ${ocf.if}</span></div>
        <div class="row"><span class="label">N° RC / N° CNSS</span><span class="value">${ocf.rc} / ${ocf.cnss}</span></div>
        <div class="row"><span class="label">Domaines de compétence</span><span class="value">${ocf.domaines.join(" · ")}</span></div>
        <div class="row"><span class="label">Moyens matériels pédagogiques</span><span class="value">${ocf.moyens}</span></div>
        <div class="row"><span class="label">Groupe étranger ?</span><span class="value">Non</span></div>
      </div>
    `;
  }

  function formM4(t, ocf) {
    const tva = Math.round(t.coutHT * 0.20);
    const ttc = t.coutHT + tva;
    return `
      <div class="form-preview">
        <div class="header-bar">
          <div class="title-group">
            <span class="small-title">Modèle 4</span>
            <h2 class="big-title">${ocf ? ocf.raisonSociale.toUpperCase() : "ORGANISME DE FORMATION"}</h2>
          </div>
          <div style="text-align:right;font-size:11px">Facture N° <strong>CSF-${String(Math.floor(Math.random()*9000+1000))}/${COMPANY.exercice}</strong><br/>Date : ${fmtDate(TODAY)}</div>
        </div>
        ${ocf ? `<div style="font-size:11px;color:#555">${ocf.adresse} · Tel: ${ocf.tel} · Fax: ${ocf.tel}</div>` : ""}
        <div class="row"><span class="label">Entreprise</span><span class="value">${COMPANY.raisonSociale}</span></div>
        <div class="row"><span class="label">Lieu de formation</span><span class="value">${ocf ? "Locaux " + ocf.raisonSociale : "Siège entreprise"}</span></div>
        <table>
          <thead><tr><th>Thèmes</th><th>Jours réels / groupe</th><th>Nbre bénéficiaires</th><th>Montant HT / thème</th></tr></thead>
          <tbody>
            <tr><td>${t.theme}<br/><span style="font-size:11px;color:#555">— Groupe 1</span></td><td>Les ${fmtDate(t.dateDebut)} → ${fmtDate(t.dateFin)}</td><td>${t.participants}</td><td><strong>${fmtDH(t.coutHT)}</strong></td></tr>
          </tbody>
          <tfoot>
            <tr><td colspan="3" style="text-align:right">Total HT</td><td><strong>${fmtDH(t.coutHT)}</strong></td></tr>
            <tr><td colspan="3" style="text-align:right">TVA (20%)</td><td>${fmtDH(tva)}</td></tr>
            <tr><td colspan="3" style="text-align:right"><strong>Total TTC</strong></td><td><strong>${fmtDH(ttc)}</strong></td></tr>
          </tfoot>
        </table>
        <div style="margin-top:12px">Arrêtée la présente facture à la somme de <strong>${montantEnLettres(ttc)} TTC</strong>.</div>
        <div style="margin-top:14px;font-size:11px;color:#555;font-style:italic">NB — Jointes : listes de présence émargées par thème et fiches d'évaluation des bénéficiaires.</div>
        ${ocf ? `<div style="margin-top:14px;font-size:11px">RC ${ocf.rc} · CNSS ${ocf.cnss} · Patente ${ocf.patente} · IF ${ocf.if}</div>` : ""}
        <div class="signature-block">
          <div><strong>Mode de règlement :</strong> Virement bancaire<br/><strong>RIB :</strong> ${COMPANY.rib}</div>
          <div class="box"><em>Cachet de l'organisme et identité du signataire</em></div>
        </div>
      </div>
    `;
  }

  function formM5(t) {
    const participants = SAMPLE_PARTICIPANTS.slice(0, Math.min(t.participants, 5));
    return `
      <div class="form-preview">
        <div class="header-bar"><div class="title-group"><span class="small-title">Modèle 5</span><h2 class="big-title">Liste de présence par action et par groupe</h2></div></div>
        <div style="margin:14px 0"><strong>Entreprise :</strong> ${COMPANY.raisonSociale}<br/><strong>Thème de l'action :</strong> ${t.theme}<br/><strong>Jours de réalisation :</strong> ${fmtDate(t.dateDebut)} → ${fmtDate(t.dateFin)}</div>
        <table>
          <thead><tr><th>Prénom NOM</th><th>N° CIN</th><th>N° CNSS</th><th>C.S.P</th><th>Émargement</th></tr></thead>
          <tbody>
            ${participants.map(p => `<tr><td>${p.prenomNom}</td><td class="mono">${p.cin}</td><td class="mono">${p.cnss}</td><td style="text-align:center">${p.csp}</td><td style="font-style:italic;color:#888">✓ signé</td></tr>`).join("")}
            ${Array.from({length: Math.max(0, t.participants - participants.length)}).map(() => `<tr><td colspan="5" style="height:22px"></td></tr>`).join("")}
          </tbody>
        </table>
        <div style="margin-top:10px;font-size:11px">(*) C.S.P : Catégorie socio-professionnelle — C: Cadre · E: Employé · O: Ouvrier</div>
        <div class="signature-block">
          <div class="box"><em>Cachet de l'organisme de formation et identité du signataire</em></div>
          <div class="box"><em>Cachet et signature du responsable de formation de l'entreprise</em></div>
        </div>
      </div>
    `;
  }

  function formM6(t) {
    const coherent = true; // in the mockup — themes match
    return `
      <div class="form-preview">
        <div class="header-bar"><div class="title-group"><span class="small-title">Modèle 6 — sur papier à entête de l'entreprise</span><h2 class="big-title">${COMPANY.raisonSociale}</h2></div><span class="small-title">${COMPANY.adresse}</span></div>
        <div class="sub-title">Attestation certifiant la réalisation des actions</div>
        <div class="attestation-body">
          Je soussigné <strong>${COMPANY.signataire}</strong>, <strong>${COMPANY.qualite}</strong>, certifie par la présente que l'entreprise <strong>${COMPANY.raisonSociale}</strong> a réalisé, au titre de l'exercice <strong>${COMPANY.exercice}</strong>, l'action de formation ci-après dans le cadre des Contrats Spéciaux de Formation et a procédé à la liquidation des dépenses relatives à ladite action :
          <table style="margin-top:16px">
            <thead><tr><th>Thème de l'action</th><th>Dates</th><th>Bénéficiaires</th><th>Montant HT</th></tr></thead>
            <tbody><tr><td><strong>${t.theme}</strong></td><td>${fmtDate(t.dateDebut)} → ${fmtDate(t.dateFin)}</td><td>${t.participants}</td><td>${fmtDH(t.coutHT)}</td></tr></tbody>
          </table>
          <div style="margin-top:10px">
            <span class="coherence-badge ${coherent ? "ok" : "warn"}">
              ${coherent ? "✓ Thème vérifié — identique au Contrat de Formation" : "⚠ Écart détecté — le thème du Modèle 6 diffère du contrat OFPPT"}
            </span>
          </div>
        </div>
        <div class="signature-block">
          <div><strong>Fait à :</strong> Casablanca<br/><strong>Le :</strong> ${fmtDate(TODAY)}</div>
          <div class="box"><em>Cachet de l'entreprise, signature et qualité du responsable</em></div>
        </div>
      </div>
    `;
  }

  function montantEnLettres(n) {
    // short stub: we don't need real conversion, just polished display
    return `${fmtDH(n)} (${n.toLocaleString("fr-FR")} dirhams TTC)`;
  }

  // ============================================
  // FORMULAIRES PAGE (global)
  // ============================================
  function renderFormulairesPage() {
    const t = state.trainings.find(x => x.status !== "annulee" && x.status !== "a-saisir") || state.trainings[0];
    return `
      <div class="page-header">
        <div><h1>Formulaires OFPPT</h1><div class="sub">Aperçu pré-rempli — données de l'action « ${t.theme} »</div></div>
      </div>
      ${renderFormulairesTab(t)}
    `;
  }

  // ============================================
  // REMBOURSEMENT PAGE
  // ============================================
  function renderRemboursementPage() {
    const eligible = state.trainings.filter(t => t.status === "terminee" || t.status === "dossier-fin");
    return `
      <div class="page-header">
        <div><h1>Préparation remboursement</h1><div class="sub">${eligible.length} action(s) éligibles — Dépôt financier avant le 31 décembre ${COMPANY.exercice + 1}</div></div>
      </div>
      <div class="grid grid-2">
        ${eligible.map(t => {
          const items = t.realisee === "externe" ? 5 : 4;
          const done = Object.values(t.checklist || {}).filter(Boolean).length;
          const pct = Math.round(done / items * 100);
          return `
            <div class="card" data-nav="#/formations/${t.id}" style="cursor:pointer">
              <div class="card-head"><h3>${t.theme}</h3><span class="chip">${fmtDH(t.remboursementEstime)}</span></div>
              <div class="checklist-progress"><div class="bar"><div class="fill" style="width:${pct}%"></div></div><span class="small mono">${done}/${items} pièces · ${pct}%</span></div>
              <div class="muted small">${fmtDate(t.dateDebut)} → ${fmtDate(t.dateFin)} · ${t.participants} bénéficiaires</div>
            </div>
          `;
        }).join("") || `<div class="empty"><div class="big">📋</div><h3>Aucun dossier éligible</h3><p>Aucune action n'est encore en phase de remboursement.</p></div>`}
      </div>
    `;
  }

  // ============================================
  // EXPORT PAGE
  // ============================================
  function renderExportPage() {
    return `
      <div class="page-header">
        <div><h1>Export</h1><div class="sub">Générez les exports consolidés du plan de formation</div></div>
      </div>
      <div class="grid grid-2">
        <div class="card">
          <div class="card-head"><h3>Plan de formation (Excel / CSV)</h3></div>
          <p class="muted">Toutes les actions de l'exercice, avec type, organisme, coûts et statuts.</p>
          <button class="btn btn-primary" data-action="export-csv">⬇ Exporter CSV</button>
        </div>
        <div class="card">
          <div class="card-head"><h3>Récapitulatif budgétaire</h3></div>
          <p class="muted">Synthèse consommé / disponible par rubrique (principal, Alpha, FP internes).</p>
          <button class="btn btn-primary" data-action="export-budget">⬇ Exporter CSV</button>
        </div>
        <div class="card">
          <div class="card-head"><h3>Check-lists PDF (simulé)</h3></div>
          <p class="muted">Toutes les check-lists de dossier financier par action.</p>
          <button class="btn btn-ghost" data-action="export-pdf-bulk">⬇ Exporter PDF (simulé)</button>
        </div>
        <div class="card">
          <div class="card-head"><h3>Formulaires OFPPT pré-remplis</h3></div>
          <p class="muted">F1, F2, F3, M4, M5, M6 — package complet par action.</p>
          <button class="btn btn-ghost" data-action="export-forms">⬇ Exporter PDF (simulé)</button>
        </div>
      </div>
    `;
  }

  // ============================================
  // NOTIFICATIONS PAGE (full view)
  // ============================================
  function renderNotificationsPage() {
    const p = state.profile;
    const items = state.notifications.filter(n => n.profile.includes(p));
    return `
      <div class="page-header">
        <div><h1>Centre de notifications</h1><div class="sub">${items.filter(n => !n.read).length} non lue(s) · ${items.length} au total</div></div>
        <div class="page-header-actions">
          <button class="btn btn-ghost" data-action="mark-all-read">✓ Tout marquer comme lu</button>
        </div>
      </div>
      <div class="card flush">
        ${items.map(n => `
          <div class="notif-item ${n.read ? "read" : ""}" data-action="toggle-read" data-id="${n.id}" style="border-radius:0;border:none;border-bottom:1px solid var(--border);background:transparent">
            <div class="sev ${n.sev}"></div>
            <div class="flex-1">
              <div class="msg">${n.msg}</div>
              <div class="when">${n.when}</div>
            </div>
          </div>
        `).join("")}
      </div>
    `;
  }

  function renderNotifPanel() {
    const p = state.profile;
    const items = (state.notifications || []).filter(n => n.profile.includes(p));
    return `
      <div class="notif-backdrop ${state.notifOpen ? "open" : ""}" data-action="close-notif"></div>
      <aside class="notif-panel ${state.notifOpen ? "open" : ""}">
        <div class="notif-header">
          <h2>Notifications</h2>
          <button class="icon-btn" data-action="close-notif">✕</button>
        </div>
        <div class="notif-body">
          ${items.map(n => `
            <div class="notif-item ${n.read ? "read" : ""}" data-action="toggle-read" data-id="${n.id}">
              <div class="sev ${n.sev}"></div>
              <div class="flex-1">
                <div class="msg">${n.msg}</div>
                <div class="when">${n.when}</div>
              </div>
            </div>
          `).join("")}
        </div>
      </aside>
    `;
  }

  // ============================================
  // GIAC INTERFACE
  // ============================================
  function renderGIACPending() {
    const pending = state.giacDossiers.filter(d => d.status === "pending");
    const expandedId = state._giacExpanded;
    return `
      <div class="hero-head">
        <div>
          <h1>Espace GIAC — Groupement Interprofessionnel d'Aide au Conseil</h1>
          <div class="sub">${pending.length} dossier(s) d'ingénierie en attente de validation</div>
        </div>
        <span class="pill" style="background:rgba(13,148,136,0.15);border-color:rgba(13,148,136,0.4);color:#5EEAD4">🛡 Auditeur ${USERS.giac.name}</span>
      </div>

      <div class="tabs">
        <button class="tab active">Dossiers en attente</button>
        <button class="tab" data-action="nav" data-href="#/giac/done">Dossiers traités</button>
        <button class="tab" data-action="nav" data-href="#/giac/history">Historique des décisions</button>
      </div>

      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>Entreprise</th><th>Secteur</th><th>Type de dossier</th><th>Date soumission</th><th>Délai écoulé</th><th>Statut</th><th style="width:340px">Actions</th></tr></thead>
          <tbody>
            ${pending.map(d => `
              <tr data-action="giac-expand" data-id="${d.id}">
                <td><strong>${d.company}</strong></td>
                <td class="small muted">${d.secteur}</td>
                <td>${d.type}</td>
                <td class="num">${fmtDate(d.submitted)}</td>
                <td class="num">${daysBetween(d.submitted, TODAY)} jours</td>
                <td><span class="badge st-pending">En attente</span></td>
                <td>
                  <div class="flex gap-2">
                    <button class="btn btn-success btn-sm" data-action="giac-decide" data-id="${d.id}" data-decision="valide">✓ Valider</button>
                    <button class="btn btn-danger btn-sm" data-action="giac-decide" data-id="${d.id}" data-decision="refuse">✗ Refuser</button>
                    <button class="btn btn-warning btn-sm" data-action="giac-decide" data-id="${d.id}" data-decision="complement">? Complément</button>
                  </div>
                </td>
              </tr>
              ${expandedId === d.id ? `
                <tr><td colspan="7" style="padding:0">
                  <div class="expandable">
                    <div class="grid grid-2">
                      <div>
                        <h4>Plan de formation</h4>
                        <div class="flex gap-6 mt-2">
                          <div class="kpi"><span class="k">Budget</span><span class="v">${fmtDH(d.plan.budget)}</span></div>
                          <div class="kpi"><span class="k">Actions</span><span class="v">${d.plan.actions}</span></div>
                          <div class="kpi"><span class="k">TFP</span><span class="v">${fmtDH(d.plan.tfp)}</span></div>
                        </div>
                      </div>
                      <div>
                        <h4>Organismes sollicités</h4>
                        <div class="flex gap-2" style="flex-wrap:wrap;margin-top:8px">
                          ${d.ocfs.map(o => `<span class="chip">${o}</span>`).join("")}
                        </div>
                      </div>
                    </div>
                    <div style="margin-top:16px">
                      <h4>Étude d'ingénierie — Résumé</h4>
                      <p class="muted" style="font-size:13px;line-height:1.6">${d.ingenierie}</p>
                    </div>
                    <div style="margin-top:8px"><span class="chip">📧 Contact : ${d.contact}</span></div>
                  </div>
                </td></tr>
              ` : ""}
            `).join("") || `<tr><td colspan="7" class="empty"><div class="big">✓</div><h3>Aucun dossier en attente</h3></td></tr>`}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderGIACDone() {
    const done = state.giacDossiers.filter(d => d.status !== "pending");
    return `
      <div class="hero-head"><div><h1>Dossiers traités</h1><div class="sub">${done.length} décision(s)</div></div></div>
      <div class="tabs">
        <button class="tab" data-action="nav" data-href="#/giac">Dossiers en attente</button>
        <button class="tab active">Dossiers traités</button>
        <button class="tab" data-action="nav" data-href="#/giac/history">Historique des décisions</button>
      </div>
      ${done.length === 0 ? `<div class="empty"><div class="big">📋</div><h3>Aucune décision prise dans cette session</h3><p>Validez des dossiers depuis l'onglet « Dossiers en attente ».</p></div>` : `
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>Entreprise</th><th>Secteur</th><th>Type</th><th>Décision</th><th>Motif</th><th>Date</th></tr></thead>
            <tbody>
              ${done.map(d => `
                <tr><td><strong>${d.company}</strong></td><td class="small muted">${d.secteur}</td><td>${d.type}</td>
                <td><span class="badge ${d.status === "valide" ? "st-valide" : d.status === "refuse" ? "st-refuse" : "st-pending"}">${d.status === "valide" ? "Validé" : d.status === "refuse" ? "Refusé" : "Complément demandé"}</span></td>
                <td class="muted small">${d.motif || "—"}</td><td class="num">${fmtDate(d.decidedAt || TODAY)}</td></tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `}
    `;
  }

  function renderGIACHistory() {
    const all = [
      ...state.giacDossiers.filter(d => d.status !== "pending").map(d => ({
        when: d.decidedAt || fmtDate(TODAY),
        company: d.company,
        decision: d.status === "valide" ? "Validé" : d.status === "refuse" ? "Refusé" : "Complément demandé",
        motif: d.motif || "—",
        agent: USERS.giac.name,
      })),
      ...state.giacHistory,
    ];
    return `
      <div class="hero-head"><div><h1>Historique des décisions</h1><div class="sub">${all.length} décision(s) archivée(s)</div></div></div>
      <div class="tabs">
        <button class="tab" data-action="nav" data-href="#/giac">Dossiers en attente</button>
        <button class="tab" data-action="nav" data-href="#/giac/done">Dossiers traités</button>
        <button class="tab active">Historique des décisions</button>
      </div>
      <div class="card">
        <div class="status-trail">
          ${all.map(h => `
            <div class="status-trail-item">
              <div class="when">${fmtDate(h.when)}</div>
              <div>
                <div><strong>${h.company}</strong> · <span class="badge ${h.decision==='Validé'?'st-valide':h.decision==='Refusé'?'st-refuse':'st-pending'}">${h.decision}</span></div>
                <div class="small muted mt-1">${h.motif}</div>
                <div class="tiny mt-1">Auditeur : ${h.agent}</div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  // ============================================
  // HELPERS (rendering primitives)
  // ============================================
  function gauge(title, data, tag, hero) {
    return `
      <div class="gauge ${hero ? "hero" : ""}">
        <div class="gauge-head">
          <div class="gauge-title">${title} ${tag ? `<span class="tag">${tag}</span>` : ""}</div>
          <span class="chip">${fmtDH(Math.max(0, data.total - data.consumed))} disponibles</span>
        </div>
        <div class="gauge-values"><div class="consumed">${fmtDH(data.consumed)}</div><div class="total">/ ${fmtDH(data.total)}</div></div>
        <div class="gauge-bar"><div class="gauge-fill" style="width:${data.pct}%"></div></div>
        <div class="gauge-foot"><span>Consommé</span><span class="pct">${data.pct}%</span></div>
      </div>
    `;
  }

  function kpi(label, value, variant) {
    return `<div class="kpi"><span class="k">${label}</span><span class="v s-${variant}">${value}</span></div>`;
  }

  function kpiCard(k, v, sub) {
    return `<div class="card"><div class="tiny">${k}</div><div style="font-family:'Syne',sans-serif;font-size:28px;font-weight:700;margin-top:4px">${v}</div><div class="small muted">${sub}</div></div>`;
  }

  function alertEl({ level, title, body }) {
    const ico = level === "red" ? "🔴" : level === "orange" ? "🟠" : level === "yellow" ? "🟡" : level === "green" ? "✅" : "ℹ";
    return `<div class="alert ${level}"><div class="ico">${ico}</div><div><div class="title">${title}</div><div class="body">${body}</div></div></div>`;
  }

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  }

  // ============================================
  // MODAL ROOT
  // ============================================
  function renderModalRoot() {
    const root = document.getElementById("modal-root");
    if (!state.modal) { root.innerHTML = ""; return; }

    const m = state.modal;
    if (m.type === "giac-decide") {
      const dossier = state.giacDossiers.find(d => d.id === m.data.id);
      const labels = { valide: "Valider l'ingénierie", refuse: "Refuser le dossier", complement: "Demander un complément" };
      const btnClass = { valide: "btn-success", refuse: "btn-danger", complement: "btn-warning" }[m.data.decision];
      root.innerHTML = `
        <div class="modal-backdrop" data-backdrop="1">
          <div class="modal">
            <div class="modal-head"><h3>${labels[m.data.decision]} — ${dossier.company}</h3></div>
            <div class="modal-body">
              <p class="muted">Votre décision sera enregistrée dans l'historique et l'entreprise sera notifiée.</p>
              <div class="field">
                <label>Motif${m.data.decision === "valide" ? " (optionnel)" : ""}</label>
                <textarea class="textarea" id="giac-motif" placeholder="${m.data.decision === 'valide' ? 'Dossier conforme — ingénierie solide' : m.data.decision === 'refuse' ? 'Ingénierie incomplète, absence de diagnostic préalable...' : 'Merci de préciser la répartition des bénéficiaires par CSP...'}"></textarea>
              </div>
            </div>
            <div class="modal-foot">
              <button class="btn btn-ghost" data-action="close-modal">Annuler</button>
              <button class="btn ${btnClass}" data-action="giac-confirm" data-id="${m.data.id}" data-decision="${m.data.decision}">Confirmer</button>
            </div>
          </div>
        </div>
      `;
    }
    else if (m.type === "cancel-training") {
      const t = state.trainings.find(x => x.id === m.data.id);
      const hours = Math.max(0, Math.round((new Date(t.dateDebut) - TODAY) / (1000*60*60)));
      const late = hours < RULES.cancelMinHours;
      root.innerHTML = `
        <div class="modal-backdrop" data-backdrop="1">
          <div class="modal">
            <div class="modal-head"><h3>Annuler l'action « ${t.theme} »</h3></div>
            <div class="modal-body">
              <div class="alert ${late ? 'red' : 'yellow'}" style="margin-bottom:12px">
                <div class="ico">${late ? '⚠' : '⏱'}</div>
                <div>
                  <div class="title">${late ? 'Délai réglementaire dépassé' : 'Annulation autorisée'}</div>
                  <div class="body">${late
                    ? `Démarrage dans ${hours}h < 24h — l'action passera en statut « Annulation tardive ». Le Modèle 3 reste obligatoire et doit être déposé immédiatement à l'UGCSF.`
                    : `Démarrage dans ${hours}h. Déposez le Modèle 3 physiquement à l'UGCSF avant l'heure de démarrage prévue. Budget de ${fmtDH(t.remboursementEstime)} réintégré à votre solde.`
                  }</div>
                </div>
              </div>
            </div>
            <div class="modal-foot">
              <button class="btn btn-ghost" data-action="close-modal">Annuler</button>
              <button class="btn btn-danger" data-action="confirm-cancel" data-id="${t.id}" data-late="${late}">Confirmer l'annulation</button>
            </div>
          </div>
        </div>
      `;
    }
  }

  // ============================================
  // EVENTS (delegated)
  // ============================================
  function attachEvents() {
    document.body.onclick = onClick;
    document.body.oninput = onInput;
    document.body.onchange = onChange;
  }

  function onClick(e) {
    // Backdrop click (only when the click target IS the backdrop itself, not a child)
    if (e.target.matches && e.target.matches(".modal-backdrop[data-backdrop]")) {
      closeModal();
      return;
    }
    const target = e.target.closest("[data-action], [data-nav], [data-switch], [data-tab], [data-formulaire]");
    if (!target) return;

    const nav = target.getAttribute("data-nav");
    if (nav) { e.preventDefault(); navigate(nav); return; }

    const sw = target.getAttribute("data-switch");
    if (sw) {
      e.preventDefault();
      state.profile = sw;
      // Reset route based on profile
      const def = sw === "giac" ? "#/giac" : "#/dashboard";
      navigate(def);
      toast("Profil changé", `Bienvenue ${USERS[sw].name}`, "success");
      return;
    }

    const tab = target.getAttribute("data-tab");
    if (tab) { state.formationTab = tab; render(); return; }

    const f = target.getAttribute("data-formulaire");
    if (f) { state.currentFormulaire = f; render(); return; }

    const action = target.getAttribute("data-action");
    if (!action) return;

    switch (action) {
      case "login": {
        const p = target.getAttribute("data-profile") || "rh";
        state.profile = p;
        navigate(p === "giac" ? "#/giac" : "#/dashboard");
        toast("Connecté", `Bienvenue ${USERS[p].name}`);
        break;
      }
      case "logout": state.profile = null; navigate("#/login"); break;
      case "toggle-notif": state.notifOpen = !state.notifOpen; render(); break;
      case "close-notif": state.notifOpen = false; render(); break;
      case "toggle-read": {
        const id = target.getAttribute("data-id");
        const n = state.notifications.find(x => x.id === id);
        if (n) { n.read = !n.read; render(); }
        break;
      }
      case "mark-all-read":
        state.notifications.forEach(n => { if (n.profile.includes(state.profile)) n.read = true; });
        render(); toast("Notifications", "Toutes marquées comme lues");
        break;
      case "save-formation": saveNewFormation(); break;
      case "advance-status": advanceStatus(target.getAttribute("data-id")); break;
      case "cancel-training": openModal({ type: "cancel-training", data: { id: target.getAttribute("data-id") }}); break;
      case "confirm-cancel": confirmCancel(target.getAttribute("data-id"), target.getAttribute("data-late") === "true"); break;
      case "toggle-check": {
        const id = target.getAttribute("data-id"); const k = target.getAttribute("data-k");
        const t = state.trainings.find(x => x.id === id);
        if (t) { t.checklist = t.checklist || {}; t.checklist[k] = !t.checklist[k]; render(); }
        break;
      }
      case "toggle-contrat": {
        const id = target.getAttribute("data-id");
        const t = state.trainings.find(x => x.id === id);
        if (t) {
          t.dateContratRecu = t.dateContratRecu ? null : new Date().toISOString().slice(0,10);
          if (t.dateContratRecu && t.status === "contrat-en-attente") { t.status = "contrat"; t.alerteUGCSF = false; }
          render();
          toast("Contrat OFPPT", t.dateContratRecu ? "Réception enregistrée" : "Réception annulée");
        }
        break;
      }
      case "update-paid":
        // handled in oninput
        break;
      case "export-csv": exportCSV(); break;
      case "export-budget": exportBudgetCSV(); break;
      case "export-pdf-bulk":
      case "export-forms":
      case "export-pdf": toast("Export PDF", "Export en cours de développement", "warn"); break;
      case "edit-fields": toast("Édition des champs", "Fonctionnalité en cours de déploiement", "warn"); break;
      case "giac-expand": {
        const id = target.getAttribute("data-id");
        state._giacExpanded = state._giacExpanded === id ? null : id;
        render();
        break;
      }
      case "giac-decide":
        openModal({ type: "giac-decide", data: { id: target.getAttribute("data-id"), decision: target.getAttribute("data-decision") }});
        break;
      case "giac-confirm": {
        const id = target.getAttribute("data-id");
        const decision = target.getAttribute("data-decision");
        const motifField = document.getElementById("giac-motif");
        const motif = motifField ? motifField.value.trim() : "";
        const d = state.giacDossiers.find(x => x.id === id);
        if (d) {
          d.status = decision;
          d.motif = motif;
          d.decidedAt = new Date().toISOString().slice(0,10);
          closeModal();
          const labels = { valide: "Validé", refuse: "Refusé", complement: "Complément demandé" };
          toast(`Décision : ${labels[decision]}`, `L'entreprise ${d.company} a été notifiée de votre décision.`);
        }
        break;
      }
      case "close-modal": closeModal(); break;
    }
  }

  function onInput(e) {
    const target = e.target;

    // New formation form inputs
    const nfKey = target.getAttribute("data-nf");
    if (nfKey) {
      let v = target.value;
      if (["participants","cadres","employes","ouvriers","jours","coutHT","coutJournalier","intervenants"].includes(nfKey)) v = v === "" ? "" : Number(v);
      state.newFormation[nfKey] = v;
      // auto-compute internal cost
      if (state.newFormation.realisee === "interne" && ["coutJournalier","jours","intervenants"].includes(nfKey)) {
        state.newFormation.coutHT = (+state.newFormation.coutJournalier||0) * (+state.newFormation.jours||0) * (+state.newFormation.intervenants||1);
      }
      // Maintain participants total from CSP sum
      const sum = (+state.newFormation.cadres||0) + (+state.newFormation.employes||0) + (+state.newFormation.ouvriers||0);
      if (sum > 0) state.newFormation.participants = sum;
      // Re-render ONLY right-column calc panel + alerts + radio "checked" style
      // For simplicity re-render the whole route (but preserve focus)
      renderPreservingFocus();
      return;
    }

    // Actual paid amount
    if (target.getAttribute("data-action") === "update-paid") {
      const id = target.getAttribute("data-id");
      const t = state.trainings.find(x => x.id === id);
      if (t) { t.actualMontantPaye = target.value ? Number(target.value) : null; renderPreservingFocus(); }
    }

    // Filters & search
    if (target.id === "search-input" || target.id === "filter-type" || target.id === "filter-status") {
      const q = (document.getElementById("search-input")?.value || "").toLowerCase();
      const ft = document.getElementById("filter-type")?.value || "";
      const fs = document.getElementById("filter-status")?.value || "";
      const tbody = document.getElementById("trainings-tbody");
      if (tbody) {
        const filtered = state.trainings.filter(t => {
          const ocf = OCFs.find(o => o.id === t.ocfId);
          const matchesQ = !q || t.theme.toLowerCase().includes(q) || (ocf && ocf.raisonSociale.toLowerCase().includes(q));
          const matchesT = !ft || t.type === ft;
          const key = t.status === "a-saisir" ? "a-deposer" : t.status === "contrat-en-attente" ? "depose" : t.status;
          const matchesS = !fs || key === fs;
          return matchesQ && matchesT && matchesS;
        });
        tbody.innerHTML = filtered.map(trainingRow).join("") || `<tr><td colspan="6" class="empty"><div class="big">🔍</div><h3>Aucune action trouvée</h3></td></tr>`;
      }
    }
  }

  function onChange(e) {
    const nfKey = e.target.getAttribute("data-nf");
    if (nfKey && (e.target.tagName === "SELECT" || e.target.type === "radio")) {
      state.newFormation[nfKey] = e.target.value;
      renderPreservingFocus();
    }
  }

  function renderPreservingFocus() {
    const active = document.activeElement;
    const key = active ? active.getAttribute("data-nf") || active.id : null;
    const val = active ? (active.tagName === "SELECT" ? null : active.selectionStart) : null;
    render();
    if (key) {
      const next = document.querySelector(`[data-nf="${key}"]`) || document.getElementById(key);
      if (next) {
        next.focus();
        if (val != null && next.setSelectionRange && typeof next.value === "string") {
          try { next.setSelectionRange(val, val); } catch(_) {}
        }
      }
    }
  }

  // ============================================
  // ACTIONS
  // ============================================
  function saveNewFormation() {
    const f = state.newFormation;
    if (!f.theme || !f.dateDebut || !f.dateFin || !f.dateDepotPrevue) {
      toast("Formulaire incomplet", "Renseignez les champs obligatoires.", "error");
      return;
    }
    const calc = computeReimbursement({
      type: f.type, realisee: f.realisee, cost: +f.coutHT || 0,
      participants: +f.participants || 0, days: +f.jours || 0, intervenants: +f.intervenants || 1,
    });
    const newId = "fm-" + (state.trainings.length + 1).toString().padStart(2, "0");
    state.trainings.unshift({
      id: newId, theme: f.theme, type: f.type, realisee: f.realisee,
      ocfId: f.realisee === "externe" ? f.ocfId : null,
      animateur: f.realisee === "interne" ? f.animateur : null,
      domaine: f.domaine,
      participants: +f.participants, cadres: +f.cadres, employes: +f.employes, ouvriers: +f.ouvriers,
      jours: +f.jours, coutHT: +f.coutHT,
      coutJournalier: +f.coutJournalier, intervenants: +f.intervenants,
      dateDebut: f.dateDebut, dateFin: f.dateFin, dateDepotPrevue: f.dateDepotPrevue,
      status: "a-deposer",
      remboursementEstime: calc.amount,
      budgetAlpha: f.type === "Alpha",
      checklist: {},
      historique: [{ when: new Date().toISOString().slice(0,10), what: "Action saisie via le cockpit" }],
    });
    state.newFormation = defaultNewFormation();
    toast("Action enregistrée", "Le plan de formation a été mis à jour.");
    navigate("#/formations/" + newId);
  }

  function advanceStatus(id) {
    const t = state.trainings.find(x => x.id === id);
    if (!t) return;
    const sequence = ["a-deposer","depose","contrat","en-cours","terminee","dossier-fin","remboursee"];
    const aliases = { "a-saisir":"a-deposer", "contrat-en-attente":"depose" };
    const cur = aliases[t.status] || t.status;
    const idx = sequence.indexOf(cur);
    if (idx >= 0 && idx < sequence.length - 1) {
      t.status = sequence[idx + 1];
      t.historique = t.historique || [];
      t.historique.push({ when: new Date().toISOString().slice(0,10), what: `Statut avancé : ${STATUS_META[t.status]?.label || t.status}` });
      toast("Statut mis à jour", STATUS_META[t.status]?.label || t.status);
      render();
    }
  }

  function confirmCancel(id, late) {
    const t = state.trainings.find(x => x.id === id);
    if (!t) return;
    t.status = late ? "tardive" : "annulee";
    t.remboursementEstime = 0;
    t.historique = t.historique || [];
    t.historique.push({ when: new Date().toISOString().slice(0,10), what: late ? "Annulation tardive — Modèle 3 obligatoire" : "Annulation — Modèle 3 déposé" });
    closeModal();
    toast("Action annulée", late ? "Passée en statut 'Annulation tardive'." : "Budget réintégré.", "warn");
    render();
  }

  function exportCSV() {
    const header = ["ID","Thème","Type","Mode","Organisme","Dates","Statut","Coût HT","Remboursement estimé"].join(";");
    const lines = state.trainings.map(t => {
      const ocf = OCFs.find(o => o.id === t.ocfId);
      return [
        t.id, `"${t.theme}"`, t.type, t.realisee,
        ocf ? `"${ocf.raisonSociale}"` : (t.animateur ? `"Interne: ${t.animateur}"` : ""),
        `${t.dateDebut || ""}→${t.dateFin || ""}`, t.status, t.coutHT || 0, t.remboursementEstime || 0,
      ].join(";");
    });
    downloadCSV("plan-formation-" + COMPANY.exercice + ".csv", [header, ...lines].join("\n"));
    toast("Export CSV", "Plan de formation téléchargé.");
  }

  function exportBudgetCSV() {
    const b = computeBudgets();
    const rows = [
      ["Rubrique","Consommé","Plafond","%"].join(";"),
      ["Principal CSF", b.main.consumed, b.main.total, b.main.pct + "%"].join(";"),
      ["Alpha", b.alpha.consumed, b.alpha.total, b.alpha.pct + "%"].join(";"),
      ["FP internes (max 30%)", b.internalFP.consumed, b.internalFP.total, b.internalFP.pct + "%"].join(";"),
    ];
    downloadCSV("budget-" + COMPANY.exercice + ".csv", rows.join("\n"));
    toast("Export CSV", "Récapitulatif budgétaire téléchargé.");
  }

  function downloadCSV(filename, content) {
    const blob = new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  // ---------------- BOOT ----------------
  render();
})();
