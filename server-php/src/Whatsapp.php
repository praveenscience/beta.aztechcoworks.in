<?php
declare(strict_types=1);

namespace Aztech;

/**
 * WhatsApp Business API integration via Meta Cloud API.
 * Falls back to error_log when WHATSAPP_API_KEY is not set.
 */
final class Whatsapp
{
    private string $apiKey;
    private string $apiUrl;
    private string $phoneId;

    public function __construct()
    {
        $this->apiKey  = $_ENV['WHATSAPP_API_KEY'] ?? '';
        $this->apiUrl  = $_ENV['WHATSAPP_API_URL'] ?? '';
        $this->phoneId = $_ENV['WHATSAPP_PHONE_ID'] ?? '';
    }

    /** @param list<string> $params */
    private function sendTemplate(string $to, string $template, array $params): void
    {
        $phone = preg_replace('/\D/', '', $to);

        if (!$this->apiKey || !$this->apiUrl) {
            error_log("[WHATSAPP PREVIEW] To: {$phone} | Template: {$template} | Params: " . implode(', ', $params));
            return;
        }

        $ch = curl_init("{$this->apiUrl}/{$this->phoneId}/messages");
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $this->apiKey,
                'Content-Type: application/json',
            ],
            CURLOPT_POSTFIELDS => json_encode([
                'messaging_product' => 'whatsapp',
                'to' => $phone,
                'type' => 'template',
                'template' => [
                    'name' => $template,
                    'language' => ['code' => 'en'],
                    'components' => [[
                        'type' => 'body',
                        'parameters' => array_map(
                            fn(string $p) => ['type' => 'text', 'text' => $p],
                            $params
                        ),
                    ]],
                ],
            ], JSON_UNESCAPED_SLASHES),
        ]);
        $result = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($code >= 400) {
            error_log("[WHATSAPP ERROR] Status $code: $result");
        }
    }

    // ─── Pre-built message senders ──────────────────

    public function sendLeadWelcome(string $phone, string $name): void
    {
        $this->sendTemplate($phone, 'lead_welcome', [$name]);
    }

    public function sendVisitReminder(string $phone, string $name, string $branchName, string $dateTime): void
    {
        $this->sendTemplate($phone, 'visit_reminder', [$name, $branchName, $dateTime]);
    }

    public function sendBookingConfirmation(string $phone, string $name, string $roomName, string $dateTime, string $amount): void
    {
        $this->sendTemplate($phone, 'booking_confirmation', [$name, $roomName, $dateTime, $amount]);
    }

    public function sendPaymentReceipt(string $phone, string $name, string $amount, string $invoiceNumber): void
    {
        $this->sendTemplate($phone, 'payment_receipt', [$name, $amount, $invoiceNumber]);
    }
}
