(() => {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;

  const nextInput = form.querySelector("[data-next-url]");
  const replyToInput = form.querySelector("[data-reply-to]");
  const emailInput = form.querySelector("[data-email-input]");
  const callOption = document.querySelector("[data-contact-call]");
  const emailOption = document.querySelector("[data-contact-email]");
  const choiceNote = document.querySelector("[data-contact-choice-note]");

  const isMobileCallContext = () =>
    window.matchMedia("(max-width: 767px)").matches;

  const setChoiceNote = (title, text) => {
    if (!choiceNote) return;
    choiceNote.classList.add("is-active");
    choiceNote.innerHTML = `<strong>${title}</strong><p>${text}</p>`;
  };

  const updateDynamicFields = () => {
    if (nextInput) {
      nextInput.value = new URL("./thank-you.html", window.location.href).href;
    }

    if (replyToInput && emailInput) {
      replyToInput.value = emailInput.value.trim();
    }
  };

  emailInput?.addEventListener("input", updateDynamicFields);

  callOption?.addEventListener("click", (event) => {
    if (isMobileCallContext()) return;

    event.preventDefault();
    setChoiceNote(
      "اطلاعات تماس هالبورد",
      "در دسکتاپ می‌توانید شماره 09038467057 را ببینید و برای هماهنگی اولیه با تیم تماس بگیرید. روی موبایل همین گزینه تماس مستقیم را باز می‌کند."
    );
  });

  emailOption?.addEventListener("click", (event) => {
    event.preventDefault();
    setChoiceNote(
      "ارسال درخواست از طریق فرم",
      "فرم پروژه را کامل کنید تا اطلاعات شما به ایمیل hallboardteam@gmail.com ارسال شود و تیم برای هماهنگی با شما تماس بگیرد."
    );

    form.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      form.querySelector("input[name='name']")?.focus({ preventScroll: true });
    }, 350);
  });

  form.addEventListener("submit", () => {
    updateDynamicFields();
    form.classList.add("is-sending");
  });

  updateDynamicFields();
})();
