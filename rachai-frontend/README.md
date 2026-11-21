# RachAÍ: frontend

Frontend em Next.js do RachAÍ. Ele só exibe, formata e navega. Toda regra e todo cálculo (Saldo, Divisão, ranking) ficam no backend Flask ([inf1041-trabalho-a2](https://github.com/gabrielccaraujo/inf1041-trabalho-a2)), conforme a ADR 0008.

O navegador só conversa com o Next. O Next encaminha `/api/*` para o Flask (rewrite em `next.config.ts`), por isso não há CORS.

```
navegador ──► Next (porta 3000) ──/api/*──► Flask (porta 5000) ──► SQLite
```

## Pré-requisitos

- Node.js 20 ou mais novo
- Python 3.11 ou mais novo
- Os dois repositórios lado a lado:

```
RachAI/
├── inf1041-trabalho-a2/     ← backend
└── RachAI-Frontend/
    └── rachai-frontend/     ← este projeto
```

## Rodar na sua máquina

Na primeira vez, instale as dependências:

```bash
# backend
cd inf1041-trabalho-a2
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt      # Windows
# .venv/bin/pip install -r requirements.txt                  # macOS/Linux

# frontend
cd ../RachAI-Frontend/rachai-frontend
npm ci
```

Depois, em dois terminais:

```bash
# terminal 1: backend em http://127.0.0.1:5000
cd inf1041-trabalho-a2
.venv/Scripts/python -m app.main      # Windows
# .venv/bin/python -m app.main        # macOS/Linux

# terminal 2: frontend em http://localhost:3000
cd RachAI-Frontend/rachai-frontend
npm run dev
```

Abra http://localhost:3000, crie um Grupo e compartilhe o código ou o link. Para conferir se o front alcança o backend, abra http://localhost:3000/health.

Se o backend estiver em outro endereço, defina `FLASK_URL` (padrão `http://127.0.0.1:5000`) antes de `npm run dev`, `npm run build` ou `npm start`.

## Testar

```bash
npm run test:e2e        # roda tudo e mostra o resultado no terminal
npm run test:e2e:ui     # abre a interface do Playwright, para assistir e depurar teste a teste
npx playwright show-report   # relatório HTML da última execução
```

Na primeira vez, baixe o navegador dos testes: `npx playwright install chromium`.

Os testes ficam em `e2e/`, um arquivo por tela, e rodam contra o backend real:

- o Playwright sobe sozinho o Flask, com um banco SQLite novo e temporário (o banco de verdade não é tocado), e o `next dev` na porta 3100;
- se os dois já estiverem rodando, ele reaproveita;
- os dados de cada teste são criados pela API em Grupos novos;
- os testes marcados com `@celular` rodam também numa tela de Pixel 7.

Se o backend estiver em outra pasta, use `BACKEND_DIR=/caminho/do/backend npm run test:e2e`.

Verificações estáticas: `npx tsc --noEmit`, `npm run lint` e `npm run build`.

## Distribuir

Do mais simples para o mais completo:

1. **Outra pessoa roda na máquina dela:** ela clona os dois repositórios e segue "Rodar na sua máquina". É o caminho para quem vai avaliar ou desenvolver.
2. **Mostrar para alguém por um link temporário, sem publicar nada:** rode os dois servidores na sua máquina e abra um túnel só para o Next, por exemplo `cloudflared tunnel --url http://localhost:3000` (Cloudflare Quick Tunnel, sem conta). O link fica no ar enquanto o seu computador e o comando estiverem ligados. O Flask não precisa ficar exposto, porque o Next faz a ponte.
3. **Publicar de verdade:** o frontend vai na Vercel, com a variável `FLASK_URL` apontando para o backend publicado. Ela precisa estar definida no build, porque o rewrite é gravado no build. O backend vai num serviço que rode Python, como o Render. Para isso, o backend ainda precisa de ajustes que hoje ele não tem: servidor de produção (por exemplo gunicorn), escutar em `0.0.0.0` na porta que o serviço define, e um disco persistente para o SQLite.

## Estrutura

- `lib/api/`: a única camada que fala com a API (tipos derivados de `app/routes/` do backend, cliente e erros 400/404/422).
- `lib/`: formatação de R$ e data, "quem sou eu" (localStorage) e carga de dados.
- `components/ui/`: design system (cartão de vidro, botão, campo, seleção, etiqueta, valores, barra de progresso, avisos de erro).
- `components/grupo/`: as telas do Grupo e o contexto que as alimenta.
- `app/`: rotas (`/`, `/grupos/[id]` e as abas Despesas, Saldos, Pagamentos, Vaquinhas e Apoiadores).
- `e2e/`: testes Playwright.
