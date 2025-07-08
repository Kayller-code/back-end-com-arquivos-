const fastify = require("fastify");
const fastifyStatic = require("@fastify/static");
const path = require("path");
// Para usar fs com promessas no CommonJS, você pode fazer:
const fs = require("fs").promises; // Ou usar callbacks com o fs normal

const server = fastify();

server.register(fastifyStatic, {
  root: path.join(process.cwd(), "public"),
  prefix: "/",
});

server.post("/", (request, reply) => {
  const { nome, email, mensagem } = request.body;

  const info = {
    nome,
    email,
    mensagem,
  };
  const json = JSON.stringify(info, null, 2);

  const NomeArquivoI = nome.replace(/[^a-zA-Z0-9]/g, "_");
  const NomeArquivoF = path.join("dados", `${NomeArquivoI}.json`);

  try {
    fs.writeFile(NomeArquivoF, json);
    console.log("arquivo criado");
    reply.send({ mensagem: "Arquivo criado com sucesso" });
  } catch (err) {
    console.log("arquivo não foi criado");
    reply.status(500).send({ erro: "Arquivo não foi criado" });
  }
});

server.get("/resposta", async (request, reply) => {
  const { nome } = request.query;

  if (!nome) {
    return reply.status(400).send({ erro: "Parâmetro 'nome' é obrigatório" });
  }

  // Isso aqui não costuma dar erro grave, a não ser que 'nome' seja algo muito estranho,
  // mas o replace já ajuda a limpar.
  const NomeArquivoI = nome.replace(/[^a-zA-Z0-9]/g, "_");

  const pastaDados = path.join(__dirname, "dados");
  const NomeArquivoF = path.join(pastaDados, `${NomeArquivoI}.json`);

  // --- AQUI COMEÇA A PARTE ONDE ERROS PODEM ACONTECER ---
  try {
    // PONTO 1: Acessar a pasta 'dados'
    // O QUE PODE DAR ERRADO: A pasta 'dados' não existe, ou o servidor não tem permissão para lê-la.
    // COMO O ERRO SE MANIFESTA: Geralmente um erro do tipo ENOENT (Entry NOt ENtry) ou de permissão.
    await fs.access(pastaDados);

    // PONTO 2: Ler o arquivo JSON
    // O QUE PODE DAR ERRADO: O arquivo especificado por NomeArquivoF não existe.
    // COMO O ERRO SE MANIFESTA: Novamente, ENOENT é o mais comum aqui.
    const data = await fs.readFile(NomeArquivoF, "utf8");

    // PONTO 3: Converter o conteúdo do arquivo para JSON
    // O QUE PODE DAR ERRADO: O conteúdo do arquivo existe, mas não é um JSON válido (ex: é um texto qualquer, ou um JSON malformado).
    // COMO O ERRO SE MANIFESTA: Um SyntaxError.
    const jsonData = JSON.parse(data);

    // Se TUDO deu certo até aqui, envia os dados.
    reply.send(jsonData);
  } catch (error) {
    // --- ONDE VOCÊ TRATA OS ERROS ---
    // O 'error' é a "ficha" do problema que aconteceu.

    // Isso é FUNDAMENTAL: Registre o erro completo para você.
    // Assim, quando um erro acontecer em produção, você sabe EXATAMENTE o que foi.
    server.log.error("Erro detalhado na rota /resposta:", error);

    // Agora, vamos perguntar à "ficha" (ao objeto 'error') qual foi o problema:

    // PERGUNTA 1: O erro é sobre um arquivo/pasta que não foi encontrado?
    if (error.code === "ENOENT") {
      // Se sim, diga ao cliente que o arquivo não existe.
      reply.status(404).send({ Erro: "Arquivo não encontrado" });
    }
    // PERGUNTA 2: O erro é sobre o JSON estar mal formatado?
    else if (error instanceof SyntaxError) {
      // Se sim, diga ao cliente que o arquivo está inválido.
      reply.status(500).send({ Erro: "Arquivo invalido (JSON malformado)" }); // Adicionei a especificação.
    }
    // PERGUNTA 3: É qualquer outro tipo de erro que não previmos?
    else {
      // Se sim, dê uma mensagem genérica de erro interno.
      // É importante não expor detalhes técnicos sensíveis aqui.
      reply.status(500).send({ error: "Erro interno do servidor." });
    }
  }
});
server.listen({ port: 3000 }, (err) => {
  if (err) {
    console.error(err);
  }
  console.log(`Servidor rodando: http://localhost:3000`);
});
