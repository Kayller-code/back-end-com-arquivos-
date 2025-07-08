const form = document.getElementById("form");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const dados = new FormData(form);
    const info = {
      nome: dados.get("nome"),
      email: dados.get("email"),
      mensagem: dados.get("mensagem"),
    };
    const response = await fetch("/", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(info),
    });
    const data = await response.json();
    console.log("Resposta do backend:", data);

    form.reset();
  } catch {
    console.error("Erro, ", error);
  }
});
