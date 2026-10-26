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

## FILES — arquivos de salvamento (v8)

A primeira aba do site é **FILES**. Cada slot contém uma ficha independente e completa:

- **NOVO FILE:** cria um personagem com todos os atributos em 1, mantendo as outras fichas.
- **ABRIR:** seleciona um arquivo e recupera os dados de HP, TP, atributos, inventário, habilidades e Buffs ativos.
- **DUPLICAR:** cria uma cópia independente do personagem escolhido.
- **RENOMEAR:** altera apenas o nome do slot (não o nome do personagem).
- **EXCLUIR:** pede confirmação e remove o arquivo somente deste navegador; não é possível excluir o único slot restante.
- **EXPORTAR:** gera um único arquivo `.deltarpg` (JSON estruturado).
- **IMPORTAR:** recebe um `.deltarpg` compatível e cria um **novo slot**, sem sobrescrever os anteriores.

Os arquivos locais são mantidos automaticamente em `localStorage` com a chave `delta-rpg-save-files-v1`. Na primeira abertura, a ficha única das versões anteriores é convertida em **FILE 01 · ORIGINAL**, para preservar os dados existentes.

**Importante:** os saves não são sincronizados entre dispositivos. Compartilhe ou faça backup exportando um arquivo `.deltarpg`, especialmente antes de limpar os dados do navegador.


## Mundos e áudio (v9)

Escolha um mundo pelo botão **TEMAS** no cabeçalho:

- **Original**, **Neve** (Bosque e Jardim), **Floresta** (Noite e **Cachoeira**)
- **Cosmos**, **Cidade** (Varanda, Metrô, Quarto, Rua Noturna)
- **Jardim Azul** e **Playground Noturno**

Os fundos são imagens e GIFs fornecidos para o projeto e estão em `assets/themes/`. Alguns GIFs foram convertidos para WebP animado, mantendo os quadros e reduzindo o peso das páginas. O fundo de cachoeira é estático porque a referência fornecida também era estática.

### Sons de interface

Dez pequenos efeitos foram recortados do áudio enviado para criar interações ao passar o mouse e selecionar botões, fichas e abas. Use o botão **♫ SOM ON/OFF** para desligar, ou o controle de volume no painel de temas. Os arquivos ficam em `assets/sfx/`. O navegador pode exigir um primeiro clique antes de permitir som ao passar o mouse.

As preferências visuais e sonoras ficam em chaves separadas do sistema de FILES. Assim, mudar de tema ou desativar os sons não modifica nenhum personagem.

## Equipamentos (v10)

A aba **Equipamentos**, entre Inventário e Habilidades, oferece **nove espaços independentes**: Capacete, Peitoral, Calça, Botas, Colar, Anel I, Anel II, Arma e Escudo.

Cada equipamento possui nome, peso em kg, categoria comum ou de dano, e até oito linhas de **aumentos de atributo**. Equipamentos de dano também têm campo de dados de dano (por exemplo, `2d6+3`). Os aumentos de Força, Defesa, Inteligência e Agilidade são **cumulativos**, apresentados na ficha como `+N`, separadamente dos pontos-base. Ao alterar a Defesa, HP máximo é recalculado mantendo a quantidade de vida que faltava; Inteligência e Agilidade também alteram o ganho de TP.

Os equipamentos ficam salvos no **FILE ativo** e são mantidos ao duplicar, exportar e importar arquivos `.deltarpg`, sem afetar outros personagens. A exportação PDF A4 inclui uma seção de equipamentos, com bônus, peso e dados de dano.

## Integração Inventário ↔ Equipamentos (v11)

- A mochila mostra um botão **✦** ao lado dos itens para equipá-los no primeiro espaço apropriado disponível.
- Selecionar um item permite escolher manualmente o espaço de equipamento; o botão **ADICIONAR EQUIPAMENTO** abre a área de equipamento.
- Equipar transfere **uma unidade** do inventário para o slot, sem duplicar; desequipar devolve **uma unidade** à mochila.
- Um resumo **✦ EQUIPADOS** aparece no inventário. Os itens em uso também aparecem na aba Equipamentos.
- Três novos espaços: **ARTEFATO I**, **ARTEFATO II** e **ARTEFATO III** (12 slots no total).
- Armas, armaduras e artefatos podem ter peso, descrição, dados de dano e bônus de atributos personalizados; são mantidos ao guardar no FILE, duplicar, exportar e importar.
- Pontos extras de Defesa e demais atributos são aplicados apenas enquanto o item estiver equipado.
