const membershipCancellationTemplate = ({ 
  fullName = 'Member',
  memberId = 'N/A',
  membershipType = 'Standard',
  cancellationReason = 'non-payment',
  supportEmail = 'support@yourorganization.com'
}) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Membership Cancellation Notice</title>
    <style>
        /* Base styles */
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        
        /* Container */
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        
        /* Header */
        .header {
            background-color: #f4f4f4;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
        }
        
        /* Content */
        .content {
            background-color: #ffffff;
            padding: 20px;
            border: 1px solid #f4f4f4;
        }
        
        /* Alert box */
        .alert {
            background-color: #fff3f3;
            border-left: 4px solid #dc3545;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 5px 5px 0;
        }
        
        /* Details box */
        .details {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
        }
        
        .details p {
            margin: 5px 0;
        }
        
        /* Button */
        .button {
            display: inline-block;
            background-color: #007bff;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            text-align: center;
        }
        
        /* Footer */
        .footer {
            text-align: center;
            font-size: 0.8em;
            color: #666;
            margin-top: 20px;
            padding: 20px;
            background-color: #f4f4f4;
            border-radius: 0 0 5px 5px;
        }
        
        /* Responsive styles */
        @media only screen and (max-width: 600px) {
            .container {
                width: 100% !important;
                padding: 10px !important;
            }
            
            .content {
                padding: 15px !important;
            }
            
            .button {
                display: block;
                width: 100%;
                box-sizing: border-box;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; color: #dc3545;">Membership Cancellation Notice</h1>
        </div>
        
        <div class="content">
            <p>Dear ${fullName},</p>
            
            <div class="alert">
                <p style="margin: 0;">We regret to inform you that your membership has been cancelled due to ${cancellationReason}.</p>
            </div>
            
            <div class="details">
                <p><strong>Membership Details:</strong></p>
                <p>Member ID: ${memberId}</p>
                <p>Membership Type: ${membershipType}</p>
                <p>Cancellation Reason: ${cancellationReason}</p>
            </div>
            
            <p>If you believe this cancellation is in error or wish to discuss reinstatement, please contact our support team.</p>
            
            <div style="text-align: center;">
                <a href="mailto:${supportEmail}" class="button">Contact Support</a>
            </div>
        </div>
        
        <div class="footer">
            <p>© ${new Date().getFullYear()} Your Organization. All rights reserved.</p>
            <p>Need help? Contact our support team at ${supportEmail}</p>
        </div>
    </div>
</body>
</html>
`;

module.exports = {
  membershipCancellationTemplate
}; 