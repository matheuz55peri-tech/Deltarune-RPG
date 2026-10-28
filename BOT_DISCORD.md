# Bot de novidades — Delta RPG

Um bot de Discord para anunciar automaticamente alterações do site https://matheuz55peri-tech.github.io/Deltarune-RPG/ após uma publicação bem-sucedida no GitHub Pages.

## Ativação (uma vez)

1. Entre em https://discord.com/developers/applications e crie uma aplicação chamada Delta RPG.
2. Abra a página Bot da aplicação e copie o token do bot. Não compartilhe esse token com ninguém.
3. Em Installation, configure a instalação no servidor com o escopo bot e as permissões View Channels, Send Messages e Embed Links. Adicione a aplicação ao seu servidor e permita o acesso ao canal desejado.
4. No Discord, ative Configurações > Avançado > Modo desenvolvedor. Clique com o botão direito no canal de texto para copiar o ID do canal.
5. No repositório, abra Settings > Secrets and variables > Actions > New repository secret e adicione:
   - DISCORD_BOT_TOKEN: token do bot no Discord Developer Portal.
   - DISCORD_CHANNEL_ID: ID numérico do canal escolhido.
6. Pronto: após a próxima atualização real do site publicada com sucesso na branch main, o bot enviará uma mensagem com novidades e um botão para abrir o Delta RPG.

## O que o bot faz

- Aguarda o workflow Publicar no GitHub Pages terminar com sucesso.
- Compara o novo deploy com o deploy bem-sucedido anterior.
- Separa as mensagens dos commits em Novidades, Correções e Melhorias.
- Envia um cartão formatado no Discord, com links para jogar e para conferir o histórico de alterações.
- Ignora novas publicações da mesma versão e alterações apenas nos arquivos de manutenção.

Para ter anúncios mais claros, escreva os commits assim:

- feat: Adiciona novos ícones de habilidades
- fix: Corrige a sincronização das fichas
- style: Melhora as bordas dos equipamentos

Não é preciso deixar seu computador ligado. Não é necessário hospedar o bot, pois o GitHub Actions executa o anúncio. Caso falte a configuração, ele não envia nada e o site continua funcionando normalmente.

Você pode conferir a execução e os erros na aba Actions > Avisar atualizações do Delta RPG no Discord.

O bot usa a API oficial do Discord (não é webhook) e não precisa da permissão Message Content Intent.
