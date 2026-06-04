/**
 * apps-script.gs — Backend da Anamnese de Leads TRINUS.
 *
 * COMO USAR (resumo — detalhe no README.md):
 *  1. Cria uma Google Sheet nova.
 *  2. Extensões → Apps Script. Cola este ficheiro inteiro.
 *  3. Ajusta CONFIG abaixo (e-mail e WhatsApp).
 *  4. Implementar → Nova implementação → App Web:
 *       Executar como: Eu  |  Quem tem acesso: Qualquer pessoa
 *  5. Copia a URL do App Web → cola em config.js (APPS_SCRIPT_URL).
 */

var CONFIG = {
  SHEET_NAME: 'Leads',
  // E-mail que recebe o alerta de cada novo lead.
  NOTIFY_EMAIL: 'integramarcus@gmail.com',
  // true → envia e-mail a cada lead (com link de 1 clique para o WhatsApp dele).
  NOTIFY_ON_NEW_LEAD: true,
};

// Ordem das colunas na planilha (cabeçalho criado na 1ª execução).
var COLUMNS = [
  'data_envio', 'nome_completo', 'email', 'codigo_pais', 'whatsapp', 'whatsapp_link',
  'data_nascimento', 'sexo', 'cidade', 'profissao',
  'objetivo', 'motivacao_principal', 'prazo', 'tentou_antes',
  'altura_cm', 'peso_avaliacao', 'percentual_gordura',
  'lesoes_anteriores', 'condicoes_medicas', 'liberacao_medica', 'dor_movimento', 'gestante',
  'nivel', 'tempo_treino', 'local_treino', 'frequencia_semanal', 'tempo_sessao', 'horario_treino', 'equipamentos',
  'qualidade_sono', 'nivel_stress', 'alcool', 'fuma', 'prioridade', 'acompanhamento', 'orcamento', 'observacoes',
  'consentimento',
];

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    var sheet = getSheet_();
    var waLink = buildWhatsAppLink_(data.codigo_pais, data.whatsapp);

    var record = {
      data_envio: new Date(),
      whatsapp_link: waLink,
    };
    COLUMNS.forEach(function (col) {
      if (record[col] === undefined) record[col] = data[col] != null ? data[col] : '';
    });

    var row = COLUMNS.map(function (col) { return record[col]; });
    sheet.appendRow(row);

    if (CONFIG.NOTIFY_ON_NEW_LEAD) notify_(data, waLink);

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS);
    sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function buildWhatsAppLink_(code, number) {
  var digits = String((code || '') + (number || '')).replace(/\D/g, '');
  return digits ? 'https://wa.me/' + digits : '';
}

function notify_(data, waLink) {
  var nome = data.nome_completo || 'Lead sem nome';
  var subject = '🔱 Novo lead TRINUS: ' + nome + ' — ' + (data.objetivo || '');
  var lines = [
    'Novo lead recebido pela anamnese.',
    '',
    'Nome: ' + nome,
    'E-mail: ' + (data.email || '-'),
    'WhatsApp: ' + (data.codigo_pais || '') + ' ' + (data.whatsapp || '-'),
    'Objetivo: ' + (data.objetivo || '-') + ' (prazo: ' + (data.prazo || '-') + ')',
    'Onde treina: ' + (data.local_treino || '-') + ' · ' + (data.frequencia_semanal || '-') + ' dias/semana',
    'Acompanhamento: ' + (data.acompanhamento || '-'),
    'Prioridade (1-10): ' + (data.prioridade || '-'),
    'Lesões: ' + (data.lesoes_anteriores || 'Nenhuma'),
    '',
    waLink ? ('👉 Responder no WhatsApp: ' + waLink) : '',
  ];
  MailApp.sendEmail({
    to: CONFIG.NOTIFY_EMAIL,
    subject: subject,
    body: lines.join('\n'),
  });
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Permite testar a URL no browser (GET) sem erro.
function doGet() {
  return json_({ ok: true, service: 'anamnese-lead', ts: new Date() });
}
