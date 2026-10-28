'use strict';

const {
  GITHUB_REPOSITORY: repo,
  DEPLOY_SHA: sha,
  DEPLOY_RUN_ID: runId,
  GH_TOKEN: githubToken,
  DISCORD_BOT_TOKEN: discordToken,
  DISCORD_CHANNEL_ID: channelId,
} = process.env;

const siteUrl = 'https://matheuz55peri-tech.github.io/Deltarune-RPG/';

async function github(path) {
  const response = await fetch('https://api.github.com/repos/' + repo + path, {
    headers: {
      Authorization: 'Bearer ' + githubToken,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'delta-rpg-discord-announcer'
    },
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) throw new Error('GitHub API HTTP ' + response.status + ': ' + (await response.text()).slice(0, 250));
  return response.json();
}

function maintenanceFile(path) {
  return path.startsWith('.github/') ||
    path.startsWith('scripts/discord-updates') ||
    path === 'BOT_DISCORD.md' || path === 'README.md' ||
    path.startsWith('docs/') || /^(LICENSE|\.gitignore)/i.test(path);
}

function summary(commits) {
  const groups = { novidades: [], correcoes: [], melhorias: [] };
  for (const commit of commits.slice().reverse()) {
    const message = (commit.commit?.message || '').split('\n')[0].trim();
    if (!message || /^(chore|docs|ci|build|test)(\([^)]+\))?:/i.test(message)) continue;
    const type = /^fix(\([^)]+\))?:/i.test(message) ? 'correcoes' :
      /^(refactor|perf|style)(\([^)]+\))?:/i.test(message) ? 'melhorias' : 'novidades';
    const clean = message.replace(/^[a-z]+(?:\([^)]+\))?!?:\s*/i, '').replace(/\s+/g, ' ').slice(0, 185);
    if (clean && !groups[type].includes(clean)) groups[type].push(clean);
    if (Object.values(groups).reduce((n, list) => n + list.length, 0) >= 10) break;
  }
  const sections = [
    ['✨ **Novidades**', groups.novidades],
    ['🛠️ **Correções**', groups.correcoes],
    ['🎨 **Melhorias**', groups.melhorias]
  ].filter(part => part[1].length).map(part => part[0] + '\n' + part[1].map(item => '• ' + item).join('\n'));
  return sections.join('\n\n') || '• Melhorias e ajustes no site.';
}

async function main() {
  if (!discordToken || !channelId) {
    console.log('Configure DISCORD_BOT_TOKEN e DISCORD_CHANNEL_ID nos secrets do repositório.');
    return;
  }
  if (!repo || !sha || !runId || !githubToken) throw new Error('Faltam variáveis de contexto do GitHub Actions.');

  const data = await github('/actions/workflows/pages.yml/runs?branch=main&status=success&per_page=100');
  const runs = data.workflow_runs || [];
  const currentId = Number(runId);
  if (!runs.some(run => Number(run.id) === currentId)) {
    console.log('Deploy não encontrado entre as últimas 100 execuções. Aviso ignorado.');
    return;
  }
  const previous = runs.filter(run => run.conclusion === 'success' && Number(run.id) < currentId)
    .sort((a, b) => Number(b.id) - Number(a.id))[0];

  if (!previous || previous.head_sha === sha) {
    console.log('Nenhuma atualização nova para anunciar.');
    return;
  }

  const diff = await github('/compare/' + previous.head_sha + '...' + sha);
  if (diff.status !== 'ahead' || !diff.total_commits) {
    console.log('Comparação sem novas alterações sequenciais. Aviso ignorado.');
    return;
  }
  if (diff.files?.length && diff.files.every(file => maintenanceFile(file.filename))) {
    console.log('Apenas arquivos de configuração/documentação foram modificados.');
    return;
  }

  const compareUrl = 'https://github.com/' + repo + '/compare/' + previous.head_sha + '...' + sha;
  const payload = {
    allowed_mentions: { parse: [] },
    embeds: [{
      title: '🌸 DELTA RPG — Nova atualização!',
      url: siteUrl,
      description: 'Uma nova atualização do site já está disponível!\n\n' +
        summary(diff.commits || []) + '\n\n**Entre no site e confira as novidades!**',
      color: 0x8b7dec,
      fields: [{ name: '📋 Registro de alterações', value: '[Ver no GitHub](' + compareUrl + ')' }],
      footer: { text: 'Delta RPG • Publicado no GitHub Pages' },
      timestamp: new Date().toISOString()
    }],
    components: [{
      type: 1,
      components: [{ type: 2, style: 5, label: 'Abrir Delta RPG', url: siteUrl }]
    }]
  };
  const response = await fetch('https://discord.com/api/v10/channels/' + encodeURIComponent(channelId) + '/messages', {
    method: 'POST',
    headers: {
      Authorization: 'Bot ' + discordToken,
      'Content-Type': 'application/json',
      'User-Agent': 'DeltaRPG-DiscordBot/1.0'
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) throw new Error('Discord API HTTP ' + response.status + ': ' + (await response.text()).slice(0, 250));
  console.log('Atualização publicada com sucesso no Discord.');
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
