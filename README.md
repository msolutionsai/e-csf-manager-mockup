# e-CSF Manager — Simulation interactive

Prototype fonctionnel haute fidélité du cockpit de conformité **e-CSF Manager** — gestion des Contrats Spéciaux de Formation (CSF) pour entreprises marocaines, administrés par l'OFPPT.

> 🔗 **Démo en ligne :** https://msolutionsai.github.io/e-csf-manager-mockup/

## Objectif

Valider le concept produit avec un client avant le développement. L'application simule les flux UX, les règles métier OFPPT et l'ensemble des livrables administratifs (F1, F2, F3, Modèles 4/5/6).

Ce n'est **pas une application de production** : aucun backend, aucune authentification, aucun appel API. Tout est auto-porté dans le navigateur.

## Trois profils simulés

| Profil | Rôle | Droits |
|---|---|---|
| **RH** (Fatima Benali) | Collaborateur RH | Saisie, suivi, préparation dossiers, alertes |
| **N+1** (Karim Alaoui) | Superviseur | Lecture seule, gauges, digest hebdomadaire |
| **GIAC** (Hicham El Idrissi) | Auditeur externe | Validation ingénierie, refus, demande complément |

Un sélecteur en haut à droite bascule instantanément entre les trois interfaces.

## Ce qui fonctionne interactivement

- **Moteur de calcul CSF en direct** — taux (70 / 40 / 80 %), plafonds (800 DH/j/intervenant, 3 000 DH/personne Alpha, 50 000 DH/personne LD), base retenue, remboursement estimé, coût net entreprise
- **Contrôles réglementaires en temps réel** — délai AP < 10 j bloquant, dépassement 30 juin / 31 déc, ingénierie interne non finançable, plafond FP internes 30 %
- **Stepper de statut** — Saisie → Dossier déposé → Contrat reçu → Formation réalisée → Dossier financier → Remboursée
- **Alerte J+60** sur contrat non reçu, **annulation 24h** (Modèle 3 obligatoire → Annulation tardive si tardif)
- **Check-list remboursement** externe / interne avec progression visuelle et recalcul sur montant réel
- **Formulaires OFPPT** F1, F2, F3, Modèles 4, 5, 6 rendus sur papier blanc, pré-remplis avec les données de l'action
- **GIAC** — table dossiers en attente, expansion de ligne, modals Valider / Refuser / Complément, historique
- **Centre de notifications** slide-out filtré par profil
- **Export CSV** réel du plan de formation et du récapitulatif budgétaire

## Stack

- HTML / CSS / JavaScript vanilla
- Zero build step · zero npm
- Polices Google Fonts (Inter + Syne + JetBrains Mono)
- Logos officiels servis depuis le CDN de production

## Lancer en local

```bash
cd e-csf-manager-mockup
python3 -m http.server 8095
```

Puis ouvrir http://localhost:8095

## Structure

```
e-csf-manager-mockup/
├── index.html        # shell
├── styles.css        # design system dark-first
├── data.js           # règles métier + données d'échantillon
└── app.js            # SPA, routing, rendus, événements
```

## Données d'échantillon

- Entreprise : **Maroc Industrie SA** (fictive) — Industrie / BTP, 200 collaborateurs, TFP 180 000 DH
- 8 actions de formation pré-chargées à différents stades
- 3 dossiers d'ingénierie en attente côté GIAC
- Organismes : FormaPlus Maroc, Cabinet Argan Consulting, SafeWeld Academy, Institut Alphabétisation Avenir

## Hors périmètre

Pas implémenté dans ce mockup :
- Authentification / JWT
- Backend / base de données / API
- Envoi d'emails
- Génération PDF (toast de simulation)
- Chatbot IA

---

© 2026 msolutionsai · Simulation produit — non contractuel
