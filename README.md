# DELTA RPG — Ficha de Personagem

Site de fichas de RPG com estética de pixel art inspirada nos menus de Deltarune.

## Interface
- Organização original: personagem à esquerda, quatro atributos à direita, HP/TP logo abaixo.
- **Força**, **Defesa**, **Inteligência** e **Agilidade** começam em **1**.
- Alma vazia no início e gradualmente colorida conforme pontos adicionais; mistura tonalidades no círculo cromático (vermelho, verde, azul e amarelo).
- Animação pixel art de pétalas ao redor da alma.
- Nome e nível editáveis, sem campo de classe/título/raça.

## Cálculos
- HP máximo: `20 + (Defesa × 4)`
- TP máximo: `100`
- TP ganho por ação: `10 × [1 + (Inteligência × 0,05) + (Agilidade × 0,02)]`

## Habilidades e Inventário
- Aba **Habilidades**: lista de técnicas personalizadas no estilo de menu de batalha, custo em **% de TP máximo**, nome, ícone e descrição. Botões Adicionar, Editar, Remover e Utilizar (desconta TP atual).
- Aba **Inventário**: itens individuais com nome, categoria, quantidade e descrição. Botões Adicionar, Editar e Remover.
- Seus registros são salvos no navegador usando `localStorage` e preservados ao reabrir o site no mesmo navegador.
- A primeira abertura tenta importar dados anteriores das versões v1/v2.

## Exportar
- Botões para exportar a ficha para imagem PNG e PDF, incluindo as abas e as descrições.
- A exportação utiliza html2canvas e jsPDF carregados via CDN e requer acesso à internet para essas bibliotecas.

## Publicação
O repositório utiliza GitHub Actions para publicar o `index.html` na branch `main` pelo GitHub Pages.

**Site:** https://matheuz55peri-tech.github.io/Deltarune-RPG/

Os dados são individuais de cada navegador/dispositivo. Ainda não existe sincronização entre jogadores, login nem servidor compartilhado.
