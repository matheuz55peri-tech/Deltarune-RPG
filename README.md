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

## Portal oculto e baús (v14)

O botão com o **olho** fica discretamente no canto inferior do site. Ao clicar,
o olho amplia e a interface oculta `O OUTRO LADO` cobre a ficha, com a ação
**VOLTAR AO NORMAL** (ou Esc) para voltar às abas do personagem.

Há cinco categorias de baús: **Taràrê** (cidade do ouro), **Rubi**
(floresta avermelhada), **Carpas** (floresta das escamóides),
**Desértico** (terras áridas) e **Deslocado** (todos os mundos sombrios).

O **Baú de Taràrê** possui uma primeira animação de tampa abrindo ao acionar
**ABRIR BAÚ**. Os demais baús estão visíveis e podem ser selecionados, mas
não têm abertura implementada ainda. **Não existe tabela de loot nesta versão**,
portanto nenhuma recompensa é gerada ou distribuída.

A interface referencia **assets/secret/eye.gif** (olho original animado, fundo
removido) e **assets/secret/realm.mp4** (vídeo de fundo fornecido), que são
arquivos de mídia binários. Se esses arquivos ainda não estiverem publicados,
o site utiliza o fallback **assets/secret/eye.svg** para o olho e o fundo
escuro do portal; a navegação e a seleção de baús continuam funcionando.
O pacote de mídia disponibilizado separadamente contém os dois arquivos
prontos para colocar na pasta `assets/secret/` do repositório.


## Importar itens do Codex Arcano (v15)

A aba **Inventário** oferece **⇧ IMPORTAR DO CODEX** para escolher arquivos JSON no formato codex-item-v1, exportados pelo [Ateliê de Itens](https://matheuz55peri-tech.github.io/Index-de-itens/studio.html). A wiki também pode transferir um item diretamente pelo botão **♥ Enviar ao Delta RPG**, usando armazenamento local compartilhado no mesmo domínio GitHub Pages.

A importação cria uma nova entrada no inventário do FILE ativo com nome, descrição, quantidade, tipo, peso, dados de dano e bônus ao equipar. Uma miniatura PNG do item é exibida na ficha e preservada no FILE, na duplicação e na exportação de .deltarpg. A integração não altera os atributos-base do personagem. O recebimento automático exige o mesmo navegador/perfil; o JSON funciona como alternativa transferível entre navegadores.

## Sala do Mestre — sincronização automática sem Firebase (2026-10)

Na aba **FILES**, o painel **SALA DO MESTRE** (também acessível pelo cabeçalho) permite editar os personagens dos jogadores em tempo real:

1. O mestre seleciona **CRIAR SALA** e **COPIAR CONVITE**.
2. Cada jogador abre o link, escolhe seu FILE atual e seleciona **CONECTAR MINHA FICHA**.
3. O mestre vê uma ficha por jogador. A Sala do Mestre procura automaticamente nos FILES pelo **nome do personagem** (qualquer nome, sem lista fixa; desconsidera maiúsculas, espaços duplicados e acentos). Se já houver um FILE correspondente, ele é vinculado **sem criar uma cópia e sem apagar as alterações do mestre**; caso não exista, cria apenas um novo FILE. Em caso de nomes duplicados e identificação ambígua, a associação é recusada para proteger as fichas.
4. **ABRIR E EDITAR** abre o FILE encontrado no editor existente. Alterações salvas pelo mestre chegam ao jogador. Alterações feitas pelo jogador retornam ao **mesmo FILE**, sem recriar fichas a cada salvamento ou reconexão.
5. O código é lembrado no navegador, e uma perda de conexão inicia tentativas de reconexão. Cada pessoa continua com os próprios FILES locais.

**Limites importantes:** usa PeerJS/WebRTC e comporta até cinco jogadores. A troca de atualizações só ocorre enquanto os dois navegadores estão online; não é armazenamento em nuvem. Ao reconectar, a versão que ficou no mestre é priorizada (salvo quando há histórico que permite aplicar com segurança uma edição offline do jogador). Se a ficha local do jogador for diferente, sua versão anterior é guardada em um **único backup local substituível por FILE**, fora da lista principal de FILES, com botão para exportar um arquivo compatível .deltarpg. Assim, reconexões não multiplicam FILES. Caso não seja possível salvar o backup, a sincronização é interrompida. Evite compartilhar dados pessoais. Algumas redes podem bloquear WebRTC. O antigo arquivo Firebase continua acessível em **Outras formas de compartilhar → Arquivo Firebase (avançado)**.

Implementação: assets/master-room.js, assets/master-room.css e interface DeltaRpgLiveBridge.openFile no index.html.

## Rolagem de iniciativa da Sala do Mestre (outubro de 2026)

- O botão **⚄ ROLAGEM DE INICIATIVA** aparece ao lado das ações da Sala do Mestre **apenas enquanto uma sala está ativa**. Não aparece ao usar FILES locais fora da sala.
- Cada jogador conectado pode clicar em **ROLAR 1D20 + AGL** uma única vez por rodada. O próprio navegador do mestre sorteia o d20 com gerador criptográfico; os jogadores não escolhem nem informam o resultado.
- **AGL** é calculada automaticamente como Agilidade-base da ficha + bônus de Agilidade dos equipamentos equipados + buffs temporários ativos de Agilidade. O valor fica registrado no momento da rolagem.
- Mestre e jogadores veem a mesma tabela sincronizada e atualizada, com nome do personagem, nome do jogador, resultado do d20, bônus de AGL e total. A ordem é decrescente pelo total (desempate por AGL, depois valor do dado e ordem da rolagem).
- O mestre pode clicar **NOVA RODADA** para limpar as rolagens e liberar os botões de todos para rolar novamente.
- A lista fica salva **localmente no navegador do mestre**, vinculada ao código da sala. Reabrir a mesma sala recupera a rodada. Reconexões recebem a classificação atual, sem gerar arquivos FILE adicionais.
- Usa a infraestrutura WebRTC da sala, portanto não há rolagens remotas quando o mestre está offline. O cálculo da rolagem depende de uma conexão ativa.

Implementação isolada: `assets/initiative-room.js`, `assets/initiative-room.css`, com eventos de integração em `assets/master-room.js`.

## Mural de Documentos individual para cada FILE (outubro de 2026)

- O mural é armazenado em `character.muralNotes` dentro de **cada FILE**, identificado pelo ID do slot. Não depende do nome do personagem: FILES distintos, mesmo com o mesmo nome, têm murais separados.
- Ao abrir ou alternar FILES, a aba Mural mostra **somente os bilhetes daquele FILE**. A interface indica o FILE ativo. As notas preservam texto, posição, dimensões, ordem de sobreposição e papel; os demais personagens não recebem cópias acidentais.
- Ao criar um novo FILE, o mural começa vazio. Ao duplicar, a cópia recebe as notas do original, mas passa a ser independente.
- Notas também entram no backup e na exportação/importação `.deltarpg`, e são incluídas nos dados da ficha enviados pelas salas ao vivo e pelo compartilhamento do mestre.
- **Migração sem apagar conteúdo:** o mural antigo, anteriormente compartilhado por todos os FILES, é copiado **uma única vez** para o FILE selecionado na primeira abertura após a atualização, desde que esse FILE não tenha notas. Os dados originais permanecem preservados na chave legada `delta-document-wall-v1` para recuperação. Se o FILE selecionado já tiver notas, elas não serão sobrescritas e os dados legados continuam guardados para importação manual.
- Exportar ou importar o mural separadamente também continua disponível, afetando apenas o FILE atualmente aberto.

O mural segue sujeito aos limites de armazenamento do navegador e, nas salas em tempo real, à conexão entre os participantes.


## Mural de Documentos — formatos, fotos e pins personalizados (outubro de 2026)

- O mural agora oferece quatro formatos: **Bilhete**, **Cartão**, **Etiqueta** e **Foto circular**. Os documentos continuam arrastáveis, redimensionáveis e salvos individualmente em cada FILE.
- A **Foto circular** permite selecionar uma imagem do dispositivo. A foto é reduzida, convertida para JPEG e exibida recortada em um medalhão circular, com legenda. A imagem salva no campo `muralNotes[].image` via data URI compacta, integrada aos FILES, backups, importação/exportação e sincronização enquanto o limite de tamanho da ficha permitir.
- Cada documento possui um **broche clicável** (no cabeçalho). Clicar nele percorre: alfinete clássico, **coração da alma**, **estrela** e **olho ornamental**. Os dois últimos usam recortes vetoriais transparentes feitos das imagens enviadas pelo criador do projeto — `assets/mural-pin-star.svg` e `assets/mural-pin-eye.svg`. Não são figuras geradas ou substituições estilizadas.
- O **coração da alma** usa automaticamente a cor calculada a partir dos pontos extras de atributos daquele personagem no FILE ativo. A cor também acompanha mudanças nos atributos sem modificar os demais FILES.
- Novos documentos começam com o coração como broche. Documentos antigos continuam com o alfinete clássico até que o usuário escolha outro. A seleção do broche e o formato são preservados ao salvar.
- Os novos campos (`kind`, `pin`, `image`) são normalizados e validados pela mesma rotina de salvamento do personagem, sem afetar itens, habilidades, equipamentos, o mural antigo ou os controles de sala.
- Fotos são compactadas no navegador, com limite por foto e limite total de imagens por mural para evitar exceder o armazenamento local e os pacotes das salas ao vivo.


## Raridade opcional de itens (outubro de 2026)

No cadastro ou na edição de qualquer item do inventário, a raridade é opcional e usa **Comum** como padrão. Itens comuns mantêm o fundo original do tema; **Raro** utiliza azul, **Épico** roxo, **Lendário** laranja e **ÚNICO** vermelho, com brilho discreto animado na lateral da barrinha. Reduzir movimento desativa a animação. A raridade aparece na lista e nos detalhes do item e acompanha a ficha em FILES, importações/exportações, PDF, sincronização entre jogadores e operações de equipar/desequipar. O importador do Codex Arcano reconhece os nomes das raridades em português e inglês.


## Raridade em Equipamentos (outubro de 2026)

O seletor de raridade do inventário e o novo seletor do editor de **Equipamentos** exibem apenas Comum, Raro, Épico, Lendário e ÚNICO, sem descrições das cores. Os fundos dos equipamentos ocupados (inclusive o espaço selecionado e o painel de detalhes) passam a usar a paleta da raridade do item, incluindo a animação discreta para ÚNICO. O comum e os espaços vazios conservam o estilo original do tema; o efeito respeita a configuração de reduzir movimento. Raridades definidas diretamente em Equipamentos também são mantidas no FILE, nas salas e ao devolver o equipamento ao inventário.


## Símbolos originais e opções visuais (outubro de 2026)

As nove imagens fornecidas foram recortadas com transparência e organizadas em um atlas WebP 4×4 (`assets/delta-icon-atlas.webp`). Os símbolos de habilidades são: Defesa (asas verdes), Ataque (emblema dourado), Magia (pergaminhos roxos), Cura (flor branca), Ataque à distância (estrela esverdeada), Invocação (lobos dourados), Auto-debuff (flor atravessada pela espada) e Debuff em inimigos (asas com olho). Esses são **tipos visuais** independentes do cálculo existente de Dano, Cura e Buff. Os seis itens em pixel art foram individualizados e centralizados como opções do editor de Inventário: Pano Rúnico, Capuz Verde, Cajado, Armadura, Cristal e Poção. Os ícones padrão também passam a utilizar essas imagens no Inventário, em Habilidades e nos equipamentos ocupados, enquanto imagens personalizadas recebidas do Codex continuam disponíveis. A seleção acompanha cada FILE, a importação/exportação `.deltarpg` e a sincronização.


## Catálogo de ícones pixel art (outubro de 2026)

Na aba Inventário → Adicionar Item / Editar, o pequeno catálogo de ícones inclui os seis antigos e **189 novos** retirados das imagens enviadas, todos recortados e centralizados sobre transparência. Filtros: Minérios (86), Armas (12), Comidas (8), Recipientes (32), Ingredientes (25) e Outros (26); possui busca e seleção visual. O arquivo `assets/item-icons-sprite.png` organiza as 189 imagens em células independentes de 96px (10 colunas x 19 linhas) para melhorar o carregamento. Os IDs `sprite000` a `sprite188` são armazenados no campo existente `iconAsset`, preservado em FILES, equipamentos, backups, importação/exportação e salas. Os itens antigos continuam funcionando e os ícones personalizados não são sobrepostos pelo importador do Codex.
