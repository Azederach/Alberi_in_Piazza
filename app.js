
'use strict';

// ALBERI IN PIAZZA — COLLEGAMENTO SUPABASE

const URL_DB = 'https://vtbrmisawmnzpjijsmrw.supabase.co';

const CHIAVE_PUBBLICA =
  'sb_publishable_ajJUBws7lyz_yeolvOjdBg_IZggrnPc';

const el = id => document.getElementById(id);

const form = el('registrationForm');
const nome = el('nome');
const cognome = el('cognome');
const privacy = el('privacy');
const privacyStep = el('privacyStep');
const privacyHint = el('privacyHint');
const details = el('detailsFieldset');
const hasCompanion = el('hasCompanion');
const companionWrap = el('companionWrap');
const companionName = el('companionName');
const button = el('submitButton');
const message = el('formMessage');

let online = false;
let sending = false;
let availableDates = [];

// COMUNICAZIONE CON SUPABASE

async function api(functionName, data = {}) {

  const response = await fetch(
    `${URL_DB}/rest/v1/rpc/${functionName}`,
    {
      method: 'POST',
      headers: {
        apikey: CHIAVE_PUBBLICA,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(data)
    }
  );

  const result = await response.json()
    .catch(() => null);

  if (!response.ok) {
    throw new Error(
      result?.message ||
      `Errore HTTP ${response.status}`
    );
  }

  return result;
}

// CONTROLLO NOME E COGNOME

function namesComplete() {

  return nome.value.trim().length >= 2 &&
         cognome.value.trim().length >= 2;

}

// ACCOMPAGNATORE

function refreshCompanion() {

  companionWrap.classList.toggle(
    'hidden',
    !hasCompanion.checked
  );

  companionName.required = hasCompanion.checked;

  if (!hasCompanion.checked) {
    companionName.value = '';
  }

}

// ABILITAZIONE MODULO

function refreshDetails() {

  const enabled =
    namesComplete() && privacy.checked;

  details.disabled = !enabled || sending;

  button.disabled =
    !enabled || !online || sending;

  button.querySelector('span').textContent =
    sending
      ? 'Invio in corso…'
      : 'Invia richiesta di partecipazione';

  if (!enabled && !sending) {

    hasCompanion.checked = false;
    refreshCompanion();

  }

}

// PRIVACY

function refreshPrivacy() {

  const unlocked = namesComplete();

  privacy.disabled = !unlocked || sending;

  privacyStep.classList.toggle(
    'is-locked',
    !unlocked
  );

  privacyHint.textContent = unlocked
    ? 'Dopo l’accettazione saranno abilitati i dati di contatto e la scelta della data.'
    : 'Inserisci prima nome e cognome.';

  if (!unlocked) {
    privacy.checked = false;
  }

  refreshDetails();

}

// MESSAGGI ALL'UTENTE

function showMessage(text, error = false) {

  message.className =
    `form-message ${error ? 'error' : 'success'}`;

  message.textContent = text;

}

// LETTURA DEI POSTI DISPONIBILI

async function refreshAvailability() {

  try {

    const events = await api('stato_eventi');

    if (!Array.isArray(events) ||
        events.length !== 2) {

      throw new Error('Date non disponibili');

    }

    online = true;
    availableDates = events;

    for (const event of events) {

      const input = document.querySelector(
        `input[name="data_evento"][value="${event.data_evento}"]`
      );

      if (!input) continue;

      input.disabled = event.chiuso === true;

      if (input.disabled) {
        input.checked = false;
      }

      let status = input.closest('.choice-card')
        .querySelector('.availability-status');

      if (!status) {

        status = document.createElement('small');

        status.className =
          'availability-status';

        input.closest('.choice-card')
          .querySelector('.date-copy')
          .append(status);

      }

      status.textContent = event.chiuso

        ? 'Iscrizioni concluse'

        : Number(event.posti_residui) === 0

          ? 'Posti esauriti · lista d’attesa aperta'

          : `${event.posti_residui} posti disponibili su ${event.capienza}`;

    }

  } catch (error) {

    online = false;

    console.error('Supabase:', error);

    showMessage(
      'Collegamento al database non disponibile: per ora non inviare iscrizioni.',
      true
    );

  }

  refreshDetails();

}

// EVENTI DEL MODULO

[nome, cognome].forEach(field =>

  field.addEventListener(
    'input',
    refreshPrivacy
  )

);

privacy.addEventListener(
  'change',
  refreshDetails
);

hasCompanion.addEventListener(
  'change',
  refreshCompanion
);

// INVIO ISCRIZIONE REALE

form.addEventListener(
  'submit',
  async event => {

    event.preventDefault();

    if (sending || !online) return;

    if (!form.checkValidity()) {

      form.reportValidity();

      showMessage(
        'Controlla i campi obbligatori.',
        true
      );

      return;

    }

    const data = new FormData(form);

    const date = data.get('data_evento');

    if (!date ||
        !availableDates.some(
          item =>
            item.data_evento === date &&
            !item.chiuso
        )) {

      showMessage(
        'Seleziona un appuntamento aperto.',
        true
      );

      return;

    }

    sending = true;

    refreshDetails();

    try {

      const result = await api(
        'registra_iscrizione',
        {

          p_nome: nome.value.trim(),

          p_cognome: cognome.value.trim(),

          p_email: String(
            data.get('email') || ''
          ).trim(),

          p_cellulare: String(
            data.get('cellulare') || ''
          ).trim(),

          p_data_evento: date,

          p_accompagnatore:
            hasCompanion.checked,

          p_nome_accompagnatore:
            hasCompanion.checked
              ? companionName.value.trim()
              : null,

          p_privacy: privacy.checked

        }
      );

      if (result?.stato === 'DUPLICATO') {

        showMessage(
          'Risulta già presente un’iscrizione associata a questa email.',
          true
        );

      } else if (

        result?.stato === 'CONFERMATO' ||

        result?.stato === "LISTA D'ATTESA"

      ) {

        
const dataLeggibile =
  date === '2026-10-10'
    ? 'sabato 10 ottobre 2026'
    : 'venerdì 16 ottobre 2026';

const testoAccompagnatore = hasCompanion.checked
  ? ` Abbiamo registrato anche l’accompagnatore: ${companionName.value.trim()}.`
  : '';

const text =
  result.stato === 'CONFERMATO'

    ? `Iscrizione confermata per ${dataLeggibile} alle ore 15:00, a Piazza Mazzini (Roma).${testoAccompagnatore} In caso di maltempo l’incontro potrà essere rinviato.`

    : `Sei in lista d’attesa per ${dataLeggibile} alle ore 15:00, a Piazza Mazzini (Roma).${testoAccompagnatore} Ti contatteremo se si libera un posto.`;


        form.reset();

        refreshCompanion();

        refreshPrivacy();

        showMessage(text);

        await refreshAvailability();

      } else {

        throw new Error(
          'Risposta imprevista dal database'
        );

      }

    } catch (error) {

      console.error(
        'Invio iscrizione:',
        error
      );

      showMessage(
        'Invio non confermato: ' +
        error.message,
        true
      );

    } finally {

      sending = false;

      refreshDetails();

    }

  }
);

// AVVIO DELLA PAGINA

refreshPrivacy();

refreshCompanion();

refreshAvailability();

// AGGIORNAMENTO OGNI 60 SECONDI

setInterval(() => {

  if (!sending) {
    refreshAvailability();
  }

}, 60000);
