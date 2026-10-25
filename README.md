# DELTA RPG — Ficha de Personagem

Ficha interativa de RPG, inspirada na estética de Deltarune.

## Funcionalidades

- Fundo animado incluído dentro do `index.html` (dispensa arquivos de imagem externos).
- Nome, título, nível e atributos editáveis.
- **HP máximo:** `20 + Defesa × 4`.
- **TP máximo:** `100`.
- **TP por ação:** `10 × (1 + Inteligência × 0,05 + Agilidade × 0,02)`.
- Botões para receber dano, restaurar HP, acumular TP e gastar TP.
- Salvamento da ficha no navegador usando `localStorage`.
- Interface responsiva para computadores e celulares.

## Executar

Abra `index.html` diretamente no navegador. Não é necessário instalar dependências.

## Publicar via GitHub Pages

O repositório contém `.github/workflows/pages.yml`. Em **Settings → Pages**, escolha **GitHub Actions** como origem da publicação (caso ainda não esteja habilitado). Depois, a cada atualização da branch `main`, o workflow tenta republicar o site.

Endereço esperado após o primeiro deploy bem-sucedido:
https://matheuz55peri-tech.github.io/Deltarune-RPG/

## Dados dos jogadores

As informações ficam gravadas **somente no navegador e dispositivo de cada jogador**. O site não sincroniza fichas pela internet e não possui servidor de contas.
