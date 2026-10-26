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

O site salva FILES localmente e oferece **sessões AO VIVO** opcionais entre navegadores abertos. Não há contas nem armazenamento permanente em nuvem.

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

**Importante:** os FILES continuam locais. A sincronização entre dispositivos funciona somente enquanto estiverem na mesma sala AO VIVO; ela não substitui backup. Exporte backups antes de limpar o navegador.


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

## Atributos opcionais nos itens (v12)

Em **Inventário → ADICIONAR ITEM** ou **EDITAR**, a seção **ATRIBUTOS AO EQUIPAR (OPCIONAL)**
permite acrescentar até 8 bônus de **Força, Defesa, Inteligência e Agilidade**.
A mochila mostra quais itens possuem bônus, mas não altera a ficha enquanto estiverem guardados.

Ao equipar uma unidade em **Equipamentos**, os bônus daquele item são aplicados
automaticamente ao personagem, separadamente dos atributos-base e dos buffs temporários.
Ao desequipar, o bônus deixa de contar e o item retorna à mochila com as mesmas propriedades.
Vários itens equipados acumulam seus bônus; a Defesa atualiza o HP máximo, e a Inteligência
e a Agilidade atualizam o ganho de TP.

Os bônus são opcionais (um item pode ter zero) e seguem o item nos FILES, ao importar/exportar
um arquivo `.deltarpg` e no PDF da ficha (bônus de itens guardados aparecem como
*ao equipar*, sem serem somados aos atributos do personagem).


## Chuva do Jardim Azul — ondinhas (v13)

No tema **Jardim Azul**, gotas pixeladas de chuva agora produzem ondas
concêntricas translúcidas em diferentes regiões da tela, como água atingindo
um vidro ou uma poça. **Clicar/tocar** em qualquer parte da página também
cria uma ondinha maior, inclusive nos menus, sem bloquear a interação.
O efeito é desligado ao mudar de tema e respeita a opção de reduzir movimento.

## AO VIVO — edição de ficha em vários dispositivos (v13)

1. Abra o FILE desejado no dispositivo anfitrião e clique em **AO VIVO → CRIAR SALA**.
2. Copie o código aleatório de **20 caracteres** mostrado no painel.
3. Nos outros navegadores, abra o mesmo site e acesse **AO VIVO → ENTRAR**,
   digitando esse código.
4. Cada convidado recebe **uma cópia independente** da ficha compartilhada
   nos seus próprios FILES; outros personagens não são sobrescritos.
5. Edições de HP, TP, atributos, itens, equipamentos, habilidades e buffs
   da ficha da sala são enviadas automaticamente entre participantes.
6. O anfitrião distribui as atualizações. Se houver edições simultâneas,
   a última alteração recebida prevalece. Apenas o FILE da sessão é compartilhado.
7. Pressionar **DESCONECTAR** encerra sua participação. Fechar o navegador
   anfitrião encerra a sala; cada participante conserva seu FILE local.

**Limitações:** usa [PeerJS](https://peerjs.com/) 1.5.5, WebRTC e PeerServer Cloud
para sinalização inicial (até **5 convidados**). Não é um banco de dados:
**não sincroniza quando os participantes estão offline**, nem mantém salas
abertas permanentemente. Certas redes podem impedir conexões diretas. A
disponibilidade do serviço de sinalização externo não é garantida.

**Privacidade:** o código da sala autoriza acesso de edição ao FILE.
Compartilhe-o somente com pessoas confiáveis, evite informações pessoais
e exporte backups dos arquivos. Para sincronização permanente entre acessos,
é necessário um backend próprio com autenticação e banco de dados.
