const whatsappNumero = "31994410565";

const topo = document.querySelector("#topo");
const menuBotao = document.querySelector(".menu-botao");
const menu = document.querySelector("#menu");
const ano = document.querySelector("#ano");
const form = document.querySelector("#form-contato");
const status = document.querySelector("#formulario-status");
const whatsapp = document.querySelector("#atalho-whatsapp");

if (ano) {
  ano.textContent = String(new Date().getFullYear());
}

if (whatsapp && whatsappNumero) {
  const texto = "Olá, gostaria de solicitar um orçamento.";
  whatsapp.href = `https://wa.me/${whatsappNumero}?text=${encodeURIComponent(texto)}`;
}

function fecharMenu() {
  if (!menuBotao || !menu) return;
  menuBotao.setAttribute("aria-expanded", "false");
  menu.classList.remove("aberto");
  menuBotao.querySelector(".sr-only").textContent = "Abrir menu";
}

menuBotao?.addEventListener("click", () => {
  const aberto = menuBotao.getAttribute("aria-expanded") === "true";
  menuBotao.setAttribute("aria-expanded", String(!aberto));
  menu.classList.toggle("aberto", !aberto);
  menuBotao.querySelector(".sr-only").textContent = aberto ? "Abrir menu" : "Fechar menu";
});

menu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", fecharMenu);
});

const secoes = [...document.querySelectorAll("main section")];
const links = [...document.querySelectorAll(".menu a")];

function atualizarTopo() {
  topo?.classList.toggle("topo-solido", window.scrollY > 12);

  const posicao = window.scrollY + 120;
  let atual = secoes[0]?.id;

  secoes.forEach((secao) => {
    if (secao.offsetTop <= posicao) atual = secao.id;
  });

  links.forEach((link) => {
    const ativo = link.getAttribute("href") === `#${atual}`;
    if (ativo) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

window.addEventListener("scroll", atualizarTopo, { passive: true });
atualizarTopo();

function limparErros() {
  form?.querySelectorAll(".erro").forEach((campo) => {
    campo.textContent = "";
  });
  form?.querySelectorAll("[aria-invalid]").forEach((campo) => {
    campo.removeAttribute("aria-invalid");
  });
}

function mostrarErros(erros) {
  Object.entries(erros).forEach(([campo, texto]) => {
    const aviso = form.querySelector(`[data-erro="${campo}"]`);
    const entrada = form.querySelector(`[name="${campo}"]`);
    if (aviso) aviso.textContent = texto;
    if (entrada) entrada.setAttribute("aria-invalid", "true");
  });
}

function definirStatus(texto, tipo) {
  status.textContent = texto;
  status.className = `formulario-status ${tipo ? `is-${tipo}` : ""}`.trim();
}

form?.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  limparErros();
  definirStatus("", "");

  const botao = form.querySelector("button[type='submit']");
  const textoOriginal = botao.innerHTML;
  botao.disabled = true;
  botao.textContent = "Enviando...";

  try {
    const destino = new URL(form.getAttribute("action"), window.location.href);
    const resposta = await fetch(destino, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" },
    });

    const dados = await resposta.json().catch(() => ({
      ok: false,
      message: "Não foi possível ler a resposta do servidor.",
    }));

    if (!resposta.ok || !dados.ok) {
      if (dados.erros) mostrarErros(dados.erros);
      definirStatus(dados.message || "Não foi possível enviar a mensagem.", "erro");
      return;
    }

    form.reset();
    definirStatus(dados.message, "ok");
  } catch {
    definirStatus("Falha de conexão. Verifique sua rede e tente de novo.", "erro");
  } finally {
    botao.disabled = false;
    botao.innerHTML = textoOriginal;
  }
});
