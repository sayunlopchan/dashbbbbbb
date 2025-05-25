export const membershipCancellationTemplate = ({ 
  fullName, 
  memberId, 
  membershipType, 
  cancellationReason = 'non-payment' 
}) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Membership Cancellation Notice</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .container {
            background-color: #f4f4f4;
            padding: 20px;
            border-radius: 5px;
        }
        h1 {
            color: #d9534f;
            border-bottom: 2px solid #d9534f;
            padding-bottom: 10px;
        }
        .details {
            background-color: #fff;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
        }
        .footer {
            margin-top: 20px;
            font-size: 0.8em;
            color: #777;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Membership Cancellation Notice</h1>
        <p>Dear ${fullName},</p>
        <p>We regret to inform you that your membership has been cancelled due to ${cancellationReason}.</p>
        
        <div class="details">
            <p><strong>Membership Details:</strong></p>
            <p>Member ID: ${memberId}</p>
            <p>Membership Type: ${membershipType}</p>
            <p>Cancellation Reason: ${cancellationReason}</p>
        </div>
        
        <p>If you believe this cancellation is in error or wish to discuss reinstatement, please contact our support team.</p>
        
        <div class="footer">
            <p>Best regards,<br/>Your Organization</p>
            <p>Need help? Contact our support team.</p>
        </div>
    </div>
</body>
</html>
`;

export default membershipCancellationTemplate; 