const form = document.getElementById('registrationForm');
const nome = document.getElementById('nome');
const cognome = document.getElementById('cognome');
const privacy = document.getElementById('privacy');
const privacyStep = document.getElementById('privacyStep');
const privacyHint = document.getElementById('privacyHint');
const detailsFieldset = document.getElementById('detailsFieldset');
const hasCompanion = document.getElementById('hasCompanion');
const companionWrap = document.getElementById('companionWrap');
const companionName = document.getElementById('companionName');
const submitButton = document.getElementById('submitButton');
const formMessage = document.getElementById('formMessage');

function namesAreComplete() {
  return nome.value.trim().length >= 2 && cognome.value.trim().length >= 2;
}

function refreshPrivacyStep() {
  const unlocked = namesAreComplete();
  privacy.disabled = !unlocked;
  privacyStep.classList.toggle('is-locked', !unlocked);
  privacyHint.textContent = unlocked
    ? 'Dopo l’accettazione saranno abilitati i dati di contatto e la scelta della data.'
    : 'Inserisci prima nome e cognome.';

  if (!unlocked) {
    privacy.checked = false;
  }

  refreshDetailsStep();
}

function refreshDetailsStep() {
  const enabled = namesAreComplete() && privacy.checked;
  detailsFieldset.disabled = !enabled;
  submitButton.disabled = !enabled;

  if (!enabled) {
    hasCompanion.checked = false;
    companionName.value = '';
    refreshCompanionField();
  }
}

function refreshCompanionField() {
  const show = hasCompanion.checked;
  companionWrap.classList.toggle('hidden', !show);
  companionName.required = show;
}

[nome, cognome].forEach((field) => field.addEventListener('input', refreshPrivacyStep));
privacy.addEventListener('change', refreshDetailsStep);
hasCompanion.addEventListener('change', refreshCompanionField);

form.addEventListener('submit', (event) => {
  event.preventDefault();
  formMessage.className = 'form-message';
  formMessage.textContent = '';

  if (!form.checkValidity()) {
    form.reportValidity();
    formMessage.classList.add('error');
    formMessage.textContent = 'Controlla i campi obbligatori prima di inviare.';
    return;
  }

  const data = new FormData(form);
  const selectedDate = data.get('data_evento');
  const formattedDate = selectedDate === '2026-10-10'
    ? 'sabato 10 ottobre 2026'
    : 'venerdì 16 ottobre 2026';

  const record = {
    nome: data.get('nome').trim(),
    cognome: data.get('cognome').trim(),
    email: data.get('email').trim(),
    cellulare: data.get('cellulare').trim(),
    data_evento: selectedDate,
    accompagnatore: hasCompanion.checked,
    nome_accompagnatore: hasCompanion.checked ? data.get('companionName').trim() : null,
    privacy_accettata: true,
    creato_il: new Date().toISOString()
  };

  // FASE 1: simulazione del salvataggio.
  // Nella fase successiva questa riga verrà sostituita dalla scrittura su Supabase.
  console.log('Registrazione pronta per il salvataggio:', record);

  formMessage.classList.add('success');
  formMessage.textContent = `Richiesta pronta: ${record.nome}, ${formattedDate} alle ore 15:00. Nella fase successiva la colleghiamo al database.`;
});

refreshPrivacyStep();
refreshCompanionField();
