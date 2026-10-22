/* Kontaktformular und Sicherheitsprüfung.
   Verhalten: config.js; Gestaltung/Zeiten: motion.css und base.css. */
import { setButtonLabel } from './buttons.js';
export function initForms(runtime) {
  const { config, listen } = runtime;
  const contactForm = document.querySelector('.contact-form form');
  if (contactForm) {
    if (
      !contactForm.querySelector('button[type="submit"]') ||
      !contactForm.querySelector('[name="email"]') ||
      !contactForm.querySelector('[name="message"]') ||
      !contactForm.querySelector('[name="consent"]')
    )
      return;
    const loadedAt = Date.now();
    const status = document.createElement('p');
    status.className = 'form-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.hidden = true;
    const submit = contactForm.querySelector('button[type="submit"]');
    const initialLabel = submit.textContent;
    const english = document.documentElement.lang === 'en';
    const formBody = contactForm.querySelector('.formbody') || contactForm;
    const messageField = contactForm.querySelector('[name="message"]');
    if (new URLSearchParams(window.location.search).get(config.contact.intentParameter) ===
        config.contact.storyboardIntent && !messageField.value.trim()) {
      messageField.value = english
        ? 'I am interested in a free storyboard for the following product: '
        : 'Ich interessiere mich für ein kostenloses Storyboard für folgendes Produkt: ';
    }
    const company = document.createElement('input');
    company.type = 'text';
    company.name = 'company';
    company.autocomplete = 'off';
    company.tabIndex = -1;
    company.className = 'form-honeypot';
    company.setAttribute('aria-hidden', 'true');
    formBody.append(company);
    const consentLabel = contactForm.querySelector(
      'input[type="checkbox"][name="consent"] + label',
    );
    if (consentLabel) {
      const privacy = document.createElement('a');
      privacy.href = config.contact.privacyPath;
      privacy.textContent = english ? ' Privacy policy' : ' Datenschutzerklärung';
      consentLabel.append(privacy);
    }
    // Vorschau simuliert die Eingabeprüfung, versendet jedoch weder Daten noch Erfolgsereignisse.
    if (document.querySelector(config.preview.selector)) {
      status.hidden = false;
      status.textContent = english
        ? 'Preview: enquiries are not sent.'
        : 'Vorschau: Anfragen werden nicht versendet.';
      submit.closest('.widget')?.after(status);
      listen(contactForm, 'submit', (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!contactForm.reportValidity()) return;
        status.textContent = english
          ? 'Simulation complete. No enquiry was sent.'
          : 'Simulation abgeschlossen. Es wurde keine Anfrage versendet.';
      }, { capture: true });
      return;
    }
    const security = document.createElement('div');
    security.className = 'cf-turnstile';
    security.dataset.sitekey = config.contact.turnstileSiteKey;
    security.dataset.theme = 'light';
    security.dataset.language = english ? 'en' : 'de';
    submit.closest('.widget')?.before(security);
    submit.closest('.widget')?.after(status);
    const turnstile = document.createElement('script');
    turnstile.src = config.contact.turnstileScript;
    turnstile.async = true;
    document.head.append(turnstile);
    const showStatus = (message, error = false) => {
      status.hidden = false;
      status.textContent = message;
      if (error) {
        status.setAttribute('data-error', '');
        submit.disabled = false;
        requestAnimationFrame(() => {
          submit.disabled = false;
        });
      } else status.removeAttribute('data-error');
    };
    listen(
      contactForm,
      'submit',
      async (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        const email = contactForm.querySelector('[name="email"]');
        const consent = contactForm.querySelector(
          'input[type="checkbox"][name="consent"]',
        );
        const token = contactForm.querySelector(
          '[name="cf-turnstile-response"]',
        )?.value;
        if (!email.checkValidity()) {
          showStatus(
            english
              ? 'Please enter a valid email address.'
              : 'Bitte geben Sie eine gültige E-Mail-Adresse an.',
            true,
          );
          email.focus();
          return;
        }
        if (!consent.checked) {
          showStatus(
            english
              ? 'Please confirm the privacy notice.'
              : 'Bitte bestätigen Sie die Datenschutzhinweise.',
            true,
          );
          consent.focus();
          return;
        }
        if (!token) {
          showStatus(
            english
              ? 'The security check is still loading. Please try again shortly.'
              : 'Die Sicherheitsprüfung lädt noch. Bitte versuchen Sie es gleich erneut.',
            true,
          );
          return;
        }
        submit.disabled = true;
        setButtonLabel(submit, english ? 'Sending …' : 'Wird gesendet …');
        status.hidden = true;
        try {
          const response = await fetch(config.contact.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: email.value.trim(),
              message: contactForm.querySelector('[name="message"]').value.trim(),
              company: contactForm.querySelector('[name="company"]').value,
              token,
              elapsed: Date.now() - loadedAt,
            }),
          });
          if (!response.ok)
            throw new Error(`Contact service returned ${response.status}`);
          contactForm.reset();
          window.turnstile?.reset();
          showStatus(
            english
              ? 'Thank you. Your enquiry has arrived.'
              : 'Danke! Ihre Anfrage ist angekommen.',
          );
          setButtonLabel(submit, english ? 'Sent' : 'Gesendet');
          document.dispatchEvent(new Event('eo:contact-success'));
        } catch {
          window.turnstile?.reset();
          showStatus(
            english
              ? 'Sending failed. Please write to projects@ertnerundso.com.'
              : 'Das Senden hat nicht geklappt. Schreiben Sie bitte an projects@ertnerundso.com.',
            true,
          );
          submit.disabled = false;
          setButtonLabel(submit, initialLabel);
        }
      },
      { capture: true },
    );
  }
}
