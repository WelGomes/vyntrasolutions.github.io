<?php

declare(strict_types=1);

$config = require __DIR__ . '/config.php';

ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');

function responder(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function tamanho(string $texto): int
{
    return function_exists('mb_strlen') ? mb_strlen($texto) : strlen($texto);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    responder(405, ['ok' => false, 'message' => 'Método não permitido.']);
}

$host = explode(':', $_SERVER['HTTP_HOST'] ?? '')[0];
$origem = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origem !== '' && parse_url($origem, PHP_URL_HOST) !== $host) {
    responder(403, ['ok' => false, 'message' => 'Origem não permitida.']);
}

if (trim((string) ($_POST['website'] ?? '')) !== '') {
    responder(200, ['ok' => true, 'message' => 'Mensagem enviada. Em breve entro em contato.']);
}

$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$arquivoLimite = sys_get_temp_dir() . '/wg_contato_' . hash('sha256', $ip);
$agora = time();
$janela = 600;
$limite = 5;
$tentativas = [];

if (is_file($arquivoLimite)) {
    $linhas = file($arquivoLimite, FILE_IGNORE_NEW_LINES) ?: [];
    foreach ($linhas as $linha) {
        $registro = (int) $linha;
        if (($agora - $registro) < $janela) {
            $tentativas[] = $registro;
        }
    }
}

if (count($tentativas) >= $limite) {
    responder(429, [
        'ok' => false,
        'message' => 'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
    ]);
}

$nome = trim((string) ($_POST['nome'] ?? ''));
$email = trim((string) ($_POST['email'] ?? ''));
$telefone = trim((string) ($_POST['telefone'] ?? ''));
$mensagem = trim((string) ($_POST['mensagem'] ?? ''));
$erros = [];

if (tamanho($nome) < 2 || tamanho($nome) > 80 || preg_match('/[\r\n]/', $nome)) {
    $erros['nome'] = 'Informe seu nome.';
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || preg_match('/[\r\n]/', $email)) {
    $erros['email'] = 'Informe um e-mail válido.';
}

if ($telefone !== '' && !preg_match('/^[0-9+\-\s()]{8,20}$/', $telefone)) {
    $erros['telefone'] = 'Informe um telefone válido.';
}

if (tamanho($mensagem) < 10 || tamanho($mensagem) > 4000) {
    $erros['mensagem'] = 'Descreva sua necessidade com pelo menos 10 caracteres.';
}

if ($erros !== []) {
    responder(422, [
        'ok' => false,
        'message' => 'Revise os campos destacados.',
        'erros' => $erros,
    ]);
}

$nomeCabecalho = str_replace(['\r', '\n', "\r", "\n"], ' ', $nome);
$assunto = $config['assunto_prefixo'] . 'Contato de ' . $nomeCabecalho;
$corpo = implode("\n", [
    'Nova mensagem pelo site da Vyntra Solutions',
    '',
    'Nome: ' . $nome,
    'E-mail: ' . $email,
    'Telefone: ' . ($telefone !== '' ? $telefone : 'não informado'),
    '',
    'Mensagem:',
    $mensagem,
    '',
]);

$headers = implode("\r\n", [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'From: ' . $config['remetente_nome'] . ' <' . $config['remetente'] . '>',
    'Reply-To: ' . $nomeCabecalho . ' <' . $email . '>',
]);

$assuntoCodificado = '=?UTF-8?B?' . base64_encode($assunto) . '?=';
set_error_handler(static fn (): bool => true);
$enviado = mail($config['destinatario'], $assuntoCodificado, $corpo, $headers);
restore_error_handler();

$tentativas[] = $agora;
file_put_contents($arquivoLimite, implode("\n", $tentativas));

if (!$enviado) {
    responder(500, [
        'ok' => false,
        'message' => 'Não foi possível enviar agora. Use o WhatsApp ou tente de novo em instantes.',
    ]);
}

responder(200, [
    'ok' => true,
    'message' => 'Mensagem enviada. Em breve entro em contato.',
]);
