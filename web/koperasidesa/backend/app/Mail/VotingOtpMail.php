<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class VotingOtpMail extends Mailable
{
    public function __construct(
        public string $email,
        public string $otp
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            to: $this->email,
            subject: 'KKM Voting 2026 - Your OTP Code',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.voting-otp',
            with: [
                'email' => $this->email,
                'otp' => $this->otp
            ]
        );
    }
}
