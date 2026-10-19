const whatsappNumero = "31994410565";

const topo = document.querySelector("#topo");
const menuBotao = document.querySelector(".menu-botao");
const menu = document.querySelector("#menu");
const ano = document.querySelector("#ano");
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
