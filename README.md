# DELTA RPG — Ficha de personagem

Site de fichas inspirado visualmente em menus de RPGs de pixel art, publicado no GitHub Pages.

**Site:** https://matheuz55peri-tech.github.io/Deltarune-RPG/

## Personagem e recursos
- Atributos começam em 1: **Força, Defesa, Inteligência e Agilidade**.
- A alma começa vazia, colore-se de acordo com a distribuição de pontos extras e mistura matizes na roda de cores.
- Pétalas pixeladas animadas ao redor da alma.
- **HP máximo:** `20 + 4 × Defesa` (considerando buffs temporários de Defesa).
- **TP máximo:** 100.
- **Ganho de TP por ação:** `10 × (1 + 0,05 × Inteligência + 0,02 × Agilidade)` (também considera buffs temporários de atributos).
- HP pode ser curado em quantidade definida, completamente ou com habilidade de Cura. O botão **Habilidades de cura** abre a aba com o filtro ativado.
- Buff de HP cria uma barra de HP temporário, na cor da alma; esse HP absorve dano antes do HP normal.

## Habilidades
Use **Adicionar habilidade** para criar técnicas em uma das três categorias:
- **Dano (vermelho):** custo em % de TP, ícone, valor de dano e descrição. Ao utilizar, gasta TP e informa dano para aplicar ao alvo.
- **Cura (verde):** custo em % de TP, valor de HP recuperado e descrição. Ao utilizar, gasta TP e recupera HP normal até o máximo.
- **Buff (roxo):** custo em % de TP, atributo-alvo (**Força, Defesa, Inteligência, Agilidade ou HP temporário**), magnitude e duração em turnos.

O botão **Passar turno** reduz a duração de buffs ativos. Ao chegar a zero, o buff termina. Também é possível encerrá-lo manualmente. O mesmo buff relançado renova seu valor e duração (não acumula com ele próprio). Buffs de atributo exibem `+n` ao lado do atributo; o valor base permanece editável e intacto.

## Inventário
Crie itens com nome, tipo, quantidade e descrição nas abas de inventário.

## Dados e exportação
- Ficha, habilidades, inventário e buffs são salvos individualmente via `localStorage` no dispositivo.
- A versão 4 mantém a chave de armazenamento `delta-rpg-character-v3` para preservar dados já criados na versão anterior.
- Exportação para PNG e PDF (usando bibliotecas de terceiros via CDN; exigem internet para carregamento).

## Publicação
O workflow em `.github/workflows/pages.yml` publica automaticamente a branch `main` no GitHub Pages.

Este site **não** sincroniza dados entre dispositivos nem tem contas ou servidor multiplayer.
