# Sequenza follow-up automatica cantine — Implementazione

## Contesto

Abbiamo un sistema fiere (`/api/admin/fiere`) che invia una presentazione email (email 0) alle cantine e logga tutto su Google Sheets (spreadsheet `1sjxo95pOQz76jizopNgjMiHc3A0u1mnhbROuTxAQ948`, sheet `cantine`).

Abbiamo creato 8 email di follow-up (template 19-26 in `/api/admin/email-preview`) che devono partire automaticamente dopo la presentazione, su un arco di ~60 giorni.

Le email sono in `src/app/api/admin/email-preview/route.ts` nelle funzioni `buildFollowUp1()` ... `buildFollowUp8()` con il layout `followUpLayout()`.

## Cosa fare

### 1. Colonne Google Sheets da usare/aggiungere

Il foglio ha già queste colonne rilevanti:
- **Colonna R (Presentazione)**: oggi contiene "Inviata" quando parte la mail 0
- **Colonna S (Ultimo contatto)**: data dell'ultimo contatto
- **Colonna Q (Closing)**: stato finale (`Registrato`, `No interesse`, vuoto)

Aggiungere/usare:
- **Colonna R (Presentazione)**: cambiare da "Inviata" a numero progressivo `0`, `1`, `2`...`8` per tracciare quante email sono state inviate
- **Colonna S (Ultimo contatto)**: aggiornare con la data di ogni invio (formato `MM/DD/YYYY`)

### 2. Aggiornare `/api/admin/fiere` (email 0)

Quando la presentazione parte con successo:
- Scrivere `0` nella colonna Presentazione (invece di "Inviata")
- Scrivere la data odierna in Ultimo contatto
- Questo marca la riga come "sequenza iniziata al giorno 0"

### 3. Creare endpoint cron `/api/cron/followup-fiere`

Cron giornaliero (Vercel Cron, stessa logica di `/api/cron/review-emails`).

**Logica:**

```
Per ogni riga del foglio Google:
  1. Leggi colonna Q (Closing) — se "Registrato" o "No interesse" → SKIP
  2. Leggi colonna R (Presentazione) — il numero dell'ultima email inviata (0-8)
     - Se vuoto o "Inviata" (legacy) → SKIP
     - Se >= 8 → SKIP (sequenza completata)
  3. Leggi colonna S (Ultimo contatto) — data ultimo invio
  4. Calcola giorni trascorsi da Ultimo contatto
  5. Determina quale email mandare in base al numero attuale:
     - Da 0→1: aspetta 5 giorni (±1-2 random, calcolato una volta)
     - Da 1→2: aspetta 7 giorni
     - Da 2→3: aspetta 8 giorni
     - Da 3→4: aspetta 8 giorni
     - Da 4→5: aspetta 7 giorni
     - Da 5→6: aspetta 7 giorni
     - Da 6→7: aspetta 8 giorni
     - Da 7→8: aspetta 8 giorni
  6. Se è il momento giusto:
     a. Invia l'email N+1 via Mandrill
     b. Aggiorna colonna R con il nuovo numero
     c. Aggiorna colonna S con la data odierna
```

**Jitter**: per non sembrare automatico, aggiungere ±1-2 giorni di variazione. Il jitter deve essere deterministico per riga (es. hash dell'email % 3 - 1 → dà -1, 0 o +1 giorni).

**Orario invio**: il cron gira una volta al giorno, ma le email non devono partire tutte alla stessa ora. Usare un delay random 0-4 ore basato sull'hash dell'email.

### 4. Template email follow-up

I template sono già scritti in `email-preview/route.ts` come funzioni `buildFollowUp1()` ... `buildFollowUp8()`.

**Devono essere spostati/estratti** in `src/lib/mail/templates.ts` come funzioni esportate che accettano parametri:
- `customerName` (nome della cantina o contatto)
- Ritornano `{ subject: string, html: string }`

**Subject lines** per ogni follow-up:
1. "Una cosa che ci tenevo a dirvi"
2. "L'enoturismo sta cambiando"
3. "Qualche numero su Stappando"
4. "Il problema delle bottiglie rotte"
5. "Come appare una cantina su Stappando"
6. "Estate e ricerche in crescita"
7. "Un riepilogo veloce"
8. "Vi auguro una splendida stagione"

Il placeholder `Mario` nei template va sostituito con il nome reale dalla colonna "contatto" del foglio (o il nome azienda se contatto è vuoto).

### 5. Stop automatico su registrazione vendor

Quando un vendor si registra (`/api/vendor/register` o equivalente):
- Cercare l'email del vendor nel foglio Google
- Se trovata, aggiornare colonna Q (Closing) = `Registrato`
- Questo blocca automaticamente la sequenza al prossimo giro del cron

### 6. File da modificare

- `src/app/api/admin/fiere/route.ts` — aggiornare per scrivere `0` + data
- `src/lib/mail/templates.ts` — estrarre/aggiungere i template follow-up
- `src/app/api/cron/followup-fiere/route.ts` — NUOVO, il cron
- `src/app/api/admin/email-preview/route.ts` — aggiornare per usare i template da templates.ts
- `vercel.json` — aggiungere il cron schedule

### 7. Vercel Cron config

```json
{
  "crons": [
    {
      "path": "/api/cron/followup-fiere",
      "schedule": "0 8 * * *"
    }
  ]
}
```

### 8. Sicurezza

- Proteggere l'endpoint cron con `CRON_SECRET` (come già fatto per review-emails)
- Rate limiting: max 50 email per esecuzione del cron per non sovraccaricare Mandrill

### 9. Retrocompatibilità

Le righe esistenti con "Inviata" nella colonna Presentazione sono legacy. Il cron le ignora (non manda follow-up). Solo le nuove righe con numero `0` entrano nella sequenza.

Se volete attivare la sequenza anche per le righe esistenti, serve uno script una tantum che converte "Inviata" → `0` e mette la data di oggi in Ultimo contatto.
