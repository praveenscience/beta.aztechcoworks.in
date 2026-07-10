<?php
declare(strict_types=1);

namespace Aztech;

/**
 * Transactional email via Resend REST API.
 * Falls back to error_log when RESEND_API_KEY is not set.
 */
final class Email
{
    private string $apiKey;
    private string $from;
    private string $siteUrl;

    public function __construct()
    {
        $this->apiKey = $_ENV['RESEND_API_KEY'] ?? '';
        $this->from   = $_ENV['EMAIL_FROM'] ?? 'Aztech Co-Works <noreply@aztechcoworks.in>';
        $this->siteUrl = $_ENV['SITE_URL'] ?? 'http://localhost:5173';
    }

    private function send(string $to, string $subject, string $html): void
    {
        if (!$this->apiKey) {
            error_log("[EMAIL PREVIEW] To: $to | Subject: $subject");
            error_log(substr(strip_tags($html), 0, 200));
            return;
        }

        $ch = curl_init('https://api.resend.com/emails');
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $this->apiKey,
                'Content-Type: application/json',
            ],
            CURLOPT_POSTFIELDS => json_encode([
                'from'    => $this->from,
                'to'      => [$to],
                'subject' => $subject,
                'html'    => $html,
            ], JSON_UNESCAPED_SLASHES),
        ]);
        $result = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($code >= 400) {
            error_log("[EMAIL ERROR] Status $code: $result");
        }
    }

    // ─── Templates ──────────────────────────────────

    public function sendWelcome(string $to, string $name): void
    {
        $url = htmlspecialchars($this->siteUrl);
        $this->send($to, 'Welcome to Aztech Co-Works!', <<<HTML
<h2>Welcome, {$name}!</h2>
<p>Your account has been created at Aztech Co-Works.</p>
<p>You can now <a href="{$url}/auth">sign in</a> to explore branches, book meeting rooms, and manage your membership.</p>
<p>Questions? WhatsApp us at <a href="https://wa.me/918310696307">+91 83106 96307</a>.</p>
<br/>
<p>— Aztech Co-Works, Coimbatore</p>
HTML);
    }

    public function sendPasswordReset(string $to, string $name, string $token): void
    {
        $resetUrl = htmlspecialchars($this->siteUrl . '/auth/reset?token=' . $token);
        $this->send($to, 'Reset your password — Aztech Co-Works', <<<HTML
<h2>Password reset requested</h2>
<p>Hi {$name},</p>
<p>Click the link below to reset your password. This link expires in 1 hour.</p>
<p><a href="{$resetUrl}" style="display:inline-block;padding:12px 24px;background:#0f172a;color:#fff;text-decoration:none;border-radius:6px;">Reset password</a></p>
<p>Or copy this URL: {$resetUrl}</p>
<p>If you didn't request this, you can safely ignore this email.</p>
<br/>
<p>— Aztech Co-Works</p>
HTML);
    }

    public function sendBookingConfirmation(
        string $to,
        string $name,
        string $roomName,
        string $branchName,
        string $date,
        string $time,
        int $amount
    ): void {
        $inr = number_format($amount);
        $this->send($to, "Booking confirmed — {$roomName} at {$branchName}", <<<HTML
<h2>Booking confirmed!</h2>
<p>Hi {$name},</p>
<table style="border-collapse:collapse;margin:16px 0;">
  <tr><td style="padding:4px 16px 4px 0;color:#666;">Room</td><td><strong>{$roomName}</strong></td></tr>
  <tr><td style="padding:4px 16px 4px 0;color:#666;">Branch</td><td>{$branchName}</td></tr>
  <tr><td style="padding:4px 16px 4px 0;color:#666;">Date</td><td>{$date}</td></tr>
  <tr><td style="padding:4px 16px 4px 0;color:#666;">Time</td><td>{$time}</td></tr>
  <tr><td style="padding:4px 16px 4px 0;color:#666;">Amount</td><td>&#8377;{$inr}</td></tr>
</table>
<p>Show this email at reception when you arrive.</p>
<br/>
<p>— Aztech Co-Works</p>
HTML);
    }

    public function sendInvoice(
        string $to,
        string $name,
        string $number,
        int $subtotal,
        int $gst,
        int $total,
        string $issuedAt
    ): void {
        $url = htmlspecialchars($this->siteUrl);
        $this->send($to, "Invoice {$number} — Aztech Co-Works", <<<HTML
<h2>Invoice {$number}</h2>
<p>Hi {$name},</p>
<table style="border-collapse:collapse;margin:16px 0;">
  <tr><td style="padding:4px 16px 4px 0;color:#666;">Invoice #</td><td><strong>{$number}</strong></td></tr>
  <tr><td style="padding:4px 16px 4px 0;color:#666;">Date</td><td>{$issuedAt}</td></tr>
  <tr><td style="padding:4px 16px 4px 0;color:#666;">Subtotal</td><td>&#8377;{$subtotal}</td></tr>
  <tr><td style="padding:4px 16px 4px 0;color:#666;">GST (18%)</td><td>&#8377;{$gst}</td></tr>
  <tr><td style="padding:4px 16px 4px 0;color:#666;">Total</td><td><strong>&#8377;{$total}</strong></td></tr>
</table>
<p>View your invoices at <a href="{$url}/dashboard/invoices">your dashboard</a>.</p>
<br/>
<p>— Aztech Co-Works</p>
HTML);
    }

    public function sendSiteVisitConfirmation(
        string $to,
        string $name,
        string $branchName,
        string $branchAddress,
        string $scheduledAt
    ): void {
        $this->send($to, "Site visit confirmed — {$branchName}", <<<HTML
<h2>Site visit confirmed!</h2>
<p>Hi {$name},</p>
<p>Your site visit has been scheduled:</p>
<table style="border-collapse:collapse;margin:16px 0;">
  <tr><td style="padding:4px 16px 4px 0;color:#666;">Branch</td><td><strong>{$branchName}</strong></td></tr>
  <tr><td style="padding:4px 16px 4px 0;color:#666;">Address</td><td>{$branchAddress}</td></tr>
  <tr><td style="padding:4px 16px 4px 0;color:#666;">When</td><td>{$scheduledAt}</td></tr>
</table>
<p>Our team will be ready to welcome you. Need to reschedule? Call or WhatsApp <a href="https://wa.me/918310696307">+91 83106 96307</a>.</p>
<br/>
<p>— Aztech Co-Works</p>
HTML);
    }
}
