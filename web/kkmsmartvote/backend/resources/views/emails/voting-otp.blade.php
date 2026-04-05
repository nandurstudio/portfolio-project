<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kode OTP Voting KKM 2026</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
            color: #333;
        }

        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }

        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }

        .header p {
            margin: 5px 0 0 0;
            font-size: 14px;
            opacity: 0.9;
        }

        .content {
            padding: 30px 20px;
        }

        .greeting {
            font-size: 16px;
            color: #333;
            margin-bottom: 20px;
        }

        .otp-section {
            background-color: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 25px 0;
            border-radius: 4px;
            text-align: center;
        }

        .otp-section p {
            margin: 0 0 15px 0;
            color: #666;
            font-size: 14px;
        }

        .otp-code {
            background-color: #ffffff;
            border: 2px solid #667eea;
            border-radius: 6px;
            padding: 15px 25px;
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 3px;
            font-family: 'Courier New', monospace;
            display: inline-block;
            margin: 10px 0;
        }

        .otp-validity {
            margin-top: 10px;
            color: #e74c3c;
            font-weight: 600;
            font-size: 13px;
        }

        .steps {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 4px;
            margin: 20px 0;
        }

        .steps h3 {
            margin: 0 0 15px 0;
            color: #333;
            font-size: 16px;
        }

        .steps ol {
            margin: 0;
            padding-left: 20px;
        }

        .steps li {
            margin: 8px 0;
            color: #666;
            font-size: 14px;
            line-height: 1.5;
        }

        .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }

        .warning h4 {
            margin: 0 0 10px 0;
            color: #856404;
            font-size: 14px;
        }

        .warning ul {
            margin: 0;
            padding-left: 20px;
        }

        .warning li {
            margin: 5px 0;
            color: #856404;
            font-size: 13px;
        }

        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #999;
        }

        .footer p {
            margin: 5px 0;
        }

        .divider {
            border: 0;
            border-top: 1px solid #eee;
            margin: 20px 0;
        }

        @media (max-width: 480px) {
            .email-container {
                border-radius: 0;
            }

            .header {
                padding: 20px 15px;
            }

            .content {
                padding: 20px 15px;
            }

            .otp-code {
                font-size: 24px;
            }
        }
    </style>
</head>

<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <h1>🗳️ Kode OTP Voting KKM 2026</h1>
            <p>Sistem Pemilihan Ketua Komisi Mahasiswa</p>
        </div>

        <!-- Content -->
        <div class="content">
            <div class="greeting">
                👋 Halo <strong>{{ $member->name ?? $email }}</strong>,
            </div>

            <p style="color: #666; line-height: 1.6;">
                Anda telah mendaftar untuk mengikuti voting Ketua KKM 2026. Berikut adalah kode OTP (One-Time Password) Anda yang unik dan pribadi:
            </p>

            <!-- OTP Section -->
            <div class="otp-section">
                <p>📬 Kode OTP Anda:</p>
                <div class="otp-code">{{ $otp }}</div>
                <div class="otp-validity">⏱️ Berlaku selama 15 menit</div>
            </div>

            <!-- Steps -->
            <div class="steps">
                <h3>📋 Cara Menggunakan Kode OTP:</h3>
                <ol>
                    <li>Buka website voting: <strong>https://kkmsmartvote.web.id</strong></li>
                    <li>Masukkan email Anda: <strong>{{ $email }}</strong></li>
                    <li>Masukkan kode OTP di atas di kolom yang tersedia</li>
                    <li>Pilih calon ketua favorit Anda</li>
                    <li>Selesai - suara Anda akan tercatat secara rahasia</li>
                </ol>
            </div>

            <!-- Warning -->
            <div class="warning">
                <h4>⚠️ PENTING - Jaga Keamanan Kode Anda!</h4>
                <ul>
                    <li>✓ Kode OTP berlaku selama <strong>15 menit</strong> saja</li>
                    <li>✓ Gunakan kode OTP <strong>hanya 1 kali</strong></li>
                    <li>✓ <strong>Jangan pernah berikan</strong> kode ini kepada siapapun</li>
                    <li>✓ <strong>Setiap member hanya bisa vote 1 kali</strong> (sistem tidak bisa diubah)</li>
                </ul>
            </div>

            <hr class="divider">

            <p style="color: #999; font-size: 13px; text-align: center;">
                Email ini dikirim otomatis. Jika Anda tidak melakukan request OTP, please ignore email ini.
            </p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p><strong>Panitia Voting KKM 2026</strong></p>
            <p>Transparansi • Keadilan • Demokrasi Internal</p>
            <p style="margin-top: 15px; color: #ccc;">© 2026 Sistem Voting KKM. All rights reserved.</p>
        </div>
    </div>
</body>

</html>
