<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['email']) || !isset($data['name']) || !isset($data['role'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

$to = $data['email'];
$name = $data['name'];
$role = $data['role'];

// Email subject
$subject = "Welcome to FlowTrack - Team Invitation";

// Email message
$message = "
<html>
<head>
    <title>Welcome to FlowTrack</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #5271ff; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .button { 
            display: inline-block;
            padding: 10px 20px;
            background-color: #5271ff;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Welcome to FlowTrack</h1>
        </div>
        <div class='content'>
            <h2>Hello " . htmlspecialchars($name) . ",</h2>
            <p>You have been invited to join FlowTrack as a " . htmlspecialchars($role) . ".</p>
            <p>FlowTrack is a powerful project management tool that will help you collaborate with your team more effectively.</p>
            <p>To get started, please click the button below to create your account:</p>
            <p style='text-align: center;'>
                <a href='http://yourdomain.com/register' class='button'>Create Account</a>
            </p>
            <p>If you have any questions, please don't hesitate to contact your team administrator.</p>
        </div>
        <div class='footer'>
            <p>This is an automated message, please do not reply to this email.</p>
            <p>&copy; " . date('Y') . " FlowTrack. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
";

// Headers for HTML email
$headers = "MIME-Version: 1.0" . "\r\n";
$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
$headers .= "From: FlowTrack <noreply@flowtrack.com>" . "\r\n";

// Send email
$mail_sent = mail($to, $subject, $message, $headers);

if ($mail_sent) {
    echo json_encode(['success' => true, 'message' => 'Invitation email sent successfully']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to send invitation email']);
}
?> 