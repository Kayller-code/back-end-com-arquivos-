const info = document.getElementById("info");
const input = document.getElementById("nome");

// Adiciona um "ouvinte" de eventos ao campo de input.
// Sempre que o valor do input mudar (ex: o usuário digitar), esta função será executada.
input.addEventListener("input", async () => {
  // Pega o valor atual que o usuário digitou no campo de input.
  const valor = input.value;

  // --- Início do bloco try...catch para lidar com erros na comunicação com o backend ---
  try {
    // 1. Faz uma requisição assíncrona (fetch) para o seu backend.
    //    `fetch()` é a API moderna do navegador para fazer requisições de rede.
    const response = await fetch(
      // A URL da requisição. Note que usamos `encodeURIComponent(valor)`.
      // Isso é CRUCIAL para garantir que o valor digitado pelo usuário (que pode ter espaços,
      // acentos ou caracteres especiais) seja formatado corretamente para ser enviado na URL
      // como um parâmetro de consulta (`?nome=...`).
      `/resposta?nome=${encodeURIComponent(valor)}`,
      {
        method: "GET", // Especifica que é uma requisição GET (para buscar dados).
        headers: {
          // Define cabeçalhos da requisição. Embora "Content-Type" não seja estritamente
          // necessário para um GET sem corpo, é uma boa prática para se acostumar.
          "Content-Type": "application/json",
        },
      }
    );

    // 2. Verifica se a resposta da requisição foi bem-sucedida (status HTTP 2xx).
    //    `response.ok` é uma propriedade booleana que é `true` se o status HTTP
    //    estiver na faixa 200-299 (sucesso). Se não for `ok`, significa que houve um erro
    //    no servidor (ex: 404, 500, etc.).
    if (!response.ok) {
      // Se a resposta NÃO foi OK, tenta extrair a mensagem de erro do corpo da resposta.
      // `response.json()` tenta parsear o corpo como JSON.
      // `.catch(() => ({}))` é um truque para garantir que, se o corpo da resposta
      // não for um JSON válido (ex: um erro de texto simples), a promessa não seja rejeitada
      // novamente e `errorData` seja um objeto vazio, evitando um erro adicional aqui.
      const errorData = await response.json().catch(() => ({}));

      // Constrói uma mensagem de erro mais detalhada.
      // Primeiro, tenta usar a propriedade `error` do JSON retornado pelo servidor (ex: `{ "error": "Mensagem do servidor" }`).
      // Se não houver `errorData.error`, usa o status HTTP e a mensagem de status (ex: "Erro 404: Not Found").
      const errorMessage =
        errorData.error || `Erro ${response.status}: ${response.statusText}`;

      // Lança um novo erro com a `errorMessage` construída.
      // Ao lançar um erro aqui, ele será "pego" pelo bloco `catch` mais abaixo.
      throw new Error(errorMessage);
    }

    // 3. Se a resposta foi OK (`response.ok` é true), tenta parsear o corpo da resposta como JSON.
    //    Isso espera que o backend retorne dados no formato JSON.
    const data = await response.json();

    const formatado = `Nome: ${data.nome}<br>Email: ${data.email}<br>Mensagem: ${data.mensagem}`;

    // 4. Se o JSON foi parseado com sucesso, exibe os dados no console do navegador.
    console.log("Dados recebidos", data);

    // 5. Atualiza o conteúdo de um elemento HTML (assumidamente `info`) para exibir os dados.
    //    `JSON.stringify(data, null, 2)` formata o JSON de forma legível (com indentação de 2 espaços).
    info.innerHTML = formatado;
  } catch (error) {
    // --- Bloco catch: Captura qualquer erro que tenha ocorrido dentro do bloco try ---
    // Isso inclui:
    // - Erros de rede (ex: servidor offline, sem conexão à internet).
    // - Erros lançados manualmente pelo `throw new Error()` acima (quando `response.ok` é falso).
    // - Erros ao parsear o JSON (embora `response.json()` geralmente cuide disso, é bom ter o `catch` genérico).

    // Registra o erro no console do navegador para depuração.
    console.error("Houve um problema com a requisição fetch:", error);

    // Atualiza o conteúdo de `info` para exibir uma mensagem de erro para o usuário.
    // Ele tenta usar `error.message` (a mensagem do erro lançado ou do erro de rede).
    // Se `error.message` for nula ou vazia, ele usa uma mensagem genérica.
    info.textContent = `Erro: ${
      error.message || "Não foi possível carregar os dados."
    }`;
  }
});
