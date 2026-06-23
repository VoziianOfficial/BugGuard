<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| BugGuard Contact Form Handler
|--------------------------------------------------------------------------
| This file receives contact form submissions and saves them into files.
| It is designed for a static/PHP hosting environment.
|--------------------------------------------------------------------------
*/

header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

const SITE_NAME = 'BugGuard';
const STORAGE_DIR = __DIR__ . '/storage';
const JSONL_FILE = STORAGE_DIR . '/bugguard-leads.jsonl';
const CSV_FILE = STORAGE_DIR . '/bugguard-leads.csv';

$allowedServices = [
    'General Pest Control',
    'Rodent Control',
    'Ant & Cockroach Control',
    'Spider Control',
    'Wasp & Hornet Nest Removal',
    'Flea Control',
];

function sendResponse(bool $success, string $message, int $statusCode = 200, array $extra = []): void
{
    http_response_code($statusCode);

    echo json_encode(
        array_merge([
            'success' => $success,
            'message' => $message,
        ], $extra),
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );

    exit;
}

function cleanInput(?string $value): string
{
    $value = trim((string) $value);
    $value = str_replace(["\r", "\0"], '', $value);
    return $value;
}

function limitLength(string $value, int $max): string
{
    if (function_exists('mb_substr')) {
        return mb_substr($value, 0, $max, 'UTF-8');
    }

    return substr($value, 0, $max);
}

function safeCsvCell(string $value): string
{
    $value = trim($value);

    if ($value !== '' && preg_match('/^[=+\-@]/', $value)) {
        return "'" . $value;
    }

    return $value;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, 'Only POST requests are allowed.', 405);
}

$name = cleanInput($_POST['name'] ?? '');
$email = cleanInput($_POST['email'] ?? '');
$phone = cleanInput($_POST['phone'] ?? '');
$service = cleanInput($_POST['service'] ?? '');
$message = cleanInput($_POST['message'] ?? '');
$consent = cleanInput($_POST['consent'] ?? '');

$name = limitLength($name, 90);
$email = limitLength($email, 160);
$phone = limitLength($phone, 40);
$service = limitLength($service, 120);
$message = limitLength($message, 2200);

if ($name === '' || strlen($name) < 2) {
    sendResponse(false, 'Please enter your name.', 422);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendResponse(false, 'Please enter a valid email address.', 422);
}

if ($phone === '' || !preg_match('/^[0-9+\-\s().]{7,40}$/', $phone)) {
    sendResponse(false, 'Please enter a valid phone number.', 422);
}

if (!in_array($service, $allowedServices, true)) {
    sendResponse(false, 'Please choose a valid service category.', 422);
}

if ($message === '' || strlen($message) < 10) {
    sendResponse(false, 'Please describe your pest concern in more detail.', 422);
}

if (!in_array(strtolower($consent), ['on', 'yes', 'true', '1'], true)) {
    sendResponse(false, 'Please confirm consent before submitting.', 422);
}

if (!is_dir(STORAGE_DIR)) {
    if (!mkdir(STORAGE_DIR, 0755, true) && !is_dir(STORAGE_DIR)) {
        sendResponse(false, 'Unable to create storage directory.', 500);
    }
}

$lead = [
    'id' => bin2hex(random_bytes(8)),
    'site' => SITE_NAME,
    'created_at' => date('c'),
    'name' => $name,
    'email' => $email,
    'phone' => $phone,
    'service' => $service,
    'message' => $message,
    'consent' => true,
    'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
    'source_page' => $_SERVER['HTTP_REFERER'] ?? '',
];

$jsonLine = json_encode($lead, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . PHP_EOL;

$jsonHandle = fopen(JSONL_FILE, 'ab');

if ($jsonHandle === false) {
    sendResponse(false, 'Unable to open leads file.', 500);
}

flock($jsonHandle, LOCK_EX);
fwrite($jsonHandle, $jsonLine);
flock($jsonHandle, LOCK_UN);
fclose($jsonHandle);

$csvIsNew = !file_exists(CSV_FILE);

$csvHandle = fopen(CSV_FILE, 'ab');

if ($csvHandle !== false) {
    flock($csvHandle, LOCK_EX);

    if ($csvIsNew) {
        fputcsv($csvHandle, [
            'id',
            'site',
            'created_at',
            'name',
            'email',
            'phone',
            'service',
            'message',
            'ip',
            'source_page',
        ]);
    }

    fputcsv($csvHandle, [
        safeCsvCell($lead['id']),
        safeCsvCell($lead['site']),
        safeCsvCell($lead['created_at']),
        safeCsvCell($lead['name']),
        safeCsvCell($lead['email']),
        safeCsvCell($lead['phone']),
        safeCsvCell($lead['service']),
        safeCsvCell($lead['message']),
        safeCsvCell($lead['ip']),
        safeCsvCell($lead['source_page']),
    ]);

    flock($csvHandle, LOCK_UN);
    fclose($csvHandle);
}

sendResponse(true, 'Thank you. Your request has been saved successfully.', 200, [
    'lead_id' => $lead['id'],
]);
